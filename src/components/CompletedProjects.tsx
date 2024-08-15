"use client"

import React, { useState, useEffect } from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"
import { supabase } from '@/lib/supabase'

export function CompletedProjects() {
  const { fetchCompletedProjects } = useAppContext()
  const [completedProjects, setCompletedProjects] = useState<CompletedProject[]>([])

  useEffect(() => {
    fetchCompletedProjectsFromDB()
  }, [])

  const fetchCompletedProjectsFromDB = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching completed projects:', error.message)
    } else {
      setCompletedProjects(data || [])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Completed Projects</CardTitle>
        <CardDescription>Your finished projects</CardDescription>
      </CardHeader>
      <CardContent>
        {completedProjects.map((project) => (
          <div key={project.id} className="mb-4">
            <h3 className="text-lg font-semibold">{project.title}</h3>
            <p className="text-sm text-muted-foreground">{project.description}</p>
            <div className="mt-2 flex items-center">
              <Badge variant="outline">Completed on: {new Date(project.created_at).toLocaleDateString()}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}