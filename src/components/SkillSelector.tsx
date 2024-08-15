"use client"

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Skill {
  name: string
  level: number
}

export function SkillSelector({ selectedSkills, onSkillSelect }) {
  const [skills, setSkills] = useState<Skill[]>([])

  React.useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    const { data, error } = await supabase.from('skills').select('*')
    if (error) console.error('Error fetching skills:', error)
    else setSkills(data)
  }

  return (
    <div>
      <h3 className="text-lg font-semibold">Select skills</h3>
      <div className="mt-2">
        {skills.map((skill) => (
          <button
            key={skill.name}
            onClick={() => onSkillSelect(skill.name)}
            className={`mr-2 mb-2 px-3 py-1 rounded-full ${
              selectedSkills.includes(skill.name)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {skill.name}
          </button>
        ))}
      </div>
    </div>
  )
}