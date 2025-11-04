export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface GradingCategory {
  id: string;
  category: string;
  score: number;
  maxScore: number;
  feedback: string;
  isEnhancing?: boolean;
  enhancedFeedback?: string;
  enhanceError?: string;
}


// Represents a single assignment from the zip file
export interface Assignment {
  id: string; // e.g., filename
  fileName: string;
  workflowId: string;
  status: JobStatus;
  grade?: number; // Overall grade percentage for this assignment
  results?: GradingCategory[];
  error?: string;
}

// Represents the entire batch submission
export interface GradingJob {
  batchId: string;
  status: JobStatus;
  assignments: Assignment[];
  error?: string;
}


export type Rubric = {
  type: 'text' | 'file' | 'url';
  value: string | File | null;
};