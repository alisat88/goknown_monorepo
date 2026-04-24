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
