import React from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useNavigate } from  "react-router-dom";
import { DeleteModal } from "./Modals";
import "../index.css";


interface CardOptionsProps {
    _id: Id<"Cards">;
}

  
export const CardOptions = ({_id} : CardOptionsProps) => {
    
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const deleteCard = useMutation(api.Cards.removeCard);
  
    const navigation = useNavigate();
    
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

    const handleViewClick = () => {
      navigation(`/card/${_id}`);
    }
  
    return (
        <div className="card-options-container">
          <button className="view-button" onClick={handleViewClick} key={"view"}>View</button>
          <button className="delete-button" onClick={deleteConfirmation} key={"delete"}>Delete</button>
          <DeleteModal 
            showModal={showDeleteModal} 
            setShowModal={setShowDeleteModal}
            messageClass="delete-card-title" 
            modalMessage="Are you sure you want to delete this card?" 
            handleCancel={handleCancel} 
            handleDelete={handleDelete}
          />
      </div>
    );
  }

export default CardOptions;