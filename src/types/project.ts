export interface Project {
    id: string;
    title: string;
    description: string;
    status: 'idea' | 'in_progress' | 'completed';
    progress: number;
    sort_order: number;
    project_features?: ProjectFeature[];
    associatedSkills?: string[];
  }
  
  export interface ProjectFeature {
    id: string;
    text: string;
    completed: boolean;
  }