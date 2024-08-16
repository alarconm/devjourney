"use client"

import React, { useState } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function AddSkillForm() {
  const [newSkill, setNewSkill] = useState('')
  const { addSkill } = useAppContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newSkill.trim()) {
      await addSkill(newSkill.trim())
      setNewSkill('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <Input
        value={newSkill}
        onChange={(e) => setNewSkill(e.target.value)}
        placeholder="Add new skill"
        className="flex-grow"
      />
      <Button type="submit">Add Skill</Button>
    </form>
  )
}