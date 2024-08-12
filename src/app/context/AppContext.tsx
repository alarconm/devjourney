"use client"

import React, { createContext, useContext, ReactNode } from 'react'
import { useLocalStorage } from '@/app/hooks/useLocalStorage'

interface Project {
  id: string
  title: string
  description: string
  progress: number
  features: { text: string; completed: boolean }[]
}

interface Idea {
  id: string
  title: string
  description: string
  features: string[]
}

interface AppContextType {
  projects: Project[]
  ideas: Idea[]
  addProject: (project: Omit<Project, 'id' | 'progress' | 'features'>) => void
  updateProject: (project: Project) => void
  removeProject: (id: string) => void
  addIdea: (idea: Omit<Idea, 'id'>) => void
  removeIdea: (id: string) => void
  addProjectFeature: (projectId: string, feature: string) => void
  toggleProjectFeature: (projectId: string, featureIndex: number) => void
  reorderIdeas: (startIndex: number, endIndex: number) => void
  reorderProjects: (startIndex: number, endIndex: number) => void
  reorderProjectFeatures: (projectId: string, startIndex: number, endIndex: number) => void
  moveIdeaToProject: (ideaId: string) => void
  clearAllProjects: () => void
  addIdeaFeature: (ideaId: string, feature: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', [])
  const [ideas, setIdeas] = useLocalStorage<Idea[]>('ideas', [])

  const addProject = (project: Omit<Project, 'id' | 'progress' | 'features'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      progress: 0,
      features: []
    }
    setProjects([...projects, newProject])
  }

  const updateProject = (updatedProject: Project) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
  }

  const removeProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id))
  }

  const addIdea = (idea: Omit<Idea, 'id'>) => {
    const newIdea: Idea = {
      ...idea,
      id: Date.now().toString(),
      features: idea.features || []
    }
    setIdeas([...ideas, newIdea])
  }

  const removeIdea = (id: string) => {
    setIdeas(ideas.filter(i => i.id !== id))
  }

  const addProjectFeature = (projectId: string, feature: string) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        const newFeatures = [...p.features, { text: feature, completed: false }]
        const progress = calculateProgress(newFeatures)
        return { ...p, features: newFeatures, progress }
      }
      return p
    }))
  }

  const toggleProjectFeature = (projectId: string, featureIndex: number) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        const newFeatures = [...p.features]
        newFeatures[featureIndex].completed = !newFeatures[featureIndex].completed
        const progress = calculateProgress(newFeatures)
        return { ...p, features: newFeatures, progress }
      }
      return p
    }))
  }

  const calculateProgress = (features: { completed: boolean }[]): number => {
    const completedFeatures = features.filter(m => m.completed).length
    return features.length > 0 ? (completedFeatures / features.length) * 100 : 0
  }

  const reorderIdeas = (startIndex: number, endIndex: number) => {
    const result = Array.from(ideas)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    setIdeas(result)
  }

  const reorderProjects = (startIndex: number, endIndex: number) => {
    const result = Array.from(projects)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    setProjects(result)
  }

  const reorderProjectFeatures = (projectId: string, startIndex: number, endIndex: number) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        const newFeatures = Array.from(p.features)
        const [removed] = newFeatures.splice(startIndex, 1)
        newFeatures.splice(endIndex, 0, removed)
        return { ...p, features: newFeatures }
      }
      return p
    }))
  }

  const moveIdeaToProject = (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId)
    if (idea) {
      const newProject: Project = {
        id: Date.now().toString(),
        title: idea.title,
        description: idea.description,
        progress: 0,
        features: idea.features ? idea.features.map(m => ({ text: m, completed: false })) : []
      }
      setProjects([...projects, newProject])
      setIdeas(ideas.filter(i => i.id !== ideaId))
    }
  }

  const clearAllProjects = () => {
    setProjects([])
  }

  const addIdeaFeature = (ideaId: string, feature: string) => {
    setIdeas(ideas.map(idea => {
      if (idea.id === ideaId) {
        return { ...idea, features: [...(idea.features || []), feature] }
      }
      return idea
    }))
  }

  return (
    <AppContext.Provider value={{
      projects,
      ideas,
      addProject,
      updateProject,
      removeProject,
      addIdea,
      removeIdea,
      addProjectFeature,
      toggleProjectFeature,
      reorderIdeas,
      reorderProjects,
      reorderProjectFeatures,
      moveIdeaToProject,
      clearAllProjects,
      addIdeaFeature
    }}>
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