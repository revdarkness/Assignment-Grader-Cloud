
import React from 'react';
import { GradingCategory } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';


const EnhancedFeedback: React.FC<{ markdown: string }> = ({ markdown }) => {
    const createMarkup = () => {
        // Using `any` for window.marked as it's loaded from a CDN
        // Add a check to ensure the 'marked' library has loaded successfully from the CDN.
        if (typeof (window as any).marked?.parse !== 'function') {
            console.error("'marked' library not found. Please check network connection or CDN availability.");
            // Fallback to plain text rendering if marked is not available
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

interface GradingCategoryAccordionProps {
    category: GradingCategory;
    isOpen: boolean;
    onToggle: () => void;
    onEnhance: (categoryId: string) => void;
    isFirst: boolean;
    isLast: boolean;
}

export const GradingCategoryAccordion: React.FC<GradingCategoryAccordionProps> = ({ category, isOpen, onToggle, onEnhance, isFirst, isLast }) => {
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
        <div className={`border-x border-slate-200 dark:border-slate-700 ${isFirst ? 'border-t' : ''} ${isLast ? 'border-b' : ''}`}>
            <h2>
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    className={`flex items-center justify-between w-full p-4 font-medium text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors ${!isFirst ? 'border-t border-slate-200 dark:border-slate-700' : ''}`}
                >
                    <div className="flex-1">
                        <span>{category.category}</span>
                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-1">
                           <div className={`h-2 rounded-full ${getScoreColor(scorePercentage)}`} style={{ width: `${scorePercentage}%` }}></div>
                        </div>
                    </div>
                    <div className="flex items-center ml-4">
                       <span className="text-lg font-bold text-slate-800 dark:text-white mr-2">{category.score}/{category.maxScore}</span>
                       <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>
            </h2>
            <div
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 space-y-4">
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
            </div>
        </div>
    );
};
