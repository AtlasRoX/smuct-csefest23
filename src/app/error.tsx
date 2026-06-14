"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error monitoring in production (e.g. Sentry)
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-error/10 border border-error/20">
            <AlertTriangle className="h-10 w-10 text-error" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-heading font-bold text-neutral-50">
            Something went wrong
          </h1>
          <p className="text-sm text-neutral-400 font-sans leading-relaxed">
            An unexpected error occurred. Our team has been notified. You can
            try refreshing the page or return to the home page.
          </p>
          {error.digest && (
            <p className="text-xs text-neutral-600 font-mono mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            onClick={reset}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/")}
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

