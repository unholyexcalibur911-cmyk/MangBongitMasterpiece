import { useState } from "react";
import styles from "./Dashboard.module.css";

const initialBoards = [
  {
    id: 1,
    title: "MIH Project Dashboard",
    color: "#1756a9",
    sections: [
      {
        id: 1,
        title: "Planning Phase",
        cards: [
          {
            id: 1,
            title: "Project Requirements Analysis",
            description:
              "Gather and document all project requirements from stakeholders",
            status: "progress",
            statusColor: "#1cc6a6",
          },
          {
            id: 2,
            title: "Resource Allocation",
            description: "Assign team members and allocate necessary resources",
            status: "progress",
            statusColor: "#1cc6a6",
          },
          {
            id: 3,
            title: "Timeline Creation",
            description: "Develop detailed project timeline with milestones",
            status: "pending",
            statusColor: "#f7c948",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Development Sprint",
    color: "#1ca94c",
    sections: [
      {
        id: 2,
        title: "Backlog",
        cards: [],
      },
      {
        id: 3,
        title: "In Development",
        cards: [
          {
            id: 4,
            title: "Dashboard UI Components",
            description: "Create responsive dashboard UI components",
            status: "pending",
            statusColor: "#f7c948",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Finished Tasks",
    color: "#1756a9",
    sections: [
      {
        id: 4,
        title: "",
        cards: [
          {
            id: 5,
            title: "User Authentication Module",
            description: "Implement secure user login and registration system",
            status: "done",
            statusColor: "#e94f4f",
          },
          {
            id: 6,
            title: "API Integration",
            description: "Integrate with external APIs and services",
            status: "done",
            statusColor: "#a259e9",
          },
        ],
      },
    ],
  },
];

function Dashboard() {
  const [boards] = useState(initialBoards);

  // Add, delete, update logic for boards, sections, cards can be implemented here

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>MIH Project Management</h1>
        <div className={styles.headerControls}>
          <button className={styles.addBoardBtn}>+ Add Board</button>
          <span className={styles.userInfo}>
            <span className={styles.userIcon}>👤</span> pogiako123
          </span>
          <button className={styles.signOutBtn}>Sign Out</button>
          <button className={styles.settingsBtn}>⚙️</button>
        </div>
      </header>
      <div className={styles.boardsWrapper}>
        {boards.map((board) => (
          <div
            key={board.id}
            className={styles.boardColumn}
            style={{ borderColor: board.color }}
          >
            <div
              className={styles.boardHeader}
              style={{ background: board.color }}
            >
              <span>{board.title}</span>
              <div>
                <button className={styles.addBtn}>+</button>
                <button className={styles.deleteBtn}>🗑️</button>
              </div>
            </div>
            {board.sections.map((section) => (
              <div key={section.id} className={styles.section}>
                {section.title && (
                  <div className={styles.sectionTitle}>{section.title}</div>
                )}
                <div className={styles.cardsWrapper}>
                  {section.cards.map((card) => (
                    <div key={card.id} className={styles.card}>
                      <div className={styles.cardTitle}>{card.title}</div>
                      <div className={styles.cardDesc}>{card.description}</div>
                      <div
                        className={styles.statusBar}
                        style={{ background: card.statusColor }}
                      ></div>
                    </div>
                  ))}
                  <button className={styles.addCardBtn}>+ Add a card</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
