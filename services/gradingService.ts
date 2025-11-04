
import { GradingJob, JobStatus, GradingCategory, Assignment } from '../types';

interface MockJobData extends GradingJob {
    assignmentsPollCount: { [assignmentId: string]: number };
    assignmentsRetryCount: { [assignmentId: string]: number };
    maxRetries: number;
    customInstructions?: string;
}
// Mock database to store job state
const mockJobs: { [key: string]: MockJobData } = {};

export interface FileData {
    name: string;
    content: string; // For a real implementation, content would be sent to the worker
}

export const startGrading = (submissionFiles: FileData[], solutionFile: File | null, maxRetries: number, customInstructions: string): Promise<{ batchId: string }> => {
  console.log(`Starting grading for batch of ${submissionFiles.length} files with ${maxRetries} retries.`);
  if (customInstructions) {
      console.log('With custom instructions:', customInstructions);
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (submissionFiles.length === 0) {
        reject(new Error('At least one submission file is required.'));
        return;
      }
      
      const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const assignments: Assignment[] = submissionFiles.map((file, index) => ({
          id: file.name,
          fileName: file.name,
          workflowId: `wf-${Date.now()}-${index}`,
          status: JobStatus.PENDING,
      }));

      mockJobs[batchId] = {
          batchId,
          status: JobStatus.PENDING,
          assignments,
          assignmentsPollCount: {},
          assignmentsRetryCount: {},
          maxRetries: maxRetries,
          customInstructions: customInstructions
      };

      assignments.forEach(a => {
          mockJobs[batchId].assignmentsPollCount[a.id] = 0;
          mockJobs[batchId].assignmentsRetryCount[a.id] = 0;
      });

      resolve({ batchId });
    }, 1000);
  });
};

export const getJobStatus = (batchId: string): Promise<GradingJob> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const job = mockJobs[batchId];
      if (!job) {
        reject(new Error('Job not found.'));
        return;
      }

      let allDone = true;
      let atLeastOneFailed = false;

      // Update each assignment
      job.assignments = job.assignments.map(assignment => {
          if (assignment.status === JobStatus.COMPLETED || assignment.status === JobStatus.FAILED) {
              if(assignment.status === JobStatus.FAILED) atLeastOneFailed = true;
              return assignment;
          }

          allDone = false;
          job.assignmentsPollCount[assignment.id]++;
          const pollCount = job.assignmentsPollCount[assignment.id];
          const retryCount = job.assignmentsRetryCount[assignment.id];

          let newStatus: JobStatus = assignment.status;
          let newResults = assignment.results;
          let newGrade = assignment.grade;
          let newError = assignment.error;

          if (pollCount <= 1) {
              newStatus = JobStatus.RUNNING;
              newError = undefined; // Clear previous error messages on new run
          } else if (pollCount === 2) {
              // Decision point: fail, succeed, or retry
              if (Math.random() < 0.3) { // 30% chance of failure
                 if (retryCount < job.maxRetries) {
                     // Retryable failure
                     job.assignmentsRetryCount[assignment.id]++;
                     job.assignmentsPollCount[assignment.id] = 0; // Reset poll to simulate retry
                     newStatus = JobStatus.RUNNING;
                     newError = `A simulated error occurred. Retrying (${retryCount + 1}/${job.maxRetries})...`;
                 } else {
                     // Final failure
                     newStatus = JobStatus.FAILED;
                     newError = `A simulated random error occurred and the job failed after ${job.maxRetries} retries.`;
                     atLeastOneFailed = true;
                 }
              } else {
                // It didn't fail this time, continue to completion
                newStatus = JobStatus.RUNNING;
                newError = undefined;
              }
          } else {
              newStatus = JobStatus.COMPLETED;
              newError = undefined;
              const results: GradingCategory[] = [
                  { id: 'correctness', category: 'Correctness', score: Math.floor(Math.random() * 5) + 6, maxScore: 10, feedback: "Function 'calculateTotal' passed most test cases." },
                  { id: 'style', category: 'Code Style', score: Math.floor(Math.random() * 5) + 5, maxScore: 10, feedback: "Good adherence to style guidelines." },
                  { id: 'docs', category: 'Documentation', score: Math.floor(Math.random() * 3) + 3, maxScore: 5, feedback: "All public functions have docstrings." },
                  { id: 'structure', category: 'Overall Structure', score: Math.floor(Math.random() * 2) + 4, maxScore: 5, feedback: "Project structure is well-organized." }
              ];

              if (job.customInstructions) {
                  results[0].feedback += " (Note: Custom instructions were considered during grading.)";
              }
              
              const totalScore = results.reduce((acc, r) => acc + r.score, 0);
              const maxScore = results.reduce((acc, r) => acc + r.maxScore, 0);
              newGrade = Math.round((totalScore / maxScore) * 100);
              newResults = results;
          }
          
          return { ...assignment, status: newStatus, results: newResults, grade: newGrade, error: newError };
      });

      // Update overall batch status
      if (allDone) {
          job.status = atLeastOneFailed ? JobStatus.FAILED : JobStatus.COMPLETED;
      } else if (job.status === JobStatus.PENDING) {
          job.status = JobStatus.RUNNING;
      }
      
      const { assignmentsPollCount, assignmentsRetryCount, maxRetries, customInstructions, ...jobData } = job;
      resolve(jobData);
    }, 2000);
  });
};
