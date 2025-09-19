import React, { useState, useEffect } from "react";
import styles from "./TeamTasks.module.css";
import type { Team, TeamTask } from "./types/team";
import { getTeamTasks, createTask as apiCreateTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask } from "./services/taskService";

interface TeamTasksProps {
  team: Team;
  currentUser: { id: string; email: string; name?: string };
  onBack: () => void;
}

const TeamTasks: React.FC<TeamTasksProps> = ({ team, currentUser, onBack }) => {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [team.id]);

  useEffect(() => {
    // Join the team board room when component mounts
    window.dispatchEvent(new CustomEvent("joinTeamBoard", { detail: { teamId: team.id } }));

    // Listen for board updates (from server)
    const boardHandler = () => {
      // Reload tasks or update board state
      loadTasks();
    };
    window.addEventListener("teamBoardUpdated", boardHandler);

    // Listen for local task updates (from other tabs/users)
    const localHandler = (e: any) => {
      if (e.detail.teamId === team.id) {
        loadTasks();
      }
    };
    window.addEventListener("teamTasksUpdated", localHandler);

    return () => {
      window.removeEventListener("teamBoardUpdated", boardHandler);
      window.removeEventListener("teamTasksUpdated", localHandler);
    };
  }, [team.id]);

  const loadTasks = async () => {
    const apiTasks = await getTeamTasks(team.id);
    setTasks(apiTasks.map((task: TeamTask) => ({ ...task, id: task.id || (task as any)._id })));
  };


  const createTask = async () => {
    if (!newTaskTitle.trim()) return;

    const newTask = {
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      assignedTo: currentUser.id,
      status: 'todo',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser.id
    };

    await apiCreateTask(team.id, newTask);
    loadTasks();
    setNewTaskTitle("");
    setNewTaskDescription("");
    setShowCreateForm(false);
  };

  const updateTaskStatus = (taskId: string, status: TeamTask['status']) => {
    apiUpdateTask(taskId, { status }).then(() => {
      loadTasks();
    });
  };

  const deleteTask = (taskId: string) => {
    apiDeleteTask(taskId).then(() => {
      loadTasks();
    });
  };

  const getTasksByStatus = (status: TeamTask['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const getPriorityColor = (priority: TeamTask['priority']) => {
    switch (priority) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffa726';
      case 'low': return '#66bb6a';
      default: return '#9ca3af';
    }
  };


  return (
    <div className={styles.teamTasksContainer}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Teams
        </button>
        <div className={styles.teamInfo}>
          <h1>{team.name} - Team Tasks</h1>
          <p>{team.description}</p>
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={styles.createTaskButton}
        >
          ➕ Create Task
        </button>
      </div>

      {showCreateForm && (
        <div className={styles.createTaskForm}>
          <h3>Create New Task</h3>
          <div className={styles.formGroup}>
            <label>Task Title *</label>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className={styles.formInput}
              placeholder="Enter task title"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className={styles.formTextarea}
              placeholder="Enter task description"
              rows={3}
            />
          </div>
          <div className={styles.formActions}>
            <button onClick={() => setShowCreateForm(false)} className={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={createTask} className={styles.createButton}>
              Create Task
            </button>
          </div>
        </div>
      )}

      <div className={styles.kanbanBoard}>
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>To Do ({getTasksByStatus('todo').length})</h3>
          <div className={styles.taskList}>
            {getTasksByStatus('todo').map(task => (
              <div key={task.id} className={styles.taskCard}>
                <div className={styles.taskHeader}>
                  <h4>{task.title}</h4>
                  <div 
                    className={styles.priorityBadge}
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </div>
                </div>
                {task.description && (
                  <p className={styles.taskDescription}>{task.description}</p>
                )}
                <div className={styles.taskActions}>
                  <button 
                    onClick={() => updateTaskStatus(task.id, 'in-progress')}
                    className={styles.actionButton}
                  >
                    Start
                  </button>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>In Progress ({getTasksByStatus('in-progress').length})</h3>
          <div className={styles.taskList}>
            {getTasksByStatus('in-progress').map(task => (
              <div key={task.id} className={styles.taskCard}>
                <div className={styles.taskHeader}>
                  <h4>{task.title}</h4>
                  <div 
                    className={styles.priorityBadge}
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </div>
                </div>
                {task.description && (
                  <p className={styles.taskDescription}>{task.description}</p>
                )}
                <div className={styles.taskActions}>
                  <button 
                    onClick={() => updateTaskStatus(task.id, 'completed')}
                    className={styles.actionButton}
                  >
                    Complete
                  </button>
                  <button 
                    onClick={() => updateTaskStatus(task.id, 'todo')}
                    className={styles.actionButton}
                  >
                    Back to Todo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Completed ({getTasksByStatus('completed').length})</h3>
          <div className={styles.taskList}>
            {getTasksByStatus('completed').map(task => (
              <div key={task.id} className={styles.taskCard}>
                <div className={styles.taskHeader}>
                  <h4>{task.title}</h4>
                  <div 
                    className={styles.priorityBadge}
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </div>
                </div>
                {task.description && (
                  <p className={styles.taskDescription}>{task.description}</p>
                )}
                <div className={styles.taskActions}>
                  <button 
                    onClick={() => updateTaskStatus(task.id, 'in-progress')}
                    className={styles.actionButton}
                  >
                    Reopen
                  </button>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamTasks;
