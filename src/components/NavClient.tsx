"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

const HIDE_NAV_ROUTES = ["/", "/onboarding", "/recommendations"];

export default function NavClient() {
  const pathname = usePathname();
  const hide = HIDE_NAV_ROUTES.includes(pathname);
  if (hide) return null;
  return <BottomNav />;
}
