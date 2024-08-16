"use client"

import { useState, useEffect } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export function ProjectIdeas() {
  const { projects, addProject, removeProject, addProjectFeature, removeProjectFeature, moveProject, addBrainstormingNote, brainstormingNotes, fetchProjects, updateProject, updateFeatureOrder } = useAppContext()
  const [newIdea, setNewIdea] = useState({ title: '', description: '' })
  const [newFeature, setNewFeature] = useState('')
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [brainstormingText, setBrainstormingText] = useState('')
  const [isBrainstormingOpen, setIsBrainstormingOpen] = useState(false)

  const ideas = projects.filter(p => p.status === 'idea')

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleRemoveProject = async (projectId: string) => {
    try {
      const project = ideas.find(p => p.id === projectId);
      if (project && project.project_features) {
        // Remove all features first
        for (const feature of project.project_features) {
          await removeProjectFeature(projectId, feature.id);
        }
      }
      // Then remove the project
      await removeProject(projectId);
    } catch (error) {
      console.error("Error removing project:", error);
    }
  }

  const toggleExpand = (ideaId: string) => {
    setExpandedIdeaId(prevId => prevId === ideaId ? null : ideaId)
  }

  const handleBrainstormingSave = async () => {
    if (brainstormingText.trim()) {
      await addBrainstormingNote(brainstormingText.trim())
      setBrainstormingText('')
    }
    setIsBrainstormingOpen(false)
  }

  const handleAddIdea = async () => {
    if (newIdea.title && newIdea.description) {
      const maxSortOrder = Math.max(...ideas.map(i => i.sort_order), -1)
      await addProject({ ...newIdea, sort_order: maxSortOrder + 1 })
      setNewIdea({ title: '', description: '' })
      setIsDialogOpen(false)
    }
  }

  const handleAddFeature = async (ideaId: string) => {
    if (newFeature) {
      await addProjectFeature(ideaId, newFeature.trim())
      setNewFeature('')
    }
  }

  const handleMoveToProject = async (ideaId: string) => {
    await moveProject(ideaId, 'in_progress')
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destIndex = result.destination.index

    if (result.type === 'feature') {
      const ideaId = result.draggableId.split('-')[0]
      const ideaToUpdate = ideas.find(i => i.id === ideaId)
      if (ideaToUpdate && ideaToUpdate.project_features) {
        const newFeatures = Array.from(ideaToUpdate.project_features)
        const [reorderedItem] = newFeatures.splice(sourceIndex, 1)
        
        if (result.destination.droppableId === `features-${ideaId}`) {
          newFeatures.splice(destIndex, 0, reorderedItem)
          await updateFeatureOrder(ideaId, newFeatures)
        } else {
          // Feature was dragged out of the card, remove it
          await removeProjectFeature(ideaId, reorderedItem.id)
        }
      }
    } else if (result.type === 'idea') {
      const updatedIdeas = Array.from(ideas)
      const [reorderedItem] = updatedIdeas.splice(sourceIndex, 1)
      updatedIdeas.splice(destIndex, 0, reorderedItem)

      // Update the sort_order of ideas in the database
      for (let i = 0; i < updatedIdeas.length; i++) {
        await updateProject({ ...updatedIdeas[i], sort_order: i })
      }

      // Fetch projects again to update the local state with the new order
      fetchProjects()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Project Ideas</CardTitle>
        <CardDescription>Capture your project ideas</CardDescription>
        <Button onClick={() => setIsBrainstormingOpen(true)} variant="gradient" className="mt-2 text-white">
          Open Brainstorming
        </Button>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="ideas" type="idea">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {ideas.map((idea, index) => (
                  <Draggable key={idea.id} draggableId={idea.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="mb-4"
                      >
                        <Card>
                          <CardHeader>
                            <CardTitle>{idea.title}</CardTitle>
                            <CardDescription>{idea.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex space-x-2 mb-4">
                              <Button onClick={() => toggleExpand(idea.id)} variant="secondary" className="text-white">
                                {expandedIdeaId === idea.id ? 'Hide Details' : 'Show Details'}
                              </Button>
                              <Button onClick={() => handleMoveToProject(idea.id)} variant="gradient" className="text-white">Start Project</Button>
                            </div>
                            {expandedIdeaId === idea.id && (
                              <div>
                                <h4 className="font-semibold mb-2">Features:</h4>
                                <Droppable droppableId={`features-${idea.id}`} type="feature" direction="vertical">
                                  {(provided, snapshot) => (
                                    <ul
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-secondary/20' : ''}`}
                                    >
                                      {idea.project_features?.map((feature, index) => (
                                        <Draggable key={feature.id} draggableId={`${idea.id}-${feature.id}`} index={index}>
                                          {(provided, snapshot) => (
                                            <li
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className={`p-2 bg-secondary/10 rounded ${
                                                snapshot.isDragging ? 'opacity-50' : ''
                                              }`}
                                            >
                                              {feature.text}
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
                                  <Button onClick={() => handleAddFeature(idea.id)} variant="gradient" className="text-white">Add</Button>
                                </div>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="mt-4 text-white">Remove Project</Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the project idea and all its features.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleRemoveProject(idea.id)}>
                                        Remove Project
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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
      <CardFooter>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="gradient" onClick={() => setIsDialogOpen(true)}>Add New Idea</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Project Idea</DialogTitle>
              <DialogDescription>Capture your project idea.</DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Idea Title"
              value={newIdea.title}
              onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
            />
            <Textarea
              placeholder="Idea Description"
              value={newIdea.description}
              onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
            />
            <DialogFooter>
              <Button onClick={handleAddIdea} variant="gradient" className="text-white">Add Idea</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
      <Dialog open={isBrainstormingOpen} onOpenChange={setIsBrainstormingOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Brainstorming Space</DialogTitle>
            <DialogDescription>
              Use this space for open-ended brainstorming and idea dumping.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col h-full">
            <Textarea
              value={brainstormingText}
              onChange={(e) => setBrainstormingText(e.target.value)}
              className="flex-grow min-h-[30vh] mb-4"
              placeholder="Start brainstorming here..."
            />
            <div className="overflow-y-auto max-h-[30vh] mb-4">
              <h3 className="text-lg font-semibold mb-2">Archived Notes</h3>
              {brainstormingNotes.map((note) => (
                <div key={note.id} className="bg-secondary/10 p-2 rounded mb-2">
                  <p className="text-sm text-muted-foreground mb-1">{new Date(note.timestamp).toLocaleString()}</p>
                  <p>{note.text}</p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleBrainstormingSave} className="text-white">Save & Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}