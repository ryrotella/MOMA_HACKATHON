"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

const HIDE_NAV_ROUTES = ["/", "/onboarding", "/recommendations"];

export default function NavClient() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setIsMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  if (!isMounted) return null;

  const hide = HIDE_NAV_ROUTES.includes(pathname);
  if (hide) return null;
  return <BottomNav />;
}
