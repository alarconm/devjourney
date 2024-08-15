"use client"

import React, { useState } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { supabase } from '@/lib/supabase'

export function AddSkillForm() {
  const [skillName, setSkillName] = useState('')
  const { addSkill } = useAppContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (skillName.trim()) {
      const { error } = await addSkill({ name: skillName.trim(), level: 1 })
      if (error) console.error('Error adding skill:', error)
      else {
        setSkillName('')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <Input
        type="text"
        value={skillName}
        onChange={(e) => setSkillName(e.target.value)}
        placeholder="Enter new skill"
      />
      <Button type="submit">Add Skill</Button>
    </form>
  )
}