"use client";

export default function ConstellationLegend() {
  return (
    <section
      aria-label="Constellation legend"
      className="rounded-xl border border-gray-200 bg-white/85 px-3 py-2 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 text-xs text-gray-700">
        <LegendItem label="Bookmarked anchors" borderClass="border-[var(--moma-red)] ring-1 ring-[var(--moma-red)]/50" />
        <LegendItem label="Related archive" borderClass="border-gray-500" />
      </div>
    </section>
  );
}

function LegendItem({ label, borderClass }: { label: string; borderClass: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`inline-flex h-3 w-3 rounded-full border ${borderClass} bg-white`}
      />
      <span>{label}</span>
    </div>
  );
}
