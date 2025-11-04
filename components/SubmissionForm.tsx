
import React, { useState, useEffect } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { Rubric } from '../types';

interface SubmissionFormProps {
    onSubmit: (submissionFile: File, solutionFile: File | null, rubric: Rubric, maxRetries: number, customInstructions: string, applyRubricToAll: boolean) => void;
    isLoading: boolean;
}

type RubricType = 'text' | 'file' | 'url';
type SubmissionType = 'zip' | 'image';

export const SubmissionForm: React.FC<SubmissionFormProps> = ({ onSubmit, isLoading }) => {
    const [submissionFile, setSubmissionFile] = useState<File | null>(null);
    const [solutionFile, setSolutionFile] = useState<File | null>(null);
    const [submissionType, setSubmissionType] = useState<SubmissionType>('zip');
    const [rubricType, setRubricType] = useState<RubricType>('text');
    const [rubricValue, setRubricValue] = useState<string | File | null>('');
    const [rubricPreview, setRubricPreview] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [maxRetries, setMaxRetries] = useState<number>(3);
    const [customInstructions, setCustomInstructions] = useState<string>('');
    const [applyRubricToAll, setApplyRubricToAll] = useState<boolean>(true);


    useEffect(() => {
        setRubricPreview(null);
        setPreviewError(null);

        if (rubricType === 'text' && typeof rubricValue === 'string' && rubricValue.trim()) {
            setRubricPreview(rubricValue);
        } else if (rubricType === 'url' && typeof rubricValue === 'string' && rubricValue.trim()) {
            setRubricPreview(`Content will be fetched from: ${rubricValue}\n(Live preview for URLs is not available)`);
        } else if (rubricType === 'file' && rubricValue instanceof File) {
            setIsPreviewLoading(true);
            const reader = new FileReader();
            reader.onload = (e) => {
                setRubricPreview(e.target?.result as string);
                setIsPreviewLoading(false);
            };
            reader.onerror = () => {
                setPreviewError('Failed to read the rubric file.');
                setIsPreviewLoading(false);
            };
            reader.readAsText(rubricValue);
        } else {
            setRubricPreview(null);
        }
    }, [rubricType, rubricValue]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (submissionFile) {
            onSubmit(submissionFile, solutionFile, { type: rubricType, value: rubricValue }, maxRetries, customInstructions, applyRubricToAll);
        }
    };
    
    const SubmissionTypeButton: React.FC<{ type: SubmissionType, children: React.ReactNode }> = ({ type, children }) => {
        const isActive = submissionType === type;
        return (
            <button
                type="button"
                onClick={() => {
                    setSubmissionType(type);
                    setSubmissionFile(null); // Reset file on type change
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                    isActive
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
            >
                {children}
            </button>
        );
    }


    const RubricTypeButton: React.FC<{ type: RubricType, children: React.ReactNode }> = ({ type, children }) => {
        const isActive = rubricType === type;
        return (
            <button
                type="button"
                onClick={() => {
                    setRubricType(type);
                    setRubricValue(type === 'text' ? '' : null);
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                    isActive
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
            >
                {children}
            </button>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Student Assignment(s)
                        </label>
                        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                            <SubmissionTypeButton type="zip">Class Set (.zip)</SubmissionTypeButton>
                            <SubmissionTypeButton type="image">Single Image</SubmissionTypeButton>
                        </div>
                        <div className="mt-2">
                             {submissionType === 'zip' && (
                                <>
                                    <label htmlFor="submissionFileZip" className="sr-only">Submissions Zip File</label>
                                    <input
                                        type="file"
                                        name="submissionFileZip"
                                        id="submissionFileZip"
                                        key="zip-input"
                                        onChange={(e) => setSubmissionFile(e.target.files ? e.target.files[0] : null)}
                                        className="block w-full text-sm text-slate-500 dark:text-slate-400
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-sky-50 dark:file:bg-sky-900/50 file:text-sky-700 dark:file:text-sky-300
                                            hover:file:bg-sky-100 dark:hover:file:bg-sky-900
                                            disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                        accept=".zip,application/zip,application/x-zip-compressed"
                                        disabled={isLoading}
                                    />
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">.zip file containing all student papers</p>
                                </>
                            )}
                            {submissionType === 'image' && (
                                <>
                                    <label htmlFor="submissionFileImage" className="sr-only">Submission Image File</label>
                                    <input
                                        type="file"
                                        name="submissionFileImage"
                                        id="submissionFileImage"
                                        key="image-input"
                                        onChange={(e) => setSubmissionFile(e.target.files ? e.target.files[0] : null)}
                                        className="block w-full text-sm text-slate-500 dark:text-slate-400
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-sky-50 dark:file:bg-sky-900/50 file:text-sky-700 dark:file:text-sky-300
                                            hover:file:bg-sky-100 dark:hover:file:bg-sky-900
                                            disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                        accept="image/*"
                                        disabled={isLoading}
                                    />
                                     <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Image of a single student paper</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="solutionFile" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Model Answer (Optional)
                        </label>
                        <div className="mt-1">
                            <input
                                type="file"
                                name="solutionFile"
                                id="solutionFile"
                                onChange={(e) => setSolutionFile(e.target.files ? e.target.files[0] : null)}
                                className="block w-full text-sm text-slate-500 dark:text-slate-400
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-sky-50 dark:file:bg-sky-900/50 file:text-sky-700 dark:file:text-sky-300
                                    hover:file:bg-sky-100 dark:hover:file:bg-sky-900
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoading}
                            />
                        </div>
                         <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">An exemplar or model text for reference</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Grading Rubric (Optional)
                    </label>
                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                        <RubricTypeButton type="text">Paste Text</RubricTypeButton>
                        <RubricTypeButton type="file">Upload File</RubricTypeButton>
                        <RubricTypeButton type="url">From URL</RubricTypeButton>
                    </div>
                    <div className="mt-2">
                        {rubricType === 'text' && (
                            <textarea
                                id="rubricText"
                                rows={4}
                                value={rubricValue as string}
                                onChange={(e) => setRubricValue(e.target.value)}
                                placeholder="Paste rubric criteria here..."
                                className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                disabled={isLoading}
                            />
                        )}
                        {rubricType === 'file' && (
                            <input
                                type="file"
                                id="rubricFile"
                                onChange={(e) => setRubricValue(e.target.files ? e.target.files[0] : null)}
                                className="block w-full text-sm text-slate-500 dark:text-slate-400
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-sky-50 dark:file:bg-sky-900/50 file:text-sky-700 dark:file:text-sky-300
                                    hover:file:bg-sky-100 dark:hover:file:bg-sky-900
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                                accept=".txt,.md,text/plain,text/markdown"
                                disabled={isLoading}
                            />
                        )}
                        {rubricType === 'url' && (
                           <input
                                type="url"
                                id="rubricUrl"
                                value={rubricValue as string}
                                onChange={(e) => setRubricValue(e.target.value)}
                                placeholder="https://example.com/rubric.md"
                                className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                disabled={isLoading}
                            />
                        )}
                    </div>
                    
                    {submissionType === 'zip' && rubricValue && (
                        <div className="mt-4">
                            <div className="relative flex items-start">
                                <div className="flex h-6 items-center">
                                    <input
                                        id="applyRubricToAll"
                                        name="applyRubricToAll"
                                        type="checkbox"
                                        checked={applyRubricToAll}
                                        onChange={(e) => setApplyRubricToAll(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600 dark:bg-slate-700 dark:border-slate-600"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <label htmlFor="applyRubricToAll" className="font-medium text-slate-700 dark:text-slate-300">
                                    Apply this rubric to all assignments in the batch
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}


                     {(rubricPreview || isPreviewLoading || previewError) && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Rubric Preview
                            </label>
                            <div className="mt-1 p-3 h-32 overflow-y-auto bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono">
                                {isPreviewLoading && (
                                    <div className="flex items-center justify-center h-full">
                                        <SpinnerIcon className="h-5 w-5 animate-spin" />
                                        <span className="ml-2">Loading preview...</span>
                                    </div>
                                )}
                                {previewError && <p className="text-red-500">{previewError}</p>}
                                {rubricPreview && !isPreviewLoading && <p>{rubricPreview}</p>}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor="customInstructions" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Custom Grading Instructions (Optional)
                    </label>
                    <textarea
                        id="customInstructions"
                        rows={3}
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        placeholder="e.g., 'Focus on thesis statement strength and use of textual evidence.' or 'Ignore spelling mistakes for this draft.'"
                        className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        disabled={isLoading}
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Provide specific instructions for the AI feedback model.</p>
                </div>

                <div>
                    <label htmlFor="maxRetries" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Max Retries on Failure
                    </label>
                    <input
                        type="number"
                        id="maxRetries"
                        name="maxRetries"
                        value={maxRetries}
                        onChange={(e) => setMaxRetries(Math.max(0, Math.min(5, parseInt(e.target.value, 10) || 0)))}
                        className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-50"
                        min="0"
                        max="5"
                        disabled={isLoading}
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Number of times to retry a failed assignment (0-5).</p>
                </div>


                <div>
                    <button
                        type="submit"
                        disabled={isLoading || !submissionFile}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        {isLoading ? (
                            <>
                                <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                Analyzing...
                            </>
                        ) : (
                            'Get Feedback'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};