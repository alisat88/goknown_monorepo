import styled from "styled-components";

import { device } from "../../styles/devices";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
  h1 {
    color: #f0f2f5;
    font-weight: 200;
    font-size: 36px;

    // mobile
    @media ${device.laptopM} {
      color: #000;
      font-size: 22px;
      font-weight: 400;
      margin-top: 15px;
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
  }
`;

export const CardContent = styled.div`
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, 120px);
  gap: 10px;
  margin-bottom: 30px;
  position: relative;
  width: 99%;
`;

export const Card = styled.div`
  /* position: relative; */
  width: 120px;
  height: 140px;
  background: #fff;
  border-radius: 10px;
  position: relative;
  padding: 10px 0px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  flex-direction: column;
  cursor: pointer;
  box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
  transition-property: box-shadow, transform, filter, border-color;
  transition-duration: 0.2s;
  border: 2px solid #e8ebed;
  filter: blur(0);

  p {
    color: #333;
    margin-top: 10px;
    font-size: 14px;
  }

  &:last-of-type {
    margin-right: 30px;
  }

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 10px 25px 0 rgba(0, 0, 0, 0.1), 0 5px 35px rgba(0, 0, 0, 0.05),
      0 5px 10px rgba(0, 0, 0, 0.01);
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
    background: red;
    position: absolute;
    top: -0.5rem;
    right: -0.5rem;
    border-radius: 6px;
    height: 1.5rem;
    min-width: 2rem;
    display: inline-block;
    text-align: center;
    padding: 0 4px;
    color: #f2f2f2;
  }
`;
