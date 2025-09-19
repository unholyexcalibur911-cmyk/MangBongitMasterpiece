import React from "react";
import "./UnderMaintenance.css";
import devImg from "./dev.jpg"; // Place your dev image as dev.jpg in src/

const UnderMaintenance: React.FC = () => (
  <div className="dmc5-bg">
    <div className="dmc5-loading-container">
      <div className="dmc5-left">
        <img src={devImg} alt="Developer" className="dmc5-dev-img" />
      </div>
      <div className="dmc5-right">
        <h1 className="dmc5-title">UNDER MAINTENANCE</h1>
        <div className="dmc5-tips">
          <span className="dmc5-tips-label">TIPS</span>
          <p>
            The site is currently undergoing stylish upgrades.<br />
            Please check back soon for more action!
          </p>
        </div>
      </div>
    </div>
    <div className="dmc5-loading-bar">
      <div className="dmc5-loading-progress"></div>
    </div>
  </div>
);

export default UnderMaintenance;