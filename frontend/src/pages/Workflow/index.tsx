/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
