"use client"

import React from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SkillSelectorProps {
  selectedSkills: string[]
  onSkillSelect: (skillId: string) => void
}

export function SkillSelector({ selectedSkills, onSkillSelect }: SkillSelectorProps) {
  const { skills } = useAppContext()

  return (
    <Select onValueChange={onSkillSelect}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a skill" />
      </SelectTrigger>
      <SelectContent>
        {skills
          .filter(skill => !selectedSkills.includes(skill.id))
          .map(skill => (
            <SelectItem key={skill.id} value={skill.id}>
              {skill.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}