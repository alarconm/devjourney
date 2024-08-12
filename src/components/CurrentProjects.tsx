"use client"

import { useState } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export function CurrentProjects() {
  const { projects, addProject, updateProject, removeProject } = useAppContext()
  const [newProject, setNewProject] = useState({ title: '', description: '', progress: 0 })

  const handleAddProject = () => {
    if (newProject.title) {
      addProject(newProject)
      setNewProject({ title: '', description: '', progress: 0 })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Projects</CardTitle>
        <CardDescription>Track your ongoing projects</CardDescription>
      </CardHeader>
      <CardContent>
        {projects.map((project) => (
          <Card key={project.id} className="mb-4">
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <Badge>{project.progress}% Complete</Badge>
            </CardHeader>
            <CardContent>
              <p>{project.description}</p>
              <Progress value={project.progress} className="mt-2" />
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="mr-2" onClick={() => updateProject({ ...project, progress: Math.min(project.progress + 10, 100) })}>
                Update Progress
              </Button>
              <Button variant="destructive" onClick={() => removeProject(project.id)}>Remove</Button>
            </CardFooter>
          </Card>
        ))}
      </CardContent>
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>Start tracking a new project.</DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Project Title"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            />
            <Textarea
              placeholder="Project Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
            <DialogFooter>
              <Button onClick={handleAddProject}>Add Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}