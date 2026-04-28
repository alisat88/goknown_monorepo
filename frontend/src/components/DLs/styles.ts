import styled from "styled-components";

import { device } from "../../styles/devices";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;

  h1 {
    color: #f8fafc;
    font-weight: 800;
    font-size: 28px;
    letter-spacing: 0;

    @media ${device.laptopM} {
      font-size: 22px;
    }
  }

  p {
    margin-top: 6px;
    color: #8be7d7;
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 700;

    span {
      display: flex;
      align-items: center;

      @media ${device.laptopM} {
        display: none;
      }
    }
  }
`;

export const CardContent = styled.div`
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(142px, 1fr));
  gap: 14px;
  margin-bottom: 4px;
  position: relative;
  width: 100%;
`;

export const Card = styled.div`
  min-height: 144px;
  background: linear-gradient(
    145deg,
    rgba(12, 24, 54, 0.86),
    rgba(2, 8, 23, 0.72)
  );
  border-radius: 18px;
  position: relative;
  padding: 18px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 14px;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.2);
  transition-property: box-shadow, transform, filter, border-color, background;
  transition-duration: 0.2s;
  border: 1px solid rgba(83, 191, 153, 0.18);
  filter: blur(0);

  img {
    width: 58px;
    height: 58px;
    object-fit: contain;
    border-radius: 14px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  }

  p {
    color: #f8fafc;
    margin-top: 0;
    font-size: 14px;
    line-height: 1.25;
    font-weight: 700;
    text-align: center;
  }

  &:last-of-type {
    margin-right: 0;
  }

  &:hover {
    transform: translateY(-6px);
    border-color: rgba(83, 191, 153, 0.48);
    background: linear-gradient(
      145deg,
      rgba(16, 38, 76, 0.94),
      rgba(3, 17, 35, 0.82)
    );
    box-shadow: 0 24px 55px rgba(0, 0, 0, 0.28);
  }

  &:after {
    content: "✔";

    opacity: 0;
    font-weight: 900;
    position: absolute;
    height: 36px;
    width: 36px;
    top: -21px;
    right: -21px;
    color: #f0f2f5;
    background: #0057ff;
    border: 2px solid #0057ff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  span {
    background: #e65d5e;
    position: absolute;
    top: 10px;
    right: 10px;
    border-radius: 999px;
    height: 1.45rem;
    min-width: 2rem;
    display: inline-block;
    text-align: center;
    padding: 0 4px;
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.45rem;
  }
`;
