import React from "react";
import "../index.css"

interface ModalProps {
    showModal: boolean;
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
    messageClass?: string
    modalMessage?: string
    maxTaskList?: number
    handleCancel?: () => void
    handleDelete?: () => void
    addTask?: () => void
    handleAdd?: () => void
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

export function TaskModal({ showModal, setShowModal, modalMessage, messageClass,maxTaskList, addTask, handleAdd }: ModalProps) {
    if (showModal === false) {
        return null
    } else {
        return (
            <div style={{position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 9999}}>
            <div style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.18)", zIndex: -1}}></div>
            <div style={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "rgb(237, 225, 225)", padding: "40px", borderRadius: "5px"}}>
                <h1 className={messageClass} style={{color: "rgba(0, 0, 0, 0.87)"}}>{modalMessage}</h1>
                <input type="text" placeholder="Task Name" style={{border: "1px solid black", borderRadius: "5px", padding: "5px", width: "100%", marginBottom: "10px"}}></input>
                <input type="number" placeholder="Priority" style={{border: "1px solid black", borderRadius: "5px", padding: "5px", width: "100%", marginBottom: "10px"}} min={"1"} max={"3"}></input>
                <input type="number" placeholder="Task order" style={{border: "1px solid black", borderRadius: "5px", padding: "5px", width: "100%", marginBottom: "10px"}} min={"1"} max={maxTaskList}></input>
                <button className="delete-modal-button" style={{backgroundColor: "rgba(255, 0, 0, 0.83)", color: "white", marginLeft: "100px", width: "17%", position: "absolute", top: "0%", left: "53%"}} onClick={() => setShowModal(false)}>Close</button>
                <button className="delete-modal-button" style={{backgroundColor: "rgba(0, 255, 0, 0.82)", color: "white", marginLeft: "100px", width: "20%", position: "absolute", top: "83%", right: "40%"}} onClick={handleAdd}>Add</button>
            </div>
            </div>
        )
    }
}