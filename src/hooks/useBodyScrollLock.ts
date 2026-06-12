import * as React from "react";

export function useBodyScrollLock(isLocked: boolean) {
  React.useEffect(() => {
    if (isLocked) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isLocked]);
}
