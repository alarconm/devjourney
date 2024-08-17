"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useAppContext } from '@/app/context/AppContext'
import { Project, ProjectFeature } from '@/types/project';

export function LearningJourney() {
  const { projects: contextProjects, skills, fetchProjects, fetchSkills } = useAppContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [inProgressProjects, setInProgressProjects] = useState<Project[]>([]);
  const [completedProjectsCount, setCompletedProjectsCount] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);

  useEffect(() => {
    fetchProjects();
    fetchSkills();
  }, []);

  useEffect(() => {
    setProjects(contextProjects);
    const currentProjects = contextProjects.filter(p => p.status === 'in_progress');
    setInProgressProjects(currentProjects as Project[]);
    const completedProjects = contextProjects.filter(p => p.status === 'completed');
    setCompletedProjectsCount(completedProjects.length);

    const totalFeatures = currentProjects.reduce((sum, project) => sum + (project.project_features?.length || 0), 0);
    const completedFeatures = currentProjects.reduce((sum, project) => sum + (project.project_features?.filter((f: ProjectFeature) => f.completed).length || 0), 0);
    
    const calculatedTotalProgress = totalFeatures > 0 ? (completedFeatures / totalFeatures) * 100 : 0;
    setTotalProgress(Math.min(calculatedTotalProgress, 99));
  }, [contextProjects]);

  const level = completedProjectsCount;
  const xpProgress = totalProgress;

  const gainedSkills = skills.filter(skill => 
    contextProjects.some(project => 
      project.status === 'completed' && 
      project.associatedSkills?.includes(skill.id)
    )
  );

  const calculateSkillLevel = (skillId: string) => {
    const projectsWithSkill = contextProjects.filter(project => 
      project.associatedSkills?.includes(skillId) && project.status === 'completed'
    );
    return projectsWithSkill.length;
  };

  const handleSkillClick = (skillId: string) => {
    // Handle skill click logic here
  };

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
            {inProgressProjects.map((project) => (
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
                <div key={skill.id} className="flex items-center justify-between mb-2">
                  <span>{skill.name}</span>
                  <Badge variant="secondary">Level {calculateSkillLevel(skill.id)}</Badge>
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