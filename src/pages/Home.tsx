import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  FILTER_CATEGORIES,
  TIERS,
  buildStack,
  fmtMoney,
  indexVerdict,
  quoteService,
  tierTotals,
  type FilterKey,
  type Selections,
} from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TIER_STYLES: Record<string, { border: string; text: string; dot: string }> = {
  good: { border: "border-tier-good", text: "text-tier-good", dot: "bg-tier-good" },
  better: { border: "border-tier-better", text: "text-tier-better", dot: "bg-tier-better" },
  best: { border: "border-tier-best", text: "text-tier-best", dot: "bg-tier-best" },
};

function pickDefaults(factors: { id: number; category: string; label: string }[]): Selections {
  const preferred: Record<FilterKey, string> = {
    location: "Delaware — Wilmington metro",
    size: "51–200 employees",
    industry: "Other / general business",
    title: "VP / Director",
    urgency: "Standard timeline",
    relationship: "New client",
    complexity: "Standard",
  };
  const sel = {} as Selections;
  for (const cat of FILTER_CATEGORIES) {
    const opts = factors.filter((f) => f.category === cat.key);
    const match = opts.find((o) => o.label === preferred[cat.key]) ?? opts[0];
    if (match) sel[cat.key] = String(match.id);
  }
  return sel;
}

