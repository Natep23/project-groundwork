import React from "react";
import CardOptions from "./CardOptions";
import "../index.css";
import { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import { useMutation } from "convex/react";

export type CardProps = {
    className?: string;
    title?: string;
    color?: string
    description?: string
    draggable?: boolean | undefined
    noViewButton?: true
    _id?: Id<"Cards">
    phase?: "Research" | "In Progress" | "Completed"
    _creationTime?: number
    previousPhase?: "Research" | "In Progress" | "Completed"
    onDragStart?: (e: React.DragEvent) => void
    
};

export type TaskProps = {
    taskDescription: string
    Draggable: true
    cardId: Id<"Cards">
    priority: 1 | 2 | 3
    order: number
    _id?: Id<"Tasks"> 
    onTaskDragStart?: (e: React.DragEvent) => void
}

export const Card = ({ _id, title, draggable, onDragStart, color, description, phase, noViewButton, } : CardProps) => {
    
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
            {draggable &&
                <div className="card" draggable={draggable} onDragStart={onDragStart} style={{backgroundColor: color}}>
                    <h1>{title}</h1>
                    <p>{truncate(description)}</p>
                    <span>{phase}</span>
                </div>
            }
            {!draggable &&
                <div className="no-drag-card" style={{backgroundColor: color}}>
                    <h1>{title}</h1>
                    <p>{truncate(description)}</p>
                    <span>{phase}</span>
                        {!noViewButton && _id && <CardOptions _id={_id} />}
                </div>
            }
        </>
    )
}

export const TaskCard = ({ taskDescription, Draggable, cardId, priority, order, _id, onTaskDragStart}: TaskProps) => {
    const deleteCard = useMutation(api.Tasks.removeTask);

    const handleDeleteCard = () => {
        if (!_id) return
        deleteCard({id: _id});
      }
    return (
        <div className="task-card" draggable={Draggable} onDragStart={onTaskDragStart}>
            <h1>{taskDescription}</h1>
            <p>{priority}</p>
            <img src={require("../assets/images/icons8-trash-50.png")} alt="Delete" onClick={handleDeleteCard}/>
        </div>
    )
}