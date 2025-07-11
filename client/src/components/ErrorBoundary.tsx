import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
          <div className="bg-dark-secondary p-8 rounded-lg max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-white mb-4">Er is iets misgegaan</h2>
            <p className="text-gray-400 mb-6">De pagina kon niet geladen worden. Probeer de pagina te vernieuwen.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-luxury-gold text-dark-primary px-6 py-2 rounded-lg font-medium hover:bg-luxury-gold/90 transition-colors"
            >
              Pagina vernieuwen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}