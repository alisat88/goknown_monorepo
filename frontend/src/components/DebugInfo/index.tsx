/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
