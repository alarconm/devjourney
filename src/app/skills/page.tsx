import React from 'react';
import { SkillList } from '@/components/SkillList';
import { AddSkillForm } from '@/components/AddSkillForm';

export default function SkillsPage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Skills</h1>
      <AddSkillForm />
      <div className="mt-8">
        <SkillList />
      </div>
    </main>
  );
}
