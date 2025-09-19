import React from "react";
import "./index.css";

const UnderMaintenance: React.FC = () => (
  <div style={{
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8fafc",
    color: "#222",
    fontFamily: "sans-serif"
  }}>
    <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚧 Under Maintenance 🚧</h1>
    <p style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>
      Our website is currently undergoing scheduled maintenance.<br />
      Please check back later.
    </p>
    <div style={{
      background: "#fff",
      padding: "1rem 2rem",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      fontSize: "1rem"
    }}>
      Thank you for your patience!
    </div>
  </div>
);

export default UnderMaintenance;