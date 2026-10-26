// Product update log. RULE: every new feature, improvement or bug fix shipped
// to users must be added here as a new entry (newest first) — see AGENTS.md.

export type UpdateKind = "feature" | "improvement" | "fix";

export interface UpdateEntry {
  version: string;
  date: string; // e.g. "October 22, 2026"
  title: string;
  kind: UpdateKind;
  items: { kind: UpdateKind; text: string }[];
}

export const updates: UpdateEntry[] = [
  {
    version: "v1.9.7",
    date: "October 26, 2026",
    title: "Cleaner dental pages",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Dental clinic, pricing and case explanation pages use compact lists, a price table, a timeline and collapsible answers instead of repeated big cards, with smaller text." },
    ],
  },
  {
    version: "v1.9.6",
    date: "October 26, 2026",
    title: "Pricing tagline fixed",
    kind: "fix",
    items: [
      { kind: "fix", text: "The per-case pricing hero no longer says a case covers unlimited visits; it now states 30 days, up to 3 visits." },
    ],
  },
  {
    version: "v1.9.5",
    date: "October 26, 2026",
    title: "Case calculator and free signup cases",
    kind: "feature",
    items: [
      { kind: "feature", text: "Pricing page now has a calculator: enter one patient's visit dates to see cases and credits used." },
      { kind: "improvement", text: "Pricing now notes 10 free cases at signup and that credits never expire." },
    ],
  },
  {
    version: "v1.9.4",
    date: "October 26, 2026",
    title: "Clearer per-case examples",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Per-case pricing examples now explain, patient by patient, why each costs 1 or 2 cases." },
    ],
  },
  {
    version: "v1.9.3",
    date: "October 26, 2026",
    title: "Per-case explanation corrected",
    kind: "fix",
    items: [
      { kind: "fix", text: "Pricing pages now explain cases correctly: 30 days, up to 3 visits, paid in advance with credits." },
    ],
  },
  {
    version: "v1.9.2",
    date: "October 26, 2026",
    title: "Per-case pricing explained",
    kind: "improvement",
    items: [
      { kind: "fix", text: "Dental clinic page now shows the new setup fee + ₦1,000 per case pricing instead of old plans." },
      { kind: "feature", text: "New page explaining how ₦1,000 per patient case works, with examples." },
    ],
  },
  {
    version: "v1.9.1",
    date: "October 26, 2026",
    title: "Dental clinic pricing page",
    kind: "feature",
    items: [
      { kind: "feature", text: "New dental pricing page: ₦30,000–₦50,000 one-time setup plus ₦1,000 per patient case." },
      { kind: "improvement", text: "Simplified site menus by removing the separate features links." },
    ],
  },
  {
    version: "v1.9.0",
    date: "October 26, 2026",
    title: "Website visitor analytics",
    kind: "feature",
    items: [
      { kind: "feature", text: "Super admins can now see website visits — traffic sources, locations, devices and each visitor's page journey." },
    ],
  },
  {
    version: "v1.8.3",
    date: "October 25, 2026",
    title: "Tidier footer on phones",
    kind: "fix",
    items: [
      { kind: "fix", text: "Footer links on phones now sit in two rows of two columns instead of one long list." },
    ],
  },
  {
    version: "v1.8.2",
    date: "October 25, 2026",
    title: "New menu and footer",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The website menu now has Solutions and Resources dropdowns with short descriptions." },
      { kind: "improvement", text: "The footer was redesigned with a newsletter signup and organised link columns." },
    ],
  },
  {
    version: "v1.8.1",
    date: "October 25, 2026",
    title: "Blog autopilot runs on its own",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The blog autopilot now runs automatically every hour, with no outside scheduler needed." },
    ],
  },
  {
    version: "v1.8.0",
    date: "October 25, 2026",
    title: "Blog autopilot, photos and calls to action",
    kind: "feature",
    items: [
      { kind: "feature", text: "Daily autopilot writes and publishes one article per category." },
      { kind: "feature", text: "Articles now include several photos, not just a cover." },
      { kind: "feature", text: "Every article has a call-to-action banner mid-way and at the end." },
      { kind: "improvement", text: "AI writing is warmer, speaks to one reader, and is tuned for Google search." },
    ],
  },
  {
    version: "v1.7.0",
    date: "October 25, 2026",
    title: "AI Blog Studio for super admins",
    kind: "feature",
    items: [
      { kind: "feature", text: "Brainstorm article ideas by chatting with Clinexus AI." },
      { kind: "feature", text: "Generate a full draft with a cover image in one click." },
      { kind: "feature", text: "Edit, publish or unpublish AI articles; published ones appear on the public blog." },
    ],
  },
  {
    version: "v1.6.3",
    date: "October 25, 2026",
    title: "Case credits explained, now ₦1,000 per case",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Case price is now ₦1,000 per case." },
      { kind: "feature", text: "A 'How credits work' guide with examples opens from the wallet button." },
      { kind: "feature", text: "New article explaining pay-per-case billing." },
    ],
  },
  {
    version: "v1.6.2",
    date: "October 25, 2026",
    title: "All case billing loopholes closed",
    kind: "fix",
    items: [
      { kind: "fix", text: "A patient's name and date of birth are locked after their first case." },
      { kind: "fix", text: "One case covers up to 3 visits in 30 days; the 4th visit uses a new credit." },
      { kind: "fix", text: "Moving or reopening an old appointment outside its case window uses a credit." },
      { kind: "fix", text: "Invoices, prescriptions, lab orders, documents and images now need an active case." },
      { kind: "fix", text: "Adding items to old treatment plans or prescriptions needs an active case." },
      { kind: "fix", text: "Only platform admins can change a clinic's type." },
      { kind: "fix", text: "Finished waiting-room check-ins can't be reset to waiting." },
    ],
  },
  {
    version: "v1.6.1",
    date: "October 24, 2026",
    title: "Case billing can't be bypassed",
    kind: "fix",
    items: [
      { kind: "fix", text: "Adding notes, treatment plans or chart entries for a patient without an active case now uses a case credit." },
      { kind: "fix", text: "The patient on a note, treatment plan or chart entry can no longer be changed." },
    ],
  },
  {
    version: "v1.6.0",
    date: "October 24, 2026",
    title: "Pay-per-case billing for dental clinics",
    kind: "feature",
    items: [
      { kind: "feature", text: "Dental clinics now use prepaid case credits at ₦1,000 per case; a case covers a patient for 30 days." },
      { kind: "feature", text: "Credit balance shows in the dashboard header; at zero, new visits and walk-ins are blocked while existing records stay open." },
      { kind: "improvement", text: "The patient on a visit can no longer be swapped, and deleted visits don't refund credits." },
    ],
  },
  {
    version: "v1.5.0",
    date: "October 23, 2026",
    title: "AI pre-chair patient briefing",
    kind: "feature",
    items: [
      { kind: "feature", text: "Dentists get an AI snapshot of allergies, conditions, last visit, today's plan and patient notes — in the waiting-room queue (sparkle button) and at the top of the dental chart." },
    ],
  },
  {
    version: "v1.4.4",
    date: "October 23, 2026",
    title: "Free AI models",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "AI assistant now uses only free models, automatically falling back through 16 options." },
    ],
  },
  {
    version: "v1.4.3",
    date: "October 23, 2026",
    title: "AI automatic fallback",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "AI assistant now switches to a backup model automatically if the main one is unavailable." },
    ],
  },
  {
    version: "v1.4.2",
    date: "October 23, 2026",
    title: "New AI provider",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "ClineXus AI assistant now runs on OpenRouter." },
    ],
  },
  {
    version: "v1.4.1",
    date: "October 22, 2026",
    title: "Always-fresh app & notification check",
    kind: "improvement",
    items: [
      {
        kind: "improvement",
        text: "Installed apps now check for updates in the background every hour, so everyone is on the latest version without reinstalling or tapping anything.",
      },
      {
        kind: "feature",
        text: "The installed app now asks to turn on notifications before it opens, so no one misses clinic alerts. If notifications were blocked, the app shows how to re-enable them.",
      },
    ],
  },
  {
    version: "v1.4.0",
    date: "October 22, 2026",
    title: "Register new patients on the spot",
    kind: "feature",
    items: [
      {
        kind: "feature",
        text: "Front desk can now register a brand-new patient directly inside the Walk-In and Book Appointment forms — no more detour to the Patients page. Tap + New patient, save, and the patient is selected automatically so you can pick a dentist right away.",
      },
      {
        kind: "improvement",
        text: "Dentist assignment is now part of the same flow for receptionists and admins: register, assign a dentist, and the patient is on their schedule or in the waiting queue in one pass.",
      },
    ],
  },
];

export const kindLabel: Record<UpdateKind, string> = {
  feature: "New feature",
  improvement: "Improvement",
  fix: "Bug fix",
};
