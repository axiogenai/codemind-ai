import {
  Check,
  Circle,
  FileText,
  Globe2,
  ImageIcon,
  MessageSquare,
  PencilLine,
  Search,
  Brain,
  SquareTerminal,
  Wrench,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE_OUT, SPRING_LAYOUT } from "@/lib/ease";
import { cn } from "@/lib/utils";
import type {
  AgentActivityItem,
  AgentActivitySearch,
  AgentActivityStep,
  AgentActivityText,
  AgentActivityTool,
  AgentActivityTrace,
  AgentSearchResult,
} from "./types";

function StepRow({ item }: { item: AgentActivityStep }) {
  const state = item.status ?? "complete";

  return (
    <div className="flex min-h-7 items-center gap-2.5 rounded-md px-1.5 py-1 whitespace-nowrap">
      <span
        aria-hidden="true"
        className="grid size-4 shrink-0 place-items-center text-zinc-400 dark:text-zinc-500"
      >
        {state === "complete" ? (
          <Check className="size-3.5 text-zinc-900 dark:text-zinc-100" strokeWidth={2.2} />
        ) : state === "active" ? (
          <span className="relative grid size-3 place-items-center">
            <span className="size-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
          </span>
        ) : (
          <Circle className="size-3 text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} />
        )}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 leading-5 text-xs sm:text-sm font-normal truncate whitespace-nowrap",
          state === "pending"
            ? "text-zinc-400 dark:text-zinc-500"
            : state === "active"
            ? "text-zinc-900 dark:text-zinc-100 font-medium"
            : "text-zinc-700 dark:text-zinc-300",
        )}
      >
        {item.label}
      </span>
      {item.meta ? (
        <span className="shrink-0 leading-5 text-xs font-mono text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
          {item.meta}
        </span>
      ) : null}
    </div>
  );
}

function TextRow({ item }: { item: AgentActivityText }) {
  return (
    <div className="rounded-md px-1.5 py-1 leading-5 text-zinc-600 dark:text-zinc-400">
      {item.content}
    </div>
  );
}

function SearchResultRow({
  result,
}: {
  result: AgentSearchResult;
}) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="grid size-5 shrink-0 place-items-center text-zinc-400 dark:text-zinc-500"
      >
        {result.icon ?? <Globe2 className="size-3" strokeWidth={2} />}
      </span>
      <span className="min-w-0 truncate font-medium text-zinc-900 dark:text-zinc-100 text-xs whitespace-nowrap">
        {result.title}
      </span>
      {result.domain ? (
        <span className="min-w-0 truncate text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
          {result.domain}
        </span>
      ) : null}
    </>
  );
  const className = cn(
    "flex min-h-7 items-center gap-2 rounded-md px-1.5 py-1 text-left outline-none transition-colors whitespace-nowrap",
    result.url && "focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600",
  );

  return result.url ? (
    <a href={result.url} className={className} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}

