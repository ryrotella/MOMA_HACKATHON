"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useStore } from "@/store/useStore";
import { humanizeReason, type ConstellationNode } from "@/lib/constellation";

interface Props {
  selectedNode: ConstellationNode | null;
  relatedNodes: ConstellationNode[];
  onSelectRelatedNode: (node: ConstellationNode) => void;
  onClose: () => void;
}

export default function ConstellationDetailPanel({
  selectedNode,
  relatedNodes,
  onSelectRelatedNode,
  onClose,
}: Props) {
  const reduceMotion = useReducedMotion();
  const { savedArtworks, toggleSavedArtwork } = useStore();

  return (
    <AnimatePresence>
      {selectedNode && (
        <motion.section
          key={selectedNode.id}
          role="dialog"
          aria-label="Artwork details"
          aria-modal="false"
          className="absolute bottom-0 right-0 top-0 z-30 w-full max-w-md overflow-y-auto overscroll-contain border-l border-white/20 bg-white text-[var(--moma-black)] shadow-[-12px_0_36px_rgba(0,0,0,0.35)]"
          initial={{ x: "100%", opacity: 0.92 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0.92 }}
          drag={reduceMotion ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x > 90 || info.velocity.x > 700) {
              onClose();
            }
          }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", damping: 30, stiffness: 320 }}
        >
          <div className="pb-8">
            <div className="mb-3 flex items-start justify-between gap-2 px-4 pt-4">
              <h2 className="text-base font-black leading-tight">{selectedNode.label}</h2>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--moma-red)]"
                aria-label="Close detail panel"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {(selectedNode.fullImageUrl || selectedNode.thumbnailUrl) && (
              <div className="mb-4">
                <div className="h-56 w-full overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedNode.fullImageUrl || selectedNode.thumbnailUrl}
                    alt={selectedNode.label}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 px-4">
              <p className="text-base font-semibold text-gray-800">{selectedNode.artist || "Unknown artist"}</p>
              <p className="text-sm text-gray-500">{selectedNode.date || "Date unavailable"}</p>
              {selectedNode.classification && (
                <p className="text-sm text-gray-600">{selectedNode.classification}</p>
              )}
              {selectedNode.department && <p className="text-sm text-gray-500">{selectedNode.department}</p>}
            </div>

            <div className="mb-4 mt-4 flex flex-wrap gap-2 px-4">
              <Chip label={selectedNode.onView ? "On view" : "Archive"} />
              {selectedNode.reasons?.map((reason) => (
                <Chip key={reason} label={humanizeReason(reason)} />
              ))}
            </div>

            {selectedNode.relatedToLabel && (
              <div className="mx-4 mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                <p className="mt-1">
                  <span className="font-semibold">{selectedNode.label}</span>
                  {" is "}
                  {toRelationSentence(selectedNode.reasons)}{" "}
                  <span className="font-semibold">{selectedNode.relatedToLabel}</span>.
                </p>
              </div>
            )}

            {relatedNodes.length > 0 && (
              <div className="mx-4 mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Related art
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {relatedNodes.slice(0, 8).map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => onSelectRelatedNode(node)}
                      className="overflow-hidden rounded-xl border border-gray-300 bg-white text-left text-[11px] leading-tight text-gray-700 hover:border-gray-400 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--moma-red)]"
                    >
                      {node.thumbnailUrl || node.fullImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={node.thumbnailUrl || node.fullImageUrl}
                          alt={node.label}
                          className="h-16 w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-16 w-full place-items-center bg-gray-100 text-[10px] font-medium text-gray-500">
                          No image
                        </div>
                      )}
                      <div className="h-16 px-2.5 py-2">
                        <p className="line-clamp-2 font-semibold text-[var(--moma-black)]">{node.label}</p>
                        <p className="mt-0.5 line-clamp-1 text-gray-500">{node.artist || "Unknown artist"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 px-4">
              {selectedNode.curatedId && (
                <button
                  onClick={() => toggleSavedArtwork(selectedNode.curatedId!)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                    savedArtworks.includes(selectedNode.curatedId!)
                      ? "bg-[var(--moma-red)] text-white"
                      : "border border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  {savedArtworks.includes(selectedNode.curatedId!) ? "Unsave artwork" : "Save artwork"}
                </button>
              )}
              {selectedNode.momaUrl && (
                <a
                  href={selectedNode.momaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-gray-400"
                >
                  View on MoMA.org
                </a>
              )}
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function toRelationSentence(reasons?: string[]): string {
  const relationFragments = (reasons ?? [])
    .slice(0, 2)
    .map((reason, index) => toRelationFragment(reason, index));
  return relationFragments.length ? `${relationFragments.join(" and ")} as` : "closely related to";
}

function toRelationFragment(reason: string, index: number): string {
  switch (reason) {
    case "same_artist":
      return index === 0 ? "by the same artist" : "from the same artist";
    case "style_overlap":
      return index === 0 ? "in the same style" : "in a similar style";
    case "same_department":
      return index === 0 ? "from the same collection area" : "from a similar collection area";
    case "era_close":
    case "era_related":
      return index === 0 ? "from the same era" : "from a similar era";
    default: {
      const label = humanizeReason(reason);
      return index === 0 ? `with a similar ${label}` : `with related ${label}`;
    }
  }
}

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium capitalize text-gray-700">
      {label}
    </span>
  );
}
