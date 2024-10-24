import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ConvexReactClient } from 'convex/react';
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import reportWebVitals from "./reportWebVitals";


    const convexUrl = process.env.REACT_APP_CONVEX_URL as string;
    const clerkKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY as string;
    const convex = new ConvexReactClient(convexUrl);
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
        <React.StrictMode>
            <ClerkProvider publishableKey={clerkKey}>
                <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                    <App />
                </ConvexProviderWithClerk>
            </ClerkProvider>
        </React.StrictMode>
    )

reportWebVitals();