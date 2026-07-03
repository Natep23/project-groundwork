import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// RTL's automatic cleanup relies on test globals, which are disabled here.
if (typeof window !== "undefined" && typeof document !== "undefined") {
  const { cleanup } = await import("@testing-library/react");
  afterEach(cleanup);

  // jsdom has no matchMedia; the theme system feature-detects dark mode with it.
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
}
