"use client"

import React from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SkillItem } from './SkillItem'

export function SkillList() {
  const { skills } = useAppContext()
  const gainedSkills = skills.filter(skill => skill.level > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <CardDescription>Track your development skills</CardDescription>
      </CardHeader>
      <CardContent>
        {gainedSkills.length > 0 ? (
          gainedSkills.map(skill => (
            <SkillItem key={skill.id} skill={skill} />
          ))
        ) : (
          <p>No skills gained yet. Complete projects to level up your skills!</p>
        )}
      </CardContent>
    </Card>
  )
}