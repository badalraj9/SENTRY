import React, { useId, useRef, useEffect, ReactNode } from "react";
import { cn } from "../lib/utils";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * GlassButton — a premium button with true SVG displacement-map liquid-glass refraction.
 * Inspired by the GlassSurface pattern, using feDisplacementMap + feColorMatrix to
 * split chromatic channels and distort what's behind the button.
 */
export function GlassButton({
  children,
  variant = "default",
  size = "md",
  className,
  disabled,
  onClick,
  ...rest
}: GlassButtonProps) {
  const id = useId();
  const filterId = `glass-btn-${id.replace(/:/g, "")}`;
  const feImageRef = useRef<SVGFEImageElement>(null);
  const containerRef = useRef<HTMLButtonElement>(null);

  const borderRadius = 9999; // pill

  const generateMap = (w: number, h: number) => {
    const edgeSize = Math.min(w, h) * 0.06;
    const brightness = variant === "danger" ? 40 : 60;
    const mixBlend = "difference";
    const redGrad = `red-g-${id.replace(/:/g, "")}`;
    const blueGrad = `blue-g-${id.replace(/:/g, "")}`;

    const svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${redGrad}" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#0000"/>
          <stop offset="100%" stop-color="red"/>
        </linearGradient>
        <linearGradient id="${blueGrad}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0000"/>
          <stop offset="100%" stop-color="blue"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${w}" height="${h}" fill="black"/>
      <rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${redGrad})"/>
      <rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${blueGrad})" style="mix-blend-mode:${mixBlend}"/>
      <rect x="${edgeSize}" y="${edgeSize}" width="${w - edgeSize * 2}" height="${h - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / 0.93)" style="filter:blur(10px)"/>
    </svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  const updateFilter = () => {
    const el = containerRef.current;
    if (!el || !feImageRef.current) return;
    const rect = el.getBoundingClientRect();
    feImageRef.current.setAttribute(
      "href",
      generateMap(rect.width || 120, rect.height || 40),
    );
  };

  useEffect(() => {
    updateFilter();
    const observer = new ResizeObserver(() => setTimeout(updateFilter, 0));
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [variant]);

  const sizeCls = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-2.5 text-[11px]",
    lg: "px-8 py-3.5 text-[13px]",
  }[size];

  const variantColors = {
    default: "text-white",
    danger: "text-white",
  }[variant];

  /* Chromatic aberration / distortion settings */
  const baseScale = -60;
  const redOffset = 0;
  const greenOffset = 6;
  const blueOffset = 14;

  return (
    <>
      {/* Hidden SVG filters — rendered at page level */}
      <svg
        style={{
          position: "fixed",
          width: 0,
          height: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <defs>
          <filter
            id={filterId}
            colorInterpolationFilters="sRGB"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feImage
              ref={feImageRef}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="map"
            />

            {/* Red channel */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={baseScale + redOffset}
              xChannelSelector="R"
              yChannelSelector="G"
              result="dispRed"
            />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="red"
            />

            {/* Green channel */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={baseScale + greenOffset}
              xChannelSelector="R"
              yChannelSelector="G"
              result="dispGreen"
            />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="green"
            />

            {/* Blue channel */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={baseScale + blueOffset}
              xChannelSelector="R"
              yChannelSelector="G"
              result="dispBlue"
            />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="blue"
            />

            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur in="output" stdDeviation="0.4" />
          </filter>
        </defs>
      </svg>

      <button
        ref={containerRef}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 font-mono tracking-widest uppercase rounded-full overflow-hidden select-none outline-none transition-transform duration-300",
          "disabled:opacity-40 disabled:pointer-events-none",
          sizeCls,
          variantColors,
          className,
        )}
        style={{
          /* Actual glass background */
          background:
            variant === "danger"
              ? "rgba(211, 62, 51, 0.82)"
              : "rgba(10, 10, 10, 0.80)",
          backdropFilter: `url(#${filterId}) blur(2px)`,
          WebkitBackdropFilter: `url(#${filterId}) blur(2px)`,
          border: `1px solid ${variant === "danger" ? "rgba(255,100,80,0.4)" : "rgba(255,255,255,0.2)"}`,
          boxShadow: [
            "0 8px 32px rgba(0,0,0,0.3)",
            "inset 0 1.5px 2px rgba(255,255,255,0.35)" /* top shine */,
            "inset 0 -3px 6px rgba(0,0,0,0.85)" /* bottom shadow */,
            variant === "danger" ? "0 0 20px rgba(211,62,51,0.25)" : "",
          ]
            .filter(Boolean)
            .join(","),
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform =
            "translateY(-2px) scale(1.02)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = [
            "0 14px 40px rgba(0,0,0,0.4)",
            "inset 0 2px 4px rgba(255,255,255,0.45)",
            "inset 0 -4px 8px rgba(0,0,0,1)",
            variant === "danger" ? "0 0 30px rgba(211,62,51,0.4)" : "",
          ]
            .filter(Boolean)
            .join(",");
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = [
            "0 8px 32px rgba(0,0,0,0.3)",
            "inset 0 1.5px 2px rgba(255,255,255,0.35)",
            "inset 0 -3px 6px rgba(0,0,0,0.85)",
            variant === "danger" ? "0 0 20px rgba(211,62,51,0.25)" : "",
          ]
            .filter(Boolean)
            .join(",");
        }}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform =
            "translateY(1px) scale(0.97)";
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform =
            "translateY(-2px) scale(1.02)";
        }}
        {...rest}
      >
        {/* Top gloss highlight */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-2/5 rounded-t-full"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.28), transparent)",
          }}
        />
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </button>
    </>
  );
}

export default GlassButton;
