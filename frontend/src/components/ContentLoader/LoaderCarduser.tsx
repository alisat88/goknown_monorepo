/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import React from "react";
import ContentLoader from "react-content-loader";

const LoaderCarduser: React.FC<React.PropsWithChildren<unknown>> = () => {
  return (
    <ContentLoader
      speed={2}
      width={530}
      height={170}
      viewBox="0 0 530 170"
      backgroundColor="#e9e9e9"
      foregroundColor="#dedede"
    >
      <rect x="0" y="15" rx="10" ry="10" width="120" height="140" />
      <rect x="140" y="15" rx="10" ry="10" width="120" height="140" />
      <rect x="280" y="15" rx="10" ry="10" width="120" height="140" />
    </ContentLoader>
  );
};

export default LoaderCarduser;
