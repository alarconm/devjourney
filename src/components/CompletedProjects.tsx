"use client"

import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"

export function CompletedProjects() {
  const { completedProjects, moveCompletedToProject } = useAppContext()

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
                {project.features && project.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="mr-2">✓</span>
                    {feature.text}
                  </li>
                ))}
              </ul>
              <Button 
                onClick={() => moveCompletedToProject(project.id)} 
                className="mt-4"
              >
                Move to Current Projects
              </Button>
            </HoverCardContent>
          </HoverCard>
        ))}
      </CardContent>
    </Card>
  )
}