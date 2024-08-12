"use client"

import { useState } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { motion, AnimatePresence } from 'framer-motion'

export function ProjectIdeas() {
  const { ideas, addIdea, removeIdea, addIdeaDetail, reorderIdeas } = useAppContext()
  const [newIdea, setNewIdea] = useState({ title: '', description: '' })
  const [newDetail, setNewDetail] = useState('')
  const [expandedIdea, setExpandedIdea] = useState<string | null>(null)

  const handleAddIdea = () => {
    if (newIdea.title) {
      addIdea(newIdea)
      setNewIdea({ title: '', description: '' })
    }
  }

  const handleAddDetail = (ideaId: string) => {
    if (newDetail) {
      addIdeaDetail(ideaId, newDetail)
      setNewDetail('')
    }
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return
    reorderIdeas(result.source.index, result.destination.index)
  }

  return (
    <Card className="bg-secondary">
      <CardHeader>
        <CardTitle className="text-primary">Project Ideas</CardTitle>
        <CardDescription>Capture your brilliant ideas here</CardDescription>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="ideas">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                <AnimatePresence>
                  {ideas.map((idea, index) => (
                    <Draggable key={idea.id} draggableId={idea.id} index={index}>
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
                              <CardTitle>{idea.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p>{idea.description}</p>
                              <Button
                                variant="outline"
                                onClick={() => setExpandedIdea(expandedIdea === idea.id ? null : idea.id)}
                                className="mt-2"
                              >
                                {expandedIdea === idea.id ? 'Hide Details' : 'Show Details'}
                              </Button>
                              <AnimatePresence>
                                {expandedIdea === idea.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <ul className="mt-2 space-y-2">
                                      {idea.details.map((detail, index) => (
                                        <li key={index} className="flex items-center">
                                          <span className="mr-2">•</span>
                                          {detail}
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
                                      <Button onClick={() => handleAddDetail(idea.id)}>Add</Button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </CardContent>
                            <CardFooter>
                              <Button variant="destructive" onClick={() => removeIdea(idea.id)}>Remove</Button>
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
            <Button>Add New Idea</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Project Idea</DialogTitle>
              <DialogDescription>Capture your next brilliant project idea here.</DialogDescription>
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