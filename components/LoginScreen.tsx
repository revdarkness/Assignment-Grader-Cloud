import React from 'react';
import { UserCircleIcon } from './icons/UserCircleIcon';

interface LoginScreenProps {
    onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md text-center">
                <header className="mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 dark:text-white tracking-tight">
                        Temporal Auto-Grader
                    </h1>
                    <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                        The AI-powered grading assistant for educators.
                    </p>
                </header>
                <main className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-8">
                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-6">
                        Welcome!
                    </h2>
                    <button
                        onClick={onLogin}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors duration-200"
                    >
                        <UserCircleIcon className="h-6 w-6" />
                        Login as Teacher
                    </button>
                </main>
                <footer className="w-full text-center mt-12 text-slate-500 dark:text-slate-400 text-sm">
                    <p>Powered by Temporal, React, and Gemini</p>
                </footer>
            </div>
        </div>
    );
};