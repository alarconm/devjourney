import { pgTable, uuid, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  progress: integer('progress').notNull().default(0),
  status: text('status').notNull().default('in_progress'),
  createdAt: timestamp('created_at').defaultNow(),
  associatedSkills: uuid('associated_skills').array(),
})

export const projectFeatures = pgTable('project_features', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  text: text('text').notNull(),
  completed: boolean('completed').notNull().default(false),
})

export const ideas = pgTable('ideas', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const ideaFeatures = pgTable('idea_features', {
  id: uuid('id').defaultRandom().primaryKey(),
  ideaId: uuid('idea_id').references(() => ideas.id).notNull(),
  text: text('text').notNull(),
})

export const skills = pgTable('skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  level: integer('level').notNull().default(1),
})

export const projectSkills = pgTable('project_skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  skillId: uuid('skill_id').references(() => skills.id).notNull(),
})

export const projectOrder = pgTable('project_order', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  order: integer('order').notNull(),
})

export const ideaOrder = pgTable('idea_order', {
  id: uuid('id').defaultRandom().primaryKey(),
  ideaId: uuid('idea_id').references(() => ideas.id).notNull(),
  order: integer('order').notNull(),
})

export const learningJourneyOrder = pgTable('learning_journey_order', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  order: integer('order').notNull(),
})

export const brainstormingNotes = pgTable('brainstorming_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  text: text('text').notNull(),
  timestamp: timestamp('timestamp').notNull(),
})