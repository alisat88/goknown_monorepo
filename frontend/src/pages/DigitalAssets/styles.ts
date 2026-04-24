import { motion } from "framer-motion";
import { lighten, shade } from "polished";
import styled, { css } from "styled-components";

import { device } from "../../styles/devices";

export const Container = styled.div<{ height?: number; mobileHeight?: number }>`
  > header {
    height: ${(props) => (props.height ? `${props.height}px` : "200px")};
    background: #000034;
    border-radius: 0 0 0 100px;
    display: flex;
    /* align-items: flex-start; */

    // mobile
    @media ${device.laptopL} {
      border-radius: 0 0 0 0;
    }

    // mobile
    @media ${device.laptopM} {
      height: ${(props) =>
        props.mobileHeight ? `${props.mobileHeight}px` : "144px"};
    }

    div {
      width: 100%;
      max-width: 1080px;
      margin: 0 auto;
      padding: 16px 0;
      align-items: baseline;
      button {
        display: none;
      }

      h1 {
        color: #f0f2f5;
        font-weight: 200;
        font-size: 36px;
        display: flex;
        align-items: center;
      }
      // mobile
      @media ${device.laptopM} {
        margin: 0 10px 0;
        display: flex;

        button {
          display: flex;
          width: 220px !important;
        }

        h1 {
          display: none;
        }
      }

      svg {
        color: #f0f2f5;
        width: 24px;
        height: 24px;
      }
    }
  }
`;

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

export const ContentForm = styled.main`
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  form {
    margin-top: 20px;
    width: 100%;
    padding: 0 10px;
  }
  // mobile
  @media ${device.laptopM} {
    margin: 0 auto;
    flex-direction: column-reverse;
  }
`;

export const Schedule = styled.div`
  flex: 1;
  margin-right: 50px;
  margin-top: 5rem;

  // mobile
  @media ${device.laptopM} {
    margin-top: 3.5rem;
  }

  > header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    button {
      width: 200px !important;
    }

    h1 {
      color: #f0f2f5;
      font-weight: 200;
      font-size: 36px;

      // mobile
      @media ${device.laptopM} {
        font-size: 22px;
        font-weight: 400;
        margin-top: 15px;

        button {
          width: 150px !important;
        }
      }
    }
  }

  p {
    margin-top: 8px;
    color: #53bf99;
    display: flex;
    align-items: center;
    font-weight: 600;

    span {
      display: flex;
      align-items: center;

      @media ${device.laptopM} {
        display: none;
      }
    }

    span + span::before {
      content: "";
      width: 1px;
      height: 12px;
      background: #53bf99;
      margin: 0 8px;
    }
  }

  // mobile
  @media ${device.laptopM} {
    margin-right: 0;
    > header {
      display: none;
    }
  }
`;

export const Section = styled.section`
  margin-top: 18px;

  // mobile
  @media ${device.laptopM} {
    margin-top: 10px;
  }

  > strong {
    color: #999591;
    font-size: 20px;
    line-height: 26px;
    border-bottom: 1px solid #3e3b47;
    display: block;
    padding-bottom: 16px;
    margin-bottom: 16px;
  }

  > p {
    color: #999591;
  }

  header {
    display: flex;
    flex-direction: column;
    align-items: center;
    img {
      max-width: 340px;
    }
    p {
      color: #999591;
      font-size: 26px !important;
      font-weight: 400;
      margin-bottom: -1em;
    }
  }
`;

