import React from "react";
import "../index.css";

interface ResearchListProps {
    className: string
    title: string
    list: string[] 
}

export const ResearchList = ({ className, title, list }: ResearchListProps)  => {
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
                {list.map((item, index) => 
                    <li key={index} onClick={() => {window.open(item)}}>
                        <img src={require("../assets/images/2023-Obsidian-logo.svg.png")} alt="Obsidian logo"/>
                        <p>{extractObsidianTitle(item)}</p>
                    </li>
                )}
            </ul>
        </fieldset>
    )
}