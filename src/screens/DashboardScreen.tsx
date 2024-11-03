import React from "react";
import "../index.css";
import { Card } from "../components/card";

export default function DashboardScreen() {
    const [devCards, setDevCards] = React.useState([ {
       title : "Card 1",
       color : "red",
    },
    {
        title : "A Really Long Title",
        color : "magenta",
    }, 
    {
        title : "One With No Color",
    }
    ]);

    const [researchCards, setResearchCards] = React.useState([{ 
        title: "Card 2",
        color: "teal"
    }
    ]);

    const [completedCards, setCompletedCards] = React.useState([{
        title: "Card 3",
        color: "green"
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
        e.dataTransfer.setData("color", card.color);
        e.dataTransfer.dropEffect = "none"   
    }

    const handleOnDevDrop = (e: React.DragEvent) => {
        const cardId = e.dataTransfer.getData("title") as string;
        const cardColor = e.dataTransfer.getData("color") as string;
        console.log("Card ID:", cardId);
        if (cardExists(devCards, {title: cardId, color: cardColor})) return;
        setDevCards([ ...devCards, {title: cardId, color: cardColor} ]);
        setResearchCards(removeCard(researchCards, {title: cardId}));
        setCompletedCards(removeCard(completedCards, {title: cardId}));

    }

    const handleOnResearchDrop = (e: React.DragEvent) => {
        const cardId = e.dataTransfer.getData("title") as string;
        const cardColor = e.dataTransfer.getData("color") as string;
        console.log("Card ID:", cardId);
        if (cardExists(researchCards, {title: cardId, color: cardColor})) return;
        setResearchCards([...researchCards, {title: cardId, color: cardColor} ]);
        setDevCards(removeCard(devCards, {title: cardId, color: cardColor}));
        setCompletedCards(removeCard(completedCards, {title: cardId, color: cardColor}));
    }

    const handleOnCompletedDrop = (e: React.DragEvent) => { 
        const cardId = e.dataTransfer.getData("title") as string;
        const cardColor = e.dataTransfer.getData("color") as string;
        console.log("Card ID:", cardId);
        if (cardExists(completedCards, {title: cardId, color: cardColor})) return;
        setCompletedCards([...completedCards,{title: cardId, color: cardColor}]);
        setDevCards(removeCard(devCards, {title: cardId, color: cardColor}));
        setResearchCards(removeCard(researchCards, {title: cardId, color: cardColor}));
    }

    const handleOnDragOver = (e: React.DragEvent) => {
        e.preventDefault();

    }
    return (
        <div className="start">
            <fieldset className="dev-work-dropzone" onDrop={handleOnDevDrop} onDragOver={handleOnDragOver}>
                <legend className="dropzone-title">Dev Work</legend>
                <div className="card-container">
                    {devCards.map((card, index) => (
                        <Card key={index} title={card.title} cardColor={card.color} onDragStart={(e) => handleOnDrag(e, card)} draggable />
                    ))}
                </div>
            </fieldset>
            <fieldset className="research-dropzone" onDrop={handleOnResearchDrop} onDragOver={handleOnDragOver}>
                <legend className="dropzone-title">Research</legend>
                <div className="card-container">
                    {researchCards.map((card, index) => (
                        <Card key={index} title={card.title} cardColor={card.color} draggable onDragStart={(e) => handleOnDrag(e, card)} />
                    ))}
                </div>
            </fieldset>
            <fieldset className="completed-dropzone" onDrop={handleOnCompletedDrop} onDragOver={handleOnDragOver}>
                <legend className="dropzone-title">Completed</legend>
                <div className="card-container">
                    {completedCards.map((card, index) => (
                        <Card key={index} title={card.title} cardColor={card.color} draggable onDragStart={(e) => handleOnDrag(e, card)} />
                    ))}
                </div>   
            </fieldset>
        </div>
    );
}
