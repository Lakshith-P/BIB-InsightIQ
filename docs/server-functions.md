# Server functions

All server-side behavior is exposed as TanStack Start server functions, plus one HTTP endpoint for the assistant. Functions marked **auth** use the `requireAuth` middleware (`src/backend/auth-middleware.js`), which rejects callers without a valid session. Inputs are validated with Zod before the handler runs.

"Not authorized" in the tables below means the SQL matched zero rows and the function throws; it does not mean a separate permission check ran first.

## Accounts (`src/lib/auth.functions.js`)

| Function             | Auth | Input                            | Behavior                                                                                                      |
| -------------------- | ---- | -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `getSession`         | no   | none                             | Returns the current user and roles, or null                                                                   |
| `signUp`             | no   | email, password (8 to 72), name  | Creates the user with the `student` role in one transaction, starts a session. Rate limited to 10/hour per IP |
| `signIn`             | no   | email, password                  | Verifies bcrypt hash, starts a session. 20 per 15 minutes per IP                                              |
| `signOut`            | no   | none                             | Clears the cookie                                                                                             |
| `changePassword`     | yes  | current, next                    | Requires the current password. 10 per 15 minutes per IP                                                       |
| `sendContactMessage` | yes  | name, email, message (5 to 4000) | Stores a row in `contact_messages`                                                                            |

## Campus data (`src/lib/campus.functions.js`)

| Function                   | Who may call                                                                  | Behavior                                                                                                                                                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loadCampus`               | any signed-in user                                                            | Returns the caller's profile, roles, visible records (with owner and mentor names) and visible interventions in one round trip. Visibility is `owner OR assigned faculty OR admin`                                                                                        |
| `saveCampusStudent`        | admin                                                                         | Upserts a record and its owner and faculty links in a transaction, and writes an `INSERT` or `UPDATE` audit row                                                                                                                                                           |
| `saveCampusIntervention`   | admin, or faculty assigned to the student                                     | Inserts an intervention (`reason` and `action` 5 to 1000 characters, `priority`, `owner`, `followUpDate` as `YYYY-MM-DD`)                                                                                                                                                 |
| `changeCampusIntervention` | admin; faculty only for interventions they created on their assigned students | Updates `status` and `outcome`                                                                                                                                                                                                                                            |
| `listAccounts`             | admin                                                                         | All accounts with their roles, for picking people by name                                                                                                                                                                                                                 |
| `setAccountRole`           | admin                                                                         | Grants or revokes `faculty` or `admin`. An admin cannot remove their own admin role                                                                                                                                                                                       |
| `linkStudentsToTeacher`    | admin                                                                         | Assigns up to 500 student accounts to a teacher (or unassigns with `facultyId: null`). Skips teachers and admins, requires the target to hold the faculty role, creates an `ACC-…` placeholder record for students without one, and writes `LINK` and `INSERT` audit rows |
| `addStudentNote`           | faculty for assigned students; student for their own record                   | Appends a note to the record's `facultyFeedback` or `studentFeedback` (5 to 1000 characters, at most 100 notes)                                                                                                                                                           |
| `updateMyProfile`          | any signed-in user                                                            | Edits own name, phone, address, bio, links and, for students, target roles (kept in sync with their record)                                                                                                                                                               |
| `listContactMessages`      | admin                                                                         | Contact-form inbox                                                                                                                                                                                                                                                        |
| `listAudit`                | admin                                                                         | Record change history                                                                                                                                                                                                                                                     |

### Contract for mutations

- A mutation resolves only after the database write is confirmed (`{ saved: true }`, `{ ok: true }` or a count).
- On success the client invalidates the shared campus query, so scores, bands and risk flags are recomputed from current data.
- Errors are thrown as `Error` with a user-readable message and are displayed by the calling component.

## HTTP endpoint

| Route              | Method | Purpose                                                                                      |
| ------------------ | ------ | -------------------------------------------------------------------------------------------- |
| `/api/public/chat` | POST   | Website assistant. Body `{ messages: UIMessage[] }`; response is an AI SDK UI-message stream |

Refusals: `403` for a request from another origin, `413` or `400` for oversized or invalid conversations, `429` when rate limited, `401` when `LLM_API_KEY` is not set. See [Architecture](architecture.md#website-assistant).

## Adding a server function

1. Put it in a `*.functions.js` file under `src/lib`.
2. Chain `.middleware([requireAuth])` unless it is genuinely public, then `.validator(z.object({...}))`.
3. Put the authorization in the SQL `WHERE` clause (follow `saveCampusIntervention`) or call `requireAdmin(context.user)` first.
4. Use `withTransaction` when more than one statement must succeed together, and write a `campus_audit` row for any change to a student record.
5. Return only after the write has completed, and invalidate the campus query from the caller.
