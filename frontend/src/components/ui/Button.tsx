import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const button = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-display text-sm font-bold whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[.98] disabled:pointer-events-none disabled:opacity-40 disabled:hover:translate-y-0",
  {
    variants: {
      variant: {
        primary:
          "border border-amber-fill bg-amber-fill text-amber-fill-ink hover:shadow-glow",
        secondary: "border border-ink bg-ink text-paper hover:shadow-2",
        outline:
          "border border-rule-2 bg-transparent text-ink hover:border-amber hover:shadow-2",
        ghost: "border border-transparent text-ink-2 hover:bg-ink/5 hover:text-ink",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-9 px-4",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
}
