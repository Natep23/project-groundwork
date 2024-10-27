import React from "react";
import "../index.css";
import { Authenticated, Unauthenticated } from "convex/react";
import { UserButton } from "@clerk/clerk-react";

export const Header = () => {
    return (
        <div className="header">
        <header>
            <Authenticated>
                <h1>GroundWork</h1>
                <UserButton /> 
            </Authenticated>

            <Unauthenticated>
                <h1>GroundWork</h1>
            </Unauthenticated>
        </header>
        </div>
    );
}