import { getDb } from "../api/queries/connection";
import { rateFactors, services } from "./schema";

/**
 * MAB AI Strategies — Pricing Engine seed data.
 *
 * Baseline market: mid-Atlantic (DE / PA / NJ / NY), SMB & mid-market
 * AI consulting. Multipliers are applied multiplicatively to baseline
 * service rates. 1.00 = baseline mid-Atlantic market rate.
 */

const FACTORS: Array<{
  category: string;
  label: string;
  detail?: string;
  multiplier: string;
  sortOrder: number;
}> = [
  // ---- LOCATION (cost-of-market index) ----------------------------------
  { category: "location", label: "Delaware — Wilmington metro", detail: "Corporate & banking HQ density (incorporation capital)", multiplier: "1.02", sortOrder: 1 },
  { category: "location", label: "Delaware — statewide / Kent & Sussex", detail: "Small-market DE outside Wilmington", multiplier: "0.95", sortOrder: 2 },
  { category: "location", label: "Pennsylvania — Philadelphia metro", detail: "Philly city + close-in suburbs", multiplier: "1.06", sortOrder: 3 },
  { category: "location", label: "Pennsylvania — Pittsburgh / Harrisburg / other", detail: "Secondary PA metros", multiplier: "0.92", sortOrder: 4 },
  { category: "location", label: "New Jersey — North Jersey / NYC metro", detail: "Bergen, Essex, Hudson, Morris corridor", multiplier: "1.18", sortOrder: 5 },
  { category: "location", label: "New Jersey — South Jersey / Philly burbs", detail: "Camden, Burlington, Gloucester", multiplier: "1.00", sortOrder: 6 },
  { category: "location", label: "New York — New York City", detail: "Five boroughs, highest cost-of-market", multiplier: "1.32", sortOrder: 7 },
  { category: "location", label: "New York — Hudson Valley / upstate", detail: "NY outside NYC", multiplier: "1.00", sortOrder: 8 },
  { category: "location", label: "Remote — national US", detail: "Fully remote engagement, national average", multiplier: "0.95", sortOrder: 9 },

  // ---- COMPANY SIZE (employees) ------------------------------------------
  { category: "size", label: "1–10 employees", detail: "Solo / micro business", multiplier: "0.85", sortOrder: 1 },
  { category: "size", label: "11–50 employees", detail: "Small business", multiplier: "0.95", sortOrder: 2 },
  { category: "size", label: "51–200 employees", detail: "Baseline mid-market", multiplier: "1.00", sortOrder: 3 },
  { category: "size", label: "201–500 employees", detail: "Upper mid-market", multiplier: "1.12", sortOrder: 4 },
  { category: "size", label: "501–1,000 employees", detail: "Lower enterprise", multiplier: "1.25", sortOrder: 5 },
  { category: "size", label: "1,001–5,000 employees", detail: "Enterprise", multiplier: "1.40", sortOrder: 6 },
  { category: "size", label: "5,000+ employees", detail: "Large enterprise", multiplier: "1.55", sortOrder: 7 },

  // ---- INDUSTRY -----------------------------------------------------------
  { category: "industry", label: "Financial services & insurance", detail: "DE banking hub, compliance-heavy, high willingness to pay", multiplier: "1.20", sortOrder: 1 },
  { category: "industry", label: "Pharma & life sciences", detail: "Dense in NJ/PA corridor", multiplier: "1.20", sortOrder: 2 },
  { category: "industry", label: "Healthcare & health systems", detail: "Regulated, budgeted IT spend", multiplier: "1.15", sortOrder: 3 },
  { category: "industry", label: "Legal", detail: "High hourly-value perception", multiplier: "1.12", sortOrder: 4 },
  { category: "industry", label: "Technology / SaaS", detail: "AI-fluent buyers, faster cycles", multiplier: "1.10", sortOrder: 5 },
  { category: "industry", label: "Professional services", detail: "Accounting, consulting, agencies", multiplier: "1.05", sortOrder: 6 },
  { category: "industry", label: "Manufacturing", detail: "Baseline", multiplier: "1.00", sortOrder: 7 },
  { category: "industry", label: "Real estate & property", detail: "Relationship-driven", multiplier: "0.95", sortOrder: 8 },
  { category: "industry", label: "Logistics & distribution", detail: "Margin-sensitive ops", multiplier: "0.95", sortOrder: 9 },
  { category: "industry", label: "Retail & e-commerce", detail: "Seasonal budgets", multiplier: "0.90", sortOrder: 10 },
  { category: "industry", label: "Construction & trades", detail: "Price-sensitive, high ROI stories needed", multiplier: "0.88", sortOrder: 11 },
  { category: "industry", label: "Government & public sector", detail: "Procurement cycles, capped budgets", multiplier: "0.88", sortOrder: 12 },
  { category: "industry", label: "Hospitality & food service", detail: "Thin margins", multiplier: "0.82", sortOrder: 13 },
  { category: "industry", label: "Education", detail: "Grant-driven budgets", multiplier: "0.80", sortOrder: 14 },
  { category: "industry", label: "Nonprofit", detail: "Mission discount", multiplier: "0.72", sortOrder: 15 },
  { category: "industry", label: "Other / general business", detail: "Baseline", multiplier: "1.00", sortOrder: 16 },

  // ---- POINT OF CONTACT / TITLE -------------------------------------------
  { category: "title", label: "Owner / Founder", detail: "Fast decisions, owns budget", multiplier: "1.08", sortOrder: 1 },
  { category: "title", label: "CEO / President", detail: "Strategic mandate", multiplier: "1.06", sortOrder: 2 },
  { category: "title", label: "C-suite (CFO / COO / CTO / CMO)", detail: "Functional budget authority", multiplier: "1.05", sortOrder: 3 },
  { category: "title", label: "VP / Director", detail: "Baseline", multiplier: "1.00", sortOrder: 4 },
  { category: "title", label: "Department manager", detail: "Limited budget authority", multiplier: "0.92", sortOrder: 5 },
  { category: "title", label: "Technical lead / IC champion", detail: "Needs internal selling support", multiplier: "0.90", sortOrder: 6 },
  { category: "title", label: "Procurement / buying committee", detail: "Formal process, longer cycle, RFP-grade scope", multiplier: "1.12", sortOrder: 7 },

  // ---- URGENCY / TIMELINE --------------------------------------------------
  { category: "urgency", label: "Standard timeline", detail: "Normal scheduling", multiplier: "1.00", sortOrder: 1 },
  { category: "urgency", label: "Expedited (< 30 days)", detail: "Priority scheduling premium", multiplier: "1.15", sortOrder: 2 },
  { category: "urgency", label: "Rush (< 14 days)", detail: "Drop-everything premium", multiplier: "1.30", sortOrder: 3 },

  // ---- CLIENT RELATIONSHIP --------------------------------------------------
  { category: "relationship", label: "New client", detail: "Baseline", multiplier: "1.00", sortOrder: 1 },
  { category: "relationship", label: "Repeat client", detail: "Loyalty consideration", multiplier: "0.95", sortOrder: 2 },
  { category: "relationship", label: "Referral / partner channel", detail: "Channel relationship pricing", multiplier: "0.92", sortOrder: 3 },

  // ---- DELIVERY COMPLEXITY ---------------------------------------------------
  { category: "complexity", label: "Low — single tool, clean data", detail: "Straightforward implementation", multiplier: "0.92", sortOrder: 1 },
  { category: "complexity", label: "Standard", detail: "Baseline", multiplier: "1.00", sortOrder: 2 },
  { category: "complexity", label: "High — multi-system, messy data", detail: "Integration & data-cleanup overhead", multiplier: "1.12", sortOrder: 3 },
  { category: "complexity", label: "Regulated — compliance, audit, security review", detail: "HIPAA / SOX / PCI-adjacent delivery burden", multiplier: "1.25", sortOrder: 4 },
];

