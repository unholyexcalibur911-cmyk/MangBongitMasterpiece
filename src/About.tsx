import React from "react";
import styles from "./Services.module.css";
import appStyles from "./App.module.css";

const About: React.FC = () => {
  return (
    <main className={`${appStyles.main} ${styles.servicesPage}`}>
      <section className={styles.servicesHero}>
        <h1 className={styles.servicesTitle}>About AyaSync</h1>
        <p className={styles.servicesLead}>
          AyaSync is a modern project management solution built for teams who
          value speed, clarity, and collaboration.
        </p>
      </section>
      <section className={styles.servicesRows}>
        <p className={styles.servicesCardDesc}>
          <strong>Our Mission:</strong> Empower teams to deliver projects on
          time and with confidence. AyaSync streamlines task management,
          communication, and reporting so you can focus on what matters most.
        </p>
        <p className={styles.servicesCardDesc}>
          <strong>Why AyaSync?</strong> Built with React, TypeScript, and Vite,
          AyaSync is fast, reliable, and easy to use. Our intuitive interface
          and robust features help teams stay organized and productive.
        </p>
        <p className={styles.servicesCardDesc}>
          <strong>Collaboration:</strong> Share boards, assign tasks, and track
          progress together. AyaSync makes teamwork seamless, whether you're
          remote or in the office.
        </p>
      </section>
    </main>
  );
};

export default About;
