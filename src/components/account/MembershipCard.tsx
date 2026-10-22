import { Award, Coins, Gift, Sparkles } from "lucide-react";
import type { User } from "@/lib/auth";
import { useBrand } from "@/lib/brand";
import { formatINR } from "@/lib/money";

const tiers = { new: "New", regular: "Regular", vip: "VIP", inactive: "Inactive" };

export function MembershipCard({ user }: { user: User }) {
  const loyalty = user.loyalty;
  const vip = user.segment === "vip";
  const tier = tiers[user.segment];
  const { name } = useBrand();

  return (
    <aside aria-labelledby="membership-title" className="relative isolate mt-6 overflow-hidden rounded-2xl border border-[#c69b52]/40 bg-[linear-gradient(115deg,#211c1b_0%,#302022_65%,#44292b_100%)] px-4 py-3 text-[#fff5e5] shadow-[0_12px_35px_-18px_rgba(47,25,22,0.65)] sm:px-4 sm:py-3">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border border-[#d8ad66]/10 bg-[radial-gradient(circle,rgba(216,173,102,0.12),transparent_70%)]" />
      <h2 id="membership-title" className="sr-only">Your membership</h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#e8bb6b]/15 bg-[#c89538]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#e8bb6b]">
          <Award aria-hidden="true" className="h-3.5 w-3.5" /> {name ? `${name} Rewards Club` : "Rewards Club"}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {loyalty && <p aria-label="Loyalty balance" className="text-lg font-semibold tabular-nums text-[#f2d7a5]">{loyalty.points.toLocaleString("en-IN")} <span className="text-xs font-normal text-[#d6c4be]">points</span></p>}
        <span aria-label={`Customer segment: ${tier}`} className="rounded-full border border-[#e8bb6b]/25 px-3 py-1 text-xs font-medium text-[#f2d7a5]">{tier}</span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-xl font-medium tracking-tight">{tier} {vip ? "Tier Member" : "Member"}</h3>
        {loyalty && <div className="flex flex-wrap gap-2 text-[10px] text-[#f0e2dc]">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-1"><Coins aria-hidden="true" className="h-3 w-3 text-[#e8bb6b]" /> Earn {loyalty.points_per_100} points per ₹100</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-1"><Gift aria-hidden="true" className="h-3 w-3 text-[#e8bb6b]" /> Redeem at checkout</span>
        </div>}
      </div>

      {loyalty && <>
        <div className="mt-2 border-t border-white/10 pt-2">
          {vip ? <div className="flex items-start gap-3">
            <Sparkles aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#e8bb6b]" />
            <div><p className="font-medium text-[#f2d7a5]">You&apos;ve reached VIP, our highest tier.</p><p className="mt-1 text-xs leading-relaxed text-[#d6c4be]">Keep earning and redeeming points on your next favourites.</p></div>
          </div> : <>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <p className="font-medium">Progress to VIP</p>
              <p className="tabular-nums text-[#f2d7a5]">{Math.max(0, loyalty.points).toLocaleString("en-IN")} <span className="text-[#d6c4be]">/ {loyalty.vip_min_points.toLocaleString("en-IN")} points</span></p>
            </div>
            <progress aria-label="Progress to VIP" className="block h-2 w-full overflow-hidden rounded-full border-0 bg-white/15 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-[linear-gradient(90deg,#a62f40,#eba92f)] [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-white/15 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-[linear-gradient(90deg,#a62f40,#eba92f)]" max={Math.max(1, loyalty.vip_min_points)} value={Math.max(0, Math.min(loyalty.points, loyalty.vip_min_points))} />
            <p className="mt-1.5 text-xs leading-snug text-[#d6c4be]">
              {loyalty.spend_to_vip_minor != null ? <>Spend <strong className="font-semibold text-[#fff5e5]">{formatINR(loyalty.spend_to_vip_minor / 100)}</strong> more to reach VIP. </> : <>Purchase points are currently disabled; bonus points can still move you towards VIP. </>}
              <strong className="font-medium text-[#f2d7a5]">{loyalty.points_to_vip.toLocaleString("en-IN")} more points</strong> to your next milestone.
            </p>
          </>}
        </div>
        <details className="mt-1.5 text-[10px] leading-snug text-[#bfa9a1]">
          <summary className="w-fit cursor-pointer hover:text-[#f2d7a5]">How points work</summary>
          <p className="mt-1">Cancellations, refunds and point redemptions can change your progress. Your membership tier updates with your points and order history.</p>
        </details>
      </>}
    </aside>
  );
}
