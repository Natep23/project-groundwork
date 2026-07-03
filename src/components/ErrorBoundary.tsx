import React from "react";
import { logger } from "../lib/logger";

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error("Unhandled render error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="error-screen">
        <div className="error-screen__panel">
          <span className="eyebrow">Off the plan</span>
          <h1 className="display" style={{ fontSize: 40 }}>
            Something broke
          </h1>
          <p style={{ color: "var(--ink-muted)" }}>
            The board hit an error it couldn't recover from. Reload to pick up where you left off —
            your cards are safe.
          </p>
          <button className="btn btn--primary" onClick={() => window.location.assign("/")}>
            Reload the board
          </button>
        </div>
      </div>
    );
  }
}
