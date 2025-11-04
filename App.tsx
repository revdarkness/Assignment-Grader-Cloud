
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SubmissionForm } from './components/SubmissionForm';
import { JobStatusCard } from './components/JobStatusCard';
import { startGrading, getJobStatus, FileData } from './services/gradingService';
import { enhanceFeedbackWithGemini } from './services/geminiService';
import { GradingJob, JobStatus, Rubric, Assignment, User } from './types';
import { LoginScreen } from './components/LoginScreen';
import { UserCircleIcon } from './components/icons/UserCircleIcon';

// TODO:
// - Securing API endpoints to be user-specific would require a backend implementation.

declare const JSZip: any;
declare const window: any;


const getFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};


const App: React.FC = () => {
    const [job, setJob] = useState<GradingJob | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rubricContent, setRubricContent] = useState<string | null>(null);
    const [customInstructions, setCustomInstructions] = useState<string | null>(null);
    const [submissionCount, setSubmissionCount] = useState(0);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const pollingIntervalRef = useRef<number | null>(null);

    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);
    
    const handleLogin = (user: User) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        stopPolling();
        if (window.google) {
            window.google.accounts.id.disableAutoSelect();
        }
        setCurrentUser(null);
        setJob(null);
        setSubmissionCount(0);
        setError(null);
    };


    const pollJobStatus = useCallback((batchId: string) => {
        const checkStatus = async () => {
            try {
                const updatedJob = await getJobStatus(batchId);
                setJob(updatedJob);
                if (updatedJob.status === JobStatus.COMPLETED || updatedJob.status === JobStatus.FAILED) {
                    stopPolling();
                }
            } catch (err: any) {
                setError(err.message || 'Failed to poll job status.');
                stopPolling();
            }
        };

        stopPolling();
        pollingIntervalRef.current = window.setInterval(checkStatus, 3000);
        checkStatus(); // Initial check immediately
    }, [stopPolling]);

    const handleSubmit = async (submissionFile: File, solutionFile: File | null, rubric: Rubric, maxRetries: number, instructions: string, applyRubricToAll: boolean) => {
        stopPolling();
        setIsSubmitting(true);
        setError(null);
        setJob(null);
        setRubricContent(null);
        setCustomInstructions(instructions);

        try {
            // Process rubric
            if (rubric.type === 'text' && rubric.value) {
                setRubricContent(rubric.value as string);
            } else if (rubric.type === 'file' && rubric.value) {
                const text = await getFileAsText(rubric.value as File);
                setRubricContent(text);
            } else if (rubric.type === 'url' && rubric.value) {
                // In a real app, you'd fetch this server-side to avoid CORS.
                // For this simulation, we'll just use the URL as the content.
                setRubricContent(`Rubric from URL: ${rubric.value}`);
            }

            let submissionFiles: FileData[] = [];

            // Handle single image or zip file
            if (submissionFile.type.startsWith('image/')) {
                 submissionFiles.push({ name: submissionFile.name, content: '' }); // Content isn't used in mock
            } else if (submissionFile.type === 'application/zip' || submissionFile.name.endsWith('.zip')) {
                const zip = await JSZip.loadAsync(submissionFile);
                const filePromises = Object.keys(zip.files).map(async (relativePath) => {
                    const file = zip.files[relativePath];
                    if (!file.dir && !relativePath.startsWith('__MACOSX/')) {
                        submissionFiles.push({ name: relativePath, content: '' });
                    }
                });
                await Promise.all(filePromises);
            } else {
                 throw new Error("Unsupported file type. Please upload a .zip or image file.");
            }


            if (submissionFiles.length === 0) {
                throw new Error("The submission is empty or does not contain valid files.");
            }


            const { batchId } = await startGrading(submissionFiles, solutionFile, maxRetries, instructions);
            const initialAssignments: Assignment[] = submissionFiles.map(f => ({
                id: f.name,
                fileName: f.name,
                status: JobStatus.PENDING,
                workflowId: 'temp-id-placeholder'
            }));
            const initialJob: GradingJob = { batchId, status: JobStatus.PENDING, assignments: initialAssignments };
            setJob(initialJob);
            setSubmissionCount(prevCount => prevCount + 1);
            pollJobStatus(batchId);
        } catch (err: any)
        {
            setError(err.message || 'Failed to start grading job.');
            setJob(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEnhanceFeedback = async (assignmentId: string, categoryId: string) => {
        if (!job || !job.assignments) return;

        const assignmentIndex = job.assignments.findIndex(a => a.id === assignmentId);
        if (assignmentIndex === -1 || !job.assignments[assignmentIndex].results) return;
        
        const assignment = job.assignments[assignmentIndex];
        const categoryIndex = assignment.results!.findIndex(c => c.id === categoryId);
        if (categoryIndex === -1) return;

        setJob(prev => {
            if (!prev) return prev;
            const newAssignments = [...prev.assignments];
            const targetAssignment = { ...newAssignments[assignmentIndex] };
            const newResults = [...targetAssignment.results!];
            newResults[categoryIndex] = { ...newResults[categoryIndex], isEnhancing: true, enhanceError: undefined };
            targetAssignment.results = newResults;
            newAssignments[assignmentIndex] = targetAssignment;
            return { ...prev, assignments: newAssignments };
        });

        try {
            const categoryToEnhance = assignment.results![categoryIndex];
            const enhanced = await enhanceFeedbackWithGemini(
                categoryToEnhance.feedback,
                categoryToEnhance.category,
                rubricContent,
                customInstructions
            );
            
            setJob(prev => {
                if (!prev) return prev;
                const newAssignments = [...prev.assignments];
                const targetAssignment = { ...newAssignments[assignmentIndex] };
                const newResults = [...targetAssignment.results!];
                newResults[categoryIndex] = { ...newResults[categoryIndex], enhancedFeedback: enhanced, isEnhancing: false };
                targetAssignment.results = newResults;
                newAssignments[assignmentIndex] = targetAssignment;
                return { ...prev, assignments: newAssignments };
            });
        } catch (err: any) {
            setJob(prev => {
                if (!prev) return prev;
                const newAssignments = [...prev.assignments];
                const targetAssignment = { ...newAssignments[assignmentIndex] };
                const newResults = [...targetAssignment.results!];
                newResults[categoryIndex] = { ...newResults[categoryIndex], isEnhancing: false, enhanceError: err.message };
                targetAssignment.results = newResults;
                newAssignments[assignmentIndex] = targetAssignment;
                return { ...prev, assignments: newAssignments };
            });
        }
    };
    
    useEffect(() => {
        return () => stopPolling();
    }, [stopPolling]);

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
            <header className="w-full max-w-2xl mb-8">
                <div className="relative text-center">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-2">
                        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 dark:text-white tracking-tight">
                            AI Feedback Assistant
                        </h1>
                        {submissionCount > 0 && (
                             <span className="bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 text-sm font-semibold px-3 py-1 rounded-full">
                                {submissionCount} {submissionCount === 1 ? 'Batch' : 'Batches'} Submitted
                            </span>
                        )}
                    </div>
                    <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                        Submit student work for automated feedback and AI-powered suggestions.
                    </p>
                     <div className="absolute top-0 right-0 flex items-center h-full">
                        <div className="flex items-center gap-3">
                            {currentUser.picture ? (
                                <img src={currentUser.picture} alt="Profile" className="h-8 w-8 rounded-full hidden sm:block" />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hidden sm:block">
                                    <UserCircleIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                                </div>
                            )}
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden sm:inline">Welcome, {currentUser.name}!</span>
                            <button 
                                onClick={handleLogout}
                                className="px-3 py-1.5 text-xs font-semibold rounded-full transition-colors bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-2xl">
                <SubmissionForm onSubmit={handleSubmit} isLoading={isSubmitting} />
                
                {error && (
                    <div className="mt-6 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                {job && (
                    <div className="mt-8">
                        <JobStatusCard job={job} onEnhanceFeedback={handleEnhanceFeedback} />
                    </div>
                )}
            </main>
             <footer className="w-full max-w-2xl text-center mt-12 text-slate-500 dark:text-slate-400 text-sm">
                <p>Powered by Temporal, React, and Gemini</p>
            </footer>
        </div>
    );
};

export default App;
