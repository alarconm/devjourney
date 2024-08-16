"use client"

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Project {
  id: string
  title: string
  description: string
  progress: number
  status: string
  project_features?: Array<{ id: string, text: string, completed: boolean }>
  associatedSkills?: string[]
}

export interface Idea {
  id: string
  title: string
  description: string
  features: string[]
}

export interface Skill {
  id: string
  name: string
  level: number
}

interface AppContextType {
  projects: Project[]
  ideas: Idea[]
  skills: Skill[]
  addProject: (project: Omit<Project, 'id' | 'progress' | 'status'>) => Promise<void>
  updateProject: (updatedProject: Project | undefined) => Promise<void>
  removeProject: (id: string) => Promise<void>
  addIdea: (idea: Omit<Idea, 'id'>) => Promise<Idea>
  removeIdea: (id: string) => Promise<boolean>
  addProjectFeature: (projectId: string, featureText: string) => Promise<void>
  toggleProjectFeature: (projectId: string, featureId: string) => Promise<void>
  addSkill: (skill: Omit<Skill, 'id'>) => Promise<void>
  updateSkill: (updatedSkill: Skill) => Promise<void>
  removeSkill: (id: string) => Promise<void>
  associateSkillWithProject: (projectId: string, skillId: string) => Promise<void>
  fetchProjects: () => Promise<void>
  fetchIdeas: () => Promise<void>
  fetchSkills: () => Promise<void>
  moveProjectToIdea: (projectId: string) => Promise<void>
  moveIdeaToProject: (ideaId: string) => Promise<void>
  updateIdeas: React.Dispatch<React.SetStateAction<Idea[]>>
  fetchCompletedProjects: () => Promise<void>
  refreshCurrentProjects: () => Promise<void>
  addIdeaFeature: (ideaId: string, featureText: string) => Promise<any>
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
  handleSkillSelect: (projectId: string, skillId: string) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [skills, setSkills] = useState<Skill[]>([])

  useEffect(() => {
    fetchProjects()
    fetchIdeas()
    fetchSkills()
  }, [])

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_features(*)')
      .order('created_at', { ascending: false })
    if (error) console.error('Error fetching projects:', error)
    else setProjects(data || [])
  }

  const fetchIdeas = async () => {
    const { data, error } = await supabase
      .from('ideas')
      .select('*, idea_features(*)')
      .order('created_at', { ascending: false })
    if (error) console.error('Error fetching ideas:', error)
    else setIdeas(data?.map(idea => ({
      ...idea,
      features: idea.idea_features.map(f => f.text)
    })) || [])
  }

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('name', { ascending: true })
    if (error) console.error('Error fetching skills:', error)
    else setSkills(data || [])
  }

  const addProject = async (project: Omit<Project, 'id' | 'progress' | 'status'>) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...project, progress: 0, status: 'in_progress' }])
      .select()
    if (error) console.error('Error adding project:', error)
    else setProjects(prev => [data[0], ...prev])
  }

  const updateProject = async (updatedProject: Project) => {
    const { error } = await supabase
      .from('projects')
      .update(updatedProject)
      .eq('id', updatedProject.id)
    if (error) console.error('Error updating project:', error)
    else setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p))
  }

  const removeProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    if (error) console.error('Error removing project:', error)
    else setProjects(prev => prev.filter(p => p.id !== id))
  }

  const addIdea = async (idea: Omit<Idea, 'id'>) => {
    const { data, error } = await supabase
      .from('ideas')
      .insert([idea])
      .select()
    if (error) {
      console.error('Error adding idea:', error)
      return null
    }
    const newIdea = { ...data[0], features: [] }
    setIdeas(prev => [newIdea, ...prev])
    return newIdea
  }

  const removeIdea = async (id: string) => {
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id)
    if (error) {
      console.error('Error removing idea:', error)
      return false
    }
    setIdeas(prev => prev.filter(i => i.id !== id))
    return true
  }

  const addProjectFeature = async (projectId: string, featureText: string) => {
    const { data, error } = await supabase
      .from('project_features')
      .insert([{ project_id: projectId, text: featureText, completed: false }])
      .select()
    if (error) console.error('Error adding project feature:', error)
    else {
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return { ...p, project_features: [...(p.project_features || []), data[0]] }
        }
        return p
      }))
      return data[0]
    }
  }

  const toggleProjectFeature = async (projectId: string, featureId: string) => {
    const project = projects.find(p => p.id === projectId)
    const feature = project?.project_features?.find(f => f.id === featureId)
    if (!feature) return

    const { error } = await supabase
      .from('project_features')
      .update({ completed: !feature.completed })
      .eq('id', featureId)
    if (error) console.error('Error toggling project feature:', error)
    else {
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            project_features: p.project_features?.map(f =>
              f.id === featureId ? { ...f, completed: !f.completed } : f
            )
          }
        }
        return p
      }))
    }
  }

  const moveProjectToIdea = async (projectId: string) => {
    const projectToMove = projects.find(p => p.id === projectId)
    if (!projectToMove) return

    const { data: newIdea, error: insertError } = await supabase
      .from('ideas')
      .insert({
        title: projectToMove.title,
        description: projectToMove.description,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error moving project to idea:', insertError)
      return
    }

    if (projectToMove.project_features) {
      const ideaFeatures = projectToMove.project_features.map(feature => ({
        idea_id: newIdea.id,
        text: feature.text,
      }))

      const { error: featureError } = await supabase
        .from('idea_features')
        .insert(ideaFeatures)

      if (featureError) {
        console.error('Error moving project features to idea:', featureError)
      }
    }

    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (deleteError) {
      console.error('Error deleting project:', deleteError)
      return
    }

    setProjects(prev => prev.filter(p => p.id !== projectId))
    setIdeas(prev => [{ ...newIdea, features: projectToMove.project_features?.map(f => f.text) || [] }, ...prev])
  }

  const moveIdeaToProject = async (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId)
    if (!idea) return

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{ title: idea.title, description: idea.description, progress: 0, status: 'in_progress' }])
      .select()

    if (projectError) {
      console.error('Error creating project:', projectError)
      return
    }

    if (idea.features && idea.features.length > 0) {
      const projectFeatures = idea.features.map(feature => ({
        project_id: project[0].id,
        text: feature,
        completed: false
      }))

      const { error: insertError } = await supabase
        .from('project_features')
        .insert(projectFeatures)

      if (insertError) {
        console.error('Error inserting project features:', insertError)
      }
    }

    await removeIdea(ideaId)
    setProjects(prev => [...prev, {...project[0], project_features: idea.features.map(feature => ({
      id: '', // This will be generated by the database
      text: feature,
      completed: false
    }))}])
  }

  const contextValue = {
    projects,
    ideas,
    skills,
    addProject,
    updateProject,
    removeProject,
    addIdea,
    removeIdea,
    addProjectFeature,
    toggleProjectFeature,
    addSkill: () => {},
    updateSkill: () => {},
    removeSkill: () => {},
    associateSkillWithProject: () => {},
    fetchProjects,
    fetchIdeas,
    fetchSkills,
    moveProjectToIdea,
    moveIdeaToProject,
    updateIdeas: setIdeas,
    fetchCompletedProjects: () => {},
    refreshCurrentProjects: () => {},
    addIdeaFeature: () => {},
    setProjects,
    handleSkillSelect: () => {},
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}