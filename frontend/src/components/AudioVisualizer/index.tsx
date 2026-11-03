/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
