// src/components/MessageBubble.tsx
import React from "react";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";
import { Markdown } from "./Markdown";

export type BubbleMessage = {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string | Date;
};

export type MessageStatus = "sending" | "sent" | "read" | "failed" | undefined;

function firstChar(nameOrEmail?: string | null) {
  if (!nameOrEmail) return "Y";
  const base = nameOrEmail.includes("@")
    ? nameOrEmail.split("@")[0]
    : nameOrEmail;
  return (base.trim()[0] || "Y").toUpperCase();
}

function LetterBadge({
  ch,
  mine,
  title,
}: {
  ch: string;
  mine: boolean;
  title: string;
}) {
  // Minimal monochrome badge so the gradient bubbles pop
  return (
    <div
      className={[
        "h-7 w-7 rounded-full grid place-items-center select-none shrink-0",
        "text-[11px] font-semibold",
        "border border-black/20 text-black",
        "dark:border-white/25 dark:text-white",
        mine ? "order-2" : "order-1",
      ].join(" ")}
      aria-label={`${title} avatar`}
      title={title}
    >
      {ch}
    </div>
  );
}

function StatusText({ status }: { status: MessageStatus }) {
  if (!status) return null;
  const label =
    status === "sending"
      ? "sending"
      : status === "sent"
      ? "sent"
      : status === "read"
      ? "read"
      : status === "failed"
      ? "failed"
      : "";

  const tone =
    status === "failed"
      ? "text-red-600 dark:text-red-400"
      : "text-gray-500 dark:text-gray-400";

  return <span className={tone}>{label}</span>;
}

export function MessageBubble({
  m,
  status,
}: {
  m: BubbleMessage;
  status?: MessageStatus;
}) {
  const { data: session } = useSession();
  const isUser = m.role === "user";
  const isAssistant = m.role === "assistant";

  const displayName = isUser
    ? session?.user?.name?.trim() ||
      session?.user?.email?.split("@")[0] ||
      "You"
    : isAssistant
    ? "Counselor"
    : "System";

  const badgeChar = isAssistant
    ? "C"
    : isUser
    ? firstChar(session?.user?.name || session?.user?.email || "You")
    : "•";

  // Outer: gradient ring (blue → purple), transparent center so dots show
  // Inner: transparent, monochrome text
  const outerGradient =
    "p-[1px] rounded-2xl bg-gradient-to-r from-blue-600/25 to-purple-600/25 " +
    "dark:from-blue-400/30 dark:to-purple-400/30";
  const innerShell =
    "rounded-[calc(theme(borderRadius.2xl)-1px)] bg-transparent " +
    "text-black dark:text-white";

  // System stays amber, no gradient
  const systemShell =
    "rounded-2xl px-3.5 py-2.5 text-[15px] leading-6 " +
    "border border-amber-300/70 dark:border-amber-300/40 " +
    "text-amber-900 dark:text-amber-100 bg-transparent";

  const bubblePadding = "px-3.5 py-2.5 text-[15px] leading-6";
  const maxWidth = "max-w-[68ch]";

  // Markdown styling
  const proseBase =
    "prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-2 prose-li:my-0.5 prose-ul:pl-5";
  const proseLink = "prose-a:no-underline hover:prose-a:underline";

  return (
    <div
      className={[
        "group flex w-full items-start gap-3",
        isUser ? "justify-end" : "justify-start",
      ].join(" ")}
      role="group"
      aria-label={`${displayName} message`}
    >
      <LetterBadge ch={badgeChar} mine={isUser} title={displayName} />

      <div
        className={
          isUser ? "order-1 items-end flex flex-col" : "order-2 items-start flex flex-col"
        }
      >
        {/* Assistant with gradient ring */}
        {m.role === "assistant" && (
          <div className={[outerGradient, maxWidth].join(" ")}>
            <div className={[innerShell, bubblePadding].join(" ")}>
              <article className={[proseBase, "dark:prose-invert", proseLink].join(" ")}>
                <Markdown>{m.content}</Markdown>
              </article>
            </div>
          </div>
        )}

        {/* System (no gradient, amber info) */}
        {m.role === "system" && (
          <div className={[systemShell, maxWidth].join(" ")}>
            <article className={[proseBase, "dark:prose-invert"].join(" ")}>
              <Markdown>{m.content}</Markdown>
            </article>
          </div>
        )}

        {/* User with gradient ring (same palette for cohesion) */}
        {m.role === "user" && (
          <div className={[outerGradient, maxWidth].join(" ")}>
            <div className={[innerShell, bubblePadding].join(" ")}>
              <article className={[proseBase, "dark:prose-invert", proseLink].join(" ")}>
                <Markdown>{m.content}</Markdown>
              </article>
            </div>
          </div>
        )}

        {/* Meta line */}
        <div
          className={[
            "mt-1 text-[11px] text-gray-500 dark:text-gray-400",
            isUser ? "text-right" : "text-left",
          ].join(" ")}
        >
          <span>{displayName}</span>
          {" · "}
          <span>{dayjs(m.createdAt).format("HH:mm")}</span>
          {isUser && status ? (
            <>
              {" · "}
              <StatusText status={status} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;