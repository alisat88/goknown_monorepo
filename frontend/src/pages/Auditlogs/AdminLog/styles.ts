import styled from "styled-components";

import { Container as Button } from "../../../components/Button/styles";
import { Container as Select } from "../../../components/Select/styles";
import { device } from "../../../styles/devices";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

export const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Content = styled.div`
  background: rgba(52, 53, 66, 0.9);
  width: 100%;
  height: calc(100vh - 13rem);
  border-radius: 6px;
  padding: 1rem 0.5rem 1rem 1rem;
  display: inline-table;
`;

export const LogList = styled.ul`
  color: #fff;
  list-style: none;
  /* overflow: auto; */
  width: 100%;
`;

export const LogItem = styled.li`
  padding: 6px 0;
  display: flex;
  cursor: pointer;

  span {
    white-space: nowrap;
  }

  span,
  .hour {
    color: #f2f2f2;
    font-weight: bold;
    margin-right: 0.5rem;
    vertical-align: middle;
  }

  .action {
    text-transform: uppercase;
  }

  .flag {
    padding: 0.05rem 0.1rem;
    font-weight: bold;
    font-size: 0.95rem;
    border-radius: 0.2rem;
    margin-right: 0.5rem;
    color: #f2f2f2;
  }

  .leader {
    background-color: #ecb365;
    color: #333;
  }

  .dapp {
    color: #4fc0d0;
    margin-right: 0.5rem;
    font-weight: bold;
  }

  .token {
    display: inline-block;
    background: rgba(52, 53, 66, 1);
    padding: 0.05rem 0.2rem;
    width: 12rem !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .success {
    color: #a2ff86;
  }

  .error {
    color: #d71313;
  }
`;

export const SubItem = styled.div`
  display: flex;
  flex-direction: column;
  opacity: 0.8;

  .node-subitem {
    margin-left: 3rem;
  }

  .node-subitem-download {
    background: none;
    border: none;
    color: #fff;
    margin-left: 0.5rem;
  }
`;

export const Filter = styled.div`
  display: flex;
  align-items: center;
  padding: 0 0 1rem;
  justify-content: space-between;
  form {
    width: 100%;
    flex: 1;
    max-width: 340px;
    display: flex;
    flex-direction: row;
    align-items: baseline;
  }

  .actions {
    display: flex;
  }

  ${Button} {
    width: auto;
    margin-top: 0;

    &:first-of-type {
      margin-right: 1rem;
    }
  }

  ${Select} {
    margin-left: 1rem;
  }

  // mobile
  @media ${device.laptopM} {
    flex-direction: column;
  }
`;
