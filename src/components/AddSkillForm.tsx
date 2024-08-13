"use client"

import React, { useState } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function AddSkillForm() {
  const [skillName, setSkillName] = useState('')
  const { addSkill } = useAppContext()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (skillName.trim()) {
      addSkill({ name: skillName.trim() })
      setSkillName('')
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