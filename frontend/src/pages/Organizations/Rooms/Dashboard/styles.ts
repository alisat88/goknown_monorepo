import styled, { css } from "styled-components";

import { device } from "../../../../styles/devices";
import { Message } from "../../styles";

export const Container = styled.div`
  ${Message} {
    transform: scale(0.8);
    margin: 0;
  }
`;

export const Content = styled.main`
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  margin-top: -11rem;

  // mobile
  @media ${device.laptopM} {
    margin: -3rem auto;
    padding: 0 10px;
    flex-direction: column-reverse;
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
    font-size: clamp(1rem, 4vw, 1.15rem);
    color: #333;
    font-weight: 400;
  }

  h5 {
    font-size: clamp(0.8rem, 4vw, 1rem);
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

interface IListItemAction {
  animated?: boolean;
}

export const ListItemAction = styled.div<IListItemAction>`
  button {
    border: 0;
    background: none;

    ${(props) =>
      props.animated &&
      css`
        transition: margin-right 0.2s ease-in-out;

        &:hover {
          margin-right: -10px;
        }
      `}
  }
`;

export const GroupAdmin = styled.div`
  h3 {
    margin-right: 10px;
    color: #f2f2f2;
    font-size: 24px;
    font-weight: 300;

    margin: 6rem 0 20px;
  }
`;
