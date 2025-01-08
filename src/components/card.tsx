import React from "react";
import CardOptions from "./CardOptions";
import "../index.css";
import { Id } from "../convex/_generated/dataModel";
// import { api } from "../convex/_generated/api";

export type CardProps = {
    className?: string;
    title?: string;
    color?: string
    description?: string
    draggable?: boolean | undefined
    isTaskCard?: true
    noViewButton?: true
    _id?: Id<"Cards">
    phase: "Research" | "In Progress" | "Completed"
    _creationTime?: number
    previousPhase?: "Research" | "In Progress" | "Completed"
    onDragStart?: (e: React.DragEvent) => void
    
};

export const Card = ({ _id, title, draggable, onDragStart, color, description, phase, isTaskCard, noViewButton, }: CardProps) => {
    
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
        if (draggable === true) {
        cardType = 
        <div className="card" draggable={draggable} onDragStart={onDragStart} style={{backgroundColor: color}}>
            <h1>{title}</h1>
            <p>{truncate(description)}</p>
            <span>{phase}</span>
        </div>
        } else {
        cardType = 
        <div className="no-drag-card" style={{backgroundColor: color}}>
            <h1>{title}</h1>
            <p>{truncate(description)}</p>
            <span>{phase}</span>
                {!noViewButton && _id && <CardOptions _id={_id} />}
        </div>
        }
    }

    return cardType;
}