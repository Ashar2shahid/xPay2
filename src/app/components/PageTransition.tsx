"use client";

import React, { useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const previousPathname = useRef<string>("");

  useGSAP(() => {
    // Only trigger animation if pathname actually changed
    if (
      pathname &&
      previousPathname.current &&
      previousPathname.current !== pathname
    ) {
      animatePageTransition();
    }
    previousPathname.current = pathname || "";
  }, [pathname]);

  const animatePageTransition = () => {
    if (!overlayRef.current || !contentRef.current) return;

    const tl = gsap.timeline();

    // Screen wipe in - overlay slides in from left
    tl.set(overlayRef.current, {
      x: "-100%",
      display: "block",
    })
      .to(overlayRef.current, {
        x: "0%",
        duration: 0.6,
        ease: "power2.inOut",
      })
      // Brief pause when screen is covered
      .to({}, { duration: 0.1 })
      // Screen wipe out - overlay slides out to right
      .to(overlayRef.current, {
        x: "100%",
        duration: 0.6,
        ease: "power2.inOut",
      })
      // Hide overlay after animation
      .set(overlayRef.current, {
        display: "none",
      });

    // Content fade animation
    tl.to(
      contentRef.current,
      {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
      },
      0
    ).to(
      contentRef.current,
      {
        opacity: 1,
        duration: 0.4,
        ease: "power2.in",
      },
      0.8
    );
  };

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Screen wipe overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-gradient-to-r from-primary via-primary-600 to-primary-700 hidden"
        style={{
          background:
            "linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>

      {/* Page content */}
      <div ref={contentRef} className="relative z-10">
        {children}
      </div>
    </div>
  );
}
