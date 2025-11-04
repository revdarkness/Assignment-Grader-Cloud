import React, { useState } from 'react';
import { Assignment, JobStatus, GradingCategory } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';

// Renders markdown for AI-enhanced feedback
const EnhancedFeedback: React.FC<{ markdown: string }> = ({ markdown }) => {
    const createMarkup = () => {
        if (typeof (window as any).marked?.parse !== 'function') {
            console.error("'marked' library not found. Please check network connection or CDN availability.");
            const escapeHtml = (unsafe: string) => 
                unsafe
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            return { __html: `<pre style="white-space: pre-wrap; font-family: monospace;">${escapeHtml(markdown)}</pre>` };
        }
        const rawMarkup = (window as any).marked.parse(markdown);
        return { __html: rawMarkup };
    };

    return (
        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-pre:bg-slate-200 dark:prose-pre:bg-slate-800 prose-pre:rounded-md"
             dangerouslySetInnerHTML={createMarkup()} />
    );
};

// Displays the full details for a single grading category
const CategoryDetails: React.FC<{ 
    category: GradingCategory, 
    onEnhance: (categoryId: string) => void 
}> = ({ category, onEnhance }) => {
    const scorePercentage = (category.score / category.maxScore) * 100;

    const getScoreColor = (percentage: number) => {
        if (percentage < 50) return 'bg-red-500';
        if (percentage < 80) return 'bg-yellow-500';
        return 'bg-green-500';
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{category.category}</h3>
                <span className="text-lg font-bold text-slate-800 dark:text-white">{category.score}/{category.maxScore}</span>
            </div>
            {/* Score Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-1 mb-4">
                <div className={`h-2 rounded-full ${getScoreColor(scorePercentage)}`} style={{ width: `${scorePercentage}%` }}></div>
            </div>

            {/* Feedbacks and Actions */}
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Original Feedback</h4>
                        <button onClick={() => copyToClipboard(category.feedback)} className="text-slate-400 hover:text-sky-500 transition-colors" aria-label="Copy original feedback">
                            <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                    </div>
                    <pre className="bg-slate-100 dark:bg-slate-700 p-3 rounded-md text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono">{category.feedback.trim()}</pre>
                </div>
                <div>
                    <button
                        onClick={() => onEnhance(category.id)}
                        disabled={category.isEnhancing}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {category.isEnhancing ? (
                            <><SpinnerIcon className="animate-spin h-4 w-4" /> Enhancing...</>
                        ) : (
                            <><SparklesIcon className="h-4 w-4" /> Enhance with AI</>
                        )}
                    </button>
                </div>
                {category.enhancedFeedback && (
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">AI-Enhanced Feedback</h4>
                                <button onClick={() => copyToClipboard(category.enhancedFeedback!)} className="text-slate-400 hover:text-sky-500 transition-colors" aria-label="Copy enhanced feedback">
                                <DocumentDuplicateIcon className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-3 rounded-md bg-gradient-to-br from-sky-50 to-purple-50 dark:from-slate-800 dark:to-indigo-900/30 border border-slate-200 dark:border-slate-700">
                            <EnhancedFeedback markdown={category.enhancedFeedback} />
                        </div>
                    </div>
                )}
                {category.enhanceError && <p className="text-xs text-red-500 text-center">{category.enhanceError}</p>}
            </div>
        </div>
    );
};


interface AssignmentAccordionProps {
    assignment: Assignment;
    onEnhanceFeedback: (assignmentId: string, categoryId: string) => void;
}

const statusInfo = {
    [JobStatus.PENDING]: { text: 'Pending...', color: 'text-slate-500', Icon: SpinnerIcon },
    [JobStatus.RUNNING]: { text: 'Grading...', color: 'text-sky-500', Icon: SpinnerIcon },
    [JobStatus.COMPLETED]: { text: 'Complete', color: 'text-green-500', Icon: CheckCircleIcon },
    [JobStatus.FAILED]: { text: 'Failed', color: 'text-red-500', Icon: XCircleIcon },
};

export const AssignmentAccordion: React.FC<AssignmentAccordionProps> = ({ assignment, onEnhanceFeedback }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleEnhance = (categoryId: string) => {
        onEnhanceFeedback(assignment.id, categoryId);
    };

    const { color, Icon } = statusInfo[assignment.status];

    const getGradeColor = (grade: number) => {
        if (grade < 50) return 'text-red-500 dark:text-red-400';
        if (grade < 80) return 'text-yellow-500 dark:text-yellow-400';
        return 'text-green-500 dark:text-green-400';
    };


    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <h2>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    className="flex items-center justify-between w-full p-4 font-medium text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors rounded-t-lg"
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Icon className={`h-6 w-6 shrink-0 ${color} ${assignment.status === JobStatus.PENDING || assignment.status === JobStatus.RUNNING ? 'animate-spin-slow' : ''}`} />
                        <span className="truncate font-mono text-sm">{assignment.fileName}</span>
                    </div>
                    <div className="flex items-center ml-4">
                        {assignment.status === JobStatus.COMPLETED && typeof assignment.grade === 'number' && (
                             <span className={`text-xl font-bold mr-4 ${getGradeColor(assignment.grade)}`}>{assignment.grade}%</span>
                        )}
                       <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>
            </h2>
            <div
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 space-y-4 rounded-b-lg">
                       
                        {assignment.status === JobStatus.COMPLETED && assignment.results && (
                             <div className="space-y-4">
                                {assignment.results.map((category) => (
                                    <CategoryDetails
                                        key={category.id}
                                        category={category}
                                        onEnhance={handleEnhance}
                                    />
                                ))}
                            </div>
                        )}

                        {assignment.status === JobStatus.RUNNING && assignment.error && (
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md text-center">
                                <p className="text-yellow-700 dark:text-yellow-300 text-sm">{assignment.error}</p>
                            </div>
                        )}

                        {assignment.status === JobStatus.FAILED && assignment.error && (
                            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-md text-center">
                                <p className="text-red-700 dark:text-red-300 text-sm">{assignment.error}</p>
                            </div>
                        )}

                        {assignment.status !== JobStatus.COMPLETED && assignment.status !== JobStatus.FAILED && !assignment.error && (
                            <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">
                                Grading is in progress. Details will appear here once complete.
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>
        </div>
    );
};