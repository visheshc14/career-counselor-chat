// src/components/SessionList.tsx
import { useMemo, useRef, useState } from "react";
import { trpc } from "@/utils/trpc";
import { clsx } from "clsx";

type Props = {
  onOpen: (id: string) => void;
  activeId?: string | null;
};

export function SessionList({ onOpen, activeId }: Props) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const utils = trpc.useUtils?.();

  const sessionsQuery = trpc.chat.listSessions.useQuery({ page: 1, pageSize: 50 });
  const list = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);

  const createSession = trpc.chat.createSession.useMutation({
    onSuccess: async (row) => {
      if (utils?.chat.listSessions.invalidate) {
        await utils.chat.listSessions.invalidate();
      } else {
        await sessionsQuery.refetch();
      }
      onOpen(row.id);
      setTitle("");
      inputRef.current?.focus();
    },
  });

  const pending = createSession.isPending || sessionsQuery.isLoading;

  const newSession = () => {
    if (pending) return;
    const t = title.trim();
    createSession.mutate({ title: t || "New" });
  };

  return (
    <div className="h-full flex flex-col card p-3 bg-transparent">
      {/* Compact creator */}
      <div className="mb-3">
        <label className="block text-[11px] font-medium tracking-wide text-gray-500 dark:text-gray-400 mb-1">
          Name your session
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              className={clsx(
                "input pr-10 py-1.5 text-sm",
                "placeholder:text-xs placeholder:text-gray-400",
                "transition shadow-sm focus:shadow",
                "bg-white/80 dark:bg-gray-900/70"
              )}
              placeholder="e.g., Backend interview plan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  newSession();
                } else if (e.key === "Escape") {
                  setTitle("");
                }
              }}
              aria-label="Session title"
              disabled={pending}
            />
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              ↵
            </div>
          </div>

          {/* Theme-aware "New" (black in light, white in dark) */}
          <button
            className="button-contrast px-3"
            onClick={newSession}
            disabled={pending}
            aria-busy={createSession.isPending}
            title="Create a new session"
          >
            {createSession.isPending ? "…" : "New"}
          </button>
        </div>
      </div>

      {/* Sessions list */}
      <div
        className="flex-1 overflow-y-auto space-y-2 pr-1"
        aria-busy={sessionsQuery.isLoading}
      >
        {sessionsQuery.isLoading && (
          <div className="space-y-2" aria-live="polite">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-11 rounded-lg bg-black/5 dark:bg-white/10 animate-pulse" />
            ))}
          </div>
        )}

        {sessionsQuery.isError && !sessionsQuery.isLoading && (
          <div className="text-xs text-red-600">Failed to load sessions. Try again.</div>
        )}

        {!sessionsQuery.isLoading && !list.length && (
          <div className="text-xs text-gray-500">No sessions yet.</div>
        )}

        {!sessionsQuery.isLoading &&
          list.map((s) => (
            <button
              key={s.id}
              onClick={() => onOpen(s.id)}
              className={clsx(
                "w-full text-left p-3 rounded-lg border transition hover:shadow-sm backdrop-blur-[1px]",
                activeId === s.id
                  ? // ✅ Blue → Purple gradient selection (light & dark)
                    "bg-gradient-to-r from-blue-600/15 to-purple-600/15 border-blue-600/30 " +
                    "dark:from-blue-400/15 dark:to-fuchsia-400/15 dark:border-blue-300/30"
                  : // Inactive: subtle ghost
                    "bg-transparent border-black/10 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/[0.06]"
              )}
            >
              <div className="text-sm font-semibold truncate">{s.title}</div>
              <div className="text-[11px] text-gray-500">
                {new Date(s.createdAt as any).toLocaleString()}
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}