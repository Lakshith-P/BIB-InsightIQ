import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BandBadge, EmptyState, SectionTitle, StatCard } from "@/components/widgets";
import { CampusInsights } from "@/components/portal/CampusInsights";
import { PageTitle } from "@/components/portal/PortalShell";
import { pct } from "@/components/portal/StudentTable";
import { BAND_ORDER, byAttention, isAtRisk, lowAttendance } from "@/lib/campus-derive";
import { liveAssignments, liveNotifications } from "@/lib/live-profile";
import { useCampus } from "@/lib/use-campus";

const card = "rounded-xl border bg-card p-4";
const BAND_BAR = {
  "On Track": "bg-success",
  Monitor: "bg-info",
  "Needs Attention": "bg-warning",
  "High Priority": "bg-destructive",
};

export function HomePage() {
  const { role } = useCampus();
  if (role === "admin") return <AdminHome />;
  if (role === "faculty") return <FacultyHome />;
  return <StudentHome />;
}

function QuickLinks({ items }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <Link
          key={i.to}
          to={i.to}
          className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary"
        >
          <p className="flex items-center justify-between font-medium">
            {i.label}
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{i.hint}</p>
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- student
function StudentHome() {
  const { profile, myRow, interventions, today } = useCampus();
  const first = (profile.display_name || "there").split(" ")[0];
  if (!myRow)
    return (
      <div>
        <PageTitle title={`Welcome, ${first}`} sub="Home" />
        <EmptyState
          title="Your account is ready"
          hint="Your student record has not been linked yet. An administrator links it to your account and assigns your teacher. You can already complete your profile."
        />
        <div className="mt-4 flex gap-2">
          <Button asChild>
            <Link to="/portal/profile">Complete my profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/demo">Explore the fictional demo</Link>
          </Button>
        </div>
      </div>
    );
  const s = myRow.s;
  const alerts = liveNotifications(s, today).filter((n) => n.tone !== "info");
  const deadlines = liveAssignments(s, today).slice(0, 4);
  const mine = interventions.filter((i) => i.student_id === s.id && i.status !== "resolved");
  const next = [...mine].sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date))[0];
  return (
    <div>
      <PageTitle
        title={`Welcome back, ${first}`}
        sub={`Home · ${s.id} · ${s.branch} · Semester ${s.semester}`}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard
          label="Success score"
          value={myRow.score === null ? "—" : String(Math.round(myRow.score))}
          sub={myRow.band ?? "No data yet"}
        />
        <StatCard label="CGPA" value={myRow.cgpa === null ? "—" : myRow.cgpa.toFixed(2)} />
        <StatCard
          label="Attendance"
          value={pct(myRow.attendance)}
          tone={lowAttendance(myRow) ? "danger" : "default"}
        />
        <StatCard label="LMS" value={pct(myRow.lms)} />
        <StatCard
          label="Alerts"
          value={String(alerts.length)}
          tone={myRow.urgent ? "danger" : alerts.length ? "warning" : "success"}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <SectionTitle sub="What to look at first">Needs your attention</SectionTitle>
          {alerts.length === 0 && (
            <p className="text-sm text-success">
              {myRow.score === null
                ? "Nothing to show yet. Alerts appear once your marks and attendance are added."
                : "You are on track everywhere."}
            </p>
          )}
          <div className="space-y-2">
            {alerts.slice(0, 4).map((n, i) => (
              <p key={i} className="rounded-lg border p-3 text-sm">
                <span className="mr-1 text-xs font-medium uppercase text-muted-foreground">
                  {n.area}
                </span>
                {n.text}
                <span className="block text-xs text-muted-foreground">{n.tip}</span>
              </p>
            ))}
          </div>
          {alerts.length > 0 && (
            <Button asChild variant="link" className="mt-2 px-0">
              <Link to="/portal/dashboard">See everything in your dashboard</Link>
            </Button>
          )}
        </div>
        <div className="space-y-4">
          <div className={card}>
            <SectionTitle sub="Your mentor and the next follow-up">Mentor</SectionTitle>
            {myRow.mentorId ? (
              <p className="text-sm">
                <b>{myRow.mentorName}</b>
                {myRow.mentorEmail && (
                  <span className="text-muted-foreground"> · {myRow.mentorEmail}</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No mentor assigned yet.</p>
            )}
            {next && (
              <p className="mt-2 text-sm">
                Next follow-up <b>{next.follow_up_date}</b>: {next.action}
              </p>
            )}
          </div>
          <div className={card}>
            <SectionTitle sub="Not yet submitted">Upcoming deadlines</SectionTitle>
            {deadlines.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {s.lms.length ? "No pending assignments." : "No LMS data recorded yet."}
              </p>
            )}
            {deadlines.map((a) => (
              <p
                key={a.subject + a.title}
                className="flex justify-between gap-3 border-t py-2 text-sm"
              >
                <span>
                  {a.title} <span className="text-muted-foreground">· {a.subject}</span>
                </span>
                <span
                  className={
                    a.daysLeft !== null && a.daysLeft < 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }
                >
                  {a.deadline || "no date"}
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6">
        <SectionTitle>Go to</SectionTitle>
        <QuickLinks
          items={[
            {
              to: "/portal/dashboard",
              label: "Dashboard",
              hint: "Your academic status and score.",
            },
            { to: "/portal/learning", label: "Learning path", hint: "This semester's courses." },
            { to: "/portal/attendance", label: "Attendance", hint: "Classes needed to stay safe." },
            { to: "/portal/skills", label: "Skills", hint: "Your assessment scores." },
            { to: "/portal/placement", label: "Placement", hint: "Readiness and target roles." },
            { to: "/portal/profile", label: "Profile", hint: "Update your personal details." },
          ]}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- shared staff bits
function AttentionList({ rows, empty }) {
  const needy = byAttention(rows).filter((r) => isAtRisk(r) || lowAttendance(r) || r.urgent);
  return (
    <div className="divide-y">
      {needy.length === 0 && <p className="py-2 text-sm text-success">{empty}</p>}
      {needy.slice(0, 6).map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
          <div className="min-w-0">
            <Link
              to="/portal/students/$id"
              params={{ id: r.id }}
              className="font-medium text-primary hover:underline"
            >
              {r.name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {r.id} · attendance {pct(r.attendance)} · {r.alerts} alert(s)
            </p>
          </div>
          <BandBadge score={r.score} />
        </div>
      ))}
    </div>
  );
}

function FollowUps({ limit = 5 }) {
  const { interventions, rows, today } = useCampus();
  const names = new Map(rows.map((r) => [r.id, r.name]));
  const open = interventions
    .filter((i) => i.status !== "resolved")
    .sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date))
    .slice(0, limit);
  return (
    <div className="divide-y">
      {open.length === 0 && (
        <p className="py-2 text-sm text-muted-foreground">No open follow-ups.</p>
      )}
      {open.map((i) => (
        <div key={i.id} className="py-2 text-sm">
          <div className="flex justify-between gap-3">
            <Link
              to="/portal/students/$id"
              params={{ id: i.student_id }}
              className="font-medium text-primary hover:underline"
            >
              {names.get(i.student_id) ?? i.student_id}
            </Link>
            <span
              className={
                i.follow_up_date < today ? "font-medium text-destructive" : "text-muted-foreground"
              }
            >
              {i.follow_up_date}
              {i.follow_up_date < today ? " · overdue" : ""}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{i.action}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- faculty
function FacultyHome() {
  const { profile, rows, summary } = useCampus();
  const first = (profile.display_name || "there").split(" ")[0];
  if (rows.length === 0)
    return (
      <div>
        <PageTitle title={`Welcome, ${first}`} sub="Home" />
        <EmptyState
          title="No students assigned to you yet"
          hint="An administrator assigns students to teachers. They will appear here as soon as they are connected to you."
        />
      </div>
    );
  return (
    <div>
      <PageTitle title={`Welcome, ${first}`} sub="Home · your students at a glance" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="My students" value={String(summary.total)} />
        <StatCard
          label="Need help"
          value={String(summary.atRisk)}
          tone={summary.atRisk ? "danger" : "success"}
          sub="Needs attention or high priority"
        />
        <StatCard
          label="Attendance < 75%"
          value={String(summary.lowAttendance)}
          tone={summary.lowAttendance ? "warning" : "success"}
        />
        <StatCard
          label="Open follow-ups"
          value={String(summary.openInterventions)}
          sub={summary.overdueFollowUps ? `${summary.overdueFollowUps} overdue` : "none overdue"}
          tone={summary.overdueFollowUps ? "danger" : "default"}
        />
        <StatCard label="No data yet" value={String(summary.noData)} sub="Marks not recorded" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <SectionTitle sub="Most urgent first">Students who need attention</SectionTitle>
          <AttentionList rows={rows} empty="Everyone with data is on track." />
          <Button asChild variant="link" className="mt-2 px-0">
            <Link to="/portal/students">See all my students</Link>
          </Button>
        </div>
        <div className={card}>
          <SectionTitle sub="Soonest first">Follow-ups</SectionTitle>
          <FollowUps />
          <Button asChild variant="link" className="mt-2 px-0">
            <Link to="/portal/interventions">Manage interventions</Link>
          </Button>
        </div>
      </div>
      <CampusInsights rows={rows} />
    </div>
  );
}

// ---------------------------------------------------------------- admin
function AdminHome() {
  const { profile, rows, summary } = useCampus();
  const first = (profile.display_name || "there").split(" ")[0];
  const branches = [...new Set(rows.map((r) => r.branch))].sort().map((b) => {
    const list = rows.filter((r) => r.branch === b);
    const scored = list.filter((r) => r.score !== null);
    return {
      branch: b,
      count: list.length,
      avg: scored.length ? scored.reduce((a, r) => a + r.score, 0) / scored.length : null,
      atRisk: list.filter(isAtRisk).length,
    };
  });
  const maxBand = Math.max(1, ...Object.values(summary.byBand));
  const segments = [
    ...rows.reduce((m, r) => m.set(r.segment, (m.get(r.segment) ?? 0) + 1), new Map()),
  ]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  return (
    <div>
      <PageTitle title={`Welcome, ${first}`} sub="Home · campus overview" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard
          label="Students"
          value={String(summary.total)}
          sub={`${summary.withData} with data`}
        />
        <StatCard
          label="Average score"
          value={summary.avgScore === null ? "—" : String(Math.round(summary.avgScore))}
        />
        <StatCard
          label="Need help"
          value={String(summary.atRisk)}
          tone={summary.atRisk ? "danger" : "success"}
        />
        <StatCard
          label="No teacher"
          value={String(summary.unassigned)}
          tone={summary.unassigned ? "warning" : "success"}
        />
        <StatCard
          label="Open follow-ups"
          value={String(summary.openInterventions)}
          sub={summary.overdueFollowUps ? `${summary.overdueFollowUps} overdue` : "none overdue"}
          tone={summary.overdueFollowUps ? "danger" : "default"}
        />
      </div>

      {(summary.unassigned > 0 || summary.noData > 0) && (
        <div className="mt-4 rounded-xl border border-dashed p-4 text-sm">
          <p className="font-medium">To finish setting up</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-muted-foreground">
            {summary.unassigned > 0 && (
              <li>
                {summary.unassigned} student(s) have no teacher.{" "}
                <Link to="/portal/assign" className="text-primary underline">
                  Assign them
                </Link>
              </li>
            )}
            {summary.noData > 0 && (
              <li>
                {summary.noData} student(s) have no marks or attendance yet.{" "}
                <Link to="/portal/records" className="text-primary underline">
                  Add their details
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <SectionTitle sub={`${summary.withData} students with data`}>
            Status of students
          </SectionTitle>
          {summary.withData === 0 && (
            <p className="text-sm text-muted-foreground">
              No scores yet. They appear as soon as student details are added.
            </p>
          )}
          <div className="space-y-3">
            {[...BAND_ORDER].reverse().map((b) => (
              <div key={b}>
                <div className="flex justify-between text-sm">
                  <span>{b}</span>
                  <span className="font-medium">{summary.byBand[b]}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${BAND_BAR[b]}`}
                    style={{ width: `${(summary.byBand[b] / maxBand) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={card}>
          <SectionTitle sub="Most urgent first">Students who need attention</SectionTitle>
          <AttentionList rows={rows} empty="Everyone with data is on track." />
          <Button asChild variant="link" className="mt-2 px-0">
            <Link to="/portal/students">See all students</Link>
          </Button>
        </div>
        <div className={card}>
          <SectionTitle sub="Soonest first">Follow-ups</SectionTitle>
          <FollowUps />
        </div>
        <div className={card}>
          <SectionTitle sub="Groups with a shared next step">Student segments</SectionTitle>
          {segments.length === 0 && (
            <p className="text-sm text-muted-foreground">No students yet.</p>
          )}
          <ul className="space-y-1 text-sm">
            {segments.map((g) => (
              <li
                key={g.name}
                className="flex justify-between gap-3 border-t py-1.5 first:border-0"
              >
                <span>{g.name}</span>
                <span className="font-medium">{g.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={card}>
          <SectionTitle sub="By branch">Branches</SectionTitle>
          {branches.length === 0 && (
            <p className="text-sm text-muted-foreground">No students yet.</p>
          )}
          {branches.length > 0 && (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-1">Branch</th>
                  <th>Students</th>
                  <th>Avg score</th>
                  <th>Need help</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.branch} className="border-t">
                    <td className="py-1.5">{b.branch}</td>
                    <td>{b.count}</td>
                    <td>{b.avg === null ? "—" : Math.round(b.avg)}</td>
                    <td className={b.atRisk ? "text-destructive" : ""}>{b.atRisk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <CampusInsights rows={rows} />
      <div className="mt-6">
        <SectionTitle>Go to</SectionTitle>
        <QuickLinks
          items={[
            {
              to: "/portal/assign",
              label: "Assign students",
              hint: "Connect students to teachers.",
            },
            {
              to: "/portal/people",
              label: "People & roles",
              hint: "Give teacher or admin access.",
            },
            {
              to: "/portal/records",
              label: "Student records",
              hint: "Add marks, attendance, skills.",
            },
            { to: "/portal/monitor", label: "Attendance & risk", hint: "Who is falling behind." },
            { to: "/portal/messages", label: "Messages", hint: "Contact messages and concerns." },
            { to: "/portal/audit", label: "Audit log", hint: "Who changed what, and when." },
          ]}
        />
      </div>
    </div>
  );
}
