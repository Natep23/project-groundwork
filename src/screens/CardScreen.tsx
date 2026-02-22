import React from "react";
import { api } from "../convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "../convex/_generated/dataModel";
import "../index.css";
import { CardProps, TaskProps } from "../components/card";
import links from "../Example-Data/research-links.json";
import tasks from "../Example-Data/tasks.json";
import { Dropzone } from "../components/Dropzone";
import { ResearchList, ResearchListProps } from "../components/ResearchList";
import { useNavigate } from  "react-router-dom";



export default function CardScreen() {
    const id = (window.location.href.substring(window.location.href.lastIndexOf('/') + 1)) as Id<"Cards">;
    const fetchCardDetails = useQuery(api.Cards.getCardDetails, { id });

    const fetchTasks = useQuery(api.Tasks.getTasks, { cardId: id });
    const fetchLinks = useQuery(api.ResearchLinks.getLinks, { cardId: id });


    
    const navigation = useNavigate();

    const title = fetchCardDetails?.[0] ?? "Title not found";
    const description = fetchCardDetails?.[1] ?? "Description not found";

    const [researchList, getResearchList] = React.useState(fetchLinks);
    const [taskList, getTaskList] = React.useState(fetchTasks);

    React.useEffect(() => {
        getTaskList(fetchTasks);
        getResearchList(fetchLinks);
    }, [fetchTasks, fetchLinks]);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
    }

    const onDragStart = (e: React.DragEvent, task: TaskProps) => {
        e.dataTransfer.setData('task', JSON.stringify(task));
      };

      const handleOnDragOver = (e: React.DragEvent, card: any) => {
        e.preventDefault();
        
      };

    return (
    <div className="card-screen-container">
        <div className="card-screen-header">
            <button onClick={() => navigation("/")}>Back to Dashboard</button>
        </div>
        <span className="card-screen-title">{title}</span>
        <span className="card-screen-description">{description}</span>
        <div className="tasks-research-area">
            {/* <div> */}
                <Dropzone
                    className="task-dropzone" 
                    draggable={true} 
                    dropzoneTitle="Task"
                    list={taskList as TaskProps[]} 
                    onDragStart={onDragStart} 
                    onDrop={onDrop}
                    onDragOver={handleOnDragOver}
                    id={id}
                    isTaskCard
                />
            {/* </div> */}
            {/* <div> */}
                <ResearchList 
                    className="research-list" 
                    title="Current Research"
                    cardId={id}
                    list={researchList?.map((item) => item.link)}
                />
            {/* </div> */}
        </div>
    </div>
    )
}