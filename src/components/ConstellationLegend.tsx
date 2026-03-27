"use client";

export default function ConstellationLegend() {
  return (
    <section
      aria-label="My collection legend"
      className="rounded-xl border border-gray-200 bg-white/85 px-3 py-2 backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-700">
        <LegendNode label="Bookmarked roots" shape="hex" color="#8DBE9F" />
        <LegendNode label="Recommendations" shape="circle" color="#B8CCE4" />
        <LegendLine label="Root links" color="rgba(141,190,159,0.65)" dotted={false} />
        <LegendLine label="Recommendation links" color="rgba(184,204,228,0.9)" dotted />
      </div>
    </section>
  );
}

function LegendNode({
  label,
  shape,
  color,
}: {
  label: string;
  shape: "hex" | "circle";
  color: string;
}) {
  const baseClass =
    "inline-flex h-3 w-3 shrink-0 border bg-white";

  return (
    <div className="flex items-center gap-1.5">
      <span aria-hidden className={`${baseClass} ${shape === "hex" ? "rounded-[3px]" : "rounded-full"}`} style={{ borderColor: color }} />
      <span>{label}</span>
    </div>
  );
}

function LegendLine({
  label,
  color,
  dotted,
}: {
  label: string;
  color: string;
  dotted: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-flex w-4 border-t"
        style={{ borderColor: color, borderStyle: dotted ? "dashed" : "solid", borderTopWidth: "2px" }}
      />
      <span>{label}</span>
    </div>
  );
}
