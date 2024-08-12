"use client"

import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export function LearningJourney() {
  const { projects } = useAppContext()

  const sortedProjects = [...projects].sort((a, b) => b.progress - a.progress)
  const totalProjects = projects.length
  const completedProjects = projects.filter(project => project.progress === 100).length
  const overallProgress = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Journey</CardTitle>
        <CardDescription>Track your overall progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Overall Progress</h3>
          <Progress value={overallProgress} className="mt-2" />
          <p className="mt-2">{overallProgress.toFixed(2)}% Complete</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Project Breakdown</h3>
          {sortedProjects.map((project) => (
            <div key={project.id} className="mb-2 flex items-center justify-between">
              <span>{project.title}</span>
              <Badge>{(project.progress ?? 0).toFixed(0)}% Complete</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}