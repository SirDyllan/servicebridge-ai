"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  {
    src: "/images/8.jpg",
    alt: "Student receiving benefits navigation support",
  },
  {
    src: "/images/7.jpg",
    alt: "Community support conversation with document guidance",
  },
  {
    src: "/images/9.jpg",
    alt: "Public benefits help and human referral setting",
  },
  {
    src: "/images/10.jpg",
    alt: "Civic support office for safe next-step verification",
  },
];

export function HeroSlideshow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      {slides.map((slide, index) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={index === 0}
          sizes="100vw"
          className={`object-cover transition-[opacity,transform] duration-[1400ms] ${
            active === index ? "scale-100 opacity-100" : "scale-[1.035] opacity-0"
          }`}
        />
      ))}
      <div className="absolute bottom-6 left-6 z-20 flex gap-2">
        {slides.map((slide, index) => (
          <button
            type="button"
            key={slide.src}
            aria-label={`Show hero slide ${index + 1}`}
            onClick={() => setActive(index)}
            className={`h-2 rounded-full transition-all hover:bg-white ${
              active === index ? "w-12 bg-white" : "w-2 bg-white/60"
            }`}
          />
        ))}
      </div>
    </>
  );
}
