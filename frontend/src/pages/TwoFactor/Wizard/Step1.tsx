import { useCallback } from "react";

import appleStoreImg from "../../../assets/apple-app-store.svg";
import playStoreImg from "../../../assets/google-play.svg";
import { Content } from "../styles";

export function Step1() {
  const handlePlay = useCallback(() => {
    window.open(
      "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2",
      "_blank"
    );
  }, []);

  const handleApple = useCallback(() => {
    window.open(
      "https://apps.apple.com/br/app/google-authenticator/id388497605",
      "_blank"
    );
  }, []);

  return (
    <Content>
      <header>
        <h1>Step 1</h1>
        <p>Download and install the google authenticator app</p>
      </header>
      <div>
        <article onClick={handleApple}>
          <img src={appleStoreImg} alt="App Store" />
          <div>
            <p>Download from</p>
            <strong>App Store</strong>
          </div>
        </article>
        <article onClick={handlePlay}>
          <img src={playStoreImg} alt="Google Play" />
          <div>
            <p>Download from</p>
            <strong>Google play</strong>
          </div>
        </article>
      </div>
    </Content>
  );
}
