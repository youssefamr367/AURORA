import { useEffect, useState } from "react";

function calculatePageSize(width, height, type) {
  const safeWidth = width || 1280;
  const safeHeight = height || 900;

  if (type === "orders") {
    if (safeWidth < 640) return 4;
    if (safeWidth < 1024) return safeHeight < 820 ? 4 : 6;
    if (safeWidth < 1440) return safeHeight < 900 ? 6 : 8;
    return safeHeight < 980 ? 8 : 9;
  }

  if (safeWidth < 640) return 4;
  if (safeWidth < 1024) return safeHeight < 820 ? 4 : 6;
  if (safeWidth < 1440) return safeHeight < 900 ? 6 : 8;
  return safeHeight < 980 ? 8 : 10;
}

export function useResponsivePageSize(type = "products") {
  const [pageSize, setPageSize] = useState(() =>
    calculatePageSize(
      typeof window === "undefined" ? 1280 : window.innerWidth,
      typeof window === "undefined" ? 900 : window.innerHeight,
      type
    )
  );

  useEffect(() => {
    const onResize = () => {
      setPageSize(calculatePageSize(window.innerWidth, window.innerHeight, type));
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [type]);

  return pageSize;
}
