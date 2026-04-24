import styled from "styled-components";

import { Container as Toggle } from "../../components/Toggle/styles";
import { device } from "../../styles/devices";

interface IProps {
  disabled?: boolean;
}

export const Container = styled.div<IProps>`
  display: flex;
  align-items: center;
  font-family: "Poppins", "Open Sans", sans-serif;
  cursor: pointer;
  /* min-height: 5.65rem; */

  & + div {
    margin-top: 1rem;
  }
  /* mobile */
  @media ${device.laptopM} {
    & + div {
      margin-top: 0.5rem;
    }
  }

  .actions-section {
    display: flex;
    flex-direction: column;
    margin-left: 0.5rem;
    button {
      border-radius: 6px;
      border: none;
      background: #00007d;
      height: 24px;
      padding: 0.2rem;
      transition: opacity 0.2s ease-in-out;

      &:nth-child(1) {
        margin-bottom: 0.5rem;
      }

      &:hover {
        opacity: 0.8;
      }

      svg {
        color: #f0f2f5;
      }
    }
  }

  > span {
    margin-left: auto;
    display: flex;
    align-items: center;
    color: #999591;
    font-weight: 600;
    font-size: 14px;
    width: 81px;
    /* mobile */
    @media ${device.tabletL} {
      display: none;
    }

    svg {
      width: 18px;
      height: 18px;
      color: #53bf99;
      margin-right: 8px;
    }
  }

  transition: transform 0.2s;
  /* &:hover {
    transform: translateX(10px);
  } */

  section {
    display: flex;
    flex: 1;
    flex-direction: row;
    align-items: center;
  }

  .sb-avatar--text {
    span {
      width: initial;
      margin: 0 auto;
      align-self: center;
      color: inherit;
    }
  }

  opacity: ${(props) => (props.disabled ? "0.6" : "1")};
`;

interface IContentProps {
  size: "normal" | "small";
  color?: string;
}

const Sizes = {
  normal: "16px 24px",
  small: "8px 12px",
};

export const Content = styled.div<IContentProps>`
  background: ${(prop) => prop.color || "#fff"};
  box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
  display: flex;
  flex: 1;
  align-items: center;
  padding: ${(props) => Sizes[props.size]};
  border-radius: 10px;
  position: relative;

  /* mobile */
  @media ${device.tablet} {
    margin-left: 0;
  }

  section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-left: 1.25rem;

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
  }

  svg {
    stroke-width: 1px;
    width: clamp(1.8rem, 6vw, 2.25rem) !important;
  }

  &::before {
    content: "";
    position: absolute;
    border-radius: 0 5px 5px 0;
    height: 80%;
    width: 4px;
    left: 0;
    top: 10%;
  }
`;

export const ListItemInfo = styled.div`
  margin-left: 1rem !important;

  display: flex;
  flex-direction: column;
  align-items: flex-start !important;
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

export const ListItemActions = styled.div`
  display: flex;
  align-items: center;
  &:nth-child(1) {
    margin: 0 0.3rem;
  }
  ${Toggle} {
    margin-bottom: 0 !important;
  }
`;

export const ListItemAction = styled.div`
  display: flex;
  align-items: center;

  button {
    border: 0;
    background: none;

    &:first-of-type {
      margin-left: 0.5rem;
    }
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

    ${Toggle} {
      margin-bottom: 0 !important;
    }
  }
`;
