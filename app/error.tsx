"use client"

import Link from "next/link"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <h1 className="text-6xl font-bold text-neutral-200 mb-6">500</h1>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Server error</h2>
        <p className="text-sm text-neutral-500 mb-8">Something went wrong on our end. Please try again.</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-all"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-neutral-200 px-6 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-all"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
