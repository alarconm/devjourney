"use client"

import { useState } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Project } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { SkillSelector } from './SkillSelector'
import { Badge } from "@/components/ui/badge"

export function CurrentProjects() {
  const { projects, projectOrder, updateProject, moveProjectToIdea, addProjectFeature, toggleProjectFeature, reorderProjects, reorderProjectFeatures, clearAllProjects, moveProjectToCompleted, skills } = useAppContext()
  const [newFeature, setNewFeature] = useState('')
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)

  const sortedProjects = projectOrder
    .map(id => projects.find(p => p.id === id))
    .filter(Boolean) as Project[]

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      // Item was dragged outside of any droppable area
      if (result.type === 'feature') {
        const [projectId, featureIndex] = result.draggableId.split('-')
        const project = projects.find(p => p.id === projectId)
        if (project) {
          const updatedFeatures = project.features.filter((_, index) => index !== parseInt(featureIndex))
          updateProject({ ...project, features: updatedFeatures })
        }
      }
      return
    }

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (result.type === 'project') {
      reorderProjects(sourceIndex, destinationIndex)
    } else if (result.type === 'feature') {
      const projectId = result.draggableId.split('-')[0]
      reorderProjectFeatures(projectId, sourceIndex, destinationIndex)
    }
  }

  const toggleExpand = (projectId: string) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId)
  }

  const checkAndMoveCompletedProject = (projectId: string, featureIndex: number) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const updatedFeatures = project.features.map((f, i) => 
        i === featureIndex ? { ...f, completed: !f.completed } : f
      );
      const completedFeatures = updatedFeatures.filter(f => f.completed).length;
      const progress = (completedFeatures / updatedFeatures.length) * 100;

      if (progress === 100) {
        moveProjectToCompleted(projectId);
      } else {
        updateProject({ ...project, features: updatedFeatures, progress });
      }
    }
  };

  const handleSkillSelect = (projectId: string, skillId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      const updatedProject = {
        ...project,
        associatedSkills: [...(project.associatedSkills || []), skillId]
      }
      updateProject(updatedProject)
    }
  }

  return (
    <Card>
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
                {sortedProjects.map((project, index) => (
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
                            <div className="flex items-center mb-2">
                              <Progress value={project.progress} className="flex-grow mr-2" />
                              <span className="text-sm text-muted-foreground">{Math.round(project.progress)}%</span>
                            </div>
                            {project.features && project.features.find(f => !f.completed) && (
                              <div className="text-sm text-muted-foreground mb-2 p-2 bg-secondary rounded">
                                <p className="font-semibold">Next Feature:</p>
                                <p className="mt-1">{project.features.find(f => !f.completed)?.text}</p>
                              </div>
                            )}
                            <div className="flex space-x-2">
                              <Button onClick={() => toggleExpand(project.id)}>
                                {expandedProjectId === project.id ? 'Hide Details' : 'Show Details'}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="secondary">
                                    Move to Ideas
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Move to Ideas?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to move this project back to ideas? This will reset its progress.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => moveProjectToIdea(project.id)}>
                                      Move to Ideas
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            {expandedProjectId === project.id && (
                              <div className="mt-2">
                                <Droppable droppableId={`features-${project.id}`} type="feature" direction="vertical">
                                  {(provided, snapshot) => (
                                    <ul
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className={`space-y-2 min-h-[100px] ${snapshot.isDraggingOver ? 'bg-secondary/50' : ''}`}
                                    >
                                      {project.features && project.features.map((feature, featureIndex) => (
                                        <Draggable key={`${project.id}-${featureIndex}`} draggableId={`${project.id}-${featureIndex}`} index={featureIndex}>
                                          {(provided, snapshot) => (
                                            <li
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className={`flex items-center bg-secondary p-2 rounded ${snapshot.isDragging ? 'opacity-50' : ''}`}
                                            >
                                              <Checkbox
                                                checked={feature.completed}
                                                onCheckedChange={() => {
                                                  checkAndMoveCompletedProject(project.id, featureIndex);
                                                }}
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
                                  <Button onClick={() => {
                                    addProjectFeature(project.id, newFeature)
                                    setNewFeature('')
                                  }}>Add</Button>
                                </div>
                                <div className="mt-4">
                                  <h4 className="text-sm font-semibold mb-2">Associated Skills</h4>
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {project.associatedSkills && project.associatedSkills.map((skillId) => {
                                      const skill = skills.find(s => s.id === skillId)
                                      return skill ? (
                                        <Badge key={skillId}>{skill.name}</Badge>
                                      ) : null
                                    })}
                                  </div>
                                  <SkillSelector
                                    selectedSkills={project.associatedSkills || []}
                                    onSkillSelect={(skillId) => handleSkillSelect(project.id, skillId)}
                                  />
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