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
  const { ideas, addIdea, removeIdea, moveIdeaToProject, updateIdeas, addIdeaFeature } = useAppContext()
  const [newIdea, setNewIdea] = useState({ title: '', description: '' })
  const [newFeature, setNewFeature] = useState('')
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [brainstormingText, setBrainstormingText] = useState('')
  const [isBrainstormingOpen, setIsBrainstormingOpen] = useState(false)
  const [archivedNotes, setArchivedNotes] = useState<Array<{ text: string, timestamp: string }>>([])

  const handleRemoveIdea = async (ideaId: string) => {
    const success = await removeIdea(ideaId);
    if (success) {
      console.log('Idea removed successfully');
      // The idea has been removed from the database and local state in the AppContext
      // No need to update local state here as it's handled in the AppContext
    } else {
      console.error('Failed to remove idea');
      // Optionally, you can refresh ideas here if needed
      // await refreshIdeas();
    }
  };

  // Add this function to refresh ideas if needed
  const refreshIdeas = async () => {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching ideas:', error);
    } else {
      updateIdeas(data);
    }
  };

  useEffect(() => {
    const ideasChannel = supabase.channel('ideas-changes')
    
    ideasChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          updateIdeas(prevIdeas => [...prevIdeas, payload.new as Idea])
        } else if (payload.eventType === 'DELETE') {
          updateIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== payload.old.id))
        } else if (payload.eventType === 'UPDATE') {
          updateIdeas(prevIdeas => prevIdeas.map(idea => idea.id === payload.new.id ? payload.new as Idea : idea))
        }
      })
      .subscribe()

    return () => {
      ideasChannel.unsubscribe()
    }
  }, [updateIdeas])

  const toggleExpand = (ideaId: string) => {
    setExpandedIdeaId(prevId => prevId === ideaId ? null : ideaId);
  };

  const handleBrainstormingSave = async () => {
    if (brainstormingText.trim()) {
      const timestamp = new Date().toISOString()
      const { data, error } = await supabase
        .from('brainstorming_notes')
        .insert({ text: brainstormingText, timestamp })
        .select()

      if (error) {
        console.error('Error saving brainstorming note:', error)
      } else {
        setArchivedNotes(prev => [data[0], ...prev])
        setBrainstormingText('')
      }
    }
    setIsBrainstormingOpen(false)
  }

  const handleAddIdea = async () => {
    if (newIdea.title && newIdea.description) {
      const addedIdea = await addIdea(newIdea)
      if (addedIdea) {
        setNewIdea({ title: '', description: '' })
        setIsDialogOpen(false)
      }
    }
  }

  const handleAddFeature = async (ideaId: string) => {
    if (newFeature) {
      const addedFeature = await addIdeaFeature(ideaId, newFeature)
      if (addedFeature) {
        setNewFeature('')
        // No need to update local state here, as it's done in addIdeaFeature
      }
    }
  }

  useEffect(() => {
    const fetchArchivedNotes = async () => {
      const { data, error } = await supabase
        .from('brainstorming_notes')
        .select('*')
        .order('timestamp', { ascending: false })
      if (error) {
        console.error('Error fetching archived notes:', error.message)
      } else {
        setArchivedNotes(data)
      }
    }

    fetchArchivedNotes()
  }, [])

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceDroppableId = result.source.droppableId;
    const destinationDroppableId = result.destination.droppableId;

    if (sourceDroppableId === 'ideas' && destinationDroppableId === 'ideas') {
      // Reordering ideas
      const items = Array.from(ideas);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      updateIdeas(items);

      // Update idea order in the database
      for (let i = 0; i < items.length; i++) {
        await supabase
          .from('ideas')
          .update({ order: i })
          .eq('id', items[i].id);
      }
    } else if (sourceDroppableId.startsWith('features-') && destinationDroppableId.startsWith('features-')) {
      // Reordering features within an idea
      const ideaId = sourceDroppableId.split('-')[1];
      const updatedIdeas = ideas.map(idea => {
        if (idea.id === ideaId) {
          const updatedFeatures = Array.from(idea.features || []);
          const [reorderedFeature] = updatedFeatures.splice(result.source.index, 1);
          updatedFeatures.splice(result.destination.index, 0, reorderedFeature);
          return { ...idea, features: updatedFeatures };
        }
        return idea;
      });
      updateIdeas(updatedIdeas);

      // Update feature order in the database
      const idea = updatedIdeas.find(i => i.id === ideaId);
      if (idea && idea.features) {
        const updatedFeatures = idea.features.map((feature, index) => ({
          text: feature,
          order: index
        }));

        // Update features for this idea
        const { error } = await supabase
          .from('idea_features')
          .upsert(
            updatedFeatures.map(feature => ({
              idea_id: ideaId,
              text: feature.text,
              order: feature.order
            })),
            { onConflict: 'idea_id,text' }
          );

        if (error) {
          console.error('Error updating feature order:', error);
        }
      }
    }
  };

  console.log('Ideas:', ideas);

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
                                        <AlertDialogAction onClick={() => handleRemoveIdea(idea.id)}>
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