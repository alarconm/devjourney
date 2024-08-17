"use client"

import React from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SkillItem } from './SkillItem'
import { AddSkillForm } from './AddSkillForm'

export function SkillList() {
  const { skills } = useAppContext()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <CardDescription>Track your development skills</CardDescription>
      </CardHeader>
      <CardContent>
        <AddSkillForm />
        <div className="mt-4">
          {skills.length > 0 ? (
            skills.map(skill => (
              <SkillItem key={skill.id} skill={skill} />
            ))
          ) : (
            <p>No skills added yet. Add skills to track your progress!</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}