"use client"

import React from 'react'
import { Skill } from '@/types/project'
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface SkillItemProps {
  skill: Skill
}

export function SkillItem({ skill }: SkillItemProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">{skill.name}</span>
        <Badge>Level {skill.level}</Badge>
      </div>
      <Progress value={(skill.level / 10) * 100} className="h-2" />
    </div>
  )
}