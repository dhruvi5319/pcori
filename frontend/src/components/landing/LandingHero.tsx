import Link from 'next/link'

export function LandingHero() {
  return (
    <section
      className="flex items-center justify-center px-6 py-16"
      style={{
        // UI-SPEC: dark gradient mesh hero (Screen 1)
        background: 'radial-gradient(ellipse at 20% 50%, #1e3a5f 0%, #0f172a 40%, #1a1040 100%)',
        minHeight: '600px',
      }}
    >
      <div className="max-w-2xl mx-auto text-center text-white space-y-6">
        {/* Headline — Display 48px / 600 per UI-SPEC */}
        <h1 style={{ fontSize: '48px', fontWeight: 600, lineHeight: '1.1' }}>
          Automate Research Plan Classification
        </h1>

        {/* Subheadline — Body 16px / 400 */}
        <p style={{ fontSize: '16px', fontWeight: 400, lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
          Upload a PDF. Get AI-powered PCORI taxonomy classification in minutes.
        </p>

        {/* Dual CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Primary CTA — gradient accent */}
          <Link
            href="/signup"
            className="rounded-lg px-6 py-3 font-medium text-sm text-white min-h-[44px] inline-flex items-center justify-center transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110"
            style={{ background: 'var(--gradient-cta)' }}
          >
            Get Started →
          </Link>
          {/* Secondary CTA — ghost/outline */}
          <Link
            href="/login"
            className="rounded-lg px-6 py-3 font-medium text-sm min-h-[44px] inline-flex items-center justify-center border border-white/30 text-white hover:bg-white/10 transition-colors duration-150"
          >
            Sign In
          </Link>
        </div>

        {/* KPI counters */}
        <div className="flex gap-8 justify-center pt-4">
          <div className="text-center">
            <div className="text-3xl font-semibold">143</div>
            <div className="text-sm text-white/60">Plans Classified</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-semibold">98%</div>
            <div className="text-sm text-white/60">Auto-Classification Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-semibold">5min</div>
            <div className="text-sm text-white/60">Avg Turnaround</div>
          </div>
        </div>
      </div>
    </section>
  )
}