const SERVICES: Array<{
  name: string;
  category: string;
  unit: string;
  basePrice: string;
  description: string;
  goodDesc: string;
  betterDesc: string;
  bestDesc: string;
  sortOrder: number;
}> = [
  {
    name: "AI Readiness Assessment",
    category: "Assess & Advise",
    unit: "per engagement",
    basePrice: "2500",
    description: "Audit of workflows, data, and tooling to identify where AI pays back fastest.",
    goodDesc: "Workflow inventory + written findings report with top-3 opportunities.",
    betterDesc: "Good + stakeholder interviews, scored opportunity matrix, ROI estimate per use case.",
    bestDesc: "Better + 90-day prioritized roadmap, tool/vendor shortlist, executive readout session.",
    sortOrder: 1,
  },
  {
    name: "Executive Briefing (90 min)",
    category: "Assess & Advise",
    unit: "per session",
    basePrice: "950",
    description: "Private leadership briefing on AI impact for the client's specific industry.",
    goodDesc: "Tailored industry briefing deck + Q&A.",
    betterDesc: "Good + competitive scan of AI adoption in the client's niche.",
    bestDesc: "Better + facilitated next-steps working session with documented decisions.",
    sortOrder: 2,
  },
  {
    name: "Strategy Workshop — Half Day",
    category: "Assess & Advise",
    unit: "per workshop",
    basePrice: "1800",
    description: "Facilitated working session to align leadership on an AI adoption plan.",
    goodDesc: "Facilitated session + summary notes.",
    betterDesc: "Good + pre-work survey, opportunity ranking exercise, action list.",
    bestDesc: "Better + follow-up accountability call and finalized 90-day action plan.",
    sortOrder: 3,
  },
  {
    name: "Strategy Workshop — Full Day",
    category: "Assess & Advise",
    unit: "per workshop",
    basePrice: "3200",
    description: "Deep-dive facilitation covering use cases, governance, and rollout sequencing.",
    goodDesc: "Full-day facilitation + documented outcomes.",
    betterDesc: "Good + departmental breakouts, draft governance guardrails.",
    bestDesc: "Better + board-ready summary deck and 2 follow-up coaching calls.",
    sortOrder: 4,
  },
  {
    name: "Single Workflow Automation",
    category: "Build & Automate",
    unit: "per workflow",
    basePrice: "4800",
    description: "One end-to-end workflow automated (e.g., intake, quoting, follow-up, reporting).",
    goodDesc: "Core automation built + basic documentation + 30-day support.",
    betterDesc: "Good + integrations with existing stack, team walkthrough, 90-day support.",
    bestDesc: "Better + error handling & monitoring, optimization pass at day 60, 6-month support.",
    sortOrder: 5,
  },
  {
    name: "Multi-Workflow System (3–5 workflows)",
    category: "Build & Automate",
    unit: "per system",
    basePrice: "14500",
    description: "Connected set of automations sharing data across a department or function.",
    goodDesc: "3 workflows built + shared documentation + 60-day support.",
    betterDesc: "Good + up to 5 workflows, unified dashboard, staff training, 6-month support.",
    bestDesc: "Better + quarterly optimization reviews and priority change-request queue.",
    sortOrder: 6,
  },
  {
    name: "Autonomous Agent System",
    category: "Build & Automate",
    unit: "per system",
    basePrice: "38000",
    description: "Full autonomous AI system: agents that research, decide, and act with human oversight.",
    goodDesc: "Single-agent system with human-in-the-loop approvals + runbook.",
    betterDesc: "Good + multi-agent orchestration, guardrails & audit logging, team enablement.",
    bestDesc: "Better + performance tuning, red-team testing, 12-month support & iteration retainer credit.",
    sortOrder: 7,
  },
  {
    name: "Integration & Data Pipeline",
    category: "Build & Automate",
    unit: "per pipeline",
    basePrice: "9500",
    description: "Connect CRMs, ERPs, and data sources so AI systems run on clean, live data.",
    goodDesc: "Two-system integration + field mapping documentation.",
    betterDesc: "Good + multi-source pipeline, data-quality checks, scheduled syncs.",
    bestDesc: "Better + warehousing layer, monitoring alerts, and schema documentation.",
    sortOrder: 8,
  },
  {
    name: "Custom AI Development",
    category: "Build & Automate",
    unit: "per hour",
    basePrice: "185",
    description: "Bespoke development: copilots, internal tools, RAG systems, model fine-tuning.",
    goodDesc: "Scoped hourly development with weekly written updates.",
    betterDesc: "Good + dedicated Slack channel, staging environment, code handover docs.",
    bestDesc: "Better + architecture review, test coverage, and knowledge-transfer sessions.",
    sortOrder: 9,
  },
  {
    name: "Team AI Training Session",
    category: "Enable & Speak",
    unit: "per session",
    basePrice: "1400",
    description: "Hands-on training to get a team confidently using AI tools day to day.",
    goodDesc: "2-hour group training + prompt playbook handout.",
    betterDesc: "Good + role-specific breakout exercises and take-home prompt library.",
    bestDesc: "Better + 30-day office hours and proficiency follow-up assessment.",
    sortOrder: 10,
  },
  {
    name: "Keynote / Speaking Engagement",
    category: "Enable & Speak",
    unit: "per event",
    basePrice: "3500",
    description: "Conference, association, or company-event keynote on practical AI adoption.",
    goodDesc: "45-min keynote + Q&A.",
    betterDesc: "Good + customized industry examples, event promo clip, attendee resource page.",
    bestDesc: "Better + breakout workshop or executive roundtable added same day.",
    sortOrder: 11,
  },
  {
    name: "Panel / Guest Lecture",
    category: "Enable & Speak",
    unit: "per appearance",
    basePrice: "1200",
    description: "Panel participation, podcast guesting, or university guest lecture.",
    goodDesc: "Single appearance + prep call.",
    betterDesc: "Good + audience Q&A follow-up and shareable recap content.",
    bestDesc: "Better + companion article or mini-guide branded to the host organization.",
    sortOrder: 12,
  },
  {
    name: "Advisory Retainer",
    category: "Ongoing Partnership",
    unit: "per month",
    basePrice: "2800",
    description: "Fractional Chief AI Officer: ongoing strategy, vendor review, and decision support.",
    goodDesc: "Monthly strategy call + async Q&A (reasonable use).",
    betterDesc: "Good + bi-weekly calls, vendor/contract review, initiative prioritization.",
    bestDesc: "Better + on-call advisory, board meeting support, quarterly strategy review.",
    sortOrder: 13,
  },
  {
    name: "Managed AI Ops Retainer",
    category: "Ongoing Partnership",
    unit: "per month",
    basePrice: "6500",
    description: "MAB runs and improves your AI systems: monitoring, fixes, and continuous improvement.",
    goodDesc: "Monitoring + maintenance of existing automations, 48-hr response.",
    betterDesc: "Good + monthly optimization pass, 24-hr response, usage reporting.",
    bestDesc: "Better + continuous improvement roadmap, same-day response, quarterly ROI review.",
    sortOrder: 14,
  },
];

async function seed() {
  const db = getDb();
  console.log("Seeding rate factors and service catalog...");

  await db.delete(rateFactors);
  await db.delete(services);
  await db.insert(rateFactors).values(FACTORS);
  await db.insert(services).values(SERVICES);

  console.log(`Seeded ${FACTORS.length} rate factors, ${SERVICES.length} services.`);
  process.exit(0);
}

seed();
