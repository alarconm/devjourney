"use client"

import React, { useState, useEffect } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Project, ProjectFeature } from '../types/project'

export function CompletedProjects() {
  const { projects, moveProject, resetProjectFeatures, skills } = useAppContext()
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)

  const completedProjects = projects.filter(p => p.status === 'completed')

  const toggleExpand = (projectId: string) => {
    setExpandedProjectId(prevId => prevId === projectId ? null : projectId)
  }

  const handleMoveToCurrentProjects = async (projectId: string) => {
    await moveProject(projectId, 'in_progress')
  }

  useEffect(() => {
    // This effect will run whenever the projects state changes
  }, [projects])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Completed Projects</CardTitle>
        <CardDescription>Your finished projects</CardDescription>
        </CardHeader>
      <CardContent>
        {completedProjects.map((project) => (
          <Card key={project.id} className="mb-4">
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-2">
                {project.associatedSkills?.map((skillId: string) => {
                  const skill = skills.find(s => s.id === skillId)
                  return skill ? (
                    <Badge key={skillId} variant="secondary" className="text-white">
                      {skill.name}
                    </Badge>
                  ) : null
                })}
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => toggleExpand(project.id)}>
                  {expandedProjectId === project.id ? 'Hide Details' : 'Show Details'}
                </Button>
                <Button onClick={() => handleMoveToCurrentProjects(project.id)}>
                  Move to Current Projects
                </Button>
              </div>
              {expandedProjectId === project.id && (
                <div className="mt-2">
                  <h4 className="font-semibold mb-2">Features:</h4>
                  <ul>
                    {project.project_features?.map((feature: ProjectFeature) => (
                      <li key={feature.id} className={feature.completed ? 'line-through' : ''}>
                        {feature.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}