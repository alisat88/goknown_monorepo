import React, { useCallback } from "react";
import ContentLoader from "react-content-loader";

export default function UserLoader() {
  const Item = useCallback(
    (props: any) => (
      <ContentLoader height={50} width={220} {...props}>
        <rect x="55" y="12" rx="3" ry="3" width="123" height="7" />
        <rect x="55" y="23" rx="3" ry="3" width="80" height="7" />
        <circle cx="30" cy="22" r="18" />
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
}
