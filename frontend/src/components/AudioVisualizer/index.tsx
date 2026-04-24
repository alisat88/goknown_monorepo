import React, { useEffect, useRef, useState } from "react";
import { useVisualizer, models } from "react-audio-viz";
import { isIOS } from "react-device-detect";

import knownCover from "../../assets/knownCover.jpeg";
import { Container } from "./styles";

interface IProps {
  url: string;
  type?: string;
}

const AudioVisualizer: React.FC<React.PropsWithChildren<IProps>> = ({
  url,
  type,
  ...rest
}) => {
  const [track, setTrack] = useState<HTMLAudioElement>();

  const mediaElementRef = useRef(null);
  const [ReactAudioViz, initializeVisualizer] = useVisualizer(mediaElementRef);

  useEffect(() => {
    const audio = new Audio();

    audio.crossOrigin = "anonymous";
    audio.src = url;
    setTrack(audio);
  }, [url]);

  return (
    <Container>
      {track && (
        <>
          {isIOS && <img src={knownCover} alt="image" />}
          <audio
            controls
            crossOrigin="anonymous"
            onPlay={() => (isIOS ? null : initializeVisualizer())}
            ref={mediaElementRef}
            src={track.src}
          />

          {ReactAudioViz && (
            <ReactAudioViz
              model={models.horizontal({
                darkMode: false,
                reversed: false,
                fadeBars: false,
                scale: 0.5,
                color: "#000034",
                binSize: 1,
                frequencyRange: [0, 19000],
              })}
            />
          )}
        </>
      )}
    </Container>
  );
};

export default AudioVisualizer;
