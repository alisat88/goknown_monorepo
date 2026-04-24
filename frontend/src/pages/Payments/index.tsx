import React, { useEffect } from "react";

const Payments: React.FC = () => {
  useEffect(() => {
    // redirect to Streamlit app
    window.location.href = "https://zta-coin-org.streamlit.app";
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Redirecting to Payments...</h1>
    </div>
  );
};

export default Payments;