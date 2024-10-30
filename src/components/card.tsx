import React from "react";
import "../index.css";
// import { api } from "../convex/_generated/api";

type CardProps = {
    className?: string;
    title?: string;
};

export const Card = ({ className, title }: CardProps) => { 
    return (
        <>
        <div className="card">
            <h1>{title}</h1>
        </div>
        </>
    );
}