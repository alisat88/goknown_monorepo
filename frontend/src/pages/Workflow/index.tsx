import { useEffect } from "react";

const Workflow = () => {
  useEffect(() => {
    window.open("https://known-compute-ai.streamlit.app", "_blank");
  }, []);

  return <h1>Opening Workflow App...</h1>;
};

export default Workflow;