---
status: diagnosed
trigger: "Signup form 'Create Account' button does nothing on click"
created: 2026-05-21T00:00:00Z
updated: 2026-05-21T00:01:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED — Button is HTML-disabled due to isValid=false; Tailwind failure hides disabled visual state
test: Traced full form lifecycle: useForm config, zodResolver, button disabled prop, Tailwind class application
expecting: N/A — root cause confirmed
next_action: Return ROOT CAUSE FOUND diagnosis

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: Submitting signup form creates user, sends verification email to MailHog, shows success confirmation
actual: On clicking 'Create Account' nothing happens
errors: None observed (silent failure)
reproduction: Test 6 in Phase 1 UAT
started: Found during UAT testing

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: form's onSubmit handler not wired up
  evidence: form has onSubmit={handleSubmit(onSubmit)}, onSubmit calls registerMutation.mutate(data), button is type="submit" — wiring is correct
  timestamp: 2026-05-21T00:01:00Z

- hypothesis: useRegisterMutation or TanStack Query not configured
  evidence: useRegisterMutation correctly defined in useAuthMutations.ts, QueryProvider wraps root layout, mutation fn calls api.post('/api/auth/register', data) correctly
  timestamp: 2026-05-21T00:01:00Z

- hypothesis: API URL misconfigured
  evidence: NEXT_PUBLIC_API_URL=http://localhost:8080 in .env.local, api.ts uses this correctly, next.config.ts also rewrites /api/* to backend
  timestamp: 2026-05-21T00:01:00Z

- hypothesis: PasswordInput missing forwardRef causing register() not to wire properly
  evidence: PasswordInput.tsx uses forwardRef correctly, passes ref={ref} to the underlying input — works properly
  timestamp: 2026-05-21T00:01:00Z

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-05-21T00:01:00Z
  checked: SignupForm.tsx button element (line 139-151)
  found: button has disabled={!isValid || registerMutation.isPending} and CSS classes disabled:opacity-50 disabled:cursor-not-allowed
  implication: The button is HTML-disabled when isValid is false. The ONLY visual indicator is Tailwind's disabled:opacity-50 class.

- timestamp: 2026-05-21T00:01:00Z
  checked: useForm configuration in SignupForm.tsx (line 31-34)
  found: mode: 'onChange', resolver: zodResolver(signupSchema), NO defaultValues set
  implication: With mode:'onChange' and no defaultValues, isValid starts as FALSE. It only becomes true when every field passes the zodResolver. Button is disabled from the very first render.

- timestamp: 2026-05-21T00:01:00Z
  checked: signupSchema password validation (lines 21-27)
  found: Password requires min 8 chars + uppercase regex + lowercase regex + digit regex — 4 separate rules ALL must pass
  implication: Password complexity is high. Even if tester fills password, it may not meet all 4 rules. isValid stays false.

- timestamp: 2026-05-21T00:01:00Z
  checked: UAT Phase 1 Tests 3 & 4 results
  found: Tailwind CSS not applied to any page ("nothing renders styled"). Tests 3 & 4 confirmed systemic Tailwind failure.
  implication: Tailwind's disabled:opacity-50 and disabled:cursor-not-allowed classes are NOT being applied. The disabled button looks identical to an enabled button. User cannot see that the button is disabled.

- timestamp: 2026-05-21T00:01:00Z
  checked: Error display in SignupForm.tsx (e.g. line 65-69 for username, lines 83-85 for email, lines 99-101 for names, lines 133-135 for password)
  found: All validation errors use Tailwind classes (text-xs text-red-600 etc.)
  implication: Validation error messages are also not styled/visible due to Tailwind failure. User gets no visual feedback on why submission is blocked.

- timestamp: 2026-05-21T00:01:00Z
  checked: useRegisterMutation onError handler (lines 64-76 in useAuthMutations.ts)
  found: onError only handles axios.isAxiosError(error) — non-Axios errors produce NO toast feedback
  implication: Secondary finding — even if submission fires, non-network errors would be silent. But primary issue is the button never enabling due to Tailwind failure hiding disabled state.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: |
  The 'Create Account' button is HTML-disabled (disabled={!isValid}) because react-hook-form's 
  isValid starts as false with mode:'onChange' and no defaultValues — it only becomes true when
  ALL fields pass zodResolver validation. This is intentional behavior. The bug manifests as 
  "nothing happens" because:
  
  1. The button is visually indistinguishable from an enabled button — Tailwind's 
     disabled:opacity-50 and disabled:cursor-not-allowed classes are NOT being applied 
     (confirmed systemic Tailwind failure in UAT Tests 3 & 4).
  
  2. Validation error messages (styled with text-red-600 etc.) are also invisible without
     Tailwind — the user gets no indication of WHAT to fix.
  
  3. The password field has strict complexity requirements (8+ chars, uppercase, lowercase, 
     digit) — if the tester's password didn't meet all 4 rules, isValid never becomes true.
  
  The root cause is the SAME Tailwind CSS failure that broke Tests 3 & 4: without Tailwind,
  the disabled button state is invisible, AND validation feedback is invisible. The form 
  code itself is correct — the submission wiring, mutation, and API configuration are all 
  properly implemented.

fix: Fix the Tailwind CSS issue (separate debug session: tailwind-styles-not-applied.md). 
     Once Tailwind applies, disabled:opacity-50 will visually indicate the button state, 
     and text-red-600 error messages will show which fields need fixing.

verification:
files_changed: []
