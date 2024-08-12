"use client"

import { useState } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { motion, AnimatePresence } from 'framer-motion'

export function CurrentProjects() {
  const { projects, addProject, updateProject, removeProject, addProjectDetail, toggleProjectDetail, reorderProjects } = useAppContext()
  const [newProject, setNewProject] = useState({ title: '', description: '' })
  const [newDetail, setNewDetail] = useState('')
  const [expandedProject, setExpandedProject] = useState<string | null>(null)

  const handleAddProject = () => {
    if (newProject.title) {
      addProject(newProject)
      setNewProject({ title: '', description: '' })
    }
  }

  const handleAddDetail = (projectId: string) => {
    if (newDetail) {
      addProjectDetail(projectId, newDetail)
      setNewDetail('')
    }
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return
    reorderProjects(result.source.index, result.destination.index)
  }

  return (
    <Card className="bg-secondary">
      <CardHeader>
        <CardTitle className="text-primary">Current Projects</CardTitle>
        <CardDescription>Track your ongoing projects</CardDescription>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="projects">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                <AnimatePresence>
                  {projects.map((project, index) => (
                    <Draggable key={project.id} draggableId={project.id} index={index}>
                      {(provided) => (
                        <motion.div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -50 }}
                          className="mb-4"
                        >
                          <Card>
                            <CardHeader>
                              <CardTitle>{project.title}</CardTitle>
                              <Badge>{project.progress}% Complete</Badge>
                            </CardHeader>
                            <CardContent>
                              <p>{project.description}</p>
                              <Progress value={project.progress} className="mt-2" />
                              <Button
                                variant="outline"
                                onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                                className="mt-2"
                              >
                                {expandedProject === project.id ? 'Hide Details' : 'Show Details'}
                              </Button>
                              <AnimatePresence>
                                {expandedProject === project.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <ul className="mt-2 space-y-2">
                                      {project.details.map((detail, index) => (
                                        <li key={index} className="flex items-center">
                                          <Checkbox
                                            checked={detail.completed}
                                            onCheckedChange={() => toggleProjectDetail(project.id, index)}
                                            className="mr-2"
                                          />
                                          <span className={detail.completed ? 'line-through' : ''}>{detail.text}</span>
                                        </li>
                                      ))}
                                    </ul>
                                    <div className="mt-2 flex">
                                      <Input
                                        value={newDetail}
                                        onChange={(e) => setNewDetail(e.target.value)}
                                        placeholder="Add new detail"
                                        className="mr-2"
                                      />
                                      <Button onClick={() => handleAddDetail(project.id)}>Add</Button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </CardContent>
                            <CardFooter>
                              <Button variant="destructive" onClick={() => removeProject(project.id)}>Remove</Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      )}
                    </Draggable>
                  ))}
                </AnimatePresence>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>Start tracking a new project.</DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Project Title"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            />
            <Textarea
              placeholder="Project Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
            <DialogFooter>
              <Button onClick={handleAddProject}>Add Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}