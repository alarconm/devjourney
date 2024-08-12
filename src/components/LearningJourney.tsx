"use client"

import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export function LearningJourney() {
  const { projects } = useAppContext()

  const sortedProjects = [...projects].sort((a, b) => b.progress - a.progress)
  const completedProjects = projects.filter(project => project.progress === 100).length
  const level = completedProjects + 1
  const xpProgress = (completedProjects % 1) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Journey</CardTitle>
        <CardDescription>Track your progress and level up!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Level {level}</h3>
          <Progress value={xpProgress} className="mt-2" />
          <p className="mt-2">{completedProjects} Projects Completed</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Project Breakdown</h3>
          {sortedProjects.map((project) => (
            <div key={project.id} className="mb-2 flex items-center">
              <div className="flex-grow mr-2 truncate">{project.title}</div>
              <Badge className="flex-shrink-0 w-24 text-center">
                {(project.progress ?? 0).toFixed(0)}% Complete
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}