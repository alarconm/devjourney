"use client"

import { useState, useEffect } from 'react'
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
import { supabase } from '@/lib/supabase'

export function CurrentProjects() {
  const { fetchProjects, updateProject, removeProject, addProjectFeature, toggleProjectFeature, skills, moveProjectToIdea, moveIdeaToProject } = useAppContext()
  const [projects, setProjects] = useState<Project[]>([])
  const [newFeature, setNewFeature] = useState('')
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [projectOrder, setProjectOrder] = useState<string[]>([])
  const [projectFeatures, setProjectFeatures] = useState<{[key: string]: {id: string, text: string, completed: boolean}[]}>({})

  useEffect(() => {
    fetchProjectsFromDB()
  }, [])

  const fetchProjectsFromDB = async () => {
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .neq('status', 'completed')

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return
    }

    const { data: featuresData, error: featuresError } = await supabase
      .from('project_features')
      .select('*')

    if (featuresError) {
      console.error('Error fetching project features:', featuresError)
      return
    }

    const projectsWithFeatures = projectsData.map(project => ({
      ...project,
      features: featuresData.filter(feature => feature.project_id === project.id)
    }))

    setProjects(projectsWithFeatures)
  }

  const fetchProjectOrder = async () => {
    const { data, error } = await supabase
      .from('project_order')
      .select('*')
      .order('order', { ascending: true })
    if (error) console.error('Error fetching project order:', error)
    else setProjectOrder(data.map(item => item.project_id))
  }

  const fetchProjectFeatures = async () => {
    const { data, error } = await supabase
      .from('project_features')
      .select('*')
    if (error) console.error('Error fetching project features:', error)
    else {
      const features = data.reduce((acc, feature) => {
        if (!acc[feature.project_id]) acc[feature.project_id] = []
        acc[feature.project_id].push(feature)
        return acc
      }, {} as {[key: string]: {id: string, text: string, completed: boolean}[]})
      setProjectFeatures(features)
    }
  }

  const sortedProjects = projectOrder.length > 0
    ? projectOrder
        .map(id => projects.find(p => p.id === id))
        .filter(Boolean) as Project[]
    : projects

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (result.type === 'project') {
      const newOrder = Array.from(projectOrder)
      const [removed] = newOrder.splice(sourceIndex, 1)
      newOrder.splice(destinationIndex, 0, removed)

      setProjectOrder(newOrder)

      // Update the order in the database
      const updates = newOrder.map((id, index) => ({
        project_id: id,
        order: index
      }))

      const { error } = await supabase
        .from('project_order')
        .upsert(updates, { onConflict: 'project_id' })

      if (error) console.error('Error updating project order:', error)
    } else if (result.type === 'feature') {
      const projectId = result.draggableId.split('-')[0]
      const newFeatures = Array.from(projectFeatures[projectId])
      const [removed] = newFeatures.splice(sourceIndex, 1)
      newFeatures.splice(destinationIndex, 0, removed)

      setProjectFeatures({...projectFeatures, [projectId]: newFeatures})

      // Update the order in the database
      const updates = newFeatures.map((feature, index) => ({
        id: feature.id,
        order: index
      }))

      const { error } = await supabase
        .from('project_features')
        .upsert(updates, { onConflict: 'id' })

      if (error) console.error('Error updating feature order:', error)
    }
  }

  const toggleExpand = (projectId: string) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId)
  }

  const handleAddFeature = async (projectId: string) => {
    if (newFeature.trim()) {
      await addProjectFeature(projectId, newFeature)
      setNewFeature('')
      await fetchProjectFeatures()
    }
  }

  const checkAndMoveCompletedProject = async (projectId: string, featureId: string) => {
    await toggleProjectFeature(projectId, featureId)
    await fetchProjectFeatures()

    const project = projects.find(p => p.id === projectId)
    if (project) {
      const updatedFeatures = projectFeatures[projectId]
      const completedFeatures = updatedFeatures.filter(f => f.completed).length
      const progress = (completedFeatures / updatedFeatures.length) * 100

      if (progress === 100) {
        await updateProject({ ...project, progress, status: 'completed' })
      } else {
        await updateProject({ ...project, progress })
      }
    }
  }

  const handleSkillSelect = async (projectId: string, skillId: string) => {
    const { error } = await supabase
      .from('project_skills')
      .insert({ project_id: projectId, skill_id: skillId })
    
    if (error) console.error('Error associating skill with project:', error)
    else {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        const updatedProject = {
          ...project,
          associatedSkills: [...(project.associatedSkills || []), skillId]
        }
        await updateProject(updatedProject)
      }
    }
  }

  const handleRemoveProject = async (projectId: string) => {
    await removeProject(projectId)
    setProjects(projects.filter(p => p.id !== projectId))
    await fetchProjectOrder()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Current Projects</CardTitle>
        <CardDescription>Track your ongoing projects</CardDescription>
      </CardHeader>
      <CardContent>
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
                            <div className="text-sm text-foreground mb-2">
                              <p className="font-semibold mb-1">Next Feature to Implement:</p>
                              {projectFeatures[project.id] && projectFeatures[project.id].find(f => !f.completed) && (
                                <div className="p-2 bg-secondary/10 rounded">
                                  <p>{projectFeatures[project.id].find(f => !f.completed)?.text}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button onClick={() => toggleExpand(project.id)}>
                                {expandedProjectId === project.id ? 'Hide Details' : 'Show Details'}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="gradient">
                                    Move to Ideas
                                  </Button>
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
                                      {projectFeatures[project.id] && projectFeatures[project.id].map((feature, featureIndex) => (
                                        <Draggable key={`${project.id}-${featureIndex}`} draggableId={`${project.id}-${featureIndex}`} index={featureIndex}>
                                          {(provided, snapshot) => (
                                            <li
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className={`flex items-center bg-secondary/10 p-2 rounded ${snapshot.isDragging ? 'opacity-50' : ''}`}
                                            >
                                              <Checkbox
                                                checked={feature.completed}
                                                onCheckedChange={() => checkAndMoveCompletedProject(project.id, feature.id)}
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
                                  <Button onClick={() => handleAddFeature(project.id)}>Add</Button>
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