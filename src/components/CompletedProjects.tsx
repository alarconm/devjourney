"use client"

import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

export function CompletedProjects() {
  const { projects } = useAppContext()
  const completedProjects = projects.filter(project => project.progress === 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Completed Projects</CardTitle>
        <CardDescription>Showcase your achievements</CardDescription>
      </CardHeader>
      <CardContent>
        {completedProjects.map((project) => (
          <HoverCard key={project.id}>
            <HoverCardTrigger asChild>
              <Card className="mb-4 cursor-pointer">
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  <Badge>Completed</Badge>
                </CardHeader>
              </Card>
            </HoverCardTrigger>
            <HoverCardContent>
              <p>{project.description}</p>
              <ul className="mt-2">
                {project.milestones.map((milestone, index) => (
                  <li key={index} className="flex items-center">
                    <span className="mr-2">✓</span>
                    {milestone.text}
                  </li>
                ))}
              </ul>
            </HoverCardContent>
          </HoverCard>
        ))}
      </CardContent>
    </Card>
  )
}