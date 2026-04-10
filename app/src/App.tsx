import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Landscape } from "./sections/Landscape";
import { Position } from "./sections/Position";
import { Geography } from "./sections/Geography";
import { Creative } from "./sections/Creative";
import { Cadence } from "./sections/Cadence";
import { Content } from "./sections/Content";
import { Discovery } from "./sections/Discovery";
import { Takeaways } from "./sections/Takeaways";
import { report } from "./lib/data";

export default function App() {
  return (
    <div className="min-h-screen">
      <Nav />

      {/* Hero — Ravineo product with client brand accent */}
      <header className="relative overflow-hidden bg-brand-900 px-6 pb-14 pt-20 text-white">
        {/* Thin client-gold top accent line */}
        <div className="absolute inset-x-0 top-[49px] h-px bg-client-gold/30" />

        <div className="mx-auto max-w-[1280px]">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-brand-600/40 bg-brand-700/30 px-3 py-0.5 text-xs font-medium text-brand-100">
              EU Luxury · Snapchat
            </span>
            <span className="rounded-full border border-brand-600/40 bg-brand-700/30 px-3 py-0.5 text-xs text-brand-100/70">
              {new Date(report.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          {/* Client brand name in serif — the one custom element */}
          <h1 className="mt-6 font-display text-5xl font-bold uppercase tracking-[0.15em] md:text-6xl lg:text-7xl">
            {report.brand}
          </h1>
          <div className="mt-3 h-px w-20 bg-client-gold/60" />

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-gray-300">
            Your competitive position on Snapchat in Europe — who's outspending
            you, where you're missing, and what to do about it.
          </p>

          {/* Highlight strip */}
          <div className="mt-8 flex flex-wrap gap-6 border-t border-white/10 pt-6 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-300/50">Rank</p>
              <p className="text-xl font-bold">#{report.position.dior_rank} <span className="text-sm font-normal text-gray-300/70">of {report.position.brands.length}</span></p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-300/50">Impressions</p>
              <p className="text-xl font-bold">{(report.position.brands.find(b => b.brand === report.brand)?.impressions ?? 0) >= 1e6 ? `${((report.position.brands.find(b => b.brand === report.brand)?.impressions ?? 0) / 1e6).toFixed(1)}M` : '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-300/50">Competitors</p>
              <p className="text-xl font-bold">{report.position.brands.length - 1}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-300/50">Countries</p>
              <p className="text-xl font-bold">{report.position.brands.find(b => b.brand === report.brand)?.countries ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-brand-700/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-72 rounded-full bg-brand-600/10 blur-3xl" />
      </header>

      <main className="mx-auto max-w-[1280px] px-6">
        <Landscape />
        <hr className="border-gray-200" />
        <Position />
        <hr className="border-gray-200" />
        <Geography />
        <hr className="border-gray-200" />
        <Creative />
        <hr className="border-gray-200" />
        <Cadence />
        <hr className="border-gray-200" />
        <Content />
        <hr className="border-gray-200" />
        <Discovery />
        <hr className="border-gray-200" />
        <Takeaways />
      </main>

      <Footer />
    </div>
  );
}
