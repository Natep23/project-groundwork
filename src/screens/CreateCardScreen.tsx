import React from "react";
import { Card, CardProps } from "../components/card";
import "../index.css";
import { useNavigate } from  "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";


export default function CreateCardScreen() {
    const [title, setTitle] = React.useState("Your Title");
    const [description, setDescription] = React.useState("Your Description");
    const [color, setColor] = React.useState("#df0000");
    const [phase, setPhase] = React.useState<CardProps["phase"]>("Research");
    const newCard = useMutation(api.Cards.addCard);

    const nav = useNavigate();

    const handleAddCard = () => {
        newCard({title, description, color, phase});
        nav("/");
    }
    return(
    <>
    <div className="card-preview-container">
        <Card
            title={title}
            description={description}
            color={color}
            phase={phase}
            className="card card-preview"
            noViewButton
        />
    </div>
    <div className="card-input-container">
        <input
            className="card-input"
            type="text"
            placeholder="Title"
            onChange={(e) => setTitle(e.target.value)}
        />
        <input
            className="card-input card-input-description"
            type="text"
            placeholder="Description"
            onChange={(e) => setDescription(e.target.value)}
        />
        <input
            className="card-input card-input-color-pick"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
        />
        <select
            className="card-input card-input-phase"
            onChange={(e) => setPhase(e.target.value as CardProps["phase"])}
        >
            <option value="Research">Research</option>            
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
        </select>
        <button className="create-card-button" onClick={handleAddCard}>Create Card</button>
    </div>
    </>
    )
}   