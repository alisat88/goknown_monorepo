import { shade } from "polished";
import styled from "styled-components";

export const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  background-color: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #7f3e8f;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${shade(0.2, "#7F3E8F")};
  }
`;

export const ModalBody = styled.div`
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 120px);

  h2 {
    color: #333;
    margin-bottom: 16px;
    text-align: center;
  }

  p {
    margin-bottom: 16px;
  }
`;

export const EulaText = styled.div`
  margin-top: 24px;
  text-align: justify;

  h3 {
    margin: 24px 0 12px;
    color: #444;
  }

  ul {
    margin-bottom: 16px;
    padding-left: 20px;

    li {
      margin-bottom: 8px;
    }
  }

  .company-info {
    margin-top: 32px;
    border-top: 1px solid #eee;
    padding-top: 24px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;

    p {
      margin-bottom: 16px;
      flex: 1 1 300px;
    }
  }
`;

export const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: center;

  button {
    background: #7f3e8f;
    color: #fff;
    padding: 12px 24px;
    border-radius: 4px;
    border: none;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: ${shade(0.2, "#7F3E8F")};
    }
  }
`;
