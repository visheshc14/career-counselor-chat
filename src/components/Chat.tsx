import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { MessageBubble, type BubbleMessage, type MessageStatus } from "./MessageBubble";

type Message = BubbleMessage;

// Local-only optimistic message
type PendingMsg = Message & { clientStatus: "sending" | "failed" };

export function Chat({ sessionId }: { sessionId: string }) {
  const { data: session } = useSession();
  const youName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "You";

  // tRPC
  const utils = trpc.useUtils?.();
  const { data, isFetching, refetch, isLoading } =
    trpc.chat.getMessages.useQuery({ sessionId });

  const [pending, setPending] = useState<PendingMsg[]>([]);

  const send = trpc.chat.sendMessage.useMutation({
    onSuccess: async () => {
      setPending([]);
      if (utils?.chat.getMessages.invalidate) {
        await utils.chat.getMessages.invalidate({ sessionId });
      } else {
        await refetch();
      }
      focusInput();
    },
    onError: () => {
      setPending(arr => arr.map(p => ({ ...p, clientStatus: "failed" })));
    },
  });

  // UI state/refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const serverMessages = useMemo(() => (data ?? []) as Message[], [data]);

  // merge server + optimistic, sort by time
  const allMessages: (Message | PendingMsg)[] = useMemo(() => {
    const merged = [...serverMessages, ...pending];
    return merged.sort(
      (a, b) =>
        new Date(a.createdAt as any).getTime() -
        new Date(b.createdAt as any).getTime()
    );
  }, [serverMessages, pending]);

  const focusInput = () => inputRef.current?.focus();

  // Auto-scroll on updates
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [allMessages.length, isFetching, send.isPending]);

  const handleSend = useCallback(async () => {
    const text = content.trim();
    if (!text || send.isPending) return;
    setError(null);

    // optimistic user message
    const temp: PendingMsg = {
      id: `temp-${Date.now()}`,
      sessionId,
      role: "user",
      content: text,
      createdAt: new Date(),
      clientStatus: "sending",
    };
    setPending(arr => [...arr, temp]);
    setContent("");

    try {
      await send.mutateAsync({ sessionId, content: text });
    } catch (e: any) {
      setError(e?.message ?? "Failed to send. Try again.");
      focusInput();
    }
  }, [content, send, sessionId]);

  // Cmd/Ctrl + Enter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void handleSend();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSend]);

  // derive status for user messages
  function statusFor(msg: Message | PendingMsg): MessageStatus {
    if (msg.role !== "user") return undefined;

    if ("clientStatus" in msg) return msg.clientStatus;

    const t = new Date(msg.createdAt as any).getTime();
    const hasAssistantAfter = serverMessages.some(
      m => m.role === "assistant" && new Date(m.createdAt as any).getTime() > t
    );
    if (hasAssistantAfter) return "read";
    return "sent";
  }

  const pendingSend = send.isPending;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Messages */}
      <div
        ref={viewportRef}
        className="flex-1 overflow-y-auto space-y-4 px-4 py-4 md:px-5 md:py-5
                   bg-gradient-to-b from-transparent to-black/[0.03] dark:to-white/[0.04]"
        aria-live="polite"
      >
        {isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 w-5/6 rounded-2xl bg-black/5 dark:bg-white/10 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading &&
          allMessages.map(m => (
            <MessageBubble key={m.id} m={m as Message} status={statusFor(m)} />
          ))}

        {!isLoading && !allMessages.length && !isFetching && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Say hi to your AI career counselor 👋
          </div>
        )}

        {pendingSend && (
          <div className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
            thinking…
          </div>
        )}
      </div>

      {/* Error line */}
      {error && (
        <div className="px-3 pt-2 text-xs text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* Composer */}
      <form
        className="sticky bottom-0 border-t border-black/5 dark:border-white/10
                   bg-white/75 dark:bg-black/40 backdrop-blur px-3 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            className="input"
            placeholder={`Message as ${youName}… (Cmd/Ctrl+Enter)`}
            aria-label="Message"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                void handleSend();
              }
            }}
            disabled={pendingSend}
            autoFocus
          />
          {/* THEME-AWARE SEND (black in light, white in dark) */}
          <button
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium
                       focus:outline-none focus-visible:ring-2 disabled:opacity-50
                       text-white bg-black hover:bg-black/90 focus-visible:ring-black/20
                       dark:text-black dark:bg-white dark:hover:bg-white/90 dark:focus-visible:ring-white/20"
            disabled={!content.trim() || pendingSend}
            title="Cmd/Ctrl+Enter"
            aria-busy={pendingSend}
          >
            {pendingSend ? "Sending…" : "Send"}
          </button>
        </div>
        <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
          You’re signed in as <span className="font-medium">{youName}</span>.
        </div>
      </form>
    </div>
  );
}