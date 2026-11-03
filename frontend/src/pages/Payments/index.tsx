/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import React, { useEffect } from "react";

import { ZTA_COIN_URL } from "../../config/externalApps";

const Payments: React.FC = () => {
  useEffect(() => {
    window.open(ZTA_COIN_URL, "_self");
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Redirecting to Payments...</h1>
      <a href={ZTA_COIN_URL}>Open ZTA Coin</a>
    </div>
  );
};

export default Payments;
