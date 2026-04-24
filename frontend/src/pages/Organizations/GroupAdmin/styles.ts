import styled from "styled-components";

import { device } from "../../../styles/devices";
import { Container as ListItem } from "../../ListItem/styles";

export const Container = styled.div`
  form {
    max-width: 700px;
    width: 100%;
    padding: 1rem;
    margin: 0 auto;

    section {
      margin-top: 1rem;
      fieldset {
        border: 0;
        border-top: 1px solid #bbb;
        padding: 0 0 2rem;
        legend {
          color: #333;
          font-size: 1rem;
          font-weight: bold;
          margin-left: 1rem;
          padding: 0 0.5rem;
        }

        ${ListItem} {
          margin-top: 1rem;
        }
      }
    }
  }
`;

interface IList {
  status: "inactive" | "active" | "pending";
}

const statusColor = {
  inactive: "#999591",
  active: "#53bf99",
  pending: "#D7D704",
};

export const List = styled.div<IList>`
  display: flex;
  align-items: center;
  font-family: "Poppins", "Open Sans", sans-serif;
  cursor: pointer;
  min-height: 5.65rem;

  & + div {
    margin-top: 1rem;
  }
  /* mobile */
  @media ${device.laptopM} {
    & + div {
      margin-top: 0.5rem;
    }
    &:last-of-type {
      margin-bottom: 200px;
    }
  }

  .actions-section {
    display: flex;
    flex-direction: column;
    margin-left: 0.5rem;
    button {
      border-radius: 6px;
      border: none;
      background: #ac3030;
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

  > div {
    background: #fff;
    box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
    display: flex;
    flex: 1;
    align-items: center;
    padding: 16px 24px;
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

      background: ${(props) => statusColor[props.status]};
    }
  }
  transition: transform 0.2s;
  &:hover {
    transform: translateX(10px);
  }

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
`;

export const ContentItem = styled.div`
  margin-left: 1rem;
  display: flex;
  flex-direction: column;

  label {
    font-weight: bold;
  }
  strong {
    color: #333;
    font-size: 0.8rem;
  }
`;
