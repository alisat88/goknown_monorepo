import styled from "styled-components";

export const Container = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;

  .debug-info {
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 15px;
    border-radius: 5px;
    font-size: 12px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    max-width: 300px;

    h3 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      padding-bottom: 5px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        margin-bottom: 5px;
      }
    }

    .active {
      color: #53bf99;
      font-weight: bold;
    }

    .inactive {
      color: #d9534f;
    }
  }
`;
