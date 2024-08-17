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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from '@/lib/supabase'
import { Project, ProjectFeature } from '../types/project'

export function CurrentProjects() {
  const { projects, addProjectFeature, toggleProjectFeature, moveProject, skills, associateSkillWithProject, fetchProjects, updateFeatureOrder, fetchSkills, setProjects } = useAppContext()
  const [newFeature, setNewFeature] = useState('')
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)

  const currentProjects = projects.filter(p => p.status === 'in_progress').sort((a, b) => a.sort_order - b.sort_order)

  const toggleExpand = (projectId: string) => {
    setExpandedProjectId(prevId => prevId === projectId ? null : projectId)
  }

  const handleToggleProjectFeature = async (projectId: string, featureId: string) => {
    const updatedProject = await toggleProjectFeature(projectId, featureId)
    if (updatedProject) {
      if (updatedProject.status === 'completed') {
        setProjects(prev => prev.filter(p => p.id !== projectId))
      } else {
        setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p))
      }
    }
    fetchProjects() // Refresh all projects to ensure consistency
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
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (result.type === 'project') {
      const updatedProjects = Array.from(currentProjects);
      const [reorderedItem] = updatedProjects.splice(sourceIndex, 1);
      updatedProjects.splice(destIndex, 0, reorderedItem);

      // Update the sort_order of projects in the database
      const updates = updatedProjects.map((project, index) => ({
        id: project.id,
        sort_order: index
      }));

      console.log('Updates to be sent:', updates);

      for (const update of updates) {
        const { error } = await supabase
          .from('projects')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);

        if (error) {
          console.error('Error updating project order:', error);
          return; // Exit the loop if there's an error
        }
      }

      // Update local state with the new order
      setProjects(prev => {
        const newProjects = prev.map(p => {
          const updatedProject = updatedProjects.find(up => up.id === p.id);
          return updatedProject ? { ...p, sort_order: updatedProject.sort_order } : p;
        });
        return newProjects.sort((a, b) => a.sort_order - b.sort_order);
      });
    } else if (result.type === 'feature') {
      const projectId = result.source.droppableId.split('-')[1];
      const projectToUpdate = currentProjects.find(p => p.id === projectId);
      if (projectToUpdate && projectToUpdate.project_features) {
        const newFeatures = Array.from(projectToUpdate.project_features);
        const [reorderedItem] = newFeatures.splice(sourceIndex, 1);
        newFeatures.splice(destIndex, 0, reorderedItem);

        // Update feature order in the database
        const updates = newFeatures.map((feature, index) => ({
          id: feature.id,
          sort_order: index
        }));

        const { error } = await supabase.from('project_features').upsert(updates);

        if (error) {
          console.error('Error updating feature order:', error);
        } else {
          // Update local state with the new feature order
          setProjects(prev => prev.map(p =>
            p.id === projectId
              ? { ...p, project_features: newFeatures.sort((a, b) => a.sort_order - b.sort_order) }
              : p
          ));
        }
      }
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
                            <div className="text-sm text-foreground mb-2">
                              <p className="font-semibold mb-1">Next Feature to Implement:</p>
                              {project.project_features && project.project_features.find((f: ProjectFeature) => !f.completed) && (
                                <div className="p-2 bg-secondary/10 rounded">
                                  <p>{project.project_features.find((f: ProjectFeature) => !f.completed)?.text}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2 mb-4">
                              <Button onClick={() => toggleExpand(project.id)} variant="secondary" className="bg-secondary text-secondary-foreground">
                                {expandedProjectId === project.id ? 'Hide Details' : 'Show Details'}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="gradient" className="text-white">Move to Ideas</Button>
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
                                    <AlertDialogAction onClick={() => handleMoveToIdea(project.id)} className="text-white">
                                      Move to Ideas
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            {expandedProjectId === project.id && (
                              <div>
                                <h4 className="font-semibold mb-2">Features:</h4>
                                <Droppable droppableId={`features-${project.id}`} type="feature" direction="vertical">
                                  {(provided, snapshot) => (
                                    <ul
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-secondary/20' : ''}`}
                                    >
                                      {project.project_features?.map((feature: ProjectFeature, index: number) => (
                                        <Draggable key={feature.id} draggableId={`${project.id}-${feature.id}`} index={index}>
                                          {(provided) => (
                                            <li
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className={`flex items-center p-2 bg-secondary/10 rounded ${
                                                snapshot.isDraggingOver ? 'opacity-50' : ''
                                              }`}
                                            >
                                              <Checkbox
                                                checked={feature.completed}
                                                onCheckedChange={() => handleToggleProjectFeature(project.id, feature.id)}
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
                                  <Button onClick={() => handleAddFeature(project.id)} variant="default" className="bg-primary text-primary-foreground">Add</Button>
                                </div>
                                <div className="mt-4 mb-4">
                                  <h4 className="font-semibold mb-2">Associated Skills:</h4>
                                  <Select onValueChange={(value) => associateSkillWithProject(project.id, value)}>
                                    <SelectTrigger className="w-full bg-background text-foreground">
                                      <SelectValue placeholder="Select a skill" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background text-foreground">
                                      {skills.map((skill) => (
                                        <SelectItem key={skill.id} value={skill.id} className="hover:bg-accent hover:text-accent-foreground">
                                          {skill.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {project.associatedSkills?.map((skillId: string) => {
                                      const skill = skills.find(s => s.id === skillId)
                                      return skill ? (
                                        <Badge key={skillId} variant="secondary" className="text-white">
                                          {skill.name}
                                        </Badge>
                                      ) : null
                                    })}
                                  </div>
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