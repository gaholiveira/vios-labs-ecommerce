"use client";

import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary reutilizável para isolar erros em seções específicas.
 * Útil para: grid de produtos, carrinho, formulários — evita que um erro quebre a página inteira.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    if (typeof console !== "undefined") {
      console.error("[ErrorBoundary]", error, errorInfo.componentStack);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          className="rounded-sm border border-stone-200/80 bg-brand-offwhite/50 p-6 text-center"
          role="alert"
        >
          <p className="text-sm font-light text-brand-softblack/80">
            Esta seção não pôde ser carregada.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 text-xs uppercase tracking-wider text-brand-green hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
