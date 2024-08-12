"use client"

import { useState } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

export function ProjectIdeas() {
  const { ideas, addIdea, removeIdea, reorderIdeas, moveIdeaToProject, addIdeaMilestone } = useAppContext()
  const [newIdea, setNewIdea] = useState({ title: '', description: '', milestones: [] })
  const [newMilestone, setNewMilestone] = useState('')

  const onDragEnd = (result: any) => {
    if (!result.destination) return
    if (result.destination.droppableId === 'currentProjects') {
      moveIdeaToProject(result.draggableId)
    } else {
      reorderIdeas(result.source.index, result.destination.index)
    }
  }

  const handleAddIdea = () => {
    if (newIdea.title && newIdea.description) {
      addIdea({ ...newIdea, milestones: [] })
      setNewIdea({ title: '', description: '', milestones: [] })
    }
  }

  const handleAddMilestone = (ideaId: string) => {
    if (newMilestone) {
      addIdeaMilestone(ideaId, newMilestone)
      setNewMilestone('')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Ideas</CardTitle>
        <CardDescription>Capture your project ideas</CardDescription>
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
                          </CardHeader>
                          <CardContent>
                            <p>{idea.description}</p>
                            <ul className="mt-2">
                              {idea.milestones && idea.milestones.map((milestone, index) => (
                                <li key={index}>{milestone}</li>
                              ))}
                            </ul>
                            <div className="mt-2 flex">
                              <Input
                                value={newMilestone}
                                onChange={(e) => setNewMilestone(e.target.value)}
                                placeholder="Add new milestone"
                                className="mr-2"
                              />
                              <Button onClick={() => handleAddMilestone(idea.id)}>Add</Button>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button variant="destructive" onClick={() => removeIdea(idea.id)}>Remove</Button>
                            <Button onClick={() => moveIdeaToProject(idea.id)} className="ml-2">Start Project</Button>
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
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full">Add New Idea</Button>
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
    </Card>
  )
}