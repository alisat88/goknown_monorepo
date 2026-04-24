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
      margin-bottom: 10px;
    }

    input {
    }

    section {
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      place-items: center;
      flex-direction: row;
      padding: 1rem 0 1rem;
      p {
        font-weight: bold;
      }
      svg {
        margin-top: 2px;
        width: 45px;
      }
      a {
        margin-top: 0 !important;
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

    input.form-control {
      height: 58px;
      padding-left: 66px;
      color: #000;
      border: 2px solid #ebebeb;
      font-size: 16px;
    }

    .flag-dropdown {
      width: auto !important;
      border: 2px solid #ebebeb;
    }

    input.form-control:focus {
      border: 2px solid #00007d;
    }

    input.form-control:focus + .flag-dropdown {
      border: 2px solid #00007d;
      border-right: 2px solid #ebebeb;
    }

    .flag-dropdown .selected-flag {
      width: 58px;
      display: flex;
      align-items: center;
      padding: 0;
      justify-content: center;
    }

    .pin-field-content {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pin-field {
      width: 56px;
      height: 75px;
      font-size: 40px;
      text-align: center;
      outline: none;
      border-radius: 5px;
      border: 2px solid #ebebeb !important;
      transition-property: color, border, box-shadow, transform;
      transition-duration: 250ms;
      margin: 20px 0 20px;

      font-family: "Open Sans";
      font-weight: 400 !important;
      color: #00007d;

      & + input {
        margin-left: 10px;
      }

      &:focus {
        outline: none;
        box-shadow: 0 0 7px rgba(#00007d, 0.5);
        border: 1px solid #00007d;
        transform: scale(1.05);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.6 !important;
        background: #fff !important;
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
  }
`;
