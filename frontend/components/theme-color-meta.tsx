"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (metaThemeColor) {
      const color = resolvedTheme === "dark" ? "#0a0a0a" : "#ffffff";
      metaThemeColor.setAttribute("content", color);
    }
  }, [resolvedTheme]);

  return null;
}
