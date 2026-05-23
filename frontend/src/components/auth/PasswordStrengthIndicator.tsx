interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const rules = [
    { label: 'At least one uppercase letter', test: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter', test: /[a-z]/.test(password) },
    { label: 'At least one digit', test: /\d/.test(password) },
    { label: '8–128 characters', test: password.length >= 8 && password.length <= 128 },
  ]

  return (
    <ul className="mt-1 space-y-0.5" aria-label="Password requirements">
      {rules.map((rule) => (
        <li
          key={rule.label}
          className="flex items-center gap-1.5 text-xs"
          style={{ color: rule.test ? '#16A34A' : 'var(--color-muted)' }}
        >
          <span aria-hidden="true">{rule.test ? '✓' : '○'}</span>
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  )
}
