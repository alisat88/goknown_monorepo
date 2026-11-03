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
  .__react_modal_image__icon_menu {
    svg {
      background: none !important;
      color: #fff !important;
    }
  }
  .__react_modal_image__modal_content {
    > div {
      height: 100%;
      width: 100%;
      > img {
        top: 50%;
        left: 50%;
        height: auto !important;
        width: 100%;
      }
    }
  }
`;
