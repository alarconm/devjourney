"use client"

import React, { createContext, useContext, ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface Project {
  id: string
  title: string
  description: string
  progress: number
  details: { text: string; completed: boolean }[]
}

interface Idea {
  id: string
  title: string
  description: string
  details: string[]
}

interface AppContextType {
  projects: Project[]
  ideas: Idea[]
  addProject: (project: Omit<Project, 'id' | 'progress' | 'details'>) => void
  updateProject: (project: Project) => void
  removeProject: (id: string) => void
  addIdea: (idea: Omit<Idea, 'id' | 'details'>) => void
  removeIdea: (id: string) => void
  addProjectDetail: (projectId: string, detail: string) => void
  toggleProjectDetail: (projectId: string, detailIndex: number) => void
  addIdeaDetail: (ideaId: string, detail: string) => void
  reorderIdeas: (startIndex: number, endIndex: number) => void
  reorderProjects: (startIndex: number, endIndex: number) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', [])
  const [ideas, setIdeas] = useLocalStorage<Idea[]>('ideas', [])

  const addProject = (project: Omit<Project, 'id' | 'progress' | 'details'>) => {
    setProjects(prev => [...prev, { ...project, id: Date.now().toString(), progress: 0, details: [] }])
  }

  const updateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p))
  }

  const removeProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const addIdea = (idea: Omit<Idea, 'id' | 'details'>) => {
    setIdeas(prev => [...prev, { ...idea, id: Date.now().toString(), details: [] }])
  }

  const removeIdea = (id: string) => {
    setIdeas(prev => prev.filter(i => i.id !== id))
  }

  const addProjectDetail = (projectId: string, detail: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newDetails = [...p.details, { text: detail, completed: false }]
        const completedCount = newDetails.filter(d => d.completed).length
        const progress = Math.round((completedCount / newDetails.length) * 100)
        return { ...p, details: newDetails, progress }
      }
      return p
    }))
  }

  const toggleProjectDetail = (projectId: string, detailIndex: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newDetails = p.details.map((d, index) => 
          index === detailIndex ? { ...d, completed: !d.completed } : d
        )
        const completedCount = newDetails.filter(d => d.completed).length
        const progress = Math.round((completedCount / newDetails.length) * 100)
        return { ...p, details: newDetails, progress }
      }
      return p
    }))
  }

  const addIdeaDetail = (ideaId: string, detail: string) => {
    setIdeas(prev => prev.map(i => 
      i.id === ideaId ? { ...i, details: [...i.details, detail] } : i
    ))
  }

  const reorderIdeas = (startIndex: number, endIndex: number) => {
    setIdeas(prev => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })
  }

  const reorderProjects = (startIndex: number, endIndex: number) => {
    setProjects(prev => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })
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
      addProjectDetail,
      toggleProjectDetail,
      addIdeaDetail,
      reorderIdeas,
      reorderProjects
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