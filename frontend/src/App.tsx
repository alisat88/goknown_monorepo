/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import React from "react";
import { BrowserRouter } from "react-router-dom";

import DebugInfo from "./components/DebugInfo";
import AppProvider from "./hooks";
import Routes from "./routes";
import GlobalStyle from "./styles/global";

const App: React.FC = () => {
  // Global debug switch
  const showDebug = process.env.REACT_APP_SHOW_DEBUG === "true";

  // Suppress console if debug is off
  if (!showDebug) {
    console.log = () => {};
    console.debug = () => {};
    console.warn = () => {};
  }

  return (
    <BrowserRouter>
      <AppProvider>
        <Routes />
        {showDebug && <DebugInfo />}
      </AppProvider>

      <GlobalStyle />
    </BrowserRouter>
  );
};

export default App;
