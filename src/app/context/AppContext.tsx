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
  removeIdea: (id: string) => Promise<void>
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
  addIdeaFeature: (ideaId: string, feature: string) => Promise<any>
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
  handleSkillSelect: (projectId: string, skillId: string) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [skills, setSkills] = useState<Skill[]>([])

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_features(*)')
      .order('created_at', { ascending: false })
      .neq('status', 'completed')
    if (error) console.error('Error fetching projects:', error)
    else setProjects(data)
  }

  const fetchIdeas = async () => {
    const { data, error } = await supabase
      .from('ideas')
      .select('*, idea_features(*)')
      .order('created_at', { ascending: false })
    if (error) console.error('Error fetching ideas:', error)
    else setIdeas(data.map(idea => ({
      ...idea,
      features: idea.idea_features.map(feature => feature.text)
    })))
  }

  const fetchSkills = async () => {
    const { data, error } = await supabase.from('skills').select('*')
    if (error) console.error('Error fetching skills:', error)
    else setSkills(data)
  }

  const fetchCompletedProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
    if (error) console.error('Error fetching completed projects:', error.message)
    else setProjects(prevProjects => [...prevProjects, ...data])
  }

  const refreshCurrentProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .neq('status', 'completed')

    if (error) {
      console.error('Error refreshing projects:', error)
    } else {
      setProjects(data)
    }
  }

  useEffect(() => {
    fetchIdeas()
    fetchProjects()
    fetchSkills()

    const ideasChannel = supabase.channel('ideas-changes')
    const projectsChannel = supabase.channel('projects-changes')
    const skillsChannel = supabase.channel('skills-changes')

    ideasChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setIdeas(prevIdeas => [...prevIdeas, payload.new as Idea])
        } else if (payload.eventType === 'DELETE') {
          setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== payload.old.id))
        } else if (payload.eventType === 'UPDATE') {
          setIdeas(prevIdeas => prevIdeas.map(idea => idea.id === payload.new.id ? payload.new as Idea : idea))
        }
      })
      .subscribe()

    projectsChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProjects(prevProjects => [...prevProjects, payload.new as Project])
        } else if (payload.eventType === 'DELETE') {
          setProjects(prevProjects => prevProjects.filter(project => project.id !== payload.old.id))
        } else if (payload.eventType === 'UPDATE') {
          setProjects(prevProjects => prevProjects.map(project => project.id === payload.new.id ? payload.new as Project : project))
        }
      })
      .subscribe()

    skillsChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skills' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSkills(prevSkills => [...prevSkills, payload.new as Skill])
        } else if (payload.eventType === 'DELETE') {
          setSkills(prevSkills => prevSkills.filter(skill => skill.id !== payload.old.id))
        } else if (payload.eventType === 'UPDATE') {
          setSkills(prevSkills => prevSkills.map(skill => skill.id === payload.new.id ? payload.new as Skill : skill))
        }
      })
      .subscribe()

    return () => {
      ideasChannel.unsubscribe()
      projectsChannel.unsubscribe()
      skillsChannel.unsubscribe()
    }
  }, [])

  const addProject = async (project: Omit<Project, 'id' | 'progress' | 'status'>) => {
    const { error } = await supabase
      .from('projects')
      .insert([{ ...project, progress: 0, status: 'in_progress' }])
    if (error) console.error('Error adding project:', error)
  }

  const updateProject = async (updatedProject: Project | undefined) => {
    if (!updatedProject || !updatedProject.id) {
      console.error('Invalid project data for update')
      return
    }
    const { error } = await supabase
      .from('projects')
      .update(updatedProject)
      .eq('id', updatedProject.id)
    if (error) console.error('Error updating project:', error)
  }

  const removeProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    if (error) console.error('Error removing project:', error)
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
    setIdeas(prevIdeas => [...prevIdeas, data[0]])
    return data[0]
  }

  const addIdeaFeature = async (ideaId: string, feature: string) => {
    const { data, error } = await supabase
      .from('idea_features')
      .insert([{ idea_id: ideaId, text: feature }])
      .select()
    if (error) {
      console.error('Error adding idea feature:', error)
      return null
    }
    setIdeas(prevIdeas => prevIdeas.map(idea => 
      idea.id === ideaId 
        ? { ...idea, features: [...(idea.features || []), feature] }
        : idea
    ))
    return data[0]
  }

  const removeIdea = async (id: string) => {
    try {
      // First, delete all features associated with the idea
      await supabase
        .from('idea_features')
        .delete()
        .eq('idea_id', id);

      // Then, delete the idea itself
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== id));
    } catch (error) {
      console.error('Error removing idea:', error);
      throw error;
    }
  }

  const addProjectFeature = async (projectId: string, featureText: string) => {
    const { data, error } = await supabase
      .from('project_features')
      .insert([{ project_id: projectId, text: featureText, completed: false }])
    if (error) console.error('Error adding project feature:', error)
  }

  const toggleProjectFeature = async (projectId: string, featureId: string) => {
    const { data, error } = await supabase
      .from('project_features')
      .select('completed')
      .eq('id', featureId)
      .single()
    
    if (error) {
      console.error('Error fetching feature:', error)
      return
    }

    const { error: updateError } = await supabase
      .from('project_features')
      .update({ completed: !data.completed })
      .eq('id', featureId)
    
    if (updateError) {
      console.error('Error toggling project feature:', updateError)
    }
  }

  const addSkill = async (skill: Omit<Skill, 'id'>) => {
    const { data, error } = await supabase
      .from('skills')
      .insert([skill])
      .select()
    if (error) console.error('Error adding skill:', error)
    else {
      setSkills([...skills, data[0]])
    }
  }

  const updateSkill = async (updatedSkill: Skill) => {
    const { error } = await supabase
      .from('skills')
      .update(updatedSkill)
      .eq('id', updatedSkill.id)
    if (error) console.error('Error updating skill:', error)
    else {
      setSkills(skills.map(s => s.id === updatedSkill.id ? updatedSkill : s))
    }
  }

  const removeSkill = async (id: string) => {
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', id)
    if (error) console.error('Error removing skill:', error)
    else {
      setSkills(skills.filter(s => s.id !== id))
    }
  }

  const associateSkillWithProject = async (projectId: string, skillId: string) => {
    const { error } = await supabase
      .from('project_skills')
      .insert([{ project_id: projectId, skill_id: skillId }])
    if (error) console.error('Error associating skill with project:', error)
  }

  const moveProjectToIdea = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .insert([{ title: project.title, description: project.description }])
      .select()

    if (ideaError) {
      console.error('Error creating idea:', ideaError)
      return
    }

    await removeProject(projectId)
    setIdeas(prevIdeas => [...prevIdeas, idea[0]])
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

    // Move features from idea to project
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
    setProjects(prevProjects => [...prevProjects, {...project[0], project_features: idea.features.map(feature => ({
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
    addSkill,
    updateSkill,
    removeSkill,
    associateSkillWithProject,
    fetchProjects,
    fetchIdeas,
    fetchSkills,
    moveProjectToIdea,
    moveIdeaToProject,
    updateIdeas: setIdeas,
    fetchCompletedProjects,
    refreshCurrentProjects,
    addIdeaFeature,
    setProjects,
    handleSkillSelect: associateSkillWithProject,
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