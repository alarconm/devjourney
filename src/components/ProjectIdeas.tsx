"use client"

import { useState } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Idea } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export function ProjectIdeas() {
  const { ideas, ideaOrder, addIdea, removeIdea, reorderIdeas, moveIdeaToProject, addIdeaFeature, reorderIdeaFeatures } = useAppContext()
  const [newIdea, setNewIdea] = useState({ title: '', description: '', features: [] })
  const [newFeature, setNewFeature] = useState('')
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [brainstormingText, setBrainstormingText] = useState('')
  const [isBrainstormingOpen, setIsBrainstormingOpen] = useState(false)

  const handleBrainstormingSave = () => {
    // Here you would typically save the brainstorming text to your backend
    // For now, we'll just close the dialog
    setIsBrainstormingOpen(false)
  }

  const sortedIdeas = ideaOrder.map(id => ideas.find(i => i.id === id)).filter(Boolean) as Idea[]

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (result.type === 'idea') {
      reorderIdeas(sourceIndex, destinationIndex)
    } else if (result.type === 'feature') {
      const ideaId = result.draggableId.split('-')[0]
      reorderIdeaFeatures(ideaId, sourceIndex, destinationIndex)
    }
  }

  const toggleExpand = (ideaId: string) => {
    setExpandedIdeaId(expandedIdeaId === ideaId ? null : ideaId)
  }

  const handleAddIdea = () => {
    if (newIdea.title && newIdea.description) {
      addIdea({ ...newIdea, features: [] })
      setNewIdea({ title: '', description: '', features: [] })
      setIsDialogOpen(false)
    }
  }

  const handleAddFeature = (ideaId: string) => {
    if (newFeature) {
      addIdeaFeature(ideaId, newFeature)
      setNewFeature('')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Project Ideas</CardTitle>
        <CardDescription>Capture your project ideas</CardDescription>
        <Button onClick={() => setIsBrainstormingOpen(true)} className="mt-2">
          Open Brainstorming
        </Button>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="ideas" type="idea">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {sortedIdeas.map((idea, index) => (
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
                            <div className="flex space-x-2">
                              <Button onClick={() => toggleExpand(idea.id)}>
                                {expandedIdeaId === idea.id ? 'Hide Details' : 'Show Details'}
                              </Button>
                              <Button variant="gradient" onClick={() => moveIdeaToProject(idea.id)}>Start Project</Button>
                            </div>
                            {expandedIdeaId === idea.id && (
                              <div className="mt-2">
                                <Droppable droppableId={`features-${idea.id}`} type="feature">
                                  {(provided) => (
                                    <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                      {idea.features && idea.features.map((feature, featureIndex) => (
                                        <Draggable key={`${idea.id}-${featureIndex}`} draggableId={`${idea.id}-${featureIndex}`} index={featureIndex}>
                                          {(provided) => (
                                            <li
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className="flex items-center bg-secondary/10 p-2 rounded"
                                            >
                                              <span>{feature}</span>
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
                                  <Button onClick={() => handleAddFeature(idea.id)}>Add</Button>
                                </div>
                                <div className="mt-4">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive">Remove</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete the idea.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => removeIdea(idea.id)}>
                                          Remove
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
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
      <CardFooter>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" onClick={() => setIsDialogOpen(true)}>Add New Idea</Button>
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
              <Button onClick={handleAddIdea}>Add Idea</Button>
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
          <Textarea
            value={brainstormingText}
            onChange={(e) => setBrainstormingText(e.target.value)}
            className="h-full min-h-[50vh]"
            placeholder="Start brainstorming here..."
          />
          <DialogFooter>
            <Button onClick={handleBrainstormingSave}>Save & Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}