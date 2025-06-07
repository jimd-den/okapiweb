
"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    // Here you might want to trigger a re-render or navigation
    // For simplicity, we'll just reset the error boundary's state.
    // A more robust solution might involve a prop callback to reset parent state
    // or even a full page reload if appropriate for the error type.
    // window.location.reload(); // Example of a forceful reset
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Alert variant="destructive" className="my-4 p-4 rounded-lg shadow-md">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-6 w-6 mr-2" />
            <AlertTitle className="text-lg font-semibold">Something went wrong</AlertTitle>
          </div>
          <AlertDescription className="text-base">
            {this.props.fallbackMessage || "An unexpected error occurred. Please try refreshing the page or try again later."}
          </AlertDescription>
          {process.env.NODE_ENV === 'development' && this.state.error?.message && (
            <p className="text-xs mt-2 text-destructive-foreground/80 bg-destructive/20 p-2 rounded">
              <strong>Error details (dev mode):</strong> {this.state.error.message}
            </p>
          )}
           <div className="mt-4 flex justify-end">
            <Button onClick={this.handleReset} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
