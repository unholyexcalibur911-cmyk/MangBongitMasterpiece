import React from "react";
import "./UnderMaintenance.css";

const UnderMaintenance: React.FC = () => (
  <div className="dmc-bg">
    <div className="dmc-card">
      <div className="dmc-icon">🩸</div>
      <h1 className="dmc-title">UNDER MAINTENANCE</h1>
      <p className="dmc-message">
        <span className="dmc-red">The gates are sealed.</span><br />
        Our crew is slaying bugs and demons.<br />
        <span className="dmc-blue">Check back soon for stylish action!</span>
      </p>
      <div className="dmc-footer">
        <span>AyaSync Team</span>
      </div>
    </div>
  </div>
);

export default UnderMaintenance;