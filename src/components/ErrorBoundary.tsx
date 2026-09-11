'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught an error:', error);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-foreground mb-2">حدث خطأ غير متوقع</h2>
          <p className="text-sm text-muted-foreground mb-6">حاول إعادة تحميل الصفحة أو العودة للرئيسية.</p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white"
            >
              إعادة المحاولة
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-border text-foreground"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
