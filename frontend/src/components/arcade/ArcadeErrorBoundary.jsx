import React from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button';

export class ArcadeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Arcade Game Runtime Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="card-panel p-6 sm:p-8 space-y-5 max-w-xl mx-auto border border-rose-500/30 bg-[var(--bg-surface)] text-center shadow-2xl rounded-2xl animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              Game Initialization Error
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto">
              An unexpected runtime error occurred while launching this arcade mode. You can retry initialization or return to the Arcade Hub safely without losing your profile data.
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 rounded-lg bg-black/50 border border-neutral-800 text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-24">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="sm"
              icon={RotateCcw}
              onClick={this.handleRetry}
            >
              Retry Game
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={this.props.onExit}
            >
              Back to Arcade
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
