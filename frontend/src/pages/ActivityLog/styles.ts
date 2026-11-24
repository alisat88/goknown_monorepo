import styled from "styled-components";

export const Container = styled.main`
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
`;

export const Filters = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  margin-bottom: 20px;

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.85rem;
  }
  input,
  button {
    min-height: 36px;
    padding: 6px 10px;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  th,
  td {
    padding: 10px 8px;
    border-bottom: 1px solid #e6e8eb;
    text-align: left;
  }
  th {
    font-weight: 600;
  }
`;

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  button {
    padding: 7px 12px;
  }
`;
