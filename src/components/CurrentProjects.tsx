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
  const { projects, updateProject, removeProject, addProjectMilestone, toggleProjectMilestone, reorderProjects, reorderProjectMilestones, clearAllProjects } = useAppContext()
  const [newMilestone, setNewMilestone] = useState('')
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination, type } = result

    if (type === 'project') {
      reorderProjects(source.index, destination.index)
    } else if (type === 'milestone') {
      const projectId = result.draggableId.split('-')[0]
      reorderProjectMilestones(projectId, source.index, destination.index)
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
                              {expandedProjectId === project.id ? 'Hide Milestones' : 'Show Milestones'}
                            </Button>
                            {expandedProjectId === project.id && (
                              <div className="mt-2">
                                <ul className="space-y-2">
                                  {project.milestones.map((milestone, index) => (
                                    <li key={index} className="flex items-center">
                                      <Checkbox
                                        checked={milestone.completed}
                                        onCheckedChange={() => toggleProjectMilestone(project.id, index)}
                                        className="mr-2"
                                      />
                                      <span className={milestone.completed ? 'line-through' : ''}>{milestone.text}</span>
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-2 flex">
                                  <Input
                                    value={newMilestone}
                                    onChange={(e) => setNewMilestone(e.target.value)}
                                    placeholder="Add new milestone"
                                    className="mr-2"
                                  />
                                  <Button onClick={() => {
                                    addProjectMilestone(project.id, newMilestone)
                                    setNewMilestone('')
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