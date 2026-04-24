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
