import React from "react";
import "../index.css";
// import { api } from "../convex/_generated/api";

type CardProps = {
    className?: string;
    title?: string;
    cardColor?: string
    description?: string
    draggable?: true
    phase: "Research" | "In Progress" | "Completed"
    onDragStart?: (e: React.DragEvent) => void
    
};

export const Card = ({ className, title, draggable, onDragStart, cardColor, description, phase }: CardProps) => {
    
    const maxWords = 100;

    const truncate = (text: string | undefined) => {
        if (text) {
            if (text.length >= maxWords) {
                return text.slice(0, maxWords) + '...';
            }
            return text;
        } else {
            return "No Description";
        }
    };

    return (
        <>
        <div className="card" draggable={draggable} onDragStart={onDragStart} style={{backgroundColor: cardColor}}>
            <h1>{title}</h1>
            <p>{truncate(description)}</p>
            <span>{phase}</span>
            <div className="card-button">
                <button onClick={() => {console.log("clicked")}}>View</button>
            </div>
        </div>
        </>
    );
}