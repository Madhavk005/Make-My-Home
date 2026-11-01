"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Props = {
  poster?: string;
  src?: string | null;
  title: string;
  description: string;
};

export function ConstructionVideo({ poster = "/images/hero-architecture.jpg", src, title, description }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const videoSrc = src ?? process.env.NEXT_PUBLIC_HOME_VIDEO_URL ?? null;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const handler = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setInView(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const showVideo = Boolean(videoSrc) && !reducedMotion && inView;

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-2xl border border-line bg-forest-deep">
      {showVideo ? (
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
        >
          <source src={videoSrc as string} type="video/mp4" />
        </video>
      ) : (
        <Image
          src={poster}
          alt={title}
          width={1200}
          height={675}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/70 via-forest-deep/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
        <h3 className="text-xl font-bold sm:text-2xl">{title}</h3>
        <p className="mt-2 max-w-xl text-sm text-white/80">{description}</p>
        {!videoSrc ? (
          <p className="mt-3 text-xs text-white/60">
            Video placeholder — add an approved video file to enable the loop.
          </p>
        ) : reducedMotion ? (
          <p className="mt-3 text-xs text-white/60">
            Motion paused to respect your reduced-motion preference.
          </p>
        ) : null}
      </div>
    </div>
  );
}
