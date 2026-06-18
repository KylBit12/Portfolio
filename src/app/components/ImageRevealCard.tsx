import { useState } from "react";

interface ImageRevealCardProps {
  imageUrl: string;
  imageAlt: string;
  title: string;
  subtitle: string;
  description: string;
  tag: string;
}

export function ImageRevealCard({
  imageUrl,
  imageAlt,
  title,
  subtitle,
  description,
  tag,
}: ImageRevealCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
      style={{ width: 360, height: 480 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Base image */}
      <img
        src={imageUrl}
        alt={imageAlt}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Persistent dark gradient at bottom for base label */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)",
          opacity: hovered ? 0 : 1,
        }}
      />

      {/* Mask overlay — reveals content using a radial/linear mask wipe */}
      <div
        className="absolute inset-0 flex flex-col justify-end p-7"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.1) 100%)",
          WebkitMaskImage: hovered
            ? "linear-gradient(to top, black 0%, black 100%)"
            : "linear-gradient(to top, black 0%, transparent 35%)",
          maskImage: hovered
            ? "linear-gradient(to top, black 0%, black 100%)"
            : "linear-gradient(to top, black 0%, transparent 35%)",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          transition: "mask-image 0.6s ease, -webkit-mask-image 0.6s ease",
        }}
      >
        {/* Tag */}
        <span
          className="self-start text-white/70 tracking-widest mb-3 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm"
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s",
          }}
        >
          {tag}
        </span>

        {/* Title — always visible (at base state it peeks above fold) */}
        <h2
          className="text-white leading-tight mb-1"
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            transform: hovered ? "translateY(0)" : "translateY(0)",
            transition: "transform 0.5s ease",
          }}
        >
          {title}
        </h2>

        {/* Subtitle */}
        <p
          className="text-white/60 mb-4"
          style={{
            fontSize: "0.8rem",
            letterSpacing: "0.04em",
            opacity: hovered ? 1 : 0.6,
            transition: "opacity 0.4s ease",
          }}
        >
          {subtitle}
        </p>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.15)",
            marginBottom: "1rem",
            transform: hovered ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "left",
            transition: "transform 0.5s ease 0.1s",
          }}
        />

        {/* Description — hidden content */}
        <p
          className="text-white/75 leading-relaxed"
          style={{
            fontSize: "0.85rem",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.4s ease 0.25s, transform 0.4s ease 0.25s",
          }}
        >
          {description}
        </p>

        {/* CTA */}
        <button
          className="mt-5 self-start flex items-center gap-2 text-white"
          style={{
            fontSize: "0.8rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.4s ease 0.35s, transform 0.4s ease 0.35s",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <span>Explore</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: hovered ? "translateX(4px)" : "translateX(0)",
              transition: "transform 0.3s ease 0.4s",
            }}
          >
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
