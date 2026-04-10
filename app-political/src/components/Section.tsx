import { useRef, useEffect, useState, type ReactNode } from "react";

interface Props {
  id: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, title, subtitle, children, className }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      className={`scroll-mt-20 py-16 transition-all duration-700 ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className ?? ""}`}
    >
      <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-brand-600">
        {subtitle}
      </p>
      <h2 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}
