import React, { ChangeEvent } from "react";
import "../index.css"
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface ModalProps {
    showModal: boolean;
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
    messageClass?: string
    modalMessage?: string
    maxTaskList?: number
    cardId?: Id<"Cards">
    handleCancel?: () => void
    handleDelete?: () => void
}


export function DeleteModal({ showModal, setShowModal, modalMessage, handleCancel, handleDelete, messageClass }: ModalProps) {
    if (showModal === false) {
        return null
    } else {
        return (
                <div style={{position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 9999}}>
                <div style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: -1}}></div>
                <div style={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "rgb(255, 255, 255)", padding: "40px", borderRadius: "5px"}}>
                    <h1 className={messageClass}>{modalMessage}</h1>
                <button className="delete-modal-button" style={{backgroundColor: "rgba(255, 0, 0, 0.83)", color: "white"}} onClick={handleDelete}>Delete</button>
                <button className="delete-modal-button" style={{backgroundColor: "rgba(22, 106, 232, 0.83)", color: "white", marginLeft: "100px"}} onClick={handleCancel}>Cancel</button>
                </div>
                </div>
        )
    }
}

export function TaskModal({ showModal, setShowModal, modalMessage, messageClass,maxTaskList, cardId }: ModalProps) {
    const createTask = useMutation(api.Tasks.addTask);
    const [taskDescription, setTaskDescription] = React.useState("");
    const [priority, setPriority] = React.useState(1);
    const [order, setOrder] = React.useState(1);

    const handleAddDescription = (text: ChangeEvent<HTMLInputElement>) => {
        setTaskDescription(text.target.value as string);
    }
    
    const handleAddPriority = (text: ChangeEvent<HTMLInputElement>) => {
        setPriority(parseInt(text.target.value))
    }
    
    const handleAddOrder = (text: ChangeEvent<HTMLInputElement>) => {
        setOrder(parseInt(text.target.value));
    }

    const handleAddTask = () => {
        if (!cardId) return
        createTask({
            taskDescription: taskDescription, 
            cardId: cardId, 
            priority: priority, 
            order: order
        });
        setShowModal(false);
    }

    if (showModal === false) {
        return null
    } else {
        return (
            <div style={{position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 9999}}>
            <div style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.18)", zIndex: -1}}></div>
            <div style={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "rgb(237, 225, 225)", padding: "40px", borderRadius: "5px"}}>
                <h1 className={messageClass} style={{color: "rgba(0, 0, 0, 0.87)"}}>{modalMessage}</h1>
                <input 
                    type="text" 
                    placeholder="Task Name" 
                    style={{border: "1px solid black", borderRadius: "5px", padding: "5px", width: "100%", marginBottom: "10px"}}
                    onChange={handleAddDescription}
                    value={taskDescription}
                />
                <input 
                    type="number" 
                    placeholder="Priority" 
                    style={{border: "1px solid black", borderRadius: "5px", padding: "5px", width: "100%", marginBottom: "10px"}} 
                    min={"1"} 
                    max={"3"}
                    onChange={handleAddPriority}
                    value={priority}
                />
                <input 
                    type="number" 
                    placeholder="Task order" 
                    style={{border: "1px solid black", borderRadius: "5px", padding: "5px", width: "100%", marginBottom: "10px"}} 
                    min={"1"} 
                    max={maxTaskList}
                    onChange={handleAddOrder}
                    value={order}
                />

                <button className="delete-modal-button" style={{backgroundColor: "rgba(255, 0, 0, 0.83)", color: "white", marginLeft: "100px", width: "17%", position: "absolute", top: "0%", left: "53%"}} onClick={() => setShowModal(false)}>Close</button>
                <button className="delete-modal-button" style={{backgroundColor: "rgba(0, 255, 0, 0.82)", color: "white", marginLeft: "100px", width: "20%", position: "absolute", top: "83%", right: "40%"}} onClick={handleAddTask}>Add</button>
            </div>
            </div>
        )
    }
}

export function ResearchModal ({ showModal, setShowModal, modalMessage, messageClass, cardId }: ModalProps) {
    const createLink = useMutation(api.ResearchLinks.addLink);
    const [link, setLink] = React.useState("");

    const handleLink = (text: ChangeEvent<HTMLInputElement>) => {
        setLink(text.target.value); 
    }

    const handleAddLink = () => {
        if (!link || !cardId) return   
        createLink({link: link, cardId: cardId});
        setShowModal(false);
    }

        if (showModal === false) {
            return null
        } else {
            return (
                <div style={{position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 9999}}>
                <div style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.18)", zIndex: -1}}></div>
                <div style={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "rgb(237, 225, 225)", padding: "40px", borderRadius: "5px"}}>
                    <h1 className={messageClass} style={{color: "rgba(0, 0, 0, 0.87)"}}>{modalMessage}</h1>

                    <input 
                        type="text" 
                        placeholder="Link"
                        style={{border: "1px solid black", borderRadius: "5px", padding: "5px", width: "100%", marginBottom: "10px"}}
                        onChange={handleLink}
                        value={link}
                    />
                    <button className="delete-modal-button" style={{backgroundColor: "rgba(255, 0, 0, 0.83)", color: "white", marginLeft: "100px", width: "25%", position: "absolute", top: "0%", left: "35%"}} onClick={() => setShowModal(false)}>Close</button>
                    <button className="delete-modal-button" style={{backgroundColor: "rgba(0, 255, 0, 0.82)", color: "white", marginLeft: "100px", width: "20%", position: "absolute", top: "75%", right: "40%"}} onClick={handleAddLink}>Add</button>

                </div>
                </div>
            )
        }
}