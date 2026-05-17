import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sunset-peach via-sunset-purple to-garden-night text-white p-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong</h1>
                        <p className="text-lg mb-4">Please refresh the page or contact support.</p>
                        <pre className="text-sm bg-black/20 p-4 rounded overflow-auto max-w-2xl">
                            {this.state.error?.message}
                        </pre>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-2 bg-white text-garden-dark rounded-full hover:bg-lantern-glow transition"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
