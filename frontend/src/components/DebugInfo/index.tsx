import React from "react";

import { Container } from "./styles";

const DebugInfo: React.FC = () => {
  // Check if debug mode is active via environment variable
  const showDebug = process.env.REACT_APP_SHOW_DEBUG === "true";

  // Don't render anything if debug mode is not active
  if (!showDebug) {
    return null;
  }

  return (
    <Container>
      <div className="debug-info">
        <h3>Debug Info</h3>
        <ul>
          <li>
            <strong>Environment:</strong> {process.env.NODE_ENV}
          </li>
          <li>
            <strong>API URL:</strong>{" "}
            {process.env.REACT_APP_PRODUCTION_API ||
              process.env.REACT_APP_DEVELOPMENT_API}
          </li>
        </ul>
      </div>
    </Container>
  );
};

export default DebugInfo;
