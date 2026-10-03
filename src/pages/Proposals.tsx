import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { fmtMoney } from "@/lib/pricing";
import { Button } from "@/components/ui/button";

interface SavedLine {
  serviceId: number;
  name: string;
  unit: string;
  good: number;
  better: number;
  best: number;
}

export default function Proposals() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const listQuery = trpc.proposals.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const utils = trpc.useUtils();
  const remove = trpc.proposals.remove.useMutation({
    onSuccess: () => utils.proposals.list.invalidate(),
  });
  const [openId, setOpenId] = useState<number | null>(null);

  if (authLoading) {
    return (
      <div className="scanline flex min-h-[60vh] items-center justify-center">
        <div className="label-caps animate-pulse text-tier-better">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="scanline flex min-h-[60vh] items-center justify-center px-4">
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <div className="label-caps text-muted-foreground">Sign in required</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Saved proposals are tied to your account and persist across sessions.
          </p>
          <Link to="/login" className="mt-4 inline-block">
            <Button className="min-h-[44px] font-mono2 text-xs">Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  const proposals = listQuery.data ?? [];

  return (
    <div className="scanline mx-auto max-w-[1100px] px-4 pb-16 sm:px-6">
      <div className="border-b border-border py-6">
        <div className="label-caps text-tier-better">Saved · persisted to your account</div>
        <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Proposals
        </h1>
      </div>

      {listQuery.isLoading ? (
        <div className="mt-10 text-center">
          <div className="label-caps animate-pulse text-muted-foreground">Loading proposals…</div>
        </div>
      ) : proposals.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border p-10 text-center">
          <div className="label-caps text-muted-foreground">No proposals yet</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Build a Good / Better / Best proposal in the Engine and save it here.
          </p>
          <Link to="/" className="mt-4 inline-block">
            <Button className="min-h-[44px] font-mono2 text-xs">Open engine</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {proposals.map((p) => {
            const totals = p.totals as { good: number; better: number; best: number };
            const lineItems = (p.lineItems as unknown as SavedLine[]) ?? [];
            const inputs = (p.inputs as Record<string, string>) ?? {};
            const open = openId === p.id;
            return (
              <div key={p.id} className="rounded-lg border border-border bg-card">
                <button
                  onClick={() => setOpenId(open ? null : p.id)}
                  className="flex min-h-[56px] w-full items-center gap-4 p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-display truncate text-sm font-semibold">{p.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      {p.clientName && <span>{p.clientName}</span>}
                      <span className="font-mono2">
                        {new Date(p.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>{lineItems.length} line items</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:gap-5">
                    {(["good", "better", "best"] as const).map((t) => (
                      <div key={t} className="hidden text-right sm:block">
                        <div className={`label-caps text-tier-${t}`}>{t}</div>
                        <div className="font-mono2 text-sm font-semibold tnum">
                          {fmtMoney(totals[t] ?? 0)}
                        </div>
                      </div>
                    ))}
                    <span className="font-mono2 text-muted-foreground">{open ? "−" : "+"}</span>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-border p-4">
                    <div className="label-caps text-muted-foreground">Rubric context</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(inputs).map(([k, v]) => (
                        <span
                          key={k}
                          className="rounded border border-border bg-secondary px-2 py-1 font-mono2 text-[11px] text-muted-foreground"
                        >
                          <span className="text-foreground/80">{k}:</span> {v}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full min-w-[560px] text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="label-caps p-2 text-left text-muted-foreground">
                              Service
                            </th>
                            <th className="label-caps p-2 text-right text-tier-good">Good</th>
                            <th className="label-caps p-2 text-right text-tier-better">Better</th>
                            <th className="label-caps p-2 text-right text-tier-best">Best</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {lineItems.map((l, i) => (
                            <tr key={i}>
                              <td className="p-2 text-[13px]">
                                {l.name}
                                <span className="ml-1 text-[11px] text-muted-foreground">
                                  {l.unit}
                                </span>
                              </td>
                              <td className="p-2 text-right font-mono2 tnum">{fmtMoney(l.good)}</td>
                              <td className="p-2 text-right font-mono2 tnum">{fmtMoney(l.better)}</td>
                              <td className="p-2 text-right font-mono2 tnum">{fmtMoney(l.best)}</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-border">
                            <td className="label-caps p-2 text-foreground">Total</td>
                            <td className="p-2 text-right font-mono2 font-semibold text-tier-good tnum">
                              {fmtMoney(totals.good)}
                            </td>
                            <td className="p-2 text-right font-mono2 font-semibold text-tier-better tnum">
                              {fmtMoney(totals.better)}
                            </td>
                            <td className="p-2 text-right font-mono2 font-semibold text-tier-best tnum">
                              {fmtMoney(totals.best)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-[36px] font-mono2 text-xs text-destructive hover:text-destructive"
                        disabled={remove.isPending}
                        onClick={() => remove.mutate({ id: p.id })}
                      >
                        {remove.isPending ? "Deleting…" : "Delete proposal"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
