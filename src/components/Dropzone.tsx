import React from "react";
import "../index.css";
import { Card, CardProps} from "../components/card";

interface DropzoneProps {
    cardStatus: "Research" | "In Progress" | "Completed";
    dropzoneTitle: string;
    className?: string;
    list?: CardProps[] | [] | undefined;
    hasTaskCard: boolean;
    onDrop: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent, card: any) => void;
    onDragStart: (e: React.DragEvent, card: any) => void;
}

export const Dropzone = ({ cardStatus, dropzoneTitle, className, list, onDrop, onDragOver, onDragStart, hasTaskCard }: DropzoneProps) => {
    let Content;

    if (!hasTaskCard) {
       Content =  <fieldset
            className={className}
            onDrop={onDrop}
            onDragOver={(e) => onDragOver(e, {phase: cardStatus})}
        >
            <legend className="dropzone-title">{dropzoneTitle}</legend>
                <div className="card-container">
                    {list?.map((card, index) => (
                        <Card
                            color={card.color}
                            description={card.description}
                            key={index}
                            title={card.title}
                            draggable
                            phase={cardStatus}
                            onDragStart={(e) => onDragStart(e, card)}
                            _id={card._id}
                        />
                    ))}
                </div>
        </fieldset>
    } else {
        Content = <fieldset><legend>Card Type Not Yet Created</legend></fieldset>
    }
    return Content;

}