import { Component, type ErrorInfo, type ReactNode } from "react";
import { Terminal, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary
 * Catches React rendering errors and shows a terminal-styled recovery screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-terminal-950 text-terminal-400 font-mono flex items-center justify-center">
          <div className="max-w-lg w-full p-8">
            {/* Header */}
            <div className="flex items-center gap-2 text-error mb-6">
              <Terminal className="w-5 h-5" />
              <span className="text-sm uppercase tracking-wider font-bold">
                SYSTEM ERROR
              </span>
            </div>

            {/* Error Box */}
            <div className="border border-terminal-800 rounded-lg p-6 bg-terminal-900/50 mb-6">
              <div className="text-terminal-500 text-xs mb-2">ERROR_TRACE:</div>
              <div className="text-error text-sm mb-4">
                {this.state.error?.message || "An unexpected error occurred"}
              </div>
              <div className="text-terminal-600 text-xs">
                The application encountered an unrecoverable error. Your data is
                safe — try reloading the page.
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/30 rounded text-success text-sm hover:bg-success/20 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2 bg-terminal-800/50 border border-terminal-700 rounded text-terminal-400 text-sm hover:bg-terminal-800 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
