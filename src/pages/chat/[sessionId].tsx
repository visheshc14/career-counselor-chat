import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { trpc } from "@/utils/trpc";
import { SessionList } from "@/components/SessionList";
import { Chat } from "@/components/Chat";

export default function ChatDetail() {
  const r = useRouter();
  const { sessionId } = r.query as { sessionId?: string };
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) setActiveId(sessionId);
  }, [sessionId]);

  const utils = trpc.useUtils?.();
  const sessionsQ = trpc.chat.listSessions.useQuery({ page: 1, pageSize: 50 });

  const wipeAndCreate = trpc.chat.wipeAndCreate.useMutation({
    onSuccess: async (row) => {
      if (utils?.chat.listSessions.invalidate) {
        await utils.chat.listSessions.invalidate();
      } else {
        await sessionsQ.refetch();
      }
      setActiveId(row.id);
      r.push(`/chat/${row.id}`);
    },
  });

  const refreshAll = async () => {
    if (utils?.chat.listSessions.invalidate) {
      await utils.chat.listSessions.invalidate();
    } else {
      await sessionsQ.refetch();
    }
    if (sessionId) r.replace("/chat");
  };

  const doSignOut = async () => {
    await signOut({ callbackUrl: "/?signout=1" });
  };

  return (
    <div className="container py-6">
      <Head><title>Chat • Career Counselor</title></Head>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* All Sessions — flips with theme */}
          <button
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium
                       focus:outline-none focus-visible:ring-2 disabled:opacity-50
                       text-white bg-black hover:bg-black/90 focus-visible:ring-black/20
                       dark:text-black dark:bg-white dark:hover:bg-white/90 dark:focus-visible:ring-white/20"
            onClick={refreshAll}
            aria-busy={sessionsQ.isFetching}
            title="Refresh the session list"
          >
            {sessionsQ.isFetching ? "Refreshing…" : "All Sessions"}
          </button>
          <h2 className="text-xl font-semibold">Your Sessions</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* New Session — flips with theme */}
          <button
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium
                       focus:outline-none focus-visible:ring-2 disabled:opacity-50
                       text-white bg-black hover:bg-black/90 focus-visible:ring-black/20
                       dark:text-black dark:bg-white dark:hover:bg-white/90 dark:focus-visible:ring-white/20"
            onClick={() => {
              if (!wipeAndCreate.isPending) {
                const title = `New Session — ${new Date().toLocaleString()}`;
                wipeAndCreate.mutate({ title });
              }
            }}
            disabled={wipeAndCreate.isPending}
            title="Start fresh (clears all sessions and creates one new)"
          >
            {wipeAndCreate.isPending ? "Creating…" : "New Session"}
          </button>

          {/* Sign out — flips with theme */}
          <button
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium
                       focus:outline-none focus-visible:ring-2 disabled:opacity-50
                       text-white bg-black hover:bg-black/90 focus-visible:ring-black/20
                       dark:text-black dark:bg-white dark:hover:bg-white/90 dark:focus-visible:ring-white/20"
            onClick={doSignOut}
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Layout with fully transparent panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 h-[78vh]">
          <SessionList
            activeId={activeId}
            onOpen={(id) => {
              setActiveId(id);
              r.push(`/chat/${id}`);
            }}
          />
        </div>

        <div className="md:col-span-2 rounded-2xl border border-black/10 dark:border-white/15 bg-transparent p-0 h-[78vh] overflow-hidden">
          {sessionId ? (
            <Chat sessionId={sessionId} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              Select a session on the left.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}