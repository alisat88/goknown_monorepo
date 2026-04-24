import React, { useContext } from "react";
import Skeleton from "react-loading-skeleton";
// import { ThemeContext } from "styled-components";

interface IFieldProps {
  value?: string | number | JSX.Element;
  theme?: "light" | "dark";
  error?: string;
  loading?: boolean;
  width?: number;
  height?: number;
  count?: number;
  tag?: string;
}

const Field: React.FC<React.PropsWithChildren<IFieldProps>> = ({
  width,
  height,
  count = 1,
  loading = false,
  value,
  error,
  theme = "light",
  tag = "Fragment",
}: IFieldProps) => {
  // const themeContext = useContext(ThemeContext);
  const CustomTag = tag as keyof JSX.IntrinsicElements;
  if (loading) {
    return (
      <CustomTag>
        <Skeleton
          count={count}
          width={width}
          height={height}
          baseColor={theme === "dark" ? "#515151" : "#e9e9e9"}
          highlightColor={theme === "dark" ? "#333" : "#3333"}
        />
      </CustomTag>
    );
  }
  if (value) {
    return <CustomTag>{value}</CustomTag>;
  }
  return (
    <CustomTag
      style={{
        textTransform: "capitalize",
        color: `#fff`,
      }}
    >
      {error || "Undefined"}
    </CustomTag>
  );
};

export default Field;
