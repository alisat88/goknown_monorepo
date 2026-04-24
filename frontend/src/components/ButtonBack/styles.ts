import styled from "styled-components";

export const Container = styled.div`
  a {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    text-decoration: none;

    line-height: 1rem;
    svg {
      width: 21px;
      height: 21px;
      color: #f0f2f5;
    }

    span {
      font-size: 20px;
      margin-left: 10px;
      color: #f0f2f5;
    }

    transition: opacity 0.2s;
    &:hover {
      opacity: 0.8;
    }
  }
`;
