export interface Project {
    id: string;
    title: string;
    description: string;
    status: 'idea' | 'in_progress' | 'completed';
    progress: number;
    sort_order: number;
    project_features?: ProjectFeature[];
    associatedSkills?: string[];
    created_at: string;
    updated_at: string;
  }
  
  export interface ProjectFeature {
    id: string;
    project_id: string;
    text: string;
    completed: boolean;
    sort_order: number;
  }

  export interface Skill {
    id: string;
    name: string;
    level: number;
    created_at: string;
  }

  export interface BrainstormingNote {
    id: string;
    text: string;
    timestamp: string;
  }