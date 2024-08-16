"use client"

import { useState, useEffect } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

export function CurrentProjects() {
  const { projects, updateProject, removeProject, addProjectFeature, toggleProjectFeature, moveProject, skills, associateSkillWithProject, fetchProjects } = useAppContext()
  const [newFeature, setNewFeature] = useState('')
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)

  const currentProjects = projects.filter(p => p.status === 'in_progress')

  useEffect(() => {
    fetchProjects()
  }, [])

  const toggleExpand = (projectId: string) => {
    setExpandedProjectId(prevId => prevId === projectId ? null : projectId)
  }

  const handleToggleProjectFeature = async (projectId: string, featureId: string) => {
    await toggleProjectFeature(projectId, featureId)
  }

  const handleAddFeature = async (projectId: string) => {
    if (newFeature.trim()) {
      await addProjectFeature(projectId, newFeature.trim())
      setNewFeature('')
    }
  }

  const handleMoveToIdea = async (projectId: string) => {
    await moveProject(projectId, 'idea')
  }

  const handleMoveToCompleted = async (projectId: string) => {
    await moveProject(projectId, 'completed')
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destIndex = result.destination.index
    const projectId = result.draggableId.split('-')[0]

    if (result.type === 'feature') {
      const projectToUpdate = currentProjects.find(p => p.id === projectId)
      if (projectToUpdate && projectToUpdate.project_features) {
        const newFeatures = Array.from(projectToUpdate.project_features)
        const [reorderedItem] = newFeatures.splice(sourceIndex, 1)
        newFeatures.splice(destIndex, 0, reorderedItem)
        
        const updatedProject = { ...projectToUpdate, project_features: newFeatures }
        await updateProject(updatedProject)
      }
    } else if (result.type === 'project') {
      const updatedProjects = Array.from(currentProjects)
      const [reorderedItem] = updatedProjects.splice(sourceIndex, 1)
      updatedProjects.splice(destIndex, 0, reorderedItem)

      // Update the sort_order of projects in the database
      for (let i = 0; i < updatedProjects.length; i++) {
        await updateProject({ ...updatedProjects[i], sort_order: i })
      }

      // Fetch projects again to update the local state with the new order
      fetchProjects()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Current Projects</CardTitle>
        <CardDescription>Your ongoing projects</CardDescription>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="current-projects" type="project">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {currentProjects.map((project, index) => (
                  <Draggable key={project.id} draggableId={project.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="mb-4"
                      >
                        <Card>
                          <CardHeader>
                            <CardTitle>{project.title}</CardTitle>
                            <CardDescription>{project.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Progress value={project.progress} className="mb-4" />
                            <div className="flex flex-wrap gap-2 mb-4">
                              {project.associatedSkills?.map((skillId) => {
                                const skill = skills.find(s => s.id === skillId)
                                return skill ? (
                                  <Badge key={skillId} variant="secondary">{skill.name}</Badge>
                                ) : null
                              })}
                            </div>
                            <div className="flex space-x-2 mb-4">
                              <Button onClick={() => toggleExpand(project.id)} variant="gradient">
                                {expandedProjectId === project.id ? 'Hide Details' : 'Show Details'}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="gradient">Move to Ideas</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Move Project to Ideas?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to move this project back to ideas? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleMoveToIdea(project.id)}>
                                      Move to Ideas
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <Button onClick={() => handleMoveToCompleted(project.id)}>Mark as Completed</Button>
                            </div>
                            {expandedProjectId === project.id && (
                              <div>
                                <h4 className="font-semibold mb-2">Features:</h4>
                                <Droppable droppableId={`features-${project.id}`} type="feature">
                                  {(provided) => (
                                    <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                      {project.project_features?.map((feature, index) => (
                                        <Draggable key={feature.id} draggableId={`${project.id}-${feature.id}`} index={index}>
                                          {(provided) => (
                                            <li
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className="flex items-center p-2 bg-secondary/10 rounded"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={feature.completed}
                                                onChange={() => handleToggleProjectFeature(project.id, feature.id)}
                                                className="mr-2"
                                              />
                                              <span className={feature.completed ? 'line-through' : ''}>{feature.text}</span>
                                            </li>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                    </ul>
                                  )}
                                </Droppable>
                                <div className="mt-2 flex">
                                  <Input
                                    value={newFeature}
                                    onChange={(e) => setNewFeature(e.target.value)}
                                    placeholder="Add new feature"
                                    className="mr-2"
                                  />
                                  <Button onClick={() => handleAddFeature(project.id)} variant="gradient">Add</Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  )
}