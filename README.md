# BIB InsightIQ — Student Success Intelligence Platform

> Turning campus data into student success — see **who needs help**, **why they are at risk**, and **what to do next**, before a small gap becomes a bigger challenge.

Built by **TEAM BIB (Biryani Intelligence Bureau)** for the **HacXLerate Smart Campus Analytics** challenge.

![BIB InsightIQ landing page](docs/screenshots/landing.png)


---

## 🎯 The Problem

Student data lives in silos — grades in one system, attendance in another, LMS activity, skill assessments, and placement records scattered everywhere. By the time anyone connects the dots, a struggling student has already fallen behind.

**BIB InsightIQ** unifies **seven campus data sources** under a single student identity and answers three questions instantly:

1. **Who needs help?** — an explainable 0–100 Success Score with clear risk bands
2. **Why are they at risk?** — dual, points-based **Academic Risk** and **Placement Risk** flags, each with a sorted driver list (signal → value → threshold → points)
3. **What should faculty do next?** — concrete next steps and mentor interventions with an owner and follow-up date

---

## 🖥️ How It Works

### 1. Public website & guided entry

A professional landing site explains the product, privacy stance, and benefits per role, with an "Ask IQ" assistant for guided navigation. Visitors can explore a **password-free demo** — no credentials needed.

![Login and demo access](docs/screenshots/login.png)

### 2. Student dashboard — the whole student story

Each student gets an 8-tab workspace: **Overview, Academics, Attendance, LMS, Skills, Placement, Engagement, Feedback**.

- **Explainable score** — every component shows its weight and exact point contribution
- **Risk badges** — Academic and Placement risk levels with points, plus "Why you are flagged" drivers
- **Actionable notifications** — e.g. *"attend the next 8 classes to reach 85%"*, assignment deadlines, drive eligibility
- Attendance planner, unit-wise LMS content, weekly skill tests, resume check, mock interviews, and placement drive eligibility

![Student dashboard](docs/screenshots/student.png)

### 3. Faculty / Mentor dashboard — triage at a glance

Mentors see their assigned cohort with **filterable Academic-risk and Placement-risk columns**, band filters, search, up-to-3-student comparison, and one-click **Intervene** actions that record owner, action, and follow-up date.

![Faculty dashboard](docs/screenshots/faculty.png)

### 4. Administrator dashboard — institution-level insight

Campus-wide KPIs, risk-band distribution, academic trends, department comparison, **flag-level counts and a branch × flag heatmap**, plus a data-quality panel — missing data is flagged, never silently treated as zero.

![Admin dashboard](docs/screenshots/admin.png)

### 5. Data & Import

CSV import with validation and a cleaning report, so messy real-world exports (duplicates, missing values, bad formats) become one unified, trustworthy student record.

![Data import](docs/screenshots/data.png)

---

## 🧮 Scoring & Risk Model

**Success Score (0–100)** — weighted, renormalized over available components (missing data never counts as zero):

| Component | Weight |
|---|---|
| Academics (CGPA) | 30% |
| Attendance | 20% |
| Placement readiness | 15% |
| LMS engagement | 15% |
| Skills | 10% |
| Engagement | 10% |

**Bands:** ≥ 80 On Track · ≥ 65 Monitor · ≥ 50 Needs Attention · < 50 High Priority.
If **any risk flag is High**, the band can never be "On Track".

**Dual risk flags** — a points-based rule table in one config file (`src/lib/risk-flags.ts`): each rule is *signal, threshold, points*. Missing inputs add no points and appear as **"Insufficient data"**.

- **Academic Risk** — backlogs, low CGPA, SGPA drop, low attendance, subjects below 75, low LMS lessons/assignments → High ≥ 5 pts, Medium ≥ 2
- **Placement Risk** — low readiness, weak aptitude/coding, weak resume, no mock interviews, incomplete assessments, no certifications/hackathons → High ≥ 6 pts, Medium ≥ 3

✅ **Verified:** all 300 students in the official dataset match the reference answer key — scores, flag points/levels, and bands — with **zero mismatches** (20 automated tests).

---

## 🏗️ Tech Stack

- **Frontend:** React 19 + TanStack Start (SSR), Tailwind CSS v4, shadcn/ui, Recharts
- **Backend:** Lovable Cloud (PostgreSQL, auth, server functions) — roles enforced server-side via `user_roles`
- **Assistant:** AI Elements + AI SDK, provider calls kept server-side
- **Testing:** Vitest — scoring, risk flags, bands, CSV validation, dataset answer-key parity

## 🚀 Run Locally

```bash
bun install
bun run dev      # http://localhost:8080
bun run test     # calculation & validation tests
bun run build
```

## 🔐 Privacy & Roles

- Public demo dashboards use **fictional data only**, stored in the browser — never an authorization source
- The authenticated portal enforces permissions in the database on every request; new accounts get student access only, staff roles require authorized assignment
- Demo workspaces are role-isolated: a student sees only their own dashboard

## 🗺️ Roadmap

Tracked in `roadmap.md` — live import of the 7 raw source CSVs with cleaning report, evidence approval queues, configurable scoring weights, notifications, and full authenticated end-to-end flows.

---

*Explainable insights. Human-led support. Fictional demo data.*
