"use client"

import React, { createContext, useContext, ReactNode } from 'react'
import { useLocalStorage } from '@/app/hooks/useLocalStorage'

interface Project {
  id: string
  title: string
  description: string
  progress: number
  milestones: { text: string; completed: boolean }[]
}

interface Idea {
  id: string
  title: string
  description: string
  milestones: string[]
}

interface AppContextType {
  projects: Project[]
  ideas: Idea[]
  addProject: (project: Omit<Project, 'id' | 'progress' | 'milestones'>) => void
  updateProject: (project: Project) => void
  removeProject: (id: string) => void
  addIdea: (idea: Omit<Idea, 'id'>) => void
  removeIdea: (id: string) => void
  addProjectMilestone: (projectId: string, milestone: string) => void
  toggleProjectMilestone: (projectId: string, milestoneIndex: number) => void
  reorderIdeas: (startIndex: number, endIndex: number) => void
  reorderProjects: (startIndex: number, endIndex: number) => void
  reorderProjectMilestones: (projectId: string, startIndex: number, endIndex: number) => void
  moveIdeaToProject: (ideaId: string) => void
  clearAllProjects: () => void
  addIdeaMilestone: (ideaId: string, milestone: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', [])
  const [ideas, setIdeas] = useLocalStorage<Idea[]>('ideas', [])

  const addProject = (project: Omit<Project, 'id' | 'progress' | 'milestones'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      progress: 0,
      milestones: []
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
      milestones: idea.milestones || []
    }
    setIdeas([...ideas, newIdea])
  }

  const removeIdea = (id: string) => {
    setIdeas(ideas.filter(i => i.id !== id))
  }

  const addProjectMilestone = (projectId: string, milestone: string) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        const newMilestones = [...p.milestones, { text: milestone, completed: false }]
        const progress = calculateProgress(newMilestones)
        return { ...p, milestones: newMilestones, progress }
      }
      return p
    }))
  }

  const toggleProjectMilestone = (projectId: string, milestoneIndex: number) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        const newMilestones = [...p.milestones]
        newMilestones[milestoneIndex].completed = !newMilestones[milestoneIndex].completed
        const progress = calculateProgress(newMilestones)
        return { ...p, milestones: newMilestones, progress }
      }
      return p
    }))
  }

  const calculateProgress = (milestones: { completed: boolean }[]): number => {
    const completedMilestones = milestones.filter(m => m.completed).length
    return milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0
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

  const reorderProjectMilestones = (projectId: string, startIndex: number, endIndex: number) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        const newMilestones = Array.from(p.milestones)
        const [removed] = newMilestones.splice(startIndex, 1)
        newMilestones.splice(endIndex, 0, removed)
        return { ...p, milestones: newMilestones }
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
        milestones: idea.milestones ? idea.milestones.map(m => ({ text: m, completed: false })) : []
      }
      setProjects([...projects, newProject])
      setIdeas(ideas.filter(i => i.id !== ideaId))
    }
  }

  const clearAllProjects = () => {
    setProjects([])
  }

  const addIdeaMilestone = (ideaId: string, milestone: string) => {
    setIdeas(ideas.map(idea => {
      if (idea.id === ideaId) {
        return { ...idea, milestones: [...(idea.milestones || []), milestone] }
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
      addProjectMilestone,
      toggleProjectMilestone,
      reorderIdeas,
      reorderProjects,
      reorderProjectMilestones,
      moveIdeaToProject,
      clearAllProjects,
      addIdeaMilestone
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