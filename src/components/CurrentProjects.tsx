"use client"

import { useState } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

export function CurrentProjects() {
  const { projects, updateProject, removeProject, addProjectFeature, toggleProjectFeature, reorderProjects, reorderProjectFeatures, clearAllProjects } = useAppContext()
  const [newFeature, setNewFeature] = useState('')
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination, type } = result

    if (type === 'project') {
      reorderProjects(source.index, destination.index)
    } else if (type === 'feature') {
      const projectId = result.draggableId.split('-')[0]
      reorderProjectFeatures(projectId, source.index, destination.index)
    }
  }

  const toggleExpand = (projectId: string) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId)
  }

  return (
    <Card className="bg-secondary">
      <CardHeader>
        <CardTitle className="text-primary">Current Projects</CardTitle>
        <CardDescription>Track your ongoing projects</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={clearAllProjects} variant="destructive" className="mb-4">
          Clear All Projects (Temporary)
        </Button>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="currentProjects" type="project">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {projects.filter(project => project.progress < 100).map((project, index) => (
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
                            <Progress value={project.progress} className="mb-2" />
                            <Button onClick={() => toggleExpand(project.id)}>
                              {expandedProjectId === project.id ? 'Hide Features' : 'Show Features'}
                            </Button>
                            {expandedProjectId === project.id && (
                              <div className="mt-2">
                                <ul className="space-y-2">
                                  {project.features.map((feature, index) => (
                                    <li key={index} className="flex items-center bg-secondary p-2 rounded">
                                      <Checkbox
                                        checked={feature.completed}
                                        onCheckedChange={() => toggleProjectFeature(project.id, index)}
                                        className="mr-2"
                                      />
                                      <span className={feature.completed ? 'line-through' : ''}>{feature.text}</span>
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-2 flex">
                                  <Input
                                    value={newFeature}
                                    onChange={(e) => setNewFeature(e.target.value)}
                                    placeholder="Add new feature"
                                    className="mr-2"
                                  />
                                  <Button onClick={() => {
                                    addProjectFeature(project.id, newFeature)
                                    setNewFeature('')
                                  }}>Add</Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter>
                            <Button variant="destructive" onClick={() => removeProject(project.id)}>Remove</Button>
                          </CardFooter>
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