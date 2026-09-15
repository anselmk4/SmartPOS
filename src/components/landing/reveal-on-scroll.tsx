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
        return isVisible
          ? "translate-y-0 opacity-100 scale-100 blur-0"
          : "translate-y-14 opacity-0 scale-[0.96] blur-[6px]";
      case "down":
        return isVisible
          ? "translate-y-0 opacity-100 scale-100 blur-0"
          : "-translate-y-14 opacity-0 scale-[0.96] blur-[6px]";
      case "left":
        return isVisible
          ? "translate-x-0 opacity-100 blur-0"
          : "translate-x-14 opacity-0 blur-[6px]";
      case "right":
        return isVisible
          ? "translate-x-0 opacity-100 blur-0"
          : "-translate-x-14 opacity-0 blur-[6px]";
      case "none":
        return isVisible
          ? "opacity-100 scale-100 blur-0"
          : "opacity-0 scale-95 blur-[6px]";
      default:
        return isVisible
          ? "translate-y-0 opacity-100 scale-100 blur-0"
          : "translate-y-14 opacity-0 scale-[0.96] blur-[6px]";
    }
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: "850ms",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        willChange: "transform, opacity, filter",
      }}
      className={`transition-all duration-850 ease-out transform-gpu ${getDirectionClasses()} ${className}`}
    >
      {children}
    </div>
  );
}
