import React from "react";
import "../index.css";
import { CardProps } from "../components/card";
import { Dropzone } from "../components/Dropzone";

export default function DashboardScreen() {
    const [devCards, setDevCards] = React.useState<CardProps[]>([ {
       title : "Card 1",
       cardColor : "red",
       description : "This is a description of card 1",
       phase: "In Progress",
    },
    {
        title : "A Really Long Title",
        cardColor : "magenta",
        phase: "In Progress",
        description : "This is a description of card with a very long title. Going on a little bit longer. This is a description of card with a very long title. Going on a little bit longer.",
        
    }, 
    {
        title : "One With No Color",
        phase: "In Progress",
        description : "This is a description of a card with no set color",
    }
    ]);

    const [researchCards, setResearchCards] = React.useState<CardProps[]>([{ 
        title: "Card 2",
        cardColor: "teal",
        phase: "Research",
        description: "This is a description of card 2",
    }
    ]);

    const [completedCards, setCompletedCards] = React.useState<CardProps[]>([{
        title: "Card 3",
        cardColor: "green",
        phase: "Completed",
        description: "This is a description of card 3",
    }
    ]);



    const cardExists = (list: any[], card: any) => {
        return list.some((item) => item.title === card.title);
    }

    const removeCard = (list: any[], card: any) => {
        return list.filter((item) => item.title !== card.title);
    }

    const handleOnDrag = (e: React.DragEvent, card: any) => {
        e.dataTransfer.setData("title", card.title);
        e.dataTransfer.setData("color", card.cardColor);
        e.dataTransfer.setData("description", card.description);
        e.dataTransfer.setData("phase", card.phase);
        e.dataTransfer.dropEffect = "none"   
    }

    const handleOnDevDrop = (e: React.DragEvent) => {
        const cardId = e.dataTransfer.getData("title") as string;
        const cardColor = e.dataTransfer.getData("color") as string;
        const description = e.dataTransfer.getData("description") as string;
        const phase = e.dataTransfer.getData("phase") as CardProps["phase"];
        console.log("Card ID:", cardId);
        if (cardExists(devCards, {title: cardId, color: cardColor})) return;
        setDevCards([ ...devCards, {title: cardId, cardColor: cardColor, description , phase: phase} ]);
        setResearchCards(removeCard(researchCards, {title: cardId}));
        setCompletedCards(removeCard(completedCards, {title: cardId}));

    }

    const handleOnResearchDrop = (e: React.DragEvent) => {
        const cardId = e.dataTransfer.getData("title") as string;
        const cardColor = e.dataTransfer.getData("color") as string;
        const description = e.dataTransfer.getData("description") as string;
        const phase = e.dataTransfer.getData("phase") as CardProps["phase"];
        console.log("Card ID:", cardId);
        if (cardExists(researchCards, {title: cardId, color: cardColor})) return;
        setResearchCards([...researchCards, {title: cardId, cardColor: cardColor, description, phase: phase} ]);
        setDevCards(removeCard(devCards, {title: cardId, color: cardColor}));
        setCompletedCards(removeCard(completedCards, {title: cardId, color: cardColor}));
    }

    const handleOnCompletedDrop = (e: React.DragEvent) => { 
        const cardId = e.dataTransfer.getData("title") as string;
        const cardColor = e.dataTransfer.getData("color") as string;
        const description = e.dataTransfer.getData("description") as string;
        const phase = e.dataTransfer.getData("phase") as CardProps["phase"];
        console.log("Card ID:", cardId);
        if (cardExists(completedCards, {title: cardId, color: cardColor})) return;
        setCompletedCards([...completedCards,{title: cardId, cardColor: cardColor, description, phase:phase} ]);
        setDevCards(removeCard(devCards, {title: cardId, color: cardColor}));
        setResearchCards(removeCard(researchCards, {title: cardId, color: cardColor}));
    }

    const handleOnDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    }

    return (
        <div className="start">
            <Dropzone
                className="dev-work-dropzone"
                cardStatus="In Progress"
                list={devCards}
                onDrop={handleOnDevDrop}
                onDragOver={handleOnDragOver}
                onDragStart={handleOnDrag}
                dropzoneTitle="Development" 
                hasTaskCard={false}
                />
            <Dropzone
                className="research-dropzone"
                cardStatus="Research"
                list={researchCards}
                onDrop={handleOnResearchDrop}
                onDragOver={handleOnDragOver}
                onDragStart={handleOnDrag}
                dropzoneTitle="Research" 
                hasTaskCard={false}
                />
            <Dropzone
                className="completed-dropzone"
                cardStatus="Completed"
                list={completedCards}
                onDrop={handleOnCompletedDrop}
                onDragOver={handleOnDragOver}
                onDragStart={handleOnDrag}
                dropzoneTitle="Completed" 
                hasTaskCard={false}
                />
        </div>
    );
}
