import { CurrentProjects } from '@/components/CurrentProjects'
import { LearningJourney } from '@/components/LearningJourney'
import { ProjectIdeas } from '@/components/ProjectIdeas'
import { CompletedProjects } from '@/components/CompletedProjects'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">DevJourney Helper App</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <CurrentProjects />
        </div>
        <div className="md:col-span-1">
          <LearningJourney />
        </div>
        <div className="md:col-span-1">
          <ProjectIdeas />
        </div>
      </div>
      <div className="mt-8">
        <CompletedProjects />
      </div>
    </main>
  )
}