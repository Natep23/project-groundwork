import React from "react";
import "../index.css";
import { Card } from "../components/card";

export default function DashboardScreen() {
    return (
        <div className="start">
            <div className="card-container">
                <Card className="" title="First Card" />
            </div>
        </div>
    );
}
