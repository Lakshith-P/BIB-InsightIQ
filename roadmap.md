# BIB InsightIQ roadmap

## Done

- [x] Public website, benefits, solution, privacy, contact and sign-in
- [x] Password-free fictional demo dashboards (student, faculty, campus, data import), separate from the live portal
- [x] Role-isolated demo sessions and a detailed student dashboard
- [x] 300-student BIB dataset as the seed; score, risk flags and bands verified against the reference answer key (`src/test/dataset.test.js`)
- [x] Dual Academic and Placement Risk flags with sorted drivers; a High flag blocks On Track
- [x] Student segmentation with suggested actions, shown on student profiles, the faculty and administrator demo dashboards, and the portal (home chart, table column and filter)
- [x] Guided website assistant (server-side prompt and provider calls)
- [x] Move to JavaScript, PostgreSQL, bcrypt and JWT auth with role-based portal workspaces
- [x] Live student records, teacher assignment, feedback notes and persisted interventions with outcomes and audit log
- [x] Publish to Vercel
- [x] Documentation: `README.md` and `docs/` (architecture, data model, server functions, development guide, score note, demo script)

## Planned

- [ ] Email verification and self-service password recovery
- [ ] Automated import from campus systems
- [ ] Configurable scoring weights and thresholds
- [ ] Notification delivery to students and mentors
- [ ] Evidence review and approval workflow for engagement activities
- [ ] Peer comparison with fairness safeguards
- [ ] Database-backed tests for the authorization SQL

Do not claim every item in the original challenge brief is complete; track follow-on work explicitly.
