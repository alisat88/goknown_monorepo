import styled from "styled-components";

import { device } from "../../styles/devices";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  width: 100%;
`;

export const Content = styled.div`
  max-width: 500px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;
  border-radius: 8px;
  /* box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); */
  padding: 30px;

  h1 {
    text-align: center;
    margin-bottom: 30px;
    color: #333;
  }

  @media ${device.mobileL} {
    padding: 20px;
  }
`;

export const PolicyText = styled.div`
  width: 100%;
  text-align: justify;

  h2 {
    margin-top: 24px;
    margin-bottom: 12px;
    color: #444;
    font-size: 1.2rem;
  }

  p {
    margin-bottom: 16px;
    line-height: 1.6;
  }

  ul {
    margin-bottom: 16px;
    padding-left: 20px;

    li {
      margin-bottom: 8px;
      line-height: 1.5;
    }
  }

  a {
    color: #0066cc;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;
