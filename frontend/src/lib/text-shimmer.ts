import type { CSSProperties } from "react";

export const TEXT_SHIMMER_KEYFRAMES =
  "@keyframes beui-text-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}";

export const TEXT_SHIMMER_CLASS_NAME =
  "beui-text-shimmer bg-[length:200%_100%] bg-clip-text text-transparent bg-[linear-gradient(110deg,rgba(113,113,122,0.7)_25%,rgba(244,244,245,1)_50%,rgba(113,113,122,0.7)_75%)] dark:bg-[linear-gradient(110deg,rgba(161,161,170,0.6)_25%,rgba(255,255,255,1)_50%,rgba(161,161,170,0.6)_75%)]";

export function textShimmerStyle(duration: number): CSSProperties {
  return {
    animation: `beui-text-shimmer ${duration}s linear infinite`,
  };
}
