"use client"

import React, { createContext, useContext, ReactNode, useState } from 'react'
import { useLocalStorage } from '@/app/hooks/useLocalStorage'

export interface Project {
  id: string
  title: string
  description: string
  progress: number
  features: { text: string; completed: boolean }[]
}

export interface Idea {
  id: string
  title: string
  description: string
  features: string[]
}

interface AppContextType {
  projects: Project[]
  ideas: Idea[]
  projectOrder: string[]
  ideaOrder: string[]
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
  moveProjectToCompleted: (projectId: string) => void
  moveCompletedToProject: (projectId: string) => void
  completedProjects: Project[]
  updateProjectOrder: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', [])
  const [completedProjects, setCompletedProjects] = useLocalStorage<Project[]>('completedProjects', [])
  const [ideas, setIdeas] = useLocalStorage<Idea[]>('ideas', [])
  const [projectOrder, setProjectOrder] = useLocalStorage<string[]>('projectOrder', [])
  const [ideaOrder, setIdeaOrder] = useLocalStorage<string[]>('ideaOrder', [])

  const addProject = (project: Omit<Project, 'id' | 'progress' | 'features'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      progress: 0,
      features: []
    }
    setProjects(prevProjects => [...prevProjects, newProject])
    setProjectOrder(prevOrder => [...prevOrder, newProject.id])
  }

  const updateProject = (updatedProject: Project) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
  }

  const removeProject = (id: string) => {
    setProjects(prevProjects => prevProjects.filter(p => p.id !== id))
    setProjectOrder(prevOrder => prevOrder.filter(projectId => projectId !== id))
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
    setIdeaOrder((prevOrder) => {
      const result = Array.from(prevOrder);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }

  const reorderProjects = (startIndex: number, endIndex: number) => {
    setProjectOrder(prevOrder => {
      const result = Array.from(prevOrder);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
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

  const moveProjectToCompleted = (projectId: string) => {
    setProjects(prevProjects => {
      const projectToMove = prevProjects.find(p => p.id === projectId);
      if (projectToMove) {
        setCompletedProjects(prev => [...prev, { ...projectToMove, progress: 100 }]);
        return prevProjects.filter(p => p.id !== projectId);
      }
      return prevProjects;
    });
    setProjectOrder(prevOrder => prevOrder.filter(id => id !== projectId));
  }

  const moveCompletedToProject = (projectId: string) => {
    setCompletedProjects(prev => {
      const projectToMove = prev.find(p => p.id === projectId);
      if (projectToMove) {
        setProjects(prevProjects => [...prevProjects, { ...projectToMove, progress: 99 }]);
        return prev.filter(p => p.id !== projectId);
      }
      return prev;
    });
  }

  const updateProjectOrder = () => {
    setProjectOrder(projects.map(p => p.id));
  };

  const contextValue = {
    projects,
    ideas,
    projectOrder,
    ideaOrder,
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
    addIdeaFeature,
    moveProjectToCompleted,
    moveCompletedToProject,
    completedProjects,
    updateProjectOrder
  };

  React.useEffect(() => {
    updateProjectOrder();
  }, [projects]);

  React.useEffect(() => {
    setIdeaOrder(ideas.map(i => i.id));
  }, [ideas]);

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