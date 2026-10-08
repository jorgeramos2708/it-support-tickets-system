import { useId } from "react";
import { cn } from "../lib/cn";

export function LogoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const maskId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="TickITFlow"
    >
      <mask id={maskId}>
        <rect x="-4" y="-4" width="72" height="72" fill="black" />
        <rect x="0" y="0" width="64" height="64" rx="10" fill="white" />
        <circle cx="64" cy="32" r="9" fill="black" />
      </mask>
      <rect
        x="0"
        y="0"
        width="64"
        height="64"
        rx="10"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
      <path
        d="M15 36 H29.5 L38 45 L53 22"
        fill="none"
        stroke="#FBFBF9"
        strokeWidth="7"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={26} className="shrink-0 text-signal" />
      <span className="font-display hidden text-[17px] leading-none font-semibold tracking-tight whitespace-nowrap sm:inline">
        Tick
        <span className="mx-[2px] inline-flex -translate-y-[1px] items-center rounded-[4px] bg-signal px-[5px] py-[3px] leading-none text-paper">
          IT
        </span>
        Flow
      </span>
    </span>
  );
}
