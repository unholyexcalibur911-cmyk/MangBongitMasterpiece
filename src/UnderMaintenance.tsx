import React from "react";
import "./UnderMaintenance.css";
import devImg from "./dev.jpg"; // Place your dev image as dev.jpg in src/

const UnderMaintenance: React.FC = () => (
  <div className="dmc5-bg">
    <div className="dmc5-content">
      <div className="dmc5-left">
        <img src={devImg} alt="Developer" className="dmc5-dev-img" />
      </div>
      <div className="dmc5-right">
        <div className="dmc5-tips-title">TIPS</div>
        <div className="dmc5-tips-bar"></div>
        <div className="dmc5-tips-text">
          The site is currently undergoing stylish upgrades.<br />
          Please check back soon for more action!
        </div>
      </div>
    </div>
    <div className="dmc5-loading-bar">
      <div className="dmc5-loading-progress"></div>
    </div>
  </div>
);

export default UnderMaintenance;