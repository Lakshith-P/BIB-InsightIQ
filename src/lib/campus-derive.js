import { academicRisk, effectiveBand, placementRisk } from "./risk-flags";
import { liveNotifications } from "./live-profile";
import { lmsCompletion, studentAttendancePct, successScore } from "./scoring";
import { segmentOf } from "./student-extras";
import { studentSchema } from "./student-validation";

// Turns the raw rows from the database into what the portal pages show: one row per student
// with the score, band, attendance and alert counts already worked out.

export const BAND_ORDER = ["High Priority", "Needs Attention", "Monitor", "On Track"];

export function buildRows(records, today) {
  return records.flatMap((rec) => {
    const parsed = studentSchema.safeParse(rec.record);
    if (!parsed.success) return [];
    const s = parsed.data;
    const r = successScore(s);
    const acad = academicRisk(s);
    const place = placementRisk(s);
    const alerts = liveNotifications(s, today).filter((n) => n.tone !== "info");
    return [
      {
        rec,
        s,
        id: s.id,
        name: s.name,
        branch: s.branch,
        semester: s.semester,
        score: r.score,
        band: r.score === null ? null : effectiveBand(r.score, r.band, acad, place),
        cgpa: s.cgpa > 0 ? s.cgpa : null,
        attendance: studentAttendancePct(s),
        lms: lmsCompletion(s),
        academicRisk: acad.level,
        placementRisk: place.level,
        segment: segmentOf(s).name,
        alerts: alerts.length,
        urgent: alerts.filter((n) => n.tone === "danger").length,
        ownerId: rec.owner_id,
        ownerEmail: rec.owner_email ?? "",
        mentorId: rec.faculty_id,
        mentorName: rec.mentor_name || rec.mentor_email || "",
        mentorEmail: rec.mentor_email ?? "",
      },
    ];
  });
}

const rank = (row) => (row.band === null ? 99 : BAND_ORDER.indexOf(row.band));

/** Students who most need help first; students with no data yet go last. */
export function byAttention(rows) {
  return [...rows].sort(
    (a, b) =>
      rank(a) - rank(b) || (a.score ?? 101) - (b.score ?? 101) || a.name.localeCompare(b.name),
  );
}

export const isAtRisk = (row) => row.band === "High Priority" || row.band === "Needs Attention";
export const lowAttendance = (row) => row.attendance !== null && row.attendance < 75;

export function summarize(rows, interventions, today) {
  const withData = rows.filter((r) => r.score !== null);
  const byBand = Object.fromEntries(BAND_ORDER.map((b) => [b, 0]));
  for (const r of withData) byBand[r.band] += 1;
  const open = interventions.filter((i) => i.status !== "resolved");
  return {
    total: rows.length,
    withData: withData.length,
    noData: rows.length - withData.length,
    byBand,
    avgScore: withData.length ? withData.reduce((a, r) => a + r.score, 0) / withData.length : null,
    atRisk: rows.filter(isAtRisk).length,
    lowAttendance: rows.filter(lowAttendance).length,
    unassigned: rows.filter((r) => !r.mentorId).length,
    openInterventions: open.length,
    overdueFollowUps: open.filter((i) => i.follow_up_date < today).length,
  };
}
