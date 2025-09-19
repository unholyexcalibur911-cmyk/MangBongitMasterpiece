import React, { useState, useRef } from "react";
import HeaderMenu from "./HeaderMenu";
import Footer from "./Footer";
import Profile from "./Profile";
import AdminDashboard from "./AdminDashboard";
import TeamManagement from "./TeamManagement";
import About from "./About";
import Services from "./Services";
import Contact from "./Contact";
import styles from "./App.module.css";
import {
  QueryClientProvider,
  QueryClient,
  useQuery,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

// Example: fetch team members (replace with your real API)
const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  // Replace with API call
  const res = await fetch("/api/team-members");
  if (!res.ok) throw new Error("Failed to fetch team members");
  return await res.json();
};

type TeamMember = {
  id: string;
  name: string;
  avatar: string;
  email: string;
};

type Task = {
  id: string;
  text: string;
  completed?: boolean;
  createdAt?: Date;
  priority?: "high" | "medium" | "low";
  assignedTo?: string[];
};
type List = { id: string; title: string; tasks: Task[] };

function generateId(prefix: string = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const defaultLists: List[] = [
  {
    id: generateId("list"),
    title: "Today",
    tasks: [
      {
        id: generateId("task"),
        text: "Start adding Task",
        completed: false,
        assignedTo: [],
      },
    ],
  },
  { id: generateId("list"), title: "This Week", tasks: [] },
  { id: generateId("list"), title: "This Month", tasks: [] },
  { id: generateId("list"), title: "Do Later", tasks: [] },
];

interface AppProps {
  onAdminClick: () => void;
}

const App: React.FC<AppProps> = () => {
  const [currentView, setCurrentView] = useState<
    | "dashboard"
    | "profile"
    | "admin"
    | "teams"
    | "about"
    | "services"
    | "contact"
  >("dashboard");

  // Mock current user data
  const currentUser = {
    id: "current_user_1",
    email: "current.user@company.com",
    name: "Current User",
  };

  // Task Manager State
  const [lists, setLists] = useState<List[]>(defaultLists);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const dragRef = useRef<{
    listId: string;
    taskId: string;
    taskIndex: number;
  } | null>(null);
  const [sortBy, setSortBy] = useState<"priority" | "date" | "alphabetical">(
    "priority",
  );
  const [showTeamDropdown, setShowTeamDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

  // Sorting function
  const sortTasks = (tasks: Task[], sortType: typeof sortBy): Task[] => {
    return [...tasks].sort((a, b) => {
      switch (sortType) {
        case "alphabetical":
          return a.text.localeCompare(b.text);
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (
            (priorityOrder[b.priority || "medium"] || 2) -
            (priorityOrder[a.priority || "medium"] || 2)
          );
        case "date":
          return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
        default:
          return 0;
      }
    });
  };

  // Task Manager Functions
  const addTask = (listId: string, text: string) => {
    const newTask = {
      id: generateId("task"),
      text,
      completed: false,
      assignedTo: [],
    };
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, tasks: [...l.tasks, newTask] } : l,
      ),
    );
  };

  const toggleTaskCompletion = (listId: string, taskId: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
              ...l,
              tasks: l.tasks.map((t) =>
                t.id === taskId ? { ...t, completed: !t.completed } : t,
              ),
            }
          : l,
      ),
    );
  };

  const renameTask = (listId: string, taskId: string, newText: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
              ...l,
              tasks: l.tasks.map((t) =>
                t.id === taskId ? { ...t, text: newText } : t,
              ),
            }
          : l,
      ),
    );
  };

  const toggleTaskPriority = (listId: string, taskId: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
              ...l,
              tasks: l.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      priority: t.priority === "high" ? "medium" : "high",
                    }
                  : t,
              ),
            }
          : l,
      ),
    );
  };

  const assignTaskToMember = (
    listId: string,
    taskId: string,
    memberId: string,
  ) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
              ...l,
              tasks: l.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      assignedTo: t.assignedTo?.includes(memberId)
                        ? t.assignedTo.filter((id) => id !== memberId)
                        : [...(t.assignedTo || []), memberId],
                    }
                  : t,
              ),
            }
          : l,
      ),
    );
  };

  const addList = (title: string) => {
    const newList = { id: generateId("list"), title, tasks: [] };
    setLists((prev) => [...prev, newList]);
  };

  const renameList = (listId: string, newTitle: string) => {
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, title: newTitle } : l)),
    );
  };

  const deleteTask = (listId: string, taskId: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) }
          : l,
      ),
    );
  };

  // Drag and Drop Functions
  const onDragStart = (listId: string, taskId: string, taskIndex: number) => {
    dragRef.current = { listId, taskId, taskIndex };
    setDraggedTaskId(taskId);
  };

  const onDragEnd = () => {
    dragRef.current = null;
    setDraggedTaskId(null);
  };

  const onDrop = (targetListId: string) => {
    if (!dragRef.current) return;
    const { listId: sourceListId, taskId } = dragRef.current;

    const sourceList = lists.find((l) => l.id === sourceListId);
    const task = sourceList?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    setLists((prev) =>
      prev.map((l) => {
        if (l.id === sourceListId) {
          return { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) };
        }
        if (l.id === targetListId) {
          return { ...l, tasks: [...l.tasks, task] };
        }
        return l;
      }),
    );
  };

  const onDropToFinished = () => {
    if (!dragRef.current) return;
    const { listId: sourceListId, taskId } = dragRef.current;

    const sourceList = lists.find((l) => l.id === sourceListId);
    const task = sourceList?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    setLists((prev) =>
      prev.map((l) => {
        if (l.id === sourceListId) {
          return {
            ...l,
            tasks: l.tasks.map((t) =>
              t.id === taskId ? { ...t, completed: true } : t,
            ),
          };
        }
        return l;
      }),
    );
  };

  const onDropBefore = (targetListId: string, targetIndex: number) => {
    if (!dragRef.current) return;
    const {
      listId: sourceListId,
      taskId,
      taskIndex: sourceIndex,
    } = dragRef.current;

    const sourceList = lists.find((l) => l.id === sourceListId);
    const task = sourceList?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    setLists((prev) =>
      prev.map((l) => {
        if (l.id === sourceListId) {
          return { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) };
        }
        if (l.id === targetListId) {
          const newTasks = [...l.tasks];
          const adjustedIndex =
            sourceListId === targetListId && sourceIndex < targetIndex
              ? targetIndex - 1
              : targetIndex;
          newTasks.splice(adjustedIndex, 0, task);
          return { ...l, tasks: newTasks };
        }
        return l;
      }),
    );
  };

  // Profile view
  if (currentView === "profile") {
    return (
      <div className={styles.app}>
        <HeaderMenu
          onProfileClick={() => setCurrentView("profile")}
          onAdminClick={() => setCurrentView("admin")}
          onTeamsClick={() => setCurrentView("teams")}
          onAboutClick={() => setCurrentView("about")}
          onHomeClick={() => setCurrentView("dashboard")}
          onServicesClick={() => setCurrentView("services")}
          onContactClick={() => setCurrentView("contact")}
        />
        <main className={styles.main}>
          <Profile onBack={() => setCurrentView("dashboard")} />
        </main>
        <Footer />
      </div>
    );
  }

  // Admin view
  if (currentView === "admin") {
    return (
      <div className={styles.app}>
        <HeaderMenu
          onProfileClick={() => setCurrentView("profile")}
          onAdminClick={() => setCurrentView("admin")}
          onTeamsClick={() => setCurrentView("teams")}
          onAboutClick={() => setCurrentView("about")}
          onHomeClick={() => setCurrentView("dashboard")}
          onServicesClick={() => setCurrentView("services")}
          onContactClick={() => setCurrentView("contact")}
        />
        <main className={styles.main}>
          <AdminDashboard onBack={() => setCurrentView("dashboard")} />
        </main>
        <Footer />
      </div>
    );
  }

  // Teams view
  if (currentView === "teams") {
    return (
      <div className={styles.app}>
        <HeaderMenu
          onProfileClick={() => setCurrentView("profile")}
          onAdminClick={() => setCurrentView("admin")}
          onTeamsClick={() => setCurrentView("teams")}
          onAboutClick={() => setCurrentView("about")}
          onHomeClick={() => setCurrentView("dashboard")}
          onServicesClick={() => setCurrentView("services")}
          onContactClick={() => setCurrentView("contact")}
        />
        {currentView === "teams" && (
          <TeamManagement
            currentUser={currentUser}
            tasks={lists.flatMap((list) => list.tasks)}
            onAssignTask={assignTaskToMember}
            lists={lists}
          />
        )}
        <Footer />
      </div>
    );
  }

  // About view
  if (currentView === "about") {
    return (
      <div className={styles.app}>
        <HeaderMenu
          onProfileClick={() => setCurrentView("profile")}
          onAdminClick={() => setCurrentView("admin")}
          onTeamsClick={() => setCurrentView("teams")}
          onAboutClick={() => setCurrentView("about")}
          onHomeClick={() => setCurrentView("dashboard")}
          onServicesClick={() => setCurrentView("services")}
          onContactClick={() => setCurrentView("contact")}
        />
        <main className={styles.main}>
          <About />
        </main>
        <Footer />
      </div>
    );
  }

  // Services view
  if (currentView === "services") {
    return (
      <div className={styles.app}>
        <HeaderMenu
          onProfileClick={() => setCurrentView("profile")}
          onAdminClick={() => setCurrentView("admin")}
          onTeamsClick={() => setCurrentView("teams")}
          onAboutClick={() => setCurrentView("about")}
          onHomeClick={() => setCurrentView("dashboard")}
          onServicesClick={() => setCurrentView("services")}
          onContactClick={() => setCurrentView("contact")}
        />
        <main className={styles.main}>
          <Services />
        </main>
        <Footer />
      </div>
    );
  }

  // Contact view
  if (currentView === "contact") {
    return (
      <div className={styles.app}>
        <HeaderMenu
          onProfileClick={() => setCurrentView("profile")}
          onAdminClick={() => setCurrentView("admin")}
          onTeamsClick={() => setCurrentView("teams")}
          onAboutClick={() => setCurrentView("about")}
          onHomeClick={() => setCurrentView("dashboard")}
          onServicesClick={() => setCurrentView("services")}
          onContactClick={() => setCurrentView("contact")}
        />
        <main className={styles.main}>
          <Contact />
        </main>
        <Footer />
      </div>
    );
  }

  // Fetch team members using React Query
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["teamMembers"],
    queryFn: fetchTeamMembers,
  });

  // Default view - Task Manager as HomePage with Header Menu on top
  return (
    <div className={styles.app}>
      <HeaderMenu
        onProfileClick={() => setCurrentView("profile")}
        onAdminClick={() => setCurrentView("admin")}
        onTeamsClick={() => setCurrentView("teams")}
        onAboutClick={() => setCurrentView("about")}
        onHomeClick={() => setCurrentView("dashboard")}
        onServicesClick={() => setCurrentView("services")}
        onContactClick={() => setCurrentView("contact")}
      />
      <main className={styles.main}>
        <div className={styles.projectBoard}>
          <div className={styles.boardHeader}>
            <div className={styles.boardTitleSection}>
              <h2 className={styles.boardTitle}>✨ My Project Board</h2>
              <p className={styles.boardSubtitle}>
                Organize and track your tasks efficiently
              </p>
            </div>
            <div className={styles.boardStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>
                  {lists.reduce((acc, list) => acc + list.tasks.length, 0)}
                </span>
                <span className={styles.statLabel}>Total Tasks</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>
                  {lists.reduce(
                    (acc, list) =>
                      acc + list.tasks.filter((t) => t.completed).length,
                    0,
                  )}
                </span>
                <span className={styles.statLabel}>Completed</span>
              </div>
            </div>
            <div className={styles.sortControls}>
              <label htmlFor="sortSelect" className={styles.sortLabel}>
                Sort by:
              </label>
              <select
                id="sortSelect"
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="none">Default</option>
                <option value="alphabetical">A-Z</option>
                <option value="priority">Priority</option>
                <option value="date">Date Created</option>
              </select>
            </div>
          </div>
          <div className={styles.boardContainer}>
            {lists.map((list) => (
              <div
                key={list.id}
                className={styles.boardColumn}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(list.id)}
              >
                <div className={styles.columnHeader}>
                  <div className={styles.columnTitle}>
                    <input
                      className={styles.columnTitleInput}
                      value={list.title}
                      onChange={(e) => renameList(list.id, e.target.value)}
                    />
                    <div className={styles.columnActions}>
                      <button
                        className={styles.columnButton}
                        onClick={() => {
                          const taskText = prompt("Enter task:");
                          if (taskText) addTask(list.id, taskText);
                        }}
                      >
                        ➕ Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.columnContent}>
                  {sortTasks(list.tasks, sortBy).map((task, index) => (
                    <div
                      key={task.id}
                      className={`${styles.taskCard} ${
                        draggedTaskId === task.id ? styles.dragging : ""
                      }`}
                      draggable
                      onDragStart={() => onDragStart(list.id, task.id, index)}
                      onDragEnd={onDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDropBefore(list.id, index)}
                    >
                      <div className={styles.taskCardHeader}>
                        <div className={styles.taskCheckbox}>
                          <button
                            className={`${styles.checkButton} ${task.completed ? styles.checked : ""}`}
                            onClick={() =>
                              toggleTaskCompletion(list.id, task.id)
                            }
                          >
                            {task.completed ? "✓" : ""}
                          </button>
                        </div>
                        <input
                          className={`${styles.taskCardTitle} ${task.completed ? styles.completed : ""}`}
                          value={task.text}
                          onChange={(e) =>
                            renameTask(list.id, task.id, e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.taskCardContent}>
                        <p className={styles.taskDescription}>
                          Task details and description
                        </p>
                        <div className={styles.taskProgress}>
                          <div className={styles.progressBar}></div>
                        </div>
                      </div>
                      <div className={styles.taskCardActions}>
                        <div className={styles.teamSection}>
                          <div className={styles.assignedMembers}>
                            {task.assignedTo?.map((memberId) => {
                              const member = teamMembers.find(
                                (m) => m.id === memberId,
                              );
                              return member ? (
                                <span
                                  key={memberId}
                                  className={styles.memberAvatar}
                                  title={member.name}
                                >
                                  {member.avatar}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                        <div className={styles.taskActions}>
                          <button
                            className={`${styles.starButton} ${task.priority === "high" ? styles.starred : ""}`}
                            onClick={() => toggleTaskPriority(list.id, task.id)}
                            title={
                              task.priority === "high"
                                ? "Remove from priority"
                                : "Mark as priority"
                            }
                          >
                            {task.priority === "high" ? "⭐" : "☆"}
                          </button>
                          <div className={styles.teamAssignmentContainer}>
                            <button
                              className={styles.assignButton}
                              onClick={(e) => {
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                setDropdownPosition({
                                  top: rect.bottom + window.scrollY + 5,
                                  left: rect.right - 320 + window.scrollX,
                                });
                                setShowTeamDropdown(
                                  showTeamDropdown === task.id ? null : task.id,
                                );
                              }}
                              title="Assign to team member"
                            >
                              <span>👥</span>
                              <span>Team</span>
                              {task.assignedTo &&
                                task.assignedTo.length > 0 && (
                                  <span className={styles.assignedCount}>
                                    {task.assignedTo.length}
                                  </span>
                                )}
                            </button>

                            {/* Team Assignment Dropdown */}
                            {showTeamDropdown === task.id && (
                              <div
                                className={styles.teamDropdown}
                                style={{
                                  top: dropdownPosition.top,
                                  left: dropdownPosition.left,
                                }}
                              >
                                <div className={styles.dropdownHeader}>
                                  <span>Assign to Team Members</span>
                                  <button
                                    className={styles.closeDropdown}
                                    onClick={() => setShowTeamDropdown(null)}
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className={styles.membersList}>
                                  {teamMembers.map((member) => (
                                    <div
                                      key={member.id}
                                      className={`${styles.memberOption} ${
                                        task.assignedTo?.includes(member.id)
                                          ? styles.assigned
                                          : ""
                                      }`}
                                      onClick={() =>
                                        assignTaskToMember(
                                          list.id,
                                          task.id,
                                          member.id,
                                        )
                                      }
                                    >
                                      <div className={styles.memberInfo}>
                                        <span className={styles.memberAvatar}>
                                          {member.avatar}
                                        </span>
                                        <div className={styles.memberDetails}>
                                          <span className={styles.memberName}>
                                            {member.name}
                                          </span>
                                          <span className={styles.memberEmail}>
                                            {member.email}
                                          </span>
                                        </div>
                                      </div>
                                      <div className={styles.assignmentStatus}>
                                        {task.assignedTo?.includes(
                                          member.id,
                                        ) ? (
                                          <span className={styles.assignedIcon}>
                                            ✓
                                          </span>
                                        ) : (
                                          <span
                                            className={styles.unassignedIcon}
                                          >
                                            +
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {task.assignedTo &&
                                  task.assignedTo.length > 0 && (
                                    <div
                                      className={styles.assignedMembersPreview}
                                    >
                                      <span className={styles.previewLabel}>
                                        Assigned to:
                                      </span>
                                      <div className={styles.assignedAvatars}>
                                        {task.assignedTo.map((memberId) => {
                                          const member = teamMembers.find(
                                            (m) => m.id === memberId,
                                          );
                                          return member ? (
                                            <span
                                              key={memberId}
                                              className={styles.assignedAvatar}
                                              title={member.name}
                                            >
                                              {member.avatar}
                                            </span>
                                          ) : null;
                                        })}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                          <button
                            className={styles.deleteButton}
                            onClick={() => deleteTask(list.id, task.id)}
                            title="Delete Task"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className={styles.addColumnButton}>
              <ListComposer onAdd={(title) => addList(title)} />
            </div>
          </div>
        </div>

        <div
          className={styles.finishedTasksPanel}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropToFinished}
        >
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Finished Tasks</h3>
          </div>
          <div className={styles.panelContent}>
            {lists.flatMap((l) => l.tasks).filter((t) => t.completed).length ===
            0 ? (
              <p className={styles.noTasksMessage}>No finished tasks yet</p>
            ) : (
              lists
                .flatMap((l) => l.tasks)
                .filter((t) => t.completed)
                .map((task) => (
                  <div key={task.id} className={styles.finishedTask}>
                    <span className={styles.finishedTaskText}>{task.text}</span>
                    <span className={styles.checkIcon}>✓</span>
                  </div>
                ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const ListComposer: React.FC<{ onAdd: (title: string) => void }> = ({
  onAdd,
}) => {
  const [title, setTitle] = useState("");
  return (
    <div className={styles.listComposer}>
      <input
        className={styles.listInput}
        placeholder="Add another list"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim()) {
            onAdd(title);
            setTitle("");
          }
        }}
      />
      <button
        className={styles.addList}
        onClick={() => {
          if (title.trim()) {
            onAdd(title);
            setTitle("");
          }
        }}
      >
        + Add List
      </button>
    </div>
  );
};

// Wrap your app with QueryClientProvider at the root
const AppWithQueryProvider = (props: AppProps) => (
  <QueryClientProvider client={queryClient}>
    <App {...props} />
  </QueryClientProvider>
);

export default AppWithQueryProvider;
