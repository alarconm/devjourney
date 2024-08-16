"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Project, ProjectFeature, Skill, BrainstormingNote } from '@/lib/types'

type AppContextType = {
  projects: Project[]
  skills: Skill[]
  brainstormingNotes: BrainstormingNote[]
  addProject: (project: Omit<Project, 'id' | 'status' | 'progress' | 'sortOrder'>) => Promise<Project | null>
  updateProject: (project: Project) => Promise<void>
  removeProject: (id: string) => Promise<void>
  addProjectFeature: (projectId: string, featureText: string) => Promise<ProjectFeature | null>
  toggleProjectFeature: (projectId: string, featureId: string) => Promise<void>
  moveProject: (projectId: string, newStatus: 'idea' | 'in_progress' | 'completed') => Promise<void>
  addSkill: (skill: Omit<Skill, 'id'>) => Promise<Skill | null>
  updateSkill: (skill: Skill) => Promise<void>
  removeSkill: (id: string) => Promise<void>
  associateSkillWithProject: (projectId: string, skillId: string) => Promise<void>
  addBrainstormingNote: (text: string) => Promise<BrainstormingNote | null>
  fetchProjects: () => Promise<void>
  fetchSkills: () => Promise<void>
  fetchBrainstormingNotes: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [brainstormingNotes, setBrainstormingNotes] = useState<BrainstormingNote[]>([])

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_features(*)')
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('Error fetching projects:', error)
    } else {
      setProjects(data || [])
    }
  }

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('name')
    if (error) {
      console.error('Error fetching skills:', error)
    } else {
      setSkills(data || [])
    }
  }

  const fetchBrainstormingNotes = async () => {
    const { data, error } = await supabase
      .from('brainstorming_notes')
      .select('*')
      .order('timestamp', { ascending: false })
    if (error) {
      console.error('Error fetching brainstorming notes:', error)
    } else {
      setBrainstormingNotes(data || [])
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchSkills()
    fetchBrainstormingNotes()
  }, [])

  const addProject = async (project: Omit<Project, 'id' | 'status' | 'progress' | 'sortOrder'>) => {
    const { data: maxSortOrderProject } = await supabase
      .from('projects')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)

    const newSortOrder = maxSortOrderProject && maxSortOrderProject[0] ? maxSortOrderProject[0].sort_order + 1 : 0

    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...project, status: 'idea', progress: 0, sort_order: newSortOrder }])
      .select()
    if (error) {
      console.error('Error adding project:', error)
      return null
    }
    setProjects(prev => [data[0], ...prev])
    return data[0]
  }

  const updateProject = async (project: Project) => {
    const { error } = await supabase
      .from('projects')
      .update(project)
      .eq('id', project.id)
    if (error) {
      console.error('Error updating project:', error)
    } else {
      setProjects(prev => prev.map(p => p.id === project.id ? project : p))
    }
  }

  const removeProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    if (error) {
      console.error('Error removing project:', error)
    } else {
      setProjects(prev => prev.filter(p => p.id !== id))
    }
  }

  const addProjectFeature = async (projectId: string, featureText: string) => {
    const { data, error } = await supabase
      .from('project_features')
      .insert([{ project_id: projectId, text: featureText }])
      .select()
    if (error) {
      console.error('Error adding project feature:', error)
      return null
    }
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, project_features: [...(p.project_features || []), data[0]] }
      }
      return p
    }))
    return data[0]
  }

  const toggleProjectFeature = async (projectId: string, featureId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    const feature = project.project_features?.find(f => f.id === featureId)
    if (!feature) return

    const { error } = await supabase
      .from('project_features')
      .update({ completed: !feature.completed })
      .eq('id', featureId)
    
    if (error) {
      console.error('Error toggling project feature:', error)
    } else {
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

  const moveProject = async (projectId: string, newStatus: 'idea' | 'in_progress' | 'completed') => {
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId)
    
    if (error) {
      console.error('Error moving project:', error)
    } else {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p))
    }
  }

  const addSkill = async (skill: Omit<Skill, 'id'>) => {
    const { data, error } = await supabase
      .from('skills')
      .insert([{ ...skill, level: 1 }])
      .select()
    if (error) {
      console.error('Error adding skill:', error)
      return null
    }
    setSkills(prev => [...prev, data[0]])
    return data[0]
  }

  const updateSkill = async (skill: Skill) => {
    const { error } = await supabase
      .from('skills')
      .update(skill)
      .eq('id', skill.id)
    if (error) {
      console.error('Error updating skill:', error)
    } else {
      setSkills(prev => prev.map(s => s.id === skill.id ? skill : s))
    }
  }

  const removeSkill = async (id: string) => {
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', id)
    if (error) {
      console.error('Error removing skill:', error)
    } else {
      setSkills(prev => prev.filter(s => s.id !== id))
    }
  }

  const associateSkillWithProject = async (projectId: string, skillId: string) => {
    const { error } = await supabase
      .from('project_skills')
      .insert([{ project_id: projectId, skill_id: skillId }])
    if (error) {
      console.error('Error associating skill with project:', error)
    } else {
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            associatedSkills: [...(p.associatedSkills || []), skillId]
          }
        }
        return p
      }))
    }
  }

  const addBrainstormingNote = async (text: string) => {
    const { data, error } = await supabase
      .from('brainstorming_notes')
      .insert([{ text }])
      .select()
    if (error) {
      console.error('Error adding brainstorming note:', error)
      return null
    }
    setBrainstormingNotes(prev => [data[0], ...prev])
    return data[0]
  }

  const contextValue: AppContextType = {
    projects,
    skills,
    brainstormingNotes,
    addProject,
    updateProject,
    removeProject,
    addProjectFeature,
    toggleProjectFeature,
    moveProject,
    addSkill,
    updateSkill,
    removeSkill,
    associateSkillWithProject,
    addBrainstormingNote,
    fetchProjects,
    fetchSkills,
    fetchBrainstormingNotes,
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