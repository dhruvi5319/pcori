import type { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  body: string
}

export function FeatureCard({ icon: Icon, title, body }: FeatureCardProps) {
  return (
    <div
      className="group relative rounded-xl p-6 transition-all duration-200"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Gradient border on hover via pseudo-element technique */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)',
          padding: '1px',
          zIndex: -1,
        }}
        aria-hidden="true"
      />
      <div className="space-y-3">
        <Icon size={32} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
        <h3 style={{ fontSize: '24px', fontWeight: 600, lineHeight: '1.2' }}>{title}</h3>
        <p style={{ fontSize: '16px', fontWeight: 400, lineHeight: '1.5', color: 'var(--color-muted)' }}>
          {body}
        </p>
      </div>
    </div>
  )
}
