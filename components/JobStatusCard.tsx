import React from 'react';
import { GradingJob, JobStatus, GradingCategory, Assignment } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { AssignmentAccordion } from './AssignmentAccordion';

// Add type declarations for CDN-loaded libraries
declare const jspdf: any;

// TODO: Ensure that actions like "Enhance with AI" are only available to authorized users (e.g., the grader/teacher)
// requires a more robust role-based access control system on the backend.
interface JobStatusCardProps {
    job: GradingJob;
    onEnhanceFeedback: (assignmentId: string, categoryId: string) => void;
}

const statusInfo = {
    [JobStatus.PENDING]: { text: 'Batch job is pending...', color: 'text-slate-500', Icon: SpinnerIcon },
    [JobStatus.RUNNING]: { text: 'Grading batch in progress...', color: 'text-sky-500', Icon: SpinnerIcon },
    [JobStatus.COMPLETED]: { text: 'Batch Grading Complete', color: 'text-green-500', Icon: CheckCircleIcon },
    [JobStatus.FAILED]: { text: 'Batch Grading Failed', color: 'text-red-500', Icon: XCircleIcon },
};


export const JobStatusCard: React.FC<JobStatusCardProps> = ({ job, onEnhanceFeedback }) => {
    const { text, color, Icon } = statusInfo[job.status];

    const handleExport = (format: 'json' | 'csv' | 'pdf') => {
        if (!job.assignments) return;
        
        if (format === 'pdf') {
            const { jsPDF } = jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(18);
            doc.text(`Grading Results for Batch: ${job.batchId}`, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

            let yPos = 40;

            job.assignments.forEach((assignment) => {
                const pageHeight = doc.internal.pageSize.height;
                if (yPos > pageHeight - 40) { // Add margin for page break
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text(`Assignment: ${assignment.fileName}`, 14, yPos);
                
                doc.setFontSize(12);
                doc.setFont(undefined, 'normal');
                doc.text(`Status: ${assignment.status}`, 14, yPos + 7);
                if (typeof assignment.grade === 'number') {
                    doc.text(`Final Grade: ${assignment.grade}%`, 14, yPos + 14);
                }

                yPos += 20;

                if (assignment.status === JobStatus.COMPLETED && assignment.results) {
                    const head = [['Category', 'Score', 'Feedback']];
                    const body = assignment.results.map(r => {
                        let feedbackText = `Original: ${r.feedback}`;
                        if (r.enhancedFeedback) {
                            // Simple markdown removal for cleaner PDF text
                            const cleanEnhancedFeedback = r.enhancedFeedback.replace(/[`*#_~]/g, '');
                            feedbackText += `\n\nAI Enhanced: ${cleanEnhancedFeedback}`;
                        }
                        return [
                            r.category,
                            `${r.score}/${r.maxScore}`,
                            feedbackText
                        ];
                    });

                    (doc as any).autoTable({
                        head: head,
                        body: body,
                        startY: yPos,
                        theme: 'grid',
                        styles: { cellPadding: 2, fontSize: 10, overflow: 'linebreak' },
                        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                        columnStyles: { 2: { cellWidth: 'auto' } }
                    });

                    yPos = (doc as any).lastAutoTable.finalY + 10;

                } else if (assignment.status === JobStatus.FAILED && assignment.error) {
                    doc.setTextColor(255, 0, 0); // Red for errors
                    const splitError = doc.splitTextToSize(`Error: ${assignment.error}`, doc.internal.pageSize.width - 28);
                    doc.text(splitError, 14, yPos);
                    doc.setTextColor(0); // Reset color
                    yPos += (splitError.length * 5) + 5;
                } else {
                    doc.text('Grading is not yet complete for this assignment.', 14, yPos);
                    yPos += 10;
                }
            });

            doc.save(`grading-results-batch-${job.batchId}.pdf`);
            return;
        }

        let dataStr = '';
        let filename = '';
        let mimeType = '';

        if (format === 'json') {
            const dataToExport = {
                batchId: job.batchId,
                status: job.status,
                assignments: job.assignments.map(a => ({
                    fileName: a.fileName,
                    grade: a.grade,
                    status: a.status,
                    error: a.error,
                    results: a.results?.map(r => ({
                        category: r.category,
                        score: r.score,
                        maxScore: r.maxScore,
                        feedback: r.feedback,
                        enhancedFeedback: r.enhancedFeedback,
                    }))
                }))
            };
            dataStr = JSON.stringify(dataToExport, null, 2);
            filename = `grading-results-batch-${job.batchId}.json`;
            mimeType = 'application/json';
        } else if (format === 'csv') {
            const rows: string[] = [];
            const headers = ['fileName', 'grade', 'status', 'category', 'score', 'maxScore', 'feedback', 'enhancedFeedback', 'error'];
            rows.push(headers.join(','));

            job.assignments.forEach(a => {
                if (a.results && a.results.length > 0) {
                    a.results.forEach(r => {
                        const row = [
                            JSON.stringify(a.fileName),
                            a.grade ?? '',
                            a.status,
                            JSON.stringify(r.category),
                            r.score,
                            r.maxScore,
                            JSON.stringify(r.feedback),
                            JSON.stringify(r.enhancedFeedback ?? ''),
                            JSON.stringify(a.error ?? ''),
                        ].join(',');
                        rows.push(row);
                    });
                } else {
                     rows.push([JSON.stringify(a.fileName), a.grade ?? '', a.status, '', '', '', '', '', JSON.stringify(a.error ?? 'No results')].join(','));
                }
            });
            dataStr = rows.join('\n');
            filename = `grading-results-batch-${job.batchId}.csv`;
            mimeType = 'text/csv';
        }

        const blob = new Blob([dataStr], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6 sm:p-8 space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Grading Status</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 break-all mt-1">
                    Batch ID: {job.batchId}
                </p>
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Submitted by: Teacher
                </p>
            </div>

            <div className={`flex items-center space-x-3 p-4 rounded-lg bg-slate-100 dark:bg-slate-900/50`}>
                <Icon className={`h-8 w-8 ${color} ${job.status === JobStatus.PENDING || job.status === JobStatus.RUNNING ? 'animate-spin-slow' : ''}`} />
                <span className={`text-lg font-medium ${color}`}>{text}</span>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Individual Assignments ({job.assignments.length})</h3>
                {job.assignments.map(assignment => (
                    <AssignmentAccordion 
                        key={assignment.id}
                        assignment={assignment}
                        onEnhanceFeedback={onEnhanceFeedback}
                    />
                ))}
            </div>

            {job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED ? (
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 text-center">
                        Export Batch Results
                    </label>
                     <div className="flex justify-center items-center gap-2">
                        <button onClick={() => handleExport('json')} className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
                            JSON
                        </button>
                        <button onClick={() => handleExport('csv')} className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
                            CSV
                        </button>
                        <button onClick={() => handleExport('pdf')} className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
                            PDF
                        </button>
                    </div>
                </div>
            ) : null}
            
            {job.status === JobStatus.FAILED && job.error && (
                <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
                    <p className="text-red-700 dark:text-red-300">{job.error}</p>
                </div>
            )}

        </div>
    );
};