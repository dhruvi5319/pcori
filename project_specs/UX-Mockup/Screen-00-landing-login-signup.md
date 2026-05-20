## Screen-00: Landing Page (`/`)

**Purpose:** First impression for new and returning visitors; directs to login or signup
**User Stories:** US-0.1 (Registration CTA), US-0.3 (Login CTA)

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo — PCORI Research Analytics]                 [Login] [Sign Up] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                    HERO SECTION                                       │
│                                                                       │
│         Automate Research Plan Classification                         │
│         Upload a PDF. Get AI-powered taxonomy                         │
│         classification in minutes.                                    │
│                                                                       │
│              [Get Started →]    [Sign In]                             │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  FEATURES GRID (3–4 cards)                                            │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐              │
│  │ AI Classification│ Audit Trail  │ │ Analytics &   │              │
│  │ Upload PDF →  │ │ Every decision│ │ Reporting     │              │
│  │ classified in │ │ logged with   │ │ Real-time KPIs│              │
│  │ minutes       │ │ reviewer name │ │ & Excel export│              │
│  └───────────────┘ └───────────────┘ └───────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│  Footer: © PCORI Research Analytics Platform · Privacy · Terms       │
└─────────────────────────────────────────────────────────────────────┘
```

### States

| State | Appearance |
|---|---|
| Default | Full hero + features grid |
| Loading (first paint) | Hero text skeleton (minimal; landing is mostly static) |

---

## Screen-01: Login (`/login`)

**Purpose:** Authenticate returning users
**User Stories:** US-0.3 (Login), US-0.5 (Password Reset link)

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo]                                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                  ┌─────────────────────────────┐                     │
│                  │  Sign In to PCORI Analytics  │                     │
│                  │                             │                     │
│                  │  Username                   │                     │
│                  │  ┌───────────────────────┐  │                     │
│                  │  │                       │  │                     │
│                  │  └───────────────────────┘  │                     │
│                  │                             │                     │
│                  │  Password              [👁] │                     │
│                  │  ┌───────────────────────┐  │                     │
│                  │  │                       │  │                     │
│                  │  └───────────────────────┘  │                     │
│                  │                             │                     │
│                  │  [          Sign In        ] │                     │
│                  │  (disabled until both filled)│                     │
│                  │                             │                     │
│                  │  Forgot password? · Sign up │                     │
│                  └─────────────────────────────┘                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Sign In button | Center CTA |
| Secondary | Username + Password fields | Form inputs |
| Tertiary | Forgot password / Sign up links | Below CTA |

### States

| State | Appearance | User Feedback |
|---|---|---|
| Default | Form empty; Sign In disabled | N/A |
| Filling | Sign In enabled when both fields non-empty | N/A |
| Loading | Sign In button: spinner, disabled | "Signing in..." |
| Error: invalid credentials | Toast (red): "Invalid username or password" | Attempt counter if near lockout |
| Error: locked | Toast (red): "Account locked. Try again after [X] min" | — |
| Error: unverified | Toast (amber): "Verify your email first" + Resend link | — |
| Error: inactive | Toast (red): "This account has been deactivated" | — |
| Success | Redirect to /dashboard | — |

### Interactive Elements

| Element | Type | Behavior |
|---|---|---|
| Username | Text input | Required; no auto-submit |
| Password | Password input + show/hide toggle | Required; 👁 icon toggles visibility |
| Sign In | Primary button | Disabled until both fields non-empty |
| Forgot password? | Link | → /forgot-password |
| Sign up | Link | → /signup |

---

## Screen-02: Sign Up (`/signup`)

**Purpose:** Self-registration for new users
**User Stories:** US-0.1 (Registration), US-0.2 (Email Verification triggered)

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo]                                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                  ┌─────────────────────────────┐                     │
│                  │  Create your account         │                     │
│                  │                             │                     │
│                  │  Username *                 │                     │
│                  │  ┌─────────────────────┐   │                     │
│                  │  │                     │   │                     │
│                  │  └─────────────────────┘   │                     │
│                  │  3–50 chars, a–z, 0–9, _   │                     │
│                  │                             │                     │
│                  │  Email *                    │                     │
│                  │  First Name *  Last Name *  │                     │
│                  │                             │                     │
│                  │  Password *                 │                     │
│                  │  ┌─────────────────────┐   │                     │
│                  │  │                     │   │                     │
│                  │  └─────────────────────┘   │                     │
│                  │  Requires: uppercase, lowercase, digit            │
│                  │                             │                     │
│                  │  [       Create Account    ] │                     │
│                  │                             │                     │
│                  │  Already have an account? Sign in                 │
│                  └─────────────────────────────┘                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### States

| State | Appearance | User Feedback |
|---|---|---|
| Default | All fields empty; button disabled | N/A |
| Validation (blur) | Field-level inline errors | Red error text below field |
| Error: username taken | Field error: "Username already in use" | — |
| Error: email taken | Field error: "Email already registered" | — |
| Error: password complexity | Field error: lists failing requirements | — |
| Success | Toast (green): "Account created — check your email" → redirect /login | — |

---
