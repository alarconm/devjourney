"use client"

import React, { createContext, useContext, ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface Project {
  id: string
  title: string
  description: string
  progress: number
}

interface Idea {
  id: string
  title: string
  description: string
}

interface AppContextType {
  projects: Project[]
  ideas: Idea[]
  brainstormNotes: string[]
  // eslint-disable-next-line no-unused-vars
  addProject: (project: Omit<Project, 'id'>) => void
  // eslint-disable-next-line no-unused-vars
  updateProject: (project: Project) => void
  // eslint-disable-next-line no-unused-vars
  removeProject: (id: string) => void
  // eslint-disable-next-line no-unused-vars
  addIdea: (idea: Omit<Idea, 'id'>) => void
  // eslint-disable-next-line no-unused-vars
  removeIdea: (id: string) => void
  // eslint-disable-next-line no-unused-vars
  addBrainstormNote: (note: string) => void
  // eslint-disable-next-line no-unused-vars
  removeBrainstormNote: (index: number) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', [])
  const [ideas, setIdeas] = useLocalStorage<Idea[]>('ideas', [])
  const [brainstormNotes, setBrainstormNotes] = useLocalStorage<string[]>('brainstormNotes', [])

  const addProject = (project: Omit<Project, 'id'>) => {
    setProjects(prev => [...prev, { ...project, id: Date.now().toString() }])
  }

  const updateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p))
  }

  const removeProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const addIdea = (idea: Omit<Idea, 'id'>) => {
    setIdeas(prev => [...prev, { ...idea, id: Date.now().toString() }])
  }

  const removeIdea = (id: string) => {
    setIdeas(prev => prev.filter(i => i.id !== id))
  }

  const addBrainstormNote = (note: string) => {
    setBrainstormNotes(prev => [...prev, note])
  }

  const removeBrainstormNote = (index: number) => {
    setBrainstormNotes(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <AppContext.Provider value={{
      projects,
      ideas,
      brainstormNotes,
      addProject,
      updateProject,
      removeProject,
      addIdea,
      removeIdea,
      addBrainstormNote,
      removeBrainstormNote
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