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
import { RealtimeChannel } from '@supabase/supabase-js'

export function CurrentProjects() {
  const { projects, updateProject, removeProject, addProjectFeature, toggleProjectFeature, skills, moveProjectToIdea, refreshCurrentProjects, setProjects, handleSkillSelect } = useAppContext()
  const [newFeature, setNewFeature] = useState('')
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)

  const toggleExpand = (projectId: string) => {
    setExpandedProjectId(prevId => prevId === projectId ? null : projectId);
  };

  const handleToggleProjectFeature = async (projectId: string, featureId: string) => {
    await toggleProjectFeature(projectId, featureId);
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      if (result.type === 'feature') {
        const [projectId, featureId] = result.draggableId.split('-');
        await handleRemoveFeature(projectId, featureId);
      }
      return;
    }

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    const projectId = result.source.droppableId.split('-')[1];

    if (result.type === 'feature') {
      const projectToUpdate = projects.find(p => p.id === projectId);
      if (projectToUpdate && projectToUpdate.project_features) {
        const newFeatures = Array.from(projectToUpdate.project_features);
        const [reorderedItem] = newFeatures.splice(sourceIndex, 1);
        newFeatures.splice(destIndex, 0, reorderedItem);
        
        const updatedProject = { ...projectToUpdate, project_features: newFeatures };
        await updateProject(updatedProject);
      }
    }
  };

  const handleRemoveFeature = async (projectId: string, featureId: string) => {
    const { error } = await supabase
      .from('project_features')
      .delete()
      .eq('id', featureId);

    if (error) {
      console.error('Error removing feature:', error);
    } else {
      setProjects(prevProjects => prevProjects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            project_features: p.project_features?.filter(f => f.id !== featureId)
          };
        }
        return p;
      }));
    }
  };

  const handleAddFeature = async (projectId: string) => {
    if (newFeature.trim()) {
      const addedFeature = await addProjectFeature(projectId, newFeature.trim())
      if (addedFeature) {
        setNewFeature('')
      }
    }
  }

  const handleMoveToIdea = async (projectId: string) => {
    await moveProjectToIdea(projectId);
  };

  useEffect(() => {
    const projectsChannel = supabase.channel('projects-changes');
    const featuresChannel = supabase.channel('features-changes');

    projectsChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, refreshCurrentProjects)
      .subscribe();

    featuresChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_features' }, refreshCurrentProjects)
      .subscribe();

    return () => {
      projectsChannel.unsubscribe();
      featuresChannel.unsubscribe();
    }
  }, [refreshCurrentProjects])

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
                {projects.map((project, index) => (
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
                              {project.project_features && project.project_features.find(f => !f.completed) && (
                                <div className="p-2 bg-secondary/10 rounded">
                                  <p>{project.project_features.find(f => !f.completed)?.text}</p>
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
                                    <AlertDialogAction onClick={() => handleMoveToIdea(project.id)}>
                                      Move to Ideas
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            {expandedProjectId === project.id && (
                              <div className="mt-2">
                                <Droppable droppableId={`features-${project.id}`} type="feature">
                                  {(provided, snapshot) => (
                                    <ul
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className={`space-y-2 min-h-[100px] ${snapshot.isDraggingOver ? 'bg-secondary/50' : ''}`}
                                    >
                                      {project.project_features && project.project_features.map((feature, index) => (
                                        <Draggable key={`${project.id}-${feature.id}`} draggableId={`${project.id}-${feature.id}`} index={index}>
                                          {(provided, snapshot) => (
                                            <li
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className={`flex items-center bg-secondary/10 p-2 rounded ${snapshot.isDragging ? 'opacity-50' : ''}`}
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