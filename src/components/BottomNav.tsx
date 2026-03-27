"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/explore", label: "Home", icon: HomeIcon },
  { href: "/passport", label: "Passport", icon: StampIcon },
  { href: "/my-collection", label: "My Collection", icon: ConstellationIcon, aliases: ["/constellation"] },
  { href: "/visits", label: "Visits", icon: VisitsIcon },
  { href: "/wrapped", label: "Wrapped", icon: SparklesIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="flex items-center justify-around max-w-md mx-auto h-16">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href) || Boolean(tab.aliases?.some((alias) => pathname.startsWith(alias)));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "text-[var(--moma-red)]"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <tab.icon active={isActive} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--moma-red)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function VisitsIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--moma-red)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M7 20V4" />
    </svg>
  );
}

function SparklesIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--moma-red)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function StampIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--moma-red)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v16H4z" />
      <path d="M4 8h2M4 12h2M4 16h2M18 8h2M18 12h2M18 16h2M8 4v2M12 4v2M16 4v2M8 18v2M12 18v2M16 18v2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ConstellationIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--moma-red)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="6" r="2" />
      <circle cx="18" cy="5" r="2" />
      <circle cx="8" cy="17" r="2.2" />
      <circle cx="19" cy="15" r="2" />
      <path d="M6.5 7.5l10-1.5M6.3 7.5l1.8 7.3M10 16.5l7.1-1" />
    </svg>
  );
}
