/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import styled from "styled-components";

export const Container = styled.div`
  a {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    text-decoration: none;

    line-height: 1rem;
    svg {
      width: 21px;
      height: 21px;
      color: #f0f2f5;
    }

    span {
      font-size: 20px;
      margin-left: 10px;
      color: #f0f2f5;
    }

    transition: opacity 0.2s;
    &:hover {
      opacity: 0.8;
    }
  }
`;
