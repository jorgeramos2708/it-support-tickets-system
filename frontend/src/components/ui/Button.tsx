import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const button = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[3px] font-medium whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-signal text-paper hover:bg-signal-deep",
        secondary: "bg-ink text-paper hover:bg-ink-2",
        outline:
          "border border-rule-2 bg-raised text-ink hover:border-ink",
        ghost: "text-ink-2 hover:bg-ink/5 hover:text-ink",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-9 px-4 text-sm",
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
