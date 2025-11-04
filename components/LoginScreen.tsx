
import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';

// Add a declaration for the google object from the GSI script
declare global {
    interface Window {
        google: any;
    }
}

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

// Simple JWT decoder to extract payload without verification (for client-side use)
const jwt_decode = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding JWT", e);
        return null;
    }
};


export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<'loading' | 'configured' | 'unconfigured' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleCredentialResponse = (response: any) => {
        const decoded = jwt_decode(response.credential);
        if (decoded) {
            onLogin({
                name: decoded.given_name || decoded.name,
                picture: decoded.picture
            });
        } else {
            console.error("Failed to decode JWT token from Google");
            setErrorMessage("An error occurred during sign-in. Could not verify user information.");
            setStatus('error');
        }
    };

    const handleDemoLogin = () => {
        onLogin({
            name: "Demo Teacher",
            picture: undefined, // No picture for demo user
        });
    };

    useEffect(() => {
        const clientId = process.env.GOOGLE_CLIENT_ID;

        if (!clientId) {
            console.warn("Google Client ID not found. Falling back to demo mode.");
            setStatus('unconfigured');
            return;
        }

        const checkGoogleReady = () => {
            if (window.google?.accounts?.id) {
                try {
                    window.google.accounts.id.initialize({
                        client_id: clientId,
                        callback: handleCredentialResponse
                    });
        
                    if (googleButtonRef.current) {
                        window.google.accounts.id.renderButton(
                            googleButtonRef.current,
                            { theme: "outline", size: "large", type: 'standard', text: 'signin_with' }
                        );
                        setStatus('configured');
                    } else {
                        // Ref not ready, try again
                        setTimeout(checkGoogleReady, 50);
                    }
                } catch (error: any) {
                    console.error("Google Sign-In Error:", error);
                    setErrorMessage(error.message?.includes("invalid client ID") 
                        ? "The configured Google Client ID is invalid."
                        : "An unexpected error occurred while setting up Google Sign-In.");
                    setStatus('error');
                }
            } else {
                // GSI script not loaded yet, wait and retry
                setTimeout(checkGoogleReady, 100);
            }
        };

        checkGoogleReady();

    }, [onLogin]);


    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex items-center justify-center h-[40px] text-slate-500 dark:text-slate-400">
                        <SpinnerIcon className="animate-spin h-5 w-5 mr-2" />
                        Initializing Sign-In...
                    </div>
                );
            case 'error':
                 return (
                     <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-left" role="alert">
                        <strong className="font-bold">Authentication Error</strong>
                        <span className="block text-sm mt-1">{errorMessage}</span>
                    </div>
                );
            case 'unconfigured':
                return (
                    <div className='space-y-4'>
                        <button 
                            onClick={handleDemoLogin}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                        >
                           Continue as Demo Teacher
                        </button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                            Note: Live Google Sign-In is not configured.
                        </p>
                    </div>
                );
            case 'configured':
                return (
                    <>
                        <div ref={googleButtonRef} className="flex justify-center" />
                         <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                            Please sign in with your Google account to manage assignments.
                        </p>
                    </>
                );
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md text-center">
                <header className="mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 dark:text-white tracking-tight">
                        AI Feedback Assistant
                    </h1>
                    <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                        The AI-powered feedback tool for educators.
                    </p>
                </header>
                <main className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-8">
                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-6">
                        Welcome
                    </h2>
                    {renderContent()}
                </main>
                <footer className="w-full text-center mt-12 text-slate-500 dark:text-slate-400 text-sm">
                    <p>Powered by Temporal, React, and Gemini</p>
                </footer>
            </div>
        </div>
    );
};
