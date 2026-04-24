import React, { useCallback } from "react";
import ContentLoader from "react-content-loader";

const SmallLisItemLoader: React.FC<React.PropsWithChildren<unknown>> = () => {
  const Item = useCallback(
    (props: any) => (
      <ContentLoader
        speed={2}
        width="100%"
        height={72}
        // viewBox="0 0 960 101"
        {...props}
      >
        <rect x="0" y="1" rx="10" ry="10" width="100%" height="88" />
      </ContentLoader>
    ),
    []
  );

  return (
    <>
      {Array(3)
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

export default SmallLisItemLoader;
