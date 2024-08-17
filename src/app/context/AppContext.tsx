"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Project, ProjectFeature, Skill, BrainstormingNote } from '@/types/project'

type AppContextType = {
  projects: Project[]
  skills: Skill[]
  brainstormingNotes: BrainstormingNote[]
  ideas: Project[]
  addProject: (title: string, description: string) => Promise<Project | null>
  updateProject: (updatedProject: Project) => Promise<Project | null>
  removeProject: (id: string) => Promise<void>
  addProjectFeature: (projectId: string, featureText: string) => Promise<ProjectFeature | null>
  toggleProjectFeature: (projectId: string, featureId: string) => Promise<Project | null>
  moveProject: (projectId: string, newStatus: 'idea' | 'in_progress' | 'completed') => Promise<Project | null>
  addSkill: (skillName: string) => Promise<Skill | null>
  updateSkill: (skill: Skill) => Promise<void>
  removeSkill: (id: string) => Promise<void>
  associateSkillWithProject: (projectId: string, skillId: string) => Promise<void>
  addBrainstormingNote: (text: string) => Promise<BrainstormingNote | null>
  fetchProjects: () => Promise<void>
  fetchSkills: () => Promise<void>
  fetchBrainstormingNotes: () => Promise<void>
  removeProjectFeature: (projectId: string, featureId: string) => Promise<void>
  resetProjectFeatures: (projectId: string) => Promise<void>
  updateFeatureOrder: (projectId: string, features: ProjectFeature[]) => Promise<void>
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [brainstormingNotes, setBrainstormingNotes] = useState<BrainstormingNote[]>([])
  const [ideas, setIdeas] = useState<Project[]>([])

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_features(*),
        project_skills(skill_id)
      `)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('Error fetching projects:', error)
    } else {
      const projectsWithSkills = data.map(project => ({
        ...project,
        associatedSkills: project.project_skills.map((ps: { skill_id: string }) => ps.skill_id)
      }))
      setProjects(projectsWithSkills)
      setIdeas(projectsWithSkills.filter(p => p.status === 'idea'))
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

  const addProject = async (title: string, description: string) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ title, description, status: 'idea', progress: 0 }])
      .select()
    if (error) {
      console.error('Error adding project:', error)
      return null
    }
    const newProject = data[0]
    setProjects(prev => [...prev, newProject])
    setIdeas(prev => [...prev, newProject])
    return newProject
  }

  const updateProject = async (updatedProject: Project) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updatedProject)
      .eq('id', updatedProject.id)
      .select()
    if (error) {
      console.error('Error updating project:', error)
      return null
    }
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? data[0] : p))
    setIdeas(prev => prev.map(p => p.id === updatedProject.id ? data[0] : p))
    return data[0]
  }

  const removeProject = async (id: string) => {
    try {
      // First, delete all associated features
      await supabase
        .from('project_features')
        .delete()
        .eq('project_id', id)

      // Then, delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProjects(prev => prev.filter(p => p.id !== id))
      setIdeas(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error removing project:', error)
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
    const { data: feature, error: featureError } = await supabase
      .from('project_features')
      .select('*')
      .eq('id', featureId)
      .single()

    if (featureError) {
      console.error('Error fetching project feature:', featureError)
      return null
    }

    const { error } = await supabase
      .from('project_features')
      .update({ completed: !feature.completed })
      .eq('id', featureId)

    if (error) {
      console.error('Error toggling project feature:', error)
      return null
    }

    const updatedProject = await updateProjectProgress(projectId)
    
    if (updatedProject) {
      if (updatedProject.progress === 100) {
        const movedProject = await moveProject(projectId, 'completed')
        if (movedProject) {
          setProjects(prev => prev.map(p => p.id === projectId ? movedProject : p))
        }
      } else {
        setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p))
      }
    }
    
    return updatedProject
  }

  const updateProjectProgress = async (projectId: string) => {
    const { data: features, error: featuresError } = await supabase
      .from('project_features')
      .select('completed')
      .eq('project_id', projectId)

    if (featuresError) {
      console.error('Error fetching project features:', featuresError)
      return null
    }

    const totalFeatures = features.length
    const completedFeatures = features.filter(f => f.completed).length
    const progress = parseFloat(((completedFeatures / totalFeatures) * 100).toFixed(2))

    const { data, error } = await supabase
      .from('projects')
      .update({ progress })
      .eq('id', projectId)
      .select('*, project_features(*)')
      .single()

    if (error) {
      console.error('Error updating project progress:', error)
      return null
    }

    return data
  }

  const moveProject = async (projectId: string, newStatus: 'idea' | 'in_progress' | 'completed') => {
    const { data, error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId)
      .select('*, project_features(*)')
      .single()

    if (error) {
      console.error('Error moving project:', error)
      return null
    }

    if (newStatus === 'in_progress') {
      await resetProjectFeatures(projectId)
    }

    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...data } : p))

    return data
  }

  const resetProjectFeatures = async (projectId: string) => {
    const { error: featuresError } = await supabase
      .from('project_features')
      .update({ completed: false })
      .eq('project_id', projectId)

    if (featuresError) {
      console.error('Error resetting project features:', featuresError)
      return
    }

    const { error: projectError } = await supabase
      .from('projects')
      .update({ progress: 0 })
      .eq('id', projectId)

    if (projectError) {
      console.error('Error resetting project progress:', projectError)
      return
    }

    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, progress: 0, project_features: p.project_features?.map((f: ProjectFeature) => ({ ...f, completed: false })) } : p
    ))
  }

  const addSkill = async (skillName: string) => {
    const { data, error } = await supabase
      .from('skills')
      .insert([{ name: skillName, level: 0 }])
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
    const { data, error } = await supabase
      .from('project_skills')
      .insert([{ project_id: projectId, skill_id: skillId }])
      .select()
    if (error) {
      console.error('Error associating skill with project:', error)
    } else {
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            associatedSkills: [...new Set([...(p.associatedSkills || []), skillId])]
          }
        }
        return p
      }))
      await fetchSkills()
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

  const removeProjectFeature = async (projectId: string, featureId: string) => {
    try {
      await supabase
        .from('project_features')
        .delete()
        .match({ id: featureId, project_id: projectId });
    } catch (error) {
      console.error("Error removing project feature:", error);
      throw error;
    }
  };

  const updateFeatureOrder = async (projectId: string, features: ProjectFeature[]) => {
    const { error } = await supabase
      .from('project_features')
      .upsert(features.map((feature, index) => ({ ...feature, sort_order: index })))

    if (error) {
      console.error('Error updating feature order:', error)
    } else {
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, project_features: features } : p
      ))
    }
  }

  const contextValue: AppContextType = {
    projects,
    skills,
    brainstormingNotes,
    ideas,
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
    removeProjectFeature,
    resetProjectFeatures,
    updateFeatureOrder,
    setProjects,
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