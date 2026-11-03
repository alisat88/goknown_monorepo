/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import styled from "styled-components";

import { device } from "../../styles/devices";

export const Container = styled.div`
  position: fixed;
  right: 0;

  top: 0;
  padding: 30px;
  overflow: hidden;
  z-index: 9999;

  @media ${device.mobileL} {
    padding: 0;
    left: 0;
  }
`;
