"use client"

import { useState } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function ProjectIdeas() {
  const { ideas, addIdea, removeIdea } = useAppContext()
  const [newIdea, setNewIdea] = useState({ title: '', description: '' })

  const handleAddIdea = () => {
    if (newIdea.title) {
      addIdea(newIdea)
      setNewIdea({ title: '', description: '' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Ideas</CardTitle>
        <CardDescription>Capture your brilliant ideas here</CardDescription>
      </CardHeader>
      <CardContent>
        {ideas.map((idea) => (
          <Card key={idea.id} className="mb-4">
            <CardHeader>
              <CardTitle>{idea.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{idea.description}</p>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" onClick={() => removeIdea(idea.id)}>Remove</Button>
            </CardFooter>
          </Card>
        ))}
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