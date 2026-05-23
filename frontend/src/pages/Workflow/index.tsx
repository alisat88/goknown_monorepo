import { useEffect } from "react";

import { KNOWNCOMPUTE_URL } from "../../config/externalApps";

const Workflow = () => {
  useEffect(() => {
    window.open(KNOWNCOMPUTE_URL, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Opening Workflow App...</h1>
      <a href={KNOWNCOMPUTE_URL} target="_blank" rel="noopener noreferrer">
        Open Known Compute
      </a>
    </div>
  );
};

export default Workflow;
