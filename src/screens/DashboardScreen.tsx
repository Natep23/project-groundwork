import React from "react";
import "../index.css";
import { CardProps } from "../components/card";
import { Dropzone } from "../components/Dropzone";
import { api } from "../convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "../convex/_generated/dataModel";


export default function DashboardScreen() {
    const fetchDev = useQuery(api.Cards.getDevCards);
    const fetchResearch = useQuery(api.Cards.getResearchCards);
    const fetchCompleted = useQuery(api.Cards.getCompletedCards);
    const changePhase = useMutation(api.Cards.changePhase);
    const removeCard = useMutation(api.Cards.removeCard);

    const [devCards, setDevCards] = React.useState(fetchDev);

    const [researchCards, setResearchCards] = React.useState(fetchResearch);

    const [completedCards, setCompletedCards] = React.useState(fetchCompleted);

    React.useEffect(() => {
        setDevCards(fetchDev);
        setResearchCards(fetchResearch);
        setCompletedCards(fetchCompleted);
    }, [fetchDev, fetchResearch, fetchCompleted]);

    const cardExists = (list: any[], card: any) => {
        return list.some((item) => item.title === card.title);
    }

   
    const handleOnDrag = (e: React.DragEvent, card: any) => {
        e.dataTransfer.setData("title", card.title);
        e.dataTransfer.setData("color", card.color);
        e.dataTransfer.setData("description", card.description);
        e.dataTransfer.setData("phase", card.phase);
        e.dataTransfer.setData("Id", card._id as Id<"Cards">)
        
        e.dataTransfer.dropEffect = "none"
    }

    const handleOnDevDrop = (e: React.DragEvent) => {
        const title = e.dataTransfer.getData("title") as string;
        console.log("Card Title:", title);
        if (devCards && cardExists(devCards, {title: title})) return;
        changePhase({ phase: "In Progress", id: e.dataTransfer.getData("Id") as Id<"Cards"> });
    }

    const handleOnResearchDrop = (e: React.DragEvent) => {
        const title = e.dataTransfer.getData("title") as string;
        console.log("Card Title:", title);
        if (researchCards && cardExists(researchCards, {title: title})) return;
        changePhase({ phase: "Research", id: e.dataTransfer.getData("Id") as Id<"Cards"> });
        
    }

    const handleOnCompletedDrop = (e: React.DragEvent) => { 
        const title = e.dataTransfer.getData("title") as string;
        console.log("Card Title:", title);
        if (completedCards && cardExists(completedCards, {title: title})) return;
        changePhase({ phase: "Completed", id: e.dataTransfer.getData("Id") as Id<"Cards"> });
    }

    const handleOnDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="start">
            <Dropzone
                className="dev-work-dropzone"
                cardStatus="In Progress"
                list={devCards as CardProps[] | undefined}
                onDrop={handleOnDevDrop}
                onDragOver={handleOnDragOver}
                onDragStart={(e, index) => {handleOnDrag(e, index)}}
                dropzoneTitle="Development" 
                hasTaskCard={false}
                />
            <Dropzone
                className="research-dropzone"
                cardStatus="Research"
                list={researchCards as CardProps[] | undefined}
                onDrop={handleOnResearchDrop}
                onDragOver={handleOnDragOver}
                onDragStart={(e, index) => {handleOnDrag(e, index)}}
                dropzoneTitle="Research" 
                hasTaskCard={false}
                />
            <Dropzone
                className="completed-dropzone"
                cardStatus="Completed"
                list={completedCards as CardProps[] | undefined}
                onDrop={handleOnCompletedDrop}
                onDragOver={handleOnDragOver}
                onDragStart={(e, index) => {handleOnDrag(e, index)}}
                dropzoneTitle="Completed" 
                hasTaskCard={false}
                />
        </div>
    );
}
