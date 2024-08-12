"use client"

import { useState } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function Brainstorming() {
  const { brainstormNotes, addBrainstormNote, removeBrainstormNote } = useAppContext()
  const [newNote, setNewNote] = useState('')

  const handleAddNote = () => {
    if (newNote) {
      addBrainstormNote(newNote)
      setNewNote('')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brainstorming</CardTitle>
        <CardDescription>Capture your thoughts and ideas</CardDescription>
      </CardHeader>
      <CardContent>
        {brainstormNotes.map((note, index) => (
          <Card key={index} className="mb-4">
            <CardContent>
              <p>{note}</p>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" onClick={() => removeBrainstormNote(index)}>Remove</Button>
            </CardFooter>
          </Card>
        ))}
      </CardContent>
      <CardFooter>
        <Textarea
          placeholder="New brainstorm note"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="mr-2"
        />
        <Button onClick={handleAddNote}>Add Note</Button>
      </CardFooter>
    </Card>
  )
}