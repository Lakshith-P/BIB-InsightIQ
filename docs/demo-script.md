# Demo Script (about 5 minutes)

Use the demonstration dashboards, which need no sign-in and use the 300-student BIB dataset. Open `/demo` first.

## Key figures from the dataset

| Measure                | Result                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Students               | 300                                                                                                                                             |
| Average success score  | 72.1                                                                                                                                            |
| Bands                  | On Track 57 · Monitor 193 · Needs Attention 31 · High Priority 19                                                                               |
| Academic Risk          | High 58 · Medium 49 · Low 193                                                                                                                   |
| Placement Risk         | High 69 · Medium 42 · Low 189                                                                                                                   |
| Largest targeted group | 42 students with high academics but low placement readiness                                                                                     |
| Other segments         | Disengaged with multiple risks 24 · Good attendance, declining grades 24 · Strong coder with aptitude gap 22 · Strong grades, poor attendance 9 |

These figures come from running the shipped scoring code over the seed data. Re-check them if the rules or dataset change.

## Flow

1. **The problem (30 s).** Colleges hold attendance, marks, LMS, placement and feedback data in separate systems. Faculty learn about a struggling student late. InsightIQ answers: who needs support, why, and what to do next.
2. **One student view (30 s).** `/student`: one record joins all seven sources under a single student ID.
3. **The score (60 s).** Open a student. Show the six weighted components, the band, and the completeness indicator. Point out that missing data is excluded, not scored as zero. The method is in `docs/success-score-note.md`.
4. **Explainable risk (60 s).** Show the Academic and Placement Risk badges and the sorted drivers (for example backlogs, CGPA under 6.0, SGPA drop).
5. **Faculty view (60 s).** `/faculty`: filter by band, risk level and **segment**. Select "High academics, low placement readiness" and show the suggested action. Select up to three students to compare.
6. **Administrator view (60 s).** `/admin`: score distribution, SGPA trend, branch × flag heatmap and the **segment chart**. Say where the 42 placement-gap students sit and what targeted action fits them.
7. **Real portal (30 s).** Sign in at `/auth`. Show that a teacher sees only assigned students, and record an intervention. It is saved to PostgreSQL, and the follow-up date shows on the teacher's home.
8. **Close (15 s).** Roles are enforced on the server, the demo is separate from real data, and the roadmap covers campus-system import, notifications and configurable weights.

## Slide outline (if slides are needed)

1. Problem and users (faculty, administrators)
2. Data integration: seven sources → one student record
3. Success Score: indicators, weights, missing-data rule
4. Risk flags and drivers (explainability)
5. Segments and targeted actions
6. Dashboard screenshots (faculty, administrator)
7. Architecture and security (roles enforced on the server)
8. Key insights and next steps
