import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ConvexReactClient } from 'convex/react';
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import reportWebVitals from "./reportWebVitals";
import { api } from "./convex/_generated/api";

const convexUrl = process.env.REACT_APP_CONVEX_URL as string;
const convex = new ConvexReactClient(convexUrl);
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
    <React.StrictMode>
        <div className="app-loading">Loading...</div>
    </React.StrictMode>
);

async function bootstrap() {
    const clerkKey = await convex.query(api.PublicConfig.getClerkPublishableKey);
    root.render(
        <React.StrictMode>
            <ClerkProvider publishableKey={clerkKey as string}>
                <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                    <App />
                </ConvexProviderWithClerk>
            </ClerkProvider>
        </React.StrictMode>
    );
}

bootstrap();
reportWebVitals();