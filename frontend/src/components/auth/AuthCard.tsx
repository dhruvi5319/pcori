import { cn } from '@/lib/utils'

interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ backgroundColor: 'var(--color-background)' }}>
      <div
        className={cn('w-full rounded-xl p-8', className)}
        style={{
          maxWidth: '400px',
          backgroundColor: 'var(--color-surface)',
          // UI-SPEC: Auth Card Elevation (E3 Floating)
          boxShadow: 'var(--auth-card-shadow, 0 8px 32px rgba(0,0,0,0.12))',
        }}
      >
        {children}
      </div>
    </div>
  )
}
