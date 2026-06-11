import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(
            "relative inline-flex items-center justify-center font-sans font-semibold rounded-lg text-sm transition-all duration-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none py-2.5 px-5 select-none cursor-pointer active:scale-[0.98]",
            {
              // Primary: Deep Indigo filled, premium lift & shadow
              "bg-primary hover:bg-primary/90 text-white hover:shadow-level-2 hover:-translate-y-[1px] active:translate-y-0 border border-primary/20": variant === "primary",
              // Secondary: Dark glassmorphic background, clean hover state
              "bg-neutral-900/60 border border-neutral-850 hover:border-neutral-700 text-neutral-50 hover:bg-neutral-900 hover:shadow-level-1 hover:-translate-y-[1px] active:translate-y-0": variant === "secondary",
              // Ghost: Transparent with subtle hover indicator
              "bg-transparent text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/40": variant === "ghost",
              // Destructive: Red accent filled, premium lift & shadow
              "bg-error hover:bg-error/90 text-white hover:shadow-level-2 hover:-translate-y-[1px] active:translate-y-0 border border-error/20": variant === "destructive",
            },
            className
          )
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className={clsx(
              "w-4 h-4 border-2 rounded-full animate-spin",
              {
                "border-white/20 border-t-white": variant === "primary" || variant === "destructive",
                "border-neutral-50/20 border-t-neutral-50": variant === "secondary" || variant === "ghost",
              }
            )} />
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
