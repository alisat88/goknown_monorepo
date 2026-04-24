import React, { useCallback } from "react";
import ContentLoader from "react-content-loader";

const LoaderDLs: React.FC<React.PropsWithChildren<unknown>> = () => {
  const Item = useCallback(
    (props: any) => (
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
    ),
    []
  );

  return (
    <>
      {Array(1)
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

export default LoaderDLs;
