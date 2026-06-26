"use client"

import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-[50vh] items-center justify-center p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Something went wrong</h2>
              <p className="text-sm text-neutral-500 mb-6">An unexpected error occurred. Please try again.</p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-all"
              >
                Try again
              </button>
            </div>
          </div>
        )
      )
    }
    return this.props.children
  }
}
