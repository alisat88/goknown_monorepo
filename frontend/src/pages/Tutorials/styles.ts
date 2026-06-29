import styled from "styled-components";

import { device } from "../../styles/devices";

export const Container = styled.div`
  min-height: 100vh;
  background: radial-gradient(
      circle at 18% 8%,
      rgba(83, 191, 153, 0.12),
      transparent 28%
    ),
    linear-gradient(135deg, #070920 0%, #000034 48%, #061827 100%);
  color: #f8fafc;
`;

export const PageHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 15;
  min-height: 86px;
  padding: 18px 36px;
  display: flex;
  align-items: center;
  gap: 18px;
  background: rgba(3, 7, 32, 0.82);
  border-bottom: 1px solid rgba(83, 191, 153, 0.14);
  backdrop-filter: blur(16px);

  @media ${device.laptopM} {
    padding: 18px 20px;
  }
`;

export const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border: 1px solid rgba(83, 191, 153, 0.28);
  border-radius: 10px;
  background: transparent;
  color: #8be7d7;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s, border-color 0.2s, color 0.2s;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  &:hover {
    border-color: rgba(83, 191, 153, 0.55);
    background: rgba(83, 191, 153, 0.08);
    color: #f8fafc;
  }
`;

export const HeaderTitle = styled.div`
  min-width: 0;

  h1 {
    margin: 0;
    color: #f8fafc;
    font-size: 22px;
    line-height: 1.2;
  }

  p {
    margin: 4px 0 0;
    color: #8be7d7;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
`;

export const Content = styled.main`
  max-width: 1240px;
  margin: 0 auto;
  padding: 36px 36px 56px;

  @media ${device.laptopM} {
    padding: 28px 20px 48px;
  }
`;

export const SectionHeader = styled.div`
  margin-bottom: 24px;

  h2 {
    margin: 0 0 8px;
    color: #f8fafc;
    font-size: 20px;
    font-weight: 700;
  }

  p {
    margin: 0;
    color: #98a8bc;
    font-size: 14px;
    line-height: 1.5;
  }
`;

export const VideoGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media ${device.desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media ${device.laptopM} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media ${device.mobileL} {
    grid-template-columns: 1fr;
  }
`;

export const VideoCard = styled.a`
  display: flex;
  flex-direction: column;
  min-height: 168px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.68);
  text-decoration: none;
  transition: transform 0.2s, background 0.2s, border-color 0.2s,
    box-shadow 0.2s;

  &:hover {
    border-color: rgba(83, 191, 153, 0.42);
    background: rgba(12, 24, 54, 0.88);
    box-shadow: 0 18px 38px rgba(0, 0, 0, 0.18);
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 3px solid rgba(103, 232, 249, 0.32);
    outline-offset: 2px;
  }
`;

export const VideoCardIcon = styled.div`
  width: 42px;
  height: 42px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 12px;
  background: rgba(83, 191, 153, 0.13);
  color: #53bf99;

  svg {
    width: 22px;
    height: 22px;
  }
`;

export const VideoCardBody = styled.div`
  flex: 1;

  strong {
    display: block;
    color: #f8fafc;
    font-size: 17px;
    line-height: 1.2;
    margin-bottom: 7px;
  }

  p {
    margin: 0;
    color: #98a8bc;
    font-size: 13px;
    line-height: 1.45;
  }
`;

export const WatchButton = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 7px 13px;
  border: 1px solid rgba(83, 191, 153, 0.34);
  border-radius: 8px;
  background: rgba(83, 191, 153, 0.08);
  color: #8be7d7;
  font-size: 13px;
  font-weight: 700;
  align-self: flex-start;

  svg {
    width: 14px;
    height: 14px;
  }

  ${VideoCard}:hover & {
    border-color: rgba(83, 191, 153, 0.62);
    background: rgba(83, 191, 153, 0.15);
    color: #f8fafc;
  }
`;
