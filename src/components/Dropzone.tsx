import React from "react";
import "../index.css";
import { Card, CardProps, TaskCard, TaskProps } from "../components/card";
import { useNavigate } from  "react-router-dom";
import { TaskModal } from "./Modals";
import { Id } from "../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";


interface DropzoneProps {
  cardStatus?: "Research" | "In Progress" | "Completed";
  dropzoneTitle: string;
  className?: string;
  list?: CardProps[] | TaskProps[] | [] | undefined;
  isTaskCard: boolean;
  draggable: boolean;
  id?: Id<"Cards">
  onDrop: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent, card: any) => void;
  onDragStart: (e: React.DragEvent, card: any) => void;
}

export const Dropzone = ({
  cardStatus,
  dropzoneTitle,
  className,
  list,
  draggable,
  onDrop,
  onDragOver,
  onDragStart,
  isTaskCard,
  id
}: DropzoneProps) => {


const navigation = useNavigate();
const [showModal, setShowModal] = React.useState(false);
const addTask = useMutation(api.Tasks.addTask);


const handleAddTask = () => {
  console.log("add task");
  setShowModal(true);
  const [taskDescription, priority, order] = ["", 1, 1];
  addTask({taskDescription: taskDescription, cardId: id as Id<"Cards">, priority: priority, order: order});
}

  let Content;

  if (!isTaskCard && onDragOver) {
    Content = (
      <fieldset
        className={className}
        onDrop={onDrop}
        onDragOver={(e) => onDragOver(e, { phase: cardStatus })}
      >
        <legend className="dropzone-title">{dropzoneTitle}</legend>
        <div className="card-container">
          <button className="add-card-button" onClick={() => navigation("/create-card")}>
            <img
              src="https://img.icons8.com/ios/50/000000/plus-math.png"
              alt="add-card"
            />
          </button>
          {list?.map((card, index) => (
            <Card {...card} key={index} draggable={draggable} onDragStart={(e) => onDragStart(e,card)} _id={card._id as Id<"Cards">}/>
          ))}
        </div>
      </fieldset>
    );
  } else if (onDragOver) {
    Content = (
      <fieldset 
      className={className}
      onDrop={onDrop}
      onDragOver ={(e) => onDragOver(e, { taskDescription: dropzoneTitle })}
      >
        <legend>{dropzoneTitle}</legend>
        {list?.sort((a, b) => (a as TaskProps).order - (b as TaskProps).order)?.map((task, index) => ( <>
          <TaskCard {...task as TaskProps} key={index} order={index + 1} onTaskDragStart={(e) => onDragStart(e,task)}/>
          </>
        ))}
        <div className="task-card" draggable={false} onClick={handleAddTask}>
            <img
              src="https://img.icons8.com/ios/50/000000/plus-math.png"
              alt="add-card"
            />
        </div>
        <TaskModal showModal={showModal} setShowModal={setShowModal} modalMessage="Add Task" handleAdd={handleAddTask}/>
      </fieldset>
    );
  } else {
  Content = (
    <div>
      <h1>Something Went Wrong</h1>
    </div>
  );
}
  return Content;
};
