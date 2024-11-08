import { e } from "@clerk/clerk-react/dist/useAuth-DT1ot2zi";
import React from "react";
import "../index.css";
import { Card, CardProps} from "../components/card";

interface DropzoneProps {
    cardStatus: "Research" | "In Progress" | "Completed";
    dropzoneTitle: string;
    className?: string;
    list: CardProps[];
    hasTaskCard: boolean;
    onDrop: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragStart: (e: React.DragEvent, card: any) => void;
}

export const Dropzone = ({ cardStatus, dropzoneTitle, className, list, onDrop, onDragOver, onDragStart, hasTaskCard }: DropzoneProps) => {
    let Content;

    if (!hasTaskCard) {
       Content =  <fieldset
            className={className}
            onDrop={onDrop}
            onDragOver={onDragOver}
        >
            <legend className="dropzone-title">{dropzoneTitle}</legend>
                <div className="card-container">
                    {list.map((card, index) => (
                        <Card
                            cardColor={card.cardColor}
                            description={card.description}
                            key={index}
                            title={card.title}
                            draggable
                            phase={cardStatus}
                            onDragStart={(e) => onDragStart(e, card)}
                        />
                    ))}
                </div>
        </fieldset>
    } else {
        Content = <fieldset><legend>Card Type Not Yet Created</legend></fieldset>
    }
    return Content;

}