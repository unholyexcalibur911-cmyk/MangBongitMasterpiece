import React from "react";
import "./UnderMaintenance.css";

const UnderMaintenance: React.FC = () => (
  <div className="dmc5-bg">
    <div className="dmc5-card">
      <div className="dmc5-loader">
        <span className="dmc5-loader-icon">🗡️</span>
        <span className="dmc5-loader-spinner"></span>
      </div>
      <h1 className="dmc5-title">UNDER MAINTENANCE</h1>
      <p className="dmc5-message">
        <span className="dmc5-red">The inner demons hunt is on.</span><br />
        Our team is unleashing SSS style fixes.<br />
        <span className="dmc5-blue">Please check back soon for more stylish action!</span>
      </p>
      <div className="dmc5-footer">
        <span>AyaSync Team</span>
      </div>
    </div>
  </div>
);

export default UnderMaintenance;