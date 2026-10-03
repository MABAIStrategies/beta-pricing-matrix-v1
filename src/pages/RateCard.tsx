import { trpc } from "@/providers/trpc";
import { FILTER_CATEGORIES, fmtMoney } from "@/lib/pricing";

export default function RateCard() {
  const factorsQuery = trpc.catalog.rateFactors.useQuery();
  const servicesQuery = trpc.catalog.services.useQuery();

  const factors = factorsQuery.data ?? [];
  const services = servicesQuery.data ?? [];

  if (factorsQuery.isLoading || servicesQuery.isLoading) {
    return (
      <div className="scanline flex min-h-[60vh] items-center justify-center">
        <div className="label-caps animate-pulse text-tier-better">Loading rate card…</div>
      </div>
    );
  }

  return (
    <div className="scanline mx-auto max-w-[1400px] px-4 pb-16 sm:px-6">
      <div className="border-b border-border py-6">
        <div className="label-caps text-tier-better">Reference · full rubric matrix</div>
        <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Rate Card
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every multiplier in the pricing rubric and every baseline service rate. 1.00 is the
          baseline mid-Atlantic market rate (DE / PA / NJ / NY SMB &amp; mid-market AI consulting).
        </p>
      </div>

      {/* Multiplier matrix */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {FILTER_CATEGORIES.map((cat) => {
          const opts = factors.filter((f) => f.category === cat.key);
          return (
            <section key={cat.key} className="rounded-lg border border-border bg-card">
              <header className="border-b border-border p-4">
                <h2 className="font-display text-base font-semibold">{cat.label}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{cat.hint}</p>
              </header>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border/60">
                  {opts.map((o) => {
                    const m = parseFloat(o.multiplier);
                    return (
                      <tr key={o.id}>
                        <td className="p-3">
                          <div className="text-[13px] font-medium">{o.label}</div>
                          {o.detail && (
                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                              {o.detail}
                            </div>
                          )}
                        </td>
                        <td
                          className={`p-3 text-right font-mono2 text-sm font-semibold tnum ${
                            m > 1
                              ? "text-tier-best"
                              : m < 1
                                ? "text-tier-good"
                                : "text-muted-foreground"
                          }`}
                        >
                          ×{m.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>

      {/* Service baseline rates */}
      <section className="mt-8 rounded-lg border border-border bg-card">
        <header className="border-b border-border p-4">
          <h2 className="font-display text-base font-semibold">Baseline Service Rates</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pre-multiplier rates. Good = 0.85×, Better = 1.00×, Best = 1.35× after rubric
            adjustment.
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="label-caps p-3 text-left text-muted-foreground">Service</th>
                <th className="label-caps p-3 text-left text-muted-foreground">Category</th>
                <th className="label-caps p-3 text-left text-muted-foreground">Unit</th>
                <th className="label-caps p-3 text-right text-muted-foreground">Baseline</th>
                <th className="label-caps p-3 text-right text-tier-good">Good</th>
                <th className="label-caps p-3 text-right text-tier-better">Better</th>
                <th className="label-caps p-3 text-right text-tier-best">Best</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {services.map((s) => {
                const base = parseFloat(s.basePrice);
                const step = s.unit === "per hour" ? 5 : base < 1500 ? 25 : 50;
                const r = (v: number) => Math.round(v / step) * step;
                return (
                  <tr key={s.id}>
                    <td className="p-3 text-[13px] font-medium">{s.name}</td>
                    <td className="p-3 text-xs text-muted-foreground">{s.category}</td>
                    <td className="p-3 text-xs text-muted-foreground">{s.unit}</td>
                    <td className="p-3 text-right font-mono2 tnum">{fmtMoney(base)}</td>
                    <td className="p-3 text-right font-mono2 text-tier-good tnum">
                      {fmtMoney(r(base * 0.85))}
                    </td>
                    <td className="p-3 text-right font-mono2 text-tier-better tnum">
                      {fmtMoney(r(base))}
                    </td>
                    <td className="p-3 text-right font-mono2 text-tier-best tnum">
                      {fmtMoney(r(base * 1.35))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