export default function Home() {
  const factorsQuery = trpc.catalog.rateFactors.useQuery();
  const servicesQuery = trpc.catalog.services.useQuery();
  const { isAuthenticated } = useAuth();

  const [selections, setSelections] = useState<Selections | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set([1, 5, 13]));
  const [proposalName, setProposalName] = useState("");
  const [clientName, setClientName] = useState("");
  const [saved, setSaved] = useState(false);

  const factors = factorsQuery.data ?? [];
  const services = servicesQuery.data ?? [];

  useEffect(() => {
    if (!selections && factors.length > 0) setSelections(pickDefaults(factors));
  }, [factors, selections]);

  const { stack, combined } = useMemo(
    () => (selections ? buildStack(factors, selections) : { stack: [], combined: 1 }),
    [factors, selections],
  );

  const lines = useMemo(
    () => services.filter((s) => selectedIds.has(s.id)).map((s) => quoteService(s, combined)),
    [services, selectedIds, combined],
  );
  const totals = useMemo(() => tierTotals(lines), [lines]);

  const utils = trpc.useUtils();
  const createProposal = trpc.proposals.create.useMutation({
    onSuccess: async () => {
      setSaved(true);
      setProposalName("");
      await utils.proposals.list.invalidate();
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const toggleService = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const saveProposal = () => {
    if (!selections) return;
    const inputMap: Record<string, string> = {};
    for (const e of stack) inputMap[e.key] = e.optionLabel;
    createProposal.mutate({
      name: proposalName.trim() || `Proposal — ${new Date().toLocaleDateString("en-US")}`,
      clientName: clientName.trim() || undefined,
      inputs: inputMap,
      lineItems: lines.map((l) => ({
        serviceId: l.service.id,
        name: l.service.name,
        unit: l.service.unit,
        good: l.good,
        better: l.better,
        best: l.best,
      })),
      totals,
    });
  };

  const analysisPanel = (
    <div className="space-y-4">
      {/* Multiplier stack */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="label-caps text-foreground">Market Index</span>
          <span className="font-mono2 text-lg font-bold text-tier-better tnum">
            ×{combined.toFixed(2)}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {indexVerdict(combined)}
        </p>
        <div className="mt-3 divide-y divide-border/60 border-t border-border">
          {stack.map((e) => (
            <div key={e.key} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <div className="label-caps text-muted-foreground">{e.label}</div>
                <div className="truncate text-xs text-foreground">{e.optionLabel}</div>
              </div>
              <span
                className={`font-mono2 shrink-0 text-xs tnum ${
                  e.multiplier > 1
                    ? "text-tier-best"
                    : e.multiplier < 1
                      ? "text-tier-good"
                      : "text-muted-foreground"
                }`}
              >
                ×{e.multiplier.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Save proposal */}
      <div className="rounded-lg border border-border bg-card p-4">
        <span className="label-caps text-foreground">Save Proposal</span>
        <div className="mt-3 space-y-2">
          <Input
            value={proposalName}
            onChange={(e) => setProposalName(e.target.value)}
            placeholder="Proposal name"
            className="h-10 bg-secondary/50 font-mono2 text-xs"
          />
          <Input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client name (optional)"
            className="h-10 bg-secondary/50 font-mono2 text-xs"
          />
          {isAuthenticated ? (
            <Button
              onClick={saveProposal}
              disabled={lines.length === 0 || createProposal.isPending}
              className="min-h-[44px] w-full font-mono2 text-xs"
            >
              {createProposal.isPending
                ? "Saving…"
                : saved
                  ? "Saved to proposals"
                  : "Save proposal"}
            </Button>
          ) : (
            <Link to="/login" className="block">
              <Button variant="outline" className="min-h-[44px] w-full font-mono2 text-xs">
                Sign in to save proposals
              </Button>
            </Link>
          )}
          {lines.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              Select at least one service to save.
            </p>
          )}
        </div>
      </div>

      {/* Methodology note */}
      <div className="rounded-lg border border-border bg-card p-4">
        <span className="label-caps text-foreground">How it prices</span>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Each service carries a baseline mid-Atlantic rate. The rubric multiplies that base
          through every context factor (location × size × industry × title × urgency ×
          relationship × complexity), then scopes the result into three tiers: Good at 0.85×
          (lean scope), Better at 1.00× (market rate), Best at 1.35× (premium scope).
        </p>
      </div>
    </div>
  );

  if (factorsQuery.isLoading || servicesQuery.isLoading) {
    return (
      <div className="scanline flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="label-caps animate-pulse text-tier-better">Loading market rubric…</div>
          <div className="mt-2 font-mono2 text-xs text-muted-foreground">
            49 factors · 14 services
          </div>
        </div>
      </div>
    );
  }

  if (factorsQuery.error || servicesQuery.error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <div className="label-caps text-destructive">Rubric unavailable</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Could not load rate factors. Refresh to retry.
          </p>
        </div>
      </div>
    );
  }

  const servicesByCategory = services.reduce<Record<string, typeof services>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const filterRail = selections && (
    <div className="space-y-5">
      {FILTER_CATEGORIES.map((cat) => {
        const opts = factors.filter((f) => f.category === cat.key);
        const active = selections[cat.key];
        return (
          <div key={cat.key}>
            <div className="label-caps text-muted-foreground">{cat.label}</div>
            <div className="mt-1.5 space-y-0.5">
              {opts.map((o) => {
                const isActive = active === String(o.id);
                const m = parseFloat(o.multiplier);
                return (
                  <button
                    key={o.id}
                    onClick={() => setSelections({ ...selections, [cat.key]: String(o.id) })}
                    title={o.detail ?? undefined}
                    className={`group flex min-h-[36px] w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] transition-colors ${
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                        isActive ? "bg-tier-better" : "bg-border group-hover:bg-muted-foreground"
                      }`}
                    />
                    <span className="flex-1 leading-tight">{o.label}</span>
                    <span
                      className={`font-mono2 text-[11px] tnum ${
                        m > 1
                          ? "text-tier-best"
                          : m < 1
                            ? "text-tier-good"
                            : "text-muted-foreground"
                      }`}
                    >
                      ×{m.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="scanline mx-auto max-w-[1600px] px-4 pb-16 sm:px-6">
      {/* Page intro */}
      <div className="border-b border-border py-6">
        <div className="label-caps text-tier-better">Live rubric · mid-Atlantic baseline</div>
        <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Build the proposal. Let the market set the price.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Set the client context on the left, pick services à la carte in the center, and the
          engine multiplies baseline rates through the rubric to produce a Good / Better / Best
          proposal.
        </p>
      </div>

      {/* Mobile filters (collapsible) */}
      <details className="mt-4 rounded-lg border border-border bg-card lg:hidden">
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between px-4">
          <span className="label-caps text-foreground">Client context filters</span>
          <span className="font-mono2 text-xs text-tier-better tnum">×{combined.toFixed(2)}</span>
        </summary>
        <div className="border-t border-border p-4">{filterRail}</div>
      </details>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_380px]">
        {/* Left rail — filters */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="label-caps text-foreground">Client Context</span>
              <span className="font-mono2 text-xs text-tier-better tnum">×{combined.toFixed(2)}</span>
            </div>
            {filterRail}
          </div>
        </aside>

        {/* Center — catalog + proposal */}
        <main className="min-w-0 space-y-8">
          {/* À la carte catalog */}
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold">Products &amp; Services</h2>
              <span className="label-caps text-muted-foreground">{selectedIds.size} selected</span>
            </div>
            <div className="space-y-5">
              {Object.entries(servicesByCategory).map(([category, items]) => (
                <div key={category}>
                  <div className="label-caps mb-2 text-muted-foreground">{category}</div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {items.map((s) => {
                      const active = selectedIds.has(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleService(s.id)}
                          aria-pressed={active}
                          className={`min-h-[44px] rounded-lg border p-3 text-left transition-colors ${
                            active
                              ? "border-tier-better bg-secondary"
                              : "border-border bg-card hover:border-muted-foreground/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium leading-snug">{s.name}</span>
                            <span
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                                active
                                  ? "border-tier-better bg-tier-better"
                                  : "border-muted-foreground/50"
                              }`}
                            >
                              {active && (
                                <svg viewBox="0 0 12 12" className="h-3 w-3 text-background">
                                  <path
                                    d="M2 6l3 3 5-6"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  />
                                </svg>
                              )}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {s.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="font-mono2 text-xs text-foreground tnum">
                              {fmtMoney(parseFloat(s.basePrice))}
                            </span>
                            <span className="label-caps text-muted-foreground">
                              {s.unit} · baseline
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Good / Better / Best proposal */}
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold">Proposal Output</h2>
              <span className="label-caps text-muted-foreground">à la carte · 3 tiers</span>
            </div>

            {lines.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-10 text-center">
                <div className="label-caps text-muted-foreground">No services selected</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Select one or more products or services above and the Good / Better / Best
                  proposal will generate here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-3">
                {TIERS.map((tier) => {
                  const style = TIER_STYLES[tier.key];
                  const total = totals[tier.key as keyof typeof totals];
                  return (
                    <div
                      key={tier.key}
                      className={`flex flex-col rounded-lg border-2 bg-card ${style.border} ${
                        tier.key === "better" ? "md:-mt-2" : ""
                      }`}
                    >
                      <div className="border-b border-border p-4">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                          <span className={`font-display text-base font-semibold ${style.text}`}>
                            {tier.label}
                          </span>
                          {tier.key === "better" && (
                            <span className="label-caps ml-auto rounded bg-tier-better px-1.5 py-0.5 text-background">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{tier.tagline}</p>
                      </div>
                      <div className="flex-1 divide-y divide-border/60">
                        {lines.map((l) => (
                          <div key={l.service.id} className="p-3">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-[13px] font-medium leading-snug">
                                {l.service.name}
                              </span>
                              <span className="font-mono2 text-sm font-semibold tnum">
                                {fmtMoney(l[tier.key as "good" | "better" | "best"])}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                              {tier.key === "good"
                                ? l.service.goodDesc
                                : tier.key === "better"
                                  ? l.service.betterDesc
                                  : l.service.bestDesc}
                            </p>
                            <div className="label-caps mt-1 text-muted-foreground/70">
                              {l.service.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className={`border-t p-4 ${style.border}`}>
                        <div className="label-caps text-muted-foreground">Tier total</div>
                        <div className={`font-mono2 mt-1 text-2xl font-bold tnum ${style.text}`}>
                          {fmtMoney(total)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Analysis + save below content on smaller screens */}
          <div className="xl:hidden">{analysisPanel}</div>
        </main>

        {/* Right rail — analysis */}
        <aside className="hidden xl:block">
          <div className="sticky top-20">{analysisPanel}</div>
        </aside>
      </div>
    </div>
  );
}
