"use client"

import { useState, useEffect } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Idea } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { supabase } from '@/lib/supabase'

export function ProjectIdeas() {
  const { fetchIdeas } = useAppContext()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [ideaOrder, setIdeaOrder] = useState<string[]>([])
  const [newIdea, setNewIdea] = useState({ title: '', description: '' })
  const [newFeature, setNewFeature] = useState('')
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [brainstormingText, setBrainstormingText] = useState('')
  const [isBrainstormingOpen, setIsBrainstormingOpen] = useState(false)
  const [archivedNotes, setArchivedNotes] = useState<Array<{ text: string, timestamp: string }>>([])

  useEffect(() => {
    fetchIdeasAndOrder()
  }, [])

  const fetchIdeasAndOrder = async () => {
    const { data: ideasData, error: ideasError } = await supabase.from('ideas').select('*')
    if (ideasError) console.error('Error fetching ideas:', ideasError)
    else setIdeas(ideasData)

    const { data: orderData, error: orderError } = await supabase
      .from('idea_order')
      .select('*')
      .order('order', { ascending: true })
    if (orderError) console.error('Error fetching idea order:', orderError)
    else setIdeaOrder(orderData.map(item => item.idea_id))
  }

  const handleBrainstormingSave = async () => {
    if (brainstormingText.trim()) {
      const timestamp = new Date().toISOString()
      const { error } = await supabase
        .from('brainstorming_notes')
        .insert({ text: brainstormingText, timestamp })
      if (error) console.error('Error saving brainstorming note:', error)
      else {
        setArchivedNotes(prev => [...prev, { text: brainstormingText, timestamp }])
        setBrainstormingText('')
      }
    }
    setIsBrainstormingOpen(false)
  }

  const sortedIdeas = ideaOrder.map(id => ideas.find(i => i.id === id)).filter(Boolean) as Idea[]

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (result.type === 'idea') {
      const newOrder = Array.from(ideaOrder)
      const [removed] = newOrder.splice(sourceIndex, 1)
      newOrder.splice(destinationIndex, 0, removed)

      setIdeaOrder(newOrder)

      const updates = newOrder.map((id, index) => ({
        idea_id: id,
        order: index
      }))

      const { error } = await supabase
        .from('idea_order')
        .upsert(updates, { onConflict: 'idea_id' })

      if (error) console.error('Error updating idea order:', error)
    } else if (result.type === 'feature') {
      const ideaId = result.draggableId.split('-')[0]
      const { data: features, error: fetchError } = await supabase
        .from('idea_features')
        .select('*')
        .eq('idea_id', ideaId)
        .order('order', { ascending: true })

      if (fetchError) {
        console.error('Error fetching idea features:', fetchError)
        return
      }

      const newFeatures = Array.from(features)
      const [removed] = newFeatures.splice(sourceIndex, 1)
      newFeatures.splice(destinationIndex, 0, removed)

      const updates = newFeatures.map((feature, index) => ({
        id: feature.id,
        order: index
      }))

      const { error } = await supabase
        .from('idea_features')
        .upsert(updates, { onConflict: 'id' })

      if (error) console.error('Error updating feature order:', error)
    }
  }

  const toggleExpand = (ideaId: string) => {
    setExpandedIdeaId(expandedIdeaId === ideaId ? null : ideaId)
  }

  const handleAddIdea = async () => {
    if (newIdea.title && newIdea.description) {
      const { data, error } = await supabase
        .from('ideas')
        .insert([newIdea])
        .select()
      if (error) {
        console.error('Error adding idea:', error)
      } else if (data) {
        setIdeas(prevIdeas => [...prevIdeas, data[0]])
        setNewIdea({ title: '', description: '' })
        setIsDialogOpen(false)
        await fetchIdeasAndOrder()  // Add this line to refresh the ideas list
      }
    }
  }

  const handleAddFeature = async (ideaId: string) => {
    if (newFeature) {
      const { error } = await supabase
        .from('idea_features')
        .insert([{ idea_id: ideaId, text: newFeature }])
      if (error) console.error('Error adding idea feature:', error)
      else {
        setNewFeature('')
        await fetchIdeasAndOrder()
      }
    }
  }

  const removeIdea = async (id: string) => {
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id)
    if (error) console.error('Error removing idea:', error)
    else {
      await fetchIdeasAndOrder()
    }
  }

  const moveIdeaToProject = async (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId)
    if (!idea) return

    const { data: features, error: featuresError } = await supabase
      .from('idea_features')
      .select('*')
      .eq('idea_id', ideaId)

    if (featuresError) {
      console.error('Error fetching idea features:', featuresError)
      return
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{ title: idea.title, description: idea.description, progress: 0 }])
      .select()

    if (projectError) {
      console.error('Error creating project:', projectError)
      return
    }

    if (features && features.length > 0) {
      const projectFeatures = features.map(f => ({
        project_id: project[0].id,
        text: f.text,
        completed: false
      }))

      const { error: featuresInsertError } = await supabase
        .from('project_features')
        .insert(projectFeatures)

      if (featuresInsertError) {
        console.error('Error inserting project features:', featuresInsertError)
      }
    }

    await removeIdea(ideaId)
    await fetchIdeasAndOrder()
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
          <div className="flex flex-col h-full">
            <Textarea
              value={brainstormingText}
              onChange={(e) => setBrainstormingText(e.target.value)}
              className="flex-grow min-h-[30vh] mb-4"
              placeholder="Start brainstorming here..."
            />
            <div className="overflow-y-auto max-h-[30vh] mb-4">
              <h3 className="text-lg font-semibold mb-2">Archived Notes</h3>
              {archivedNotes.map((note, index) => (
                <div key={index} className="bg-secondary/10 p-2 rounded mb-2">
                  <p className="text-sm text-muted-foreground mb-1">{note.timestamp}</p>
                  <p>{note.text}</p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleBrainstormingSave}>Save & Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}