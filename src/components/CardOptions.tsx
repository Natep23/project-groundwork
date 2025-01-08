import React from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import "../index.css";


interface CardOptionsProps {
    _id: Id<"Cards">;
}

  
export const CardOptions = ({_id} : CardOptionsProps) => {
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const deleteCard = useMutation(api.Cards.removeCard);
  
    const deleteConfirmation = () => {
      setShowDeleteModal(true);
    }
  
    const handleDelete = () => {
      deleteCard({id:_id});
      setShowDeleteModal(false);
    }
  
    const handleCancel = () => {
      setShowDeleteModal(false);
    }
  
    return (
        <div className="card-options-container">
        <button className="view-button" onClick={() => {console.log("View clicked")}} key={"view"}>View</button>
        <button className="delete-button" onClick={deleteConfirmation} key={"delete"}>Delete</button>
        {showDeleteModal && (
          <div className="delete-modal-container" style={{position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 9999}}>
            <div className="delete-modal-background" style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: -1}}></div>
            <div className="delete-modal" style={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "rgb(195, 193, 193)", padding: "40px", borderRadius: "5px"}}>
              <p>Are you sure you want to delete this card?</p>
              <button className="delete-modal-button" style={{backgroundColor: "red", color: "white"}} onClick={handleDelete}>Delete</button>
              <button className="delete-modal-button" style={{backgroundColor: "blue", color: "white", marginLeft: "100px"}} onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

export default CardOptions;