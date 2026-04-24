import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  margin: 0 auto;
  height: 100vh;
  form {
    min-width: 400px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background-color: #fff;
    border-radius: 25px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

    padding: 30px;
    img {
      padding: 30px;
      max-width: 340px;
    }

    div {
      margin: 30px 0;
    }
  }
`;
