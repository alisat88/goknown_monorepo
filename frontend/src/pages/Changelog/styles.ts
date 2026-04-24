import styled from "styled-components";

export const Container = styled.div`
  width: 100%;
  height: 100vh;
`;

export const Content = styled.div`
  padding: 4rem 0 0 0;
  max-width: 340px;
  margin: 0 auto;
  width: 100%;

  display: flex;
  align-items: center;
  flex-direction: column;

  header {
    display: flex;
    flex-direction: column;
    width: 100%;

    h1 {
      margin-top: 4rem;
      text-align: left;
      text-color: #333;
      font-weight: 500;
    }

    img {
      width: 20rem;
      margin: 0 auto;
    }
  }
`;

export const ChangeLog = styled.article`
  margin-top: 3rem;
  width: 100%;
  header {
    display: flex;
    flex-direction: row;
    align-items: baseline;

    h3 {
      font-weight: bold;
    }

    strong {
      margin-left: 0.5rem;
    }
  }

  section {
    ul {
      padding: 1rem 2rem;
    }
  }
`;

interface IChangeLogProps {
  category: "fixed" | "added" | "improved" | "updated";
}

const categoryColors = {
  fixed: "#e74c3c",
  added: "#0099e5",
  improved: "#00ad1d",
  updated: "#faa700",
};

export const ChangeLogItem = styled.li<IChangeLogProps>`
  width: 100%;

  div {
    display: flex;
    align-items: baseline;
    padding: 0.4rem 0;
    strong {
      font-weight: bold;
      margin-right: 0.4rem;
      color: ${(props) => categoryColors[props.category]};
      font-size: 1.1rem;
    }

    p {
      font-size: 1rem;
    }
  }
`;
