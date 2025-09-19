import React, { useRef, useEffect, useState } from "react";
import "./UnderMaintenance.css";
import devImg from "./dev.jpg";

const JCE_ANIMATION_DURATION = 1200; // ms

const UnderMaintenance: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [showJCE, setShowJCE] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (showJCE) return;
    intervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(intervalRef.current!);
          setShowJCE(true);
          setTimeout(() => {
            setShowJCE(false);
            setProgress(0);
            intervalRef.current = window.setInterval(() => {
              setProgress((p) => (p >= 100 ? p : p + Math.random() * 0.2 + 0.01)); // slower increment
            }, 50); // slower interval
          }, JCE_ANIMATION_DURATION);
          return 100;
        }
        return prev + Math.random() * 0.3 + 0.01; // slower increment
      });
    }, 50); // slower interval
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showJCE]);

  return (
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
        <div
          className={`dmc5-loading-progress${showJCE ? " dmc5-jce-flash" : ""}`}
          style={{ width: `${progress}%` }}
        ></div>
        {showJCE && (
          <div className="dmc5-jce-effect">
            <span className="dmc5-jce-text">JUDGEMENT CUT END!</span>
            <div className="dmc5-jce-slash"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnderMaintenance;
