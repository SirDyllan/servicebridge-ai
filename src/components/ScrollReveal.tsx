"use client";

import { useEffect, useRef, useState } from "react";
import type { HTMLAttributes, ReactNode, Ref } from "react";

type ScrollRevealProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  delay?: number;
  as?: "div" | "section";
};

export function ScrollReveal({ children, className = "", delay = 0, as = "div", style, ...props }: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -80px 0px", threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const revealClass = `sb-scroll-reveal ${isVisible ? "sb-scroll-reveal-visible" : ""} ${className}`;
  const mergedStyle = { ...style, transitionDelay: `${delay}ms` };

  if (as === "section") {
    return (
      <section ref={ref as Ref<HTMLElement>} className={revealClass} style={mergedStyle} {...props}>
        {children}
      </section>
    );
  }

  return (
    <div ref={ref as Ref<HTMLDivElement>} className={revealClass} style={mergedStyle} {...props}>
      {children}
    </div>
  );
}
