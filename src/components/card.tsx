import React from "react";
import "../index.css";
// import { api } from "../convex/_generated/api";

type CardProps = {
    className?: string;
    title?: string;
    draggable?: true
    onDragStart?: (e: React.DragEvent) => void
    currentStatus?: ["research", "dev", "completed"]
    cardColor?: string
};

export const Card = ({ className, title, draggable, onDragStart, currentStatus, cardColor }: CardProps) => { 
    return (
        <>
        <div className="card" draggable onDragStart={onDragStart} style={{backgroundColor: cardColor}}>
            <h1>{title}</h1>
        </div>
        </>
    );
}