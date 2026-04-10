import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "landscape", label: "Market" },
  { id: "position", label: "Position" },
  { id: "geography", label: "Geography" },
  { id: "creative", label: "Creative" },
  { id: "cadence", label: "Cadence" },
  { id: "content", label: "Content" },
  { id: "discovery", label: "Discovery" },
  { id: "takeaways", label: "Actions" },
];

export function Nav() {
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };

    const observers: IntersectionObserver[] = [];
    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (!el) continue;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(section.id);
        },
        { rootMargin: "-40% 0px -55% 0px" },
      );
      obs.observe(el);
      observers.push(obs);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-brand-900">
      {/* Progress bar */}
      <div className="h-0.5 bg-brand-900">
        <div
          className="h-full bg-brand-600 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex h-12 items-center gap-6 px-6">
        <span className="text-sm font-semibold tracking-wide text-white">
          RAVINEO
        </span>
        <span className="text-brand-600">|</span>
        <span className="hidden text-sm text-gray-300 sm:inline">
          Dior Report
        </span>

        <div className="ml-auto hidden items-center gap-0.5 lg:flex">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`rounded px-2.5 py-1 text-xs transition ${
                activeSection === s.id
                  ? "bg-white/15 font-medium text-white"
                  : "text-gray-300/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
