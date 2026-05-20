'use client'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // Full auth guard + sidebar + header implemented in Plan 07
  return <>{children}</>
}
