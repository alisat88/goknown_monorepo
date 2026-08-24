import { useEffect } from "react";

import { KNOWNCOMPUTE_URL } from "../../config/externalApps";

const Workflow = () => {
  useEffect(() => {
    window.open(KNOWNCOMPUTE_URL, "_self");
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Opening Workflow App...</h1>
      <a href={KNOWNCOMPUTE_URL}>Open Known Compute</a>
    </div>
  );
};

export default Workflow;
