"use client";

import { useEffect, useState } from "react";

export function useMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if mobile device using user agent
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent,
        );
      setIsMobile(isMobileDevice);
    };

    checkMobile();

    // Also listen for resize events (for testing in dev tools)
    const handleResize = () => {
      // Only update if window width changes significantly
      if (window.innerWidth < 768) {
        setIsMobile(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}
