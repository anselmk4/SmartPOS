"use client";

import React, { useEffect, useRef, useState } from "react";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export default function RevealOnScroll({
  children,
  className = "",
  delay = 0,
  threshold = 0.15,
  direction = "up",
}: RevealOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If IntersectionObserver is not supported, reveal immediately
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const getDirectionClasses = () => {
    switch (direction) {
      case "up":
        return isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-[0.98]";
      case "down":
        return isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-8 opacity-0 scale-[0.98]";
      case "left":
        return isVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0";
      case "right":
        return isVisible ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0";
      case "none":
        return isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95";
      default:
        return isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0";
    }
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: "750ms",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all ${getDirectionClasses()} ${className}`}
    >
      {children}
    </div>
  );
}
