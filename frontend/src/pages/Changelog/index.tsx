import React from "react";

import LogoImg from "../../assets/logo.svg";
import versions from "./data";
import { ChangeLog, ChangeLogItem, Container, Content } from "./styles";

const Changelog: React.FC<React.PropsWithChildren<unknown>> = () => {
  return (
    <Container>
      <Content>
        <header>
          <img src={LogoImg} />

          <h1>DAppGenius Changelog list app</h1>
        </header>

        {versions.map((version) => (
          <ChangeLog key={version.id}>
            <header>
              <h3>Version {version.version} - </h3>
              <strong> {version.date}</strong>
            </header>
            <section>
              <ul>
                {version.changelogs.map((changelog) => (
                  <ChangeLogItem
                    key={changelog.id}
                    category={changelog.category}
                  >
                    <div>
                      <strong>{changelog.category.toUpperCase()}</strong>
                      <p>{changelog.description}</p>
                    </div>
                  </ChangeLogItem>
                ))}
              </ul>
            </section>
          </ChangeLog>
        ))}
      </Content>
    </Container>
  );
};

export default Changelog;
