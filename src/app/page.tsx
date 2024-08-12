import { ProjectIdeas } from '@/components/ProjectIdeas'
import { CurrentProjects } from '@/components/CurrentProjects'
import { LearningJourney } from '@/components/LearningJourney'
import { CompletedProjects } from '@/components/CompletedProjects'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">DevJourney Helper App</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ProjectIdeas />
        <CurrentProjects />
        <LearningJourney />
        <CompletedProjects />
      </div>
    </main>
  )
}