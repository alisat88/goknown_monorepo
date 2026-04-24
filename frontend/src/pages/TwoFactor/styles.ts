import { lighten } from "polished";
import styled from "styled-components";

export const Container = styled.div`
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  align-items: center;
  justify-content: center;
  padding: 5rem 1rem;

  header {
    display: flex;
    flex-direction: column;
    align-items: center;
    h1 {
      margin-top: 2rem;
      font-size: 2rem;
      font-weight: 500;
    }

    img {
      max-width: 340px;
    }
  }

  form {
    background-color: #fff;
    padding: 2rem;
    border-radius: 15px;
    margin-top: 30px;
    legend {
      color: #333;
      padding: 0 0 0.5rem;
      font-weight: 500;
    }

    section {
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      padding: 1rem 0 2rem;
      p {
        font-weight: bold;
      }
      svg {
        margin-top: 2px;
        width: 45px;
      }
    }

    a {
      color: #00007d;
      display: block;
      text-align: center;
      margin-top: 24px;
      text-decoration: none;
      transition: color 0.2s;

      &:hover {
        color: ${lighten(0.4, "#00007D")};
      }
      svg {
        margin-right: 10px;
        padding-top: 2px;
      }
    }
  }

  footer {
    display: flex;

    justify-content: space-between;
    align-items: center;
    button {
      width: 200px;
    }
  }
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;

  align-items: center;
  header {
    h1 {
    }
  }
  div {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    article {
      display: flex;
      align-items: center;
      width: 250px;
      background-color: #fff;
      border-radius: 15px;
      padding: 20px;
      cursor: pointer;
      margin: 50px 0;
      box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.1), 0 4px 3px rgba(0, 0, 0, 0);

      transition: filter 0.2s;

      &:hover {
        filter: brightness(0.95);
      }

      &.qrcode {
        flex-direction: column !important;
        width: 100%;
        background-color: initial;
        box-shadow: none;
        margin: 0 0 20px;
        cursor: initial;

        div {
          display: flex;
          flex-direction: row;
          align-items: center;
          p {
            margin-left: 20px;
            strong {
              font-weight: bold;
              padding-bottom: 20px;
              display: block;
            }
          }
        }

        > p {
          margin-top: 30px;
        }

        > strong {
          margin-top: 10px;
          font-weight: bold;
        }

        &:hover {
          filter: brightness(1);
        }
      }

      div {
        display: flex;
        flex-direction: column;
      }
    }
  }
`;
