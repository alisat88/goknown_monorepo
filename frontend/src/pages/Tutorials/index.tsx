import React from "react";
import { FiArrowLeft, FiExternalLink, FiPlay } from "react-icons/fi";
import { useHistory } from "react-router-dom";

import { TUTORIAL_VIDEOS } from "../../config/tutorialVideos";
import {
  BackButton,
  Container,
  Content,
  HeaderTitle,
  PageHeader,
  SectionHeader,
  VideoCard,
  VideoCardBody,
  VideoCardIcon,
  VideoGrid,
  WatchButton,
} from "./styles";

const Tutorials: React.FC = () => {
  const history = useHistory();

  return (
    <Container>
      <PageHeader>
        <BackButton type="button" onClick={() => history.push("/dashboard")}>
          <FiArrowLeft />
          Dashboard
        </BackButton>

        <HeaderTitle>
          <p>Resources</p>
          <h1>Tutorial Videos</h1>
        </HeaderTitle>
      </PageHeader>

      <Content>
        <SectionHeader>
          <h2>Pre-recorded walkthroughs</h2>
          <p>
            Click any card to open the recording in a new tab. No account
            needed to watch.
          </p>
        </SectionHeader>

        <VideoGrid>
          {TUTORIAL_VIDEOS.map((video) => (
            <VideoCard
              key={video.url}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <VideoCardIcon>
                <FiPlay />
              </VideoCardIcon>

              <VideoCardBody>
                <strong>{video.title}</strong>
                <p>{video.description}</p>
              </VideoCardBody>

              <WatchButton>
                <FiExternalLink />
                Watch Recording
              </WatchButton>
            </VideoCard>
          ))}
        </VideoGrid>
      </Content>
    </Container>
  );
};

export default Tutorials;
