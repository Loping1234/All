import { BookOpenCheck } from 'lucide-react'
import clsx from 'clsx'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2 font-bold text-gray-900', className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
        <BookOpenCheck className="h-4.5 w-4.5" aria-hidden />
      </span>
      <span className="text-lg tracking-tight">
        Prep<span className="text-primary-600">Mode</span>
      </span>
    </span>
  )
}
