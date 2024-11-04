import React from "react";
import "../index.css";
import { Card } from "../components/card";

export default function DashboardScreen() {
    const [devCards, setDevCards] = React.useState([ {
       title : "Card 1",
       color : "red",
       description : "This is a description of card 1",
    },
    {
        title : "A Really Long Title",
        color : "magenta",
        description : "This is a description of card with a very long title. Going on a little bit longer. This is a description of card with a very long title. Going on a little bit longer.",
    }, 
    {
        title : "One With No Color",
        description : "This is a description of a card with no set color",
    }
    ]);

    const [researchCards, setResearchCards] = React.useState([{ 
        title: "Card 2",
        color: "teal",
        description: "This is a description of card 2",
    }
    ]);

    const [completedCards, setCompletedCards] = React.useState([{
        title: "Card 3",
        color: "green",
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
        e.dataTransfer.setData("color", card.color);
        e.dataTransfer.setData("description", card.description);
        e.dataTransfer.dropEffect = "none"   
    }

    const handleOnDevDrop = (e: React.DragEvent) => {
        const cardId = e.dataTransfer.getData("title") as string;
        const cardColor = e.dataTransfer.getData("color") as string;
        const description = e.dataTransfer.getData("description") as string;
        console.log("Card ID:", cardId);
        if (cardExists(devCards, {title: cardId, color: cardColor})) return;
        setDevCards([ ...devCards, {title: cardId, color: cardColor, description} ]);
        setResearchCards(removeCard(researchCards, {title: cardId}));
        setCompletedCards(removeCard(completedCards, {title: cardId}));

    }

    const handleOnResearchDrop = (e: React.DragEvent) => {
        const cardId = e.dataTransfer.getData("title") as string;
        const cardColor = e.dataTransfer.getData("color") as string;
        const description = e.dataTransfer.getData("description") as string;
        console.log("Card ID:", cardId);
        if (cardExists(researchCards, {title: cardId, color: cardColor})) return;
        setResearchCards([...researchCards, {title: cardId, color: cardColor, description} ]);
        setDevCards(removeCard(devCards, {title: cardId, color: cardColor}));
        setCompletedCards(removeCard(completedCards, {title: cardId, color: cardColor}));
    }

    const handleOnCompletedDrop = (e: React.DragEvent) => { 
        const cardId = e.dataTransfer.getData("title") as string;
        const cardColor = e.dataTransfer.getData("color") as string;
        const description = e.dataTransfer.getData("description") as string;
        console.log("Card ID:", cardId);
        if (cardExists(completedCards, {title: cardId, color: cardColor})) return;
        setCompletedCards([...completedCards,{title: cardId, color: cardColor, description} ]);
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
                        <Card 
                            key={index} 
                            title={card.title} 
                            description={card.description}
                            cardColor={card.color} 
                            onDragStart={(e) => handleOnDrag(e, card)}
                            phase="In Progress" 
                            draggable
                         />
                    ))}
                </div>
            </fieldset>
            <fieldset className="research-dropzone" onDrop={handleOnResearchDrop} onDragOver={handleOnDragOver}>
                <legend className="dropzone-title">Research</legend>
                <div className="card-container">
                    {researchCards.map((card, index) => (
                        <Card 
                            key={index} 
                            title={card.title} 
                            description={card.description}
                            cardColor={card.color}  
                            onDragStart={(e) => handleOnDrag(e, card)}
                            phase="Research"
                            draggable
                        />
                    ))}
                </div>
            </fieldset>
            <fieldset className="completed-dropzone" onDrop={handleOnCompletedDrop} onDragOver={handleOnDragOver}>
                <legend className="dropzone-title">Completed</legend>
                <div className="card-container">
                    {completedCards.map((card, index) => (
                        <Card 
                            key={index} 
                            title={card.title} 
                            description={card.description}
                            cardColor={card.color}  
                            onDragStart={(e) => handleOnDrag(e, card)} 
                            phase="Completed"
                            draggable
                        />
                    ))}
                </div>   
            </fieldset>
        </div>
    );
}
