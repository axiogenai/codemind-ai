import { motion, type HTMLMotionProps } from "motion/react";
import type { CSSProperties } from "react";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export interface AgentDisclosureProps
  extends Omit<HTMLMotionProps<"div">, "animate" | "initial"> {
  open: boolean;
  openHeight?: CSSProperties["height"];
}

/** Shared transform-only reveal for collapsible agent content. */
export function AgentDisclosure({
  open,
  openHeight = "auto",
  className,
  style,
  transition,
  ...props
}: AgentDisclosureProps) {
  return (
    <motion.div
      {...props}
      aria-hidden={!open}
      inert={!open ? true : undefined}
      initial={false}
      animate={{
        opacity: open ? 1 : 0,
        clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
        y: open ? 0 : -4,
      }}
      transition={
        transition ?? {
          duration: open ? 0.22 : 0.14,
          ease: EASE_OUT,
        }
      }
      className={cn("overflow-hidden", className)}
      style={{
        ...style,
        height: open ? openHeight : 0,
        pointerEvents: open ? undefined : "none",
        transformOrigin: "top",
      }}
    />
  );
}
