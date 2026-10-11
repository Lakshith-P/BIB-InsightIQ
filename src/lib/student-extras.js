import {
  successScore,
  attendancePct,
  classesNeededForTarget,
  maxMissableClasses,
  attendanceMarks,
  pendingAssignments,
} from "./scoring";
import { riskBand } from "./types";
/** Fixed demo "today" so server and browser render identical fictional data. */
export const DEMO_TODAY = "2026-10-10";
export const REMAINING_CLASSES_PER_SUBJECT = 14;
const day = (offset) => {
  const d = new Date(DEMO_TODAY + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};
export const daysUntil = (iso) =>
  Math.round((Date.parse(iso + "T00:00:00Z") - Date.parse(DEMO_TODAY + "T00:00:00Z")) / 86400000);
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export function attendancePlan(subject, held, attended) {
  const pct = attendancePct(attended, held);
  const marks = attendanceMarks(pct);
  const needFor90 = held > 0 ? classesNeededForTarget(attended, held, 90) : 0;
  const needFor85 = held > 0 ? classesNeededForTarget(attended, held, 85) : 0;
  const canMissAt90 = held > 0 ? maxMissableClasses(attended, held, 90) : 0;
  const reachable90 = needFor90 <= REMAINING_CLASSES_PER_SUBJECT;
  const reachable85 = needFor85 <= REMAINING_CLASSES_PER_SUBJECT;
  const target = reachable90 ? 90 : reachable85 ? 85 : 75;
  let status = "safe";
  let message;
  if (pct === null) {
    status = "watch";
    message = "No classes recorded yet.";
  } else if (pct >= 90)
    message = `Great — you earn 5 marks. You can miss up to ${canMissAt90} more class(es) and stay at 90%.`;
  else if (reachable90) {
    status = "watch";
    message = `Attend the next ${needFor90} class(es) without a break to reach 90% (5 marks).`;
  } else if (reachable85) {
    status = "warning";
    message = `90% is no longer reachable this semester. New target 85% (4 marks): attend the next ${needFor85} class(es).`;
  } else {
    status = "critical";
    message = `Warning: even 85% is out of reach. Attend every remaining class to stay above 75% and speak to your mentor.`;
  }
  if (pct !== null && pct < 75) status = "critical";
  return {
    subject,
    held,
    attended,
    pct,
    marks,
    needFor90,
    needFor85,
    canMissAt90,
    target,
    reachable90,
    reachable85,
    status,
    message,
  };
}
const SYLLABUS = {
  "Data Structures": [
    ["Arrays & complexity", "Big-O analysis"],
    ["Linked lists", "Stacks & queues"],
    ["Trees & BST", "Heaps"],
    ["Graphs", "BFS/DFS"],
    ["Hashing", "Tries"],
    ["Dynamic programming review", "Mock test"],
  ],
  DBMS: [
    ["ER model", "Relational model"],
    ["SQL basics", "Joins"],
    ["Normalization", "Functional dependencies"],
    ["Transactions", "Concurrency"],
    ["Indexing", "Query optimisation"],
    ["NoSQL overview", "Revision"],
  ],
  "Operating Systems": [
    ["Processes", "Threads"],
    ["CPU scheduling", "Synchronisation"],
    ["Deadlocks", "Semaphores"],
    ["Memory management", "Paging"],
    ["File systems", "I/O"],
    ["Security", "Revision"],
  ],
  "Computer Networks": [
    ["OSI & TCP/IP", "Physical layer"],
    ["Data link", "MAC"],
    ["Network layer", "Routing"],
    ["Transport layer", "TCP/UDP"],
    ["Application layer", "DNS/HTTP"],
    ["Network security", "Revision"],
  ],
};
export function unitContent(subject, unit, unitDone) {
  const syl = SYLLABUS[subject]?.[unit - 1] ?? ["Topic A", "Topic B"];
  return {
    syllabus: syl,
    videos: syl.map((t, i) => ({
      title: `${t} — lecture video`,
      minutes: 18 + ((unit * 7 + i * 5) % 20),
      watched: unitDone,
    })),
    teacherUploads: [
      {
        title: `Unit ${unit} notes (PDF)`,
        kind: "Notes",
        by: "Course faculty",
        date: day(-60 + unit * 8),
      },
      {
        title: `Unit ${unit} practice problems`,
        kind: "Worksheet",
        by: "Course faculty",
        date: day(-58 + unit * 8),
      },
    ],
  };
}
// ---------- Assignments with given/due dates ----------
export function assignmentBoard(s) {
  const pending = pendingAssignments(s)
    .slice(0, 6)
    .map((a, i) => {
      const due = day(2 + i * 3);
      return {
        ...a,
        given: day(-12 + i * 3),
        due,
        daysLeft: daysUntil(due),
        task: `Solve the ${a.title.split(": ")[1] ?? "unit"} problem set and upload your answers as a PDF.`,
      };
    });
  return pending;
}
// ---------- LMS login frequency (last 7 days) ----------
export function loginFrequency(s) {
  const h = hash(s.id);
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({
    day: d,
    logins: ((h >> i) % 4) + (s.cgpa > 7 ? 1 : 0),
  }));
}
// ---------- Skills: weekly tests & practice ----------
export function weeklyTests(s) {
  const base = (s.skills.aptitude + s.skills.verbal + s.skills.analytical) / 3;
  return [1, 2, 3, 4, 5, 6].map((w) => ({
    week: `W${w}`,
    aptitude: Math.min(100, Math.round(s.skills.aptitude - 12 + w * 2.5)),
    verbal: Math.min(100, Math.round(s.skills.verbal - 10 + w * 2)),
    analytical: Math.min(100, Math.round(base - 8 + w * 1.8)),
  }));
}
export const VOCAB = [
  { word: "Meticulous", meaning: "Showing great attention to detail" },
  { word: "Pragmatic", meaning: "Dealing with things practically" },
  { word: "Concise", meaning: "Giving information clearly in few words" },
  { word: "Resilient", meaning: "Able to recover quickly from difficulty" },
];
export const PRACTICE_SETS = [
  { name: "Quantitative aptitude — percentages & ratios", questions: 20, minutes: 25 },
  { name: "Logical reasoning — seating & puzzles", questions: 15, minutes: 20 },
  { name: "Verbal — reading comprehension", questions: 10, minutes: 15 },
  { name: "Analytical — data interpretation", questions: 12, minutes: 20 },
];
// ---------- Placement ----------
export const ROLE_KEYWORDS = {
  SDE: ["DSA", "Java/Python", "Git", "System design", "Projects"],
  "ML Engineer": ["Python", "ML", "Statistics", "Projects", "Deployment"],
  "Data Scientist": ["Python", "SQL", "Statistics", "ML", "Visualisation"],
  "Data Analyst": ["SQL", "Excel", "Visualisation", "Statistics"],
  "Embedded Engineer": ["C", "Microcontrollers", "RTOS", "Electronics"],
  "Design Engineer": ["CAD", "Mechanics", "Manufacturing", "Projects"],
  "Business Analyst": ["Excel", "SQL", "Communication", "Case studies"],
};
export function resumeCheck(s) {
  const role = s.targetRoles[0];
  const needed = role ? (ROLE_KEYWORDS[role] ?? []) : [];
  const h = hash(s.id + "cv");
  const found = needed.filter((_, i) => ((h >> i) & 1) === 1 || s.resumeCompleteness > 80);
  const missing = needed.filter((k) => !found.includes(k));
  const match = needed.length ? Math.round((found.length / needed.length) * 100) : 0;
  return { role: role ?? "Not selected", found, missing, match, matches: match >= 60 };
}
export function mockInterviews(s) {
  const b = (s.skills.communication + s.skills.coding) / 2;
  return [
    {
      date: day(-40),
      type: "Technical",
      score: Math.round(b - 8),
      note: "Explain approach before coding.",
    },
    {
      date: day(-20),
      type: "HR",
      score: Math.round(s.skills.communication - 3),
      note: "Use STAR format for answers.",
    },
    {
      date: day(-6),
      type: "Technical",
      score: Math.round(b),
      note: "Improved clarity; practice edge cases.",
    },
  ];
}
export function upcomingDrives() {
  return [
    { company: "TechNova (fictional)", date: day(5), role: "SDE" },
    { company: "DataCraft (fictional)", date: day(11), role: "Data Analyst" },
    { company: "EmbedWorks (fictional)", date: day(18), role: "Embedded Engineer" },
  ];
}
export function drivesAllowedByCgpa(cgpa) {
  if (cgpa >= 8.5) return { limit: "Unlimited", note: "Dream & super-dream drives open" };
  if (cgpa >= 7.5) return { limit: "8 drives", note: "Dream drives open" };
  if (cgpa >= 6.5) return { limit: "5 drives", note: "Regular drives only" };
  return { limit: "2 drives", note: "Improve CGPA to 6.5 to unlock more drives" };
}
// ---------- Engagement catalogue ----------
export const CLUBS = [
  {
    name: "Coding Club",
    members: 240,
    score: 88,
    why: "Weekly contests build DSA speed for placements.",
    importance: "Directly improves coding & interview readiness.",
  },
  {
    name: "Robotics Club",
    members: 120,
    score: 81,
    why: "Hands-on hardware + software projects.",
    importance: "Strong portfolio for core & embedded roles.",
  },
  {
    name: "Literary Society",
    members: 90,
    score: 74,
    why: "Debates and writing improve verbal ability.",
    importance: "Boosts communication & GD performance.",
  },
  {
    name: "Entrepreneurship Cell",
    members: 150,
    score: 79,
    why: "Pitch events and startup mentoring.",
    importance: "Leadership, teamwork and product thinking.",
  },
];
export const EVENTS = [
  {
    name: "Tech Fest 2026",
    date: day(9),
    kind: "Fest",
    about: "Campus-wide technical fest with 20+ competitions.",
  },
  {
    name: "Industry talk: AI in Healthcare",
    date: day(4),
    kind: "Seminar",
    about: "Guest lecture by a fictional industry expert.",
  },
  {
    name: "Inter-college Debate",
    date: day(15),
    kind: "Competition",
    about: "Team debate; counts toward soft-skill credits.",
  },
];
export const HACKATHONS = [
  {
    name: "HacXLerate Smart Campus",
    date: day(21),
    brief: "36-hour build on campus analytics.",
    why: "Real campus problem, mentors from industry, internship fast-track.",
    different: "Judged on data integration and explainability, not just UI.",
    best: "Winning teams get pre-placement interviews (demo).",
  },
  {
    name: "Green Code Sprint",
    date: day(30),
    brief: "24-hour sustainability coding challenge.",
    why: "Builds teamwork under time pressure.",
    different: "Scored on energy-efficient code.",
    best: "Open to first-years; beginner mentoring.",
  },
];
export function integrityFlags(s) {
  const flags = [];
  for (const e of s.engagement)
    if (!e.verified)
      flags.push({
        kind: e.name.toLowerCase().startsWith("claimed") ? "Possible fraud" : "Unverified",
        detail: `${e.name} — no evidence approved yet; it does not count toward your score.`,
      });
  return flags;
}
export function engagementScore(s) {
  const pts = s.engagement.reduce(
    (a, e) =>
      a +
      (e.verified
        ? e.type === "hackathon"
          ? 30
          : e.type === "certification"
            ? 25
            : e.type === "club"
              ? 20
              : 15
        : 0),
    0,
  );
  return Math.min(100, pts);
}
// ---------- Feedback ----------
export function feedbackRounds(s) {
  const teachers = ["Dr. Rao", "Prof. Iyer", "Dr. Menon", "Prof. Das"];
  return s.subjects.map((sub, i) => ({
    subject: sub.subject,
    teacher: teachers[i % teachers.length],
    rounds: [1, 2, 3].map((r) => ({
      round: r,
      date: day(-75 + r * 25),
      done: daysUntil(day(-75 + r * 25)) <= 0,
      remark:
        daysUntil(day(-75 + r * 25)) <= 0
          ? sub.marks >= 75
            ? "Consistent, participates well."
            : sub.marks >= 60
              ? "Needs more practice on problem solving."
              : "Falling behind; please attend doubt sessions."
          : "Scheduled",
    })),
  }));
}
// ---------- Segmentation & notifications ----------
// Rule-based segments — first match wins, mirroring the dataset's official scoring.py.
export function segmentOf(s) {
  const c = successScore(s).components;
  const academics = c.academics ?? -1;
  const placement = c.placement ?? -1;
  const att = c.attendance ?? -1;
  const lms = c.lms ?? -1;
  const eng = c.engagement ?? -1;
  const drop =
    s.semesterGrades.length >= 2 ? (s.semesterGrades[0] ?? 0) - (s.semesterGrades.at(-1) ?? 0) : 0;
  const score = successScore(s).score ?? -1;
  if (academics >= 75 && placement >= 0 && placement < 60)
    return {
      name: "High academics, low placement readiness",
      action: "Resume clinic + mock interviews + aptitude practice.",
    };
  if (academics >= 70 && att >= 0 && att < 75)
    return {
      name: "Strong grades, poor attendance",
      action: "Attendance contract and class-wise reminders.",
    };
  if (att >= 85 && drop >= 1.0)
    return {
      name: "Good attendance, declining academics",
      action: "Doubt sessions and a revision plan for the weakest units.",
    };
  if (s.skills.coding >= 75 && s.skills.aptitude >= 0 && s.skills.aptitude < 50)
    return { name: "Strong coder, aptitude gap", action: "Daily aptitude practice sets." };
  if (score >= 0 && score < 65 && lms >= 0 && lms < 60 && eng >= 0 && eng < 25)
    return {
      name: "Disengaged, multiple risks",
      action: "Weekly mentoring plus one club or event this month.",
    };
  if (riskBand(score) === "On Track")
    return { name: "On track", action: "Stretch goals: hackathons, research, leadership." };
  return {
    name: "Steady, no standout pattern",
    action: "Maintain current performance and complete pending LMS work.",
  };
}
/** Count students per segment (largest first), with the suggested action for each. */
export function segmentCounts(students) {
  const map = new Map();
  for (const s of students) {
    const seg = segmentOf(s);
    const entry = map.get(seg.name) ?? { name: seg.name, action: seg.action, count: 0 };
    entry.count += 1;
    map.set(seg.name, entry);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
export function notifications(s) {
  const out = [];
  for (const sub of s.subjects) {
    const p = attendancePlan(sub.subject, sub.classesHeld, sub.classesAttended);
    if (p.status === "critical" || p.status === "warning")
      out.push({
        tone: p.status === "critical" ? "danger" : "warning",
        area: "Attendance",
        text: `${sub.subject}: ${p.pct?.toFixed(1)}%`,
        tip: p.message,
      });
  }
  for (const a of assignmentBoard(s))
    if (a.daysLeft <= 3)
      out.push({
        tone: "warning",
        area: "Assignment",
        text: `${a.title} (${a.subject}) closes in ${a.daysLeft} day(s)`,
        tip: "Submit before the deadline to keep LMS credit.",
      });
  for (const sub of s.subjects)
    if (sub.marks < 60)
      out.push({
        tone: "danger",
        area: "Academics",
        text: `${sub.subject} marks ${sub.marks}/100`,
        tip: "Book a doubt session and revise units with lowest quiz scores.",
      });
  if (s.backlogs)
    out.push({
      tone: "danger",
      area: "Academics",
      text: `${s.backlogs} backlog(s) pending`,
      tip: "Register for the next re-examination and follow the recovery plan.",
    });
  const cv = resumeCheck(s);
  if (!cv.matches)
    out.push({
      tone: "warning",
      area: "Placement",
      text: `Resume matches ${cv.match}% of ${cv.role} skills`,
      tip: cv.missing.length ? `Add: ${cv.missing.join(", ")}.` : "Select a target role.",
    });
  const d = upcomingDrives()[0];
  out.push({
    tone: "info",
    area: "Placement",
    text: `${d.company} drive in ${daysUntil(d.date)} days`,
    tip: "Check your eligibility in the Placement tab.",
  });
  if (s.skills.aptitude < 60)
    out.push({
      tone: "warning",
      area: "Skills",
      text: `Aptitude ${s.skills.aptitude}/100`,
      tip: "Take this week's aptitude practice set.",
    });
  for (const f of integrityFlags(s))
    out.push({
      tone: "warning",
      area: "Engagement",
      text: f.detail,
      tip: "Upload evidence for review.",
    });
  return out;
}
