import React, { useEffect } from "react";

import { ZTA_COIN_URL } from "../../config/externalApps";

const Payments: React.FC = () => {
  useEffect(() => {
    window.open(ZTA_COIN_URL, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Redirecting to Payments...</h1>
      <a href={ZTA_COIN_URL} target="_blank" rel="noopener noreferrer">
        Open ZTA Coin
      </a>
    </div>
  );
};

export default Payments;
