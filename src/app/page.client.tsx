"use client"

import { CurrentProjects } from '@/components/CurrentProjects'
import { LearningJourney } from '@/components/LearningJourney'
import { ProjectIdeas } from '@/components/ProjectIdeas'
import { CompletedProjects } from '@/components/CompletedProjects'
import { motion } from 'framer-motion'
import { Sparkles, ArrowUp } from 'lucide-react'
import { ColorPaletteToggle } from '@/components/ColorPaletteToggle'

export default function HomeClient() {
  return (
    <main className="container mx-auto p-4">
      <motion.header
        className="bg-gradient-to-r from-primary via-secondary to-primary text-white py-6 mb-8 rounded-lg shadow-lg relative overflow-hidden"
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
            <motion.span
              className="bg-clip-text text-transparent bg-gradient-to-r from-white to-secondary"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}
            >
              DevJourney
            </motion.span>
            <motion.span
              className="ml-2 inline-block"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-8 h-8" />
            </motion.span>
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <p className="text-xl font-semibold mr-2">Complete projects to level</p>
              <motion.div
                whileHover={{ y: [0, -10, 0], transition: { duration: 0.5, repeat: Infinity } }}
              >
                <ArrowUp className="w-6 h-6" />
              </motion.div>
              <p className="text-xl font-semibold ml-2">your skills</p>
            </div>
            <ColorPaletteToggle />
          </div>
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