function SearchRow({ item }: { item: AgentActivitySearch }) {
  const reduce = useReducedMotion() ?? false;
  const enter = reduce ? { opacity: 1 } : { opacity: 0, y: 6 };
  const visible = { opacity: 1, y: 0 };
  const exit = reduce ? { opacity: 0 } : { opacity: 0, y: -3 };
  const transition = reduce
    ? { duration: 0 }
    : {
        opacity: { duration: 0.18, ease: EASE_OUT },
        y: SPRING_LAYOUT,
        layout: SPRING_LAYOUT,
      };

  return (
    <div className="space-y-0.5">
      <div className="flex min-h-7 items-center gap-2.5 rounded-md px-1.5 py-1 text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm whitespace-nowrap">
        <Search aria-hidden="true" className="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.8} />
        <span className="min-w-0 truncate whitespace-nowrap">{item.query}</span>
      </div>
      {item.results?.length ? (
        <div className="space-y-0.5 pl-4">
          <AnimatePresence initial mode="popLayout">
            {item.results.map((result) => (
              <motion.div
                layout="position"
                key={result.id}
                initial={enter}
                animate={visible}
                exit={exit}
                transition={transition}
              >
                <SearchResultRow result={result} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : null}
      <AnimatePresence initial>
        {item.moreCount ? (
          <motion.div
            key="more-results"
            initial={enter}
            animate={visible}
            exit={exit}
            transition={transition}
            className="px-1.5 py-1 pl-8 text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap"
          >
            +{item.moreCount} more
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ActionIcon({ action }: { action: string }) {
  if (action === "read") return <FileText className="size-3.5" />;
  if (action === "edit" || action === "write") {
    return <PencilLine className="size-3.5" />;
  }
  if (action === "run") return <SquareTerminal className="size-3.5" />;
  return <Wrench className="size-3.5" />;
}

function ToolRow({ item }: { item: AgentActivityTool }) {
  const action = item.action.charAt(0).toUpperCase() + item.action.slice(1);

  return (
    <div className="flex min-h-8 min-w-0 items-center gap-2.5 rounded-md px-1.5 py-0.5 leading-5 text-xs sm:text-sm whitespace-nowrap">
      <span
        aria-hidden="true"
        className="grid size-4 shrink-0 place-items-center text-zinc-400 dark:text-zinc-500"
      >
        <ActionIcon action={item.action} />
      </span>
      <span className="shrink-0 font-medium text-zinc-800 dark:text-zinc-200">{action}</span>
      <span className="min-w-0 flex-1 truncate rounded-lg bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-0.5 font-mono text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-white/[0.04] whitespace-nowrap">
        {item.target}
      </span>
      {typeof item.additions === "number" || typeof item.deletions === "number" ? (
        <span className="flex shrink-0 items-center gap-2 font-mono tabular-nums text-xs whitespace-nowrap">
          {typeof item.additions === "number" ? (
            <span className="text-zinc-700 dark:text-zinc-300 font-semibold">+{item.additions}</span>
          ) : null}
          {typeof item.deletions === "number" ? (
            <span className="text-zinc-400 dark:text-zinc-500">−{item.deletions}</span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

function TraceIcon({ kind }: { kind: AgentActivityTrace["kind"] }) {
  if (kind === "thinking") return <Brain className="size-3.5" />;
  if (kind === "message") return <MessageSquare className="size-3.5" />;
  if (kind === "write") return <PencilLine className="size-3.5" />;
  if (kind === "run") return <SquareTerminal className="size-3.5" />;
  if (kind === "read") return <ImageIcon className="size-3.5" />;
  return <Wrench className="size-3.5" />;
}

function TraceRow({ item }: { item: AgentActivityTrace }) {
  return (
    <div className="flex min-h-8 min-w-0 items-center gap-2.5 rounded-md px-1.5 py-0.5 text-xs sm:text-sm whitespace-nowrap">
      <span
        aria-hidden="true"
        className="grid size-4 place-items-center text-zinc-400 dark:text-zinc-500 shrink-0"
      >
        {item.icon ?? <TraceIcon kind={item.kind} />}
      </span>
      <span className="font-medium text-zinc-800 dark:text-zinc-200 shrink-0 whitespace-nowrap">{item.label}</span>
      {item.detail ? (
        <span className="min-w-0 flex-1 truncate rounded-lg bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-0.5 font-mono text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-white/[0.04] whitespace-nowrap">
          {item.detail}
        </span>
      ) : null}
    </div>
  );
}

export function ActivityRow({ item }: { item: AgentActivityItem }) {
  if (item.type === "text") return <TextRow item={item} />;
  if (item.type === "search") return <SearchRow item={item} />;
  if (item.type === "tool") return <ToolRow item={item} />;
  if (item.type === "trace") return <TraceRow item={item} />;
  return <StepRow item={item} />;
}
