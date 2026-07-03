import React from "react";
import "../index.css";
import { ResearchModal } from "./Modals";
import { Id } from "../convex/_generated/dataModel";

export interface ResearchListProps {
    className?: string
    title?: string
    list?: string[]
    cardId?: Id<"Cards"> 
}

export const ResearchList = ({ className, title, list, cardId }: ResearchListProps)  => {
    const [showModal, setShowModal] = React.useState(false);

    const extractObsidianTitle = (path: string) => {
        return path.split("file=").pop()?.split(".md")[0].split("%20").join(" ").split("%2F").pop();
    }

    const handleAddLink = () => {
        setShowModal(true);
    }

    return (
        <fieldset className={className}>
            <legend>{title}</legend>
            <ul>
                {list?.map((item, index) => 
                    <li key={index} onClick={() => {window.open(item)}}>
                        <img src={require("../assets/images/2023-Obsidian-logo.svg.png")} alt="Obsidian logo"/>
                        <p>{extractObsidianTitle(item)}</p>
                    </li>
                )}
                <button className="research-list-add" onClick={handleAddLink}>
                    <img src="https://img.icons8.com/ios/50/000000/plus-math.png" alt="Add link"/>
                </button>
                <ResearchModal showModal={showModal} setShowModal={setShowModal} modalMessage="Add link" cardId={cardId} />
            </ul>
        </fieldset>
    )
}