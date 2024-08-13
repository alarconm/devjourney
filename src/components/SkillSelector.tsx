import React from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SkillSelectorProps {
  selectedSkills: string[]
  onSkillSelect: (skillId: string) => void
}

export function SkillSelector({ selectedSkills, onSkillSelect }: SkillSelectorProps) {
  const { skills } = useAppContext()

  const availableSkills = skills.filter(skill => !selectedSkills.includes(skill.id))

  return (
    <Select onValueChange={onSkillSelect}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a skill" />
      </SelectTrigger>
      <SelectContent>
        {availableSkills.map((skill) => (
          <SelectItem key={skill.id} value={skill.id}>
            {skill.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}