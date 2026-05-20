import { useEffect } from "react";

const Workflow = () => {
  useEffect(() => {
    window.open("https://knowncompute.ai", "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Opening Workflow App...</h1>
      <a
        href="https://knowncompute.ai"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open Known Compute
      </a>
    </div>
  );
};

export default Workflow;
