import styled from "styled-components";

export const Container = styled.div`
  position: absolute;
  background-color: #00007d;
  right: 2rem;
  bottom: 2rem;
  width: 4rem;
  height: 4rem;
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  svg {
    color: #f2f2f2;
    margin: 0;
    padding: 0;
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

  &:hover {
    transform: scale(1.2);
  }
`;
