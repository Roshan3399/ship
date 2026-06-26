import Link from "next/link"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <h1 className="text-6xl font-bold text-neutral-200 mb-6">404</h1>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Page not found</h2>
        <p className="text-sm text-neutral-500 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/"
          className="inline-flex rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-all"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
