"use client"

import { CurrentProjects } from '@/components/CurrentProjects'
import { LearningJourney } from '@/components/LearningJourney'
import { ProjectIdeas } from '@/components/ProjectIdeas'
import { CompletedProjects } from '@/components/CompletedProjects'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function HomeClient() {
  return (
    <main className="container mx-auto p-4">
      <motion.header
        className="bg-gradient-to-r from-primary to-secondary text-white py-8 mb-8 rounded-lg shadow-lg relative overflow-hidden"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-grid-white/[0.2] bg-[size:20px_20px]" />
        <motion.div
          className="container mx-auto flex items-center justify-between relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold flex items-center">
            DevJourney
            <motion.span
              className="ml-2 inline-block"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-8 h-8" />
            </motion.span>
          </h1>
          <p className="text-xl font-semibold">Complete projects to level up your skills</p>
        </motion.div>
      </motion.header>
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