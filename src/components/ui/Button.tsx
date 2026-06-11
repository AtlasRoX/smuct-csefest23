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
            "relative inline-flex items-center justify-center font-sans font-medium rounded-radius-sm text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] py-2.5 px-5 select-none cursor-pointer",
            {
              // Primary: Deep Indigo filled, strong contrast
              "bg-primary hover:bg-primary/95 text-neutral-50 hover:shadow-level-2 hover:scale-[1.02] active:scale-[0.98]": variant === "primary",
              // Secondary: Outlined slate-like border
              "bg-transparent border border-neutral-700 hover:border-neutral-500 text-neutral-50 hover:bg-neutral-900": variant === "secondary",
              // Ghost: Text only, subtle hover bg
              "bg-transparent text-neutral-400 hover:text-neutral-50 hover:bg-neutral-900": variant === "ghost",
              // Destructive: Red accent filled
              "bg-error hover:bg-error/95 text-neutral-50 hover:shadow-level-2 hover:scale-[1.02] active:scale-[0.98]": variant === "destructive",
            },
            className
          )
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-neutral-50/20 border-t-neutral-50 rounded-full animate-spin" />
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