export const ContentPreviewAssets = styled.div`
  background: #fff;
  box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
  margin: 0 10px;
  border-radius: 10px;
  overflow: auto;
  position: relative;
  height: calc(100vh - 178px);
  min-height: 100%;

  //

  > div {
    position: absolute;
    width: 100%;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    > div {
      height: auto;
      width: 100%;
      display: flex;
      align-items: flex-start;
    }
    img,
    video {
      z-index: 1;
      top: 0;
      left: 0;
      max-width: 940px;
      height: auto !important;
      width: 100%;
      object-fit: cover;
      background-size: cover;
      background-position: 50% 50%;
    }

    video {
    }
  }

  svg {
    padding: 15px;
    position: absolute;
    height: 89px;
    width: 107px;

    background-size: cover;
    background: #ccc;
    color: #fbfbfb;
  }

  section {
    display: flex;
    flex: 1;
    flex-direction: row;
    align-items: center;
  }

  // mobile
  @media ${device.tablet} {
    min-height: calc(100vh - 115px);
    > div {
      flex-direction: column;

      span {
        color: #999591;
        font-style: italic;
      }
    }
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

export const ContentDigitalAssets = styled(motion.div)`
  display: flex;
  align-items: center;
  font-family: "Poppins", "Open Sans", sans-serif;
  cursor: pointer;

  & + div {
    margin-top: 1rem;
  }
  /* mobile */
  @media ${device.laptopM} {
    & + div {
      margin-top: 0.5rem;
    }

    &:last-of-type {
      margin-bottom: 60px;
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
    @media ${device.mobileL} {
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
    padding: 0 24px 0 0;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
    min-height: 80px;

    section {
      display: flex !important;
      flex-direction: column !important;
      align-items: end !important;
      h4 {
      }

      strong {
        font-size: 12px;
      }
    }

    img {
      position: relative;
      object-fit: cover;
      object-position: center;
      height: 80px;
      width: 107px;
    }

    svg {
      padding: 15px;

      height: 89px;
      width: 107px;
      z-index: 2;
      background-size: cover;
      background: #ccc;
      color: #fbfbfb;
    }

    button {
      background: transparent !important;
      border: none !important;

      pointer-events: painted;
      padding: 20px;
      margin-right: -1rem;

      transition: transform 0.2s ease-in-out;

      svg {
        z-index: 2 !important;
        color: #333 !important;
        background: transparent !important;
        padding: none;
        height: 18px;
        width: 18px;

        padding: 0 !important;
      }

      &:hover {
        transform: scale(1.3);
      }
    }

    /* 
    &::before {
      content: "";
      position: absolute;
      border-radius: 0 5px 5px 0;
      height: 80%;
      width: 4px;
      left: 0;
      top: 10%;
     
   } */
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

export const InfoDigitalAssets = styled.div`
  padding-left: 10px;

  strong {
    font-size: clamp(0.6rem, 2.5vw, 0.8rem);
    line-height: 18px;
    color: #999591;
  }
`;

export const InfoPreviewAssets = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 20px;

  h5 {
    color: #00007d;
    font-size: 18px;
    font-weight: 400;
    border-bottom: 1px solid #00007d;
    padding-bottom: 5px;
  }

  h6 {
    margin-top: 15px;
    font-size: 16px;
    color: #999591;
  }

  > div {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    color: #999591;
    padding: 10px 0;
    flex-direction: column;
    width: 100%;
    p {
      margin-top: 0 !important;
      font-size: 12px;
      color: #999591;
      font-style: italic;
    }

    > div {
      margin-top: 10px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;

      width: 100%;
    }
  }
`;

interface IFlagProps {
  color: "red" | "green" | "grey" | "blue";
}

const color = {
  red: "#E65D5E",
  green: "#53bf99",
  grey: "#999591",
  blue: "#00007d",
};

export const Flag = styled.div<IFlagProps>`
  min-width: 80px;
  height: 24px;
  margin: 0 0 0 auto;
  border-radius: 6px;
  padding: 0 8px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  background-color: ${(props) => color[props.color]};

  strong {
    color: #fbfbfb;
    font-size: 14px;
  }
`;

export const ToggleContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-left: 0 !important;
  padding: 30px 0;
  strong {
    color: #00007d;
    font-weight: bold;
  }
`;

export const ContentUpload = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: calc(100vh - 200px);
  width: 100%;
  h4 {
    font-family: "Abel", sans-serif;
    font-size: 120px;
    color: #999591;
    font-weight: medium;
  }

  p {
    font-size: 24px;
    color: #999591;
  }
  img {
    width: 70%;
  }
`;

interface IProgressBar {
  percent: number;
}
export const ProgressBar = styled.div<IProgressBar>`
  height: 20px;
  width: 90%;
  background-color: #e0e0de;
  border-radius: 50px;
  margin: 30px;
  position: relative;
  transition: width 0.2s ease-in-out;
  &::before {
    transition: width 0.2s ease-in-out;
    content: "";
    position: absolute;
    height: 100%;
    width: ${(props) => props.percent}%;
    background-color: #53bf99;

    border-radius: inherit;
    text-align: right;
  }
`;

export const MyAssets = styled.div`
  h3 {
    margin-top: 1rem;
  }
  h3,
  div.filter-content,
  div.members-content {
    display: none;
  }

  h1 {
    display: block;
    font-size: 2rem;
    margin-top: 20px;
    margin-bottom: 10px;
    color: #000;

    font-weight: 200;
    margin-top: 2rem;
  }

  // mobile
  @media ${device.laptopM} {
    margin-top: 10px;
    h3,
    div.filter-content {
      display: flex;
      align-items: center;
    }

    div.members-content {
      display: block;
    }

    div {
      p {
        margin-top: 0;
      }
    }

    h1 {
      margin-top: 0.5rem;
    }
  }
`;

export const PublicAssets = styled.div`
  h1 {
    color: #000;
    font-weight: 200;
    font-size: 36px;
    margin: 30px 0 15px;

    @media ${device.laptopM} {
      display: block;
      margin-top: 20px;
      margin-bottom: 10px;
      color: #000;
      font-size: 22px;
      font-weight: 400;
      margin-top: 15px;
    }
  }
`;

export const RigthSection = styled.aside`
  min-width: 320px;
  max-width: 380px;

  @media ${device.laptopM} {
    display: none;
  }

  h1 {
    margin: 1rem 0 0.5rem;
  }

  h3 {
    margin-right: 10px;
    color: #333;
    font-size: 24px;
    font-weight: 300;

    margin: 2rem 0 20px;
  }

  button {
    margin: 0 auto;
    display: block;
    width: 100%;

    max-width: 600px;

    @media ${device.laptopM} {
      display: none;
    }
  }

  @media ${device.laptopM} {
    max-width: 100%;
    width: 100% !important;
    margin: 0 auto;

    h3 {
      color: #333;
      font-weight: 400;
      font-size: 22px;
    }
  }

  section {
    display: flex;
    flex-direction: row;
    margin-top: 20px;
    justify-content: space-between;

    // mobile
    @media ${device.laptopM} {
      display: none;
    }
  }
`;

export const FilterList = styled(motion.div)`
  list-style: none;
  margin: 0;
  padding: 0;

  /* display: grid;
  grid-gap: 10px;
  grid-auto-flow: row; */
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  // mobile
  @media ${device.laptopM} {
    margin-top: 10px;
    transform: scale(0.9);
    margin-left: -1.5rem;
  }

  div {
    width: auto;
    background-color: #dcdcdc;
    border-radius: 20px;
    border: 1px solid #d8d8d8;
    margin-bottom: 5px;
    overflow: hidden;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin-right: 10px;
    /* box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0); */
    padding: 5px 10px 5px 5px;
    span {
      width: 24px;
      height: 24px;
      background-color: #bdbebd;
      border-radius: 50%;
      margin: 3px 3px 3px 5px;
    }

    p {
      padding: 0 5px;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      text-transform: capitalize;
    }
  }
`;
export const FilterItem = styled(motion.li)``;

export const BigButton = styled.div<{
  disabled?: boolean;
}>`
  background: #53bf99;
  width: 180px;
  height: 180px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
  transition-property: box-shadow, color;
  transition-duration: 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #f0f2f5;
  transition: filter ease-in-out 0.2s;
  svg {
    width: 40px;
    height: 40px;
    stroke-width: 1px;
    color: #f0f2f5;
    transition: color 0.2s;
  }

  p {
    margin-top: 10px;
    color: #f0f2f5;
    font-family: "Poppins";
    font-size: 18px;
    transition: filter 0.2s;
  }

  &:hover {
    box-shadow: 0 10px 25px 0 rgba(0, 0, 0, 0.1), 0 5px 35px rgba(0, 0, 0, 0.05),
      0 5px 10px rgba(0, 0, 0, 0.01);
    filter: brightness(0.9);
  }

  ${(props) =>
    props.disabled &&
    css`
      background: ${lighten(0.2, "#53bf99")};
      cursor: not-allowed;
      &:hover {
        filter: none;
        box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
      }
    `}
`;

interface IFolderProps {
  type: "shared" | "private" | "welcome";
  status: "shared" | "private" | "welcome";
}

export const FolderList = styled.div<IFolderProps>`
  display: flex;
  align-items: center;
  font-family: "Poppins", "Open Sans", sans-serif;
  cursor: pointer;
  min-height: 5.65rem;

  opacity: ${(props) =>
    ["unapproved", "failed"].includes(props.status) ? "0.6" : "1"};

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

      background: ${(props) =>
        props.status === "welcome"
          ? "#00007d"
          : props.status === "shared"
          ? "#53bf99"
          : " #E65D5E"};
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

export const FolderAsset = styled.span`
  display: flex;
  align-items: center;
  font-size: 0.7rem;
  line-height: 20px;
  height: 1rem;
  margin-top: 10px;
  svg {
    width: 18px !important;
    padding: 0 !important;
    background-color: transparent !important;
    color: #333 !important;
  }
`;
