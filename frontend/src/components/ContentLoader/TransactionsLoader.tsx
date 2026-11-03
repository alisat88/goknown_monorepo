/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import React, { useCallback } from "react";
import ContentLoader from "react-content-loader";

const LoaderCarduser: React.FC<React.PropsWithChildren<unknown>> = () => {
  const Item = useCallback(
    (props: any) => (
      <ContentLoader
        speed={2}
        width={660}
        height={101}
        viewBox="0 0 660 101"
        {...props}
      >
        <rect x="0" y="34" rx="0" ry="0" width="70" height="20" />
        <rect x="94" y="1" rx="10" ry="10" width="566" height="88" />
      </ContentLoader>
    ),
    []
  );

  return (
    <>
      {Array(5)
        .fill("")
        .map((e, i) => (
          <Item
            key={i}
            style={{ opacity: Number(1.2 / i).toFixed(1) }}
            backgroundColor="#e9e9e9"
            foregroundColor="#dedede"
          />
        ))}
    </>
  );
};

export default LoaderCarduser;
