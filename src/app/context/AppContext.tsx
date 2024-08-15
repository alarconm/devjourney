"use client"

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Project {
  id: string
  title: string
  description: string
  progress: number
  status: string
}

export interface Idea {
  id: string
  title: string
  description: string
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
  updateProject: (updatedProject: Project) => Promise<void>
  removeProject: (id: string) => Promise<void>
  addIdea: (idea: Omit<Idea, 'id'>) => Promise<void>
  removeIdea: (id: string) => Promise<void>
  addProjectFeature: (projectId: string, feature: string) => Promise<void>
  toggleProjectFeature: (projectId: string, featureId: string) => Promise<void>
  addSkill: (skill: Omit<Skill, 'id'>) => Promise<void>
  updateSkill: (updatedSkill: Skill) => Promise<void>
  removeSkill: (id: string) => Promise<void>
  associateSkillWithProject: (projectId: string, skillId: string) => Promise<void>
  fetchProjects: () => Promise<void>
  fetchIdeas: () => Promise<void>
  fetchSkills: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [skills, setSkills] = useState<Skill[]>([])

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*')
    if (error) console.error('Error fetching projects:', error)
    else setProjects(data)
  }

  const fetchIdeas = async () => {
    const { data, error } = await supabase.from('ideas').select('*')
    if (error) console.error('Error fetching ideas:', error)
    else setIdeas(data)
  }

  const fetchSkills = async () => {
    const { data, error } = await supabase.from('skills').select('*')
    if (error) console.error('Error fetching skills:', error)
    else setSkills(data)
  }

  useEffect(() => {
    fetchProjects()
    fetchIdeas()
    fetchSkills()
  }, [])

  const addProject = async (project: Omit<Project, 'id' | 'progress' | 'status'>) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...project, progress: 0, status: 'in_progress' }])
      .select()
    if (error) console.error('Error adding project:', error)
    else {
      setProjects([...projects, data[0]])
    }
  }

  const updateProject = async (updatedProject: Project) => {
    const { error } = await supabase
      .from('projects')
      .update(updatedProject)
      .eq('id', updatedProject.id)
    if (error) console.error('Error updating project:', error)
    else {
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
    }
  }

  const removeProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    if (error) console.error('Error removing project:', error)
    else {
      setProjects(projects.filter(p => p.id !== id))
    }
  }

  const addIdea = async (idea: Omit<Idea, 'id'>) => {
    const { data, error } = await supabase
      .from('ideas')
      .insert([idea])
      .select()
    if (error) console.error('Error adding idea:', error)
    else {
      setIdeas([...ideas, data[0]])
    }
  }

  const removeIdea = async (id: string) => {
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id)
    if (error) console.error('Error removing idea:', error)
    else {
      setIdeas(ideas.filter(i => i.id !== id))
    }
  }

  const addProjectFeature = async (projectId: string, feature: string) => {
    const { error } = await supabase
      .from('project_features')
      .insert([{ project_id: projectId, text: feature, completed: false }])
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