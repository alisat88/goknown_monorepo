import styled from "styled-components";

import { device } from "../../../styles/devices";

export const Container = styled.div``;

export const Content = styled.main`
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  margin-top: -8rem;

  // mobile
  @media ${device.laptopM} {
    margin: -3rem auto;
    padding: 0 10px;
    flex-direction: column-reverse;
  }
`;

export const ContentStore = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 1rem auto 0;
  width: 100%;
  max-width: 700px;
  padding: 1rem;
  height: 100%;
  form {
    width: 100%;
    height: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;

    h1 {
      margin-bottom: 24px;

      text-align: left;

      font-weight: 200;
      font-size: 36px;
      @media ${device.laptopM} {
        display: none;
      }
    }

    h3 {
      text-align: left;
      margin-top: 0rem;
      margin-bottom: -2rem;
      font-weight: bold;
      font-size: 1.2rem;
      color: #333 !important;
    }

    > section {
      align-items: center;
      margin-top: 1rem;
      position: relative;
      min-height: 170px;
      padding-left: 60px;
      display: flex;

      > svg {
        padding-left: 20px;
      }
    }

    div {
      display: flex;
      /* margin: 20px 0; */
      align-items: center;

      & + div {
        margin-left: 20px;
      }
    }

    footer {
      display: flex;
      flex-direction: column;
      flex: 1;
      align-items: center;
      justify-content: flex-end;
    }
  }
`;

export const ListItemInfo = styled.div`
  margin-left: 1rem;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 1.25rem;
  width: 100%;
  h4 {
    font-size: clamp(1rem, 4vw, 1.25rem);
    color: #333;
    font-weight: 400;
  }

  span {
    background-color: transparent;
    color: #999591;
    font-size: 0.875rem;
    font-size: clamp(0.675rem, 3vw, 0.875rem);
    .avatar-shared {
      margin-left: 0.2rem;
    }
  }
`;

export const ListItemAction = styled.div`
  display: flex;
  button {
    border: 0;
    background: none;
    svg {
      width: 1.6rem;
      height: 1.6rem;
    }
    transition: all 0.2s ease-in-out;

    & + button:hover {
      margin-left: 10px;
      margin-right: -10px;
    }

    &:hover {
      margin-right: 0;
      transform: scale(1.15);
    }
  }
`;
