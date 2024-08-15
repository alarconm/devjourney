"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { supabase } from '@/lib/supabase'

interface Project {
  id: string
  title: string
  progress: number
  status: string
}

interface Skill {
  id: string
  name: string
  level: number
}

export function LearningJourney() {
  const [projects, setProjects] = useState<Project[]>([])
  const [completedProjects, setCompletedProjects] = useState<Project[]>([])
  const [skills, setSkills] = useState<Skill[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
    if (projectsError) console.error('Error fetching projects:', projectsError)
    else setProjects(projectsData)

    const { data: completedData, error: completedError } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'completed')
    if (completedError) console.error('Error fetching completed projects:', completedError)
    else setCompletedProjects(completedData)

    const { data: skillsData, error: skillsError } = await supabase
      .from('skills')
      .select('*')
    if (skillsError) console.error('Error fetching skills:', skillsError)
    else setSkills(skillsData)
  }

  const completedProjectsCount = completedProjects.length
  const level = completedProjectsCount + 1

  // Sort projects by progress in descending order
  const sortedProjects = [...projects].sort((a, b) => b.progress - a.progress)

  // Calculate XP progress based on current projects' completion
  const totalProgress = sortedProjects.reduce((sum, project) => sum + project.progress, 0)
  const averageProgress = sortedProjects.length > 0 ? totalProgress / sortedProjects.length : 0
  let xpProgress = Math.min(averageProgress, 99)  // Cap at 99% if it would push to the next level

  const gainedSkills = skills.filter(skill => skill.level > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Learning Journey</CardTitle>
        <CardDescription>Track your progress and level up!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Level {level}</h3>
          <Progress value={xpProgress} className="mt-2" />
          <p className="mt-2">{completedProjectsCount} Projects Completed</p>
        </div>
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-primary">Current Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedProjects.map((project) => (
              <div key={project.id} className="mb-2 flex items-center">
                <div className="flex-grow mr-2 truncate">{project.title}</div>
                <Badge className="flex-shrink-0 w-24 text-center">
                  {project.progress.toFixed(0)}% Complete
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Skill Levels</CardTitle>
          </CardHeader>
          <CardContent>
            {gainedSkills.length > 0 ? (
              gainedSkills.map((skill) => (
                <div key={skill.id} className="mb-2">
                  <div className="flex justify-between items-center">
                    <span>{skill.name}</span>
                    <Badge>Level {skill.level}</Badge>
                  </div>
                  <Progress value={(skill.level / 10) * 100} className="mt-1" />
                </div>
              ))
            ) : (
              <p>No skills gained yet. Complete projects to level up your skills!</p>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}