import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import App from "./App";
import { api } from "./convex/_generated/api";
import { logger } from "./lib/logger";

import "@fontsource-variable/big-shoulders-display";
import "@fontsource-variable/archivo";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL is not set — add it to .env.local");
}

const convex = new ConvexReactClient(convexUrl);
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <div className="app-loading">
      <span>Loading…</span>
    </div>
  </React.StrictMode>
);

/*
 * The Clerk publishable key is served by the Convex backend (PublicConfig)
 * rather than baked into the bundle, so ClerkProvider can only mount after
 * this first round-trip resolves.
 */
async function bootstrap() {
  try {
    const clerkKey = await convex.query(api.PublicConfig.getClerkPublishableKey);
    if (!clerkKey) throw new Error("Backend returned no Clerk publishable key");
    root.render(
      <React.StrictMode>
        <ClerkProvider publishableKey={clerkKey}>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <App />
          </ConvexProviderWithClerk>
        </ClerkProvider>
      </React.StrictMode>
    );
  } catch (err) {
    logger.error("Bootstrap failed", err);
    root.render(
      <React.StrictMode>
        <div className="error-screen">
          <div className="error-screen__panel">
            <h1 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase" }}>
              Can't reach the site office
            </h1>
            <p style={{ color: "var(--ink-muted)" }}>
              The app couldn't connect to its backend. Check your connection and reload.
            </p>
            <button className="btn btn--primary" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      </React.StrictMode>
    );
  }
}

void bootstrap();
