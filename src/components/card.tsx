import React from "react";
import "../index.css";
import { Id } from "../convex/_generated/dataModel";
// import { api } from "../convex/_generated/api";

export type CardProps = {
    className?: string;
    title?: string;
    color?: string
    description?: string
    draggable?: true
    isTaskCard?: true
    _id?: Id<"Cards">
    phase: "Research" | "In Progress" | "Completed"
    _creationTime?: number
    previousPhase?: "Research" | "In Progress" | "Completed"
    onDragStart?: (e: React.DragEvent) => void
    
};

export const Card = ({ className, title, draggable, onDragStart, color, description, phase, isTaskCard }: CardProps) => {
    
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

    let cardType;
    if (isTaskCard){
        cardType = <div><span>Task</span></div>
    } else {
        cardType = <div className="card" draggable={draggable} onDragStart={onDragStart} style={{backgroundColor: color}}>
        <h1>{title}</h1>
        <p>{truncate(description)}</p>
        <span>{phase}</span>
        <div className="card-button">
            <button onClick={() => {console.log("clicked")}}>View</button>
        </div>
    </div>
    }

    return cardType;
}