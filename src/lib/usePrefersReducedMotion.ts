import React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Live-updating read of the `prefers-reduced-motion` media query. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(() => window.matchMedia(QUERY).matches);

  React.useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = () => setReduced(mql.matches);
    // Safari < 14 only supports the deprecated addListener/removeListener pair.
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  return reduced;
}
