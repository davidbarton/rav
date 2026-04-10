import { AnimatedCounter } from "./AnimatedCounter";

interface Props {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  formatter?: (n: number) => string;
  detail?: string;
}

export function KpiCard({ label, value, prefix, suffix, formatter, detail }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
        <AnimatedCounter
          end={value}
          prefix={prefix}
          suffix={suffix}
          formatter={formatter}
        />
      </p>
      {detail && (
        <p className="mt-1 text-xs text-gray-600">{detail}</p>
      )}
    </div>
  );
}
