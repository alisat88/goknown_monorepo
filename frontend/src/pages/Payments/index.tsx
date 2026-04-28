import React, { useEffect } from "react";

const Payments: React.FC = () => {
  useEffect(() => {
    window.open(
      "https://zta-coin-org.streamlit.app/",
      "_blank",
      "noopener,noreferrer"
    );
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Redirecting to Payments...</h1>
      <a
        href="https://zta-coin-org.streamlit.app/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open ZTA Coin
      </a>
    </div>
  );
};

export default Payments;
