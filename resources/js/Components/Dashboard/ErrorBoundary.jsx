import React from 'react';

class ErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 dark:border-gray-600/30 p-6 text-red-600 dark:text-red-400 font-semibold text-center my-6 transition-all duration-300">
                    <h2 className="text-xl mb-2">Oops! Something went wrong.</h2>
                    <p>
                        There was an unexpected error displaying this component. Please try refreshing the page.
                    </p>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;