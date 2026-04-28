import { useEffect } from "react";

const Workflow = () => {
  useEffect(() => {
    window.open(
      "https://known-compute-ai.streamlit.app/",
      "_blank",
      "noopener,noreferrer"
    );
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Opening Workflow App...</h1>
      <a
        href="https://known-compute-ai.streamlit.app/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open Known Compute
      </a>
    </div>
  );
};

export default Workflow;
