import React from "react";
import { SignOutButton } from '@clerk/clerk-react';
import "../index.css";

export default function DashboardScreen() {
    return (
        <div className="start">
            <SignOutButton />
        </div>
    );
}
