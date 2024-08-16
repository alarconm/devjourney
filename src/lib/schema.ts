import { pgTable, uuid, text, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core'

// Create an enum for project status
export const projectStatusEnum = pgEnum('project_status', ['idea', 'in_progress', 'completed'])

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  progress: integer('progress').notNull().default(0),
  status: projectStatusEnum('status').notNull().default('idea'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const projectFeatures = pgTable('project_features', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  text: text('text').notNull(),
  completed: boolean('completed').notNull().default(false),
  order: integer('order'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const skills = pgTable('skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  level: integer('level').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
})

export const projectSkills = pgTable('project_skills', {
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  skillId: uuid('skill_id').references(() => skills.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    pk: primaryKey(table.projectId, table.skillId),
  }
})

export const brainstormingNotes = pgTable('brainstorming_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  text: text('text').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
})