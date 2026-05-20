import { LandingHero } from '@/components/landing/LandingHero'
import { FeatureCard } from '@/components/landing/FeatureCard'
import { Brain, ClipboardCheck, BarChart3 } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: Brain,
    title: 'AI Classification',
    body: 'Upload a research plan PDF and receive automated PCORI taxonomy classification in minutes.',
  },
  {
    icon: ClipboardCheck,
    title: 'Full Audit Trail',
    body: "Every classification decision is logged with the reviewer's name, timestamp, and reasoning.",
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reporting',
    body: 'Real-time KPI dashboards and one-click Excel export for program managers and executives.',
  },
]

export default function LandingPage() {
  return (
    <div>
      {/* Public nav bar — 64px height per UI-SPEC */}
      <nav
        className="flex items-center justify-between px-6 h-16 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span className="font-semibold text-lg">PCORI Analytics</span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg text-sm font-medium border min-h-[44px] flex items-center"
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white min-h-[44px] flex items-center"
            style={{ background: 'var(--gradient-cta)' }}
          >
            Sign Up
          </Link>
        </div>
      </nav>

      <LandingHero />

      {/* Features grid — 3 cols on lg, 1 on mobile */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} body={f.body} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm" style={{ color: 'var(--color-muted)' }}>
        © PCORI Research Analytics Platform ·{' '}
        <a href="#" className="hover:underline">Privacy</a> ·{' '}
        <a href="#" className="hover:underline">Terms</a>
      </footer>
    </div>
  )
}
