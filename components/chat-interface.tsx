"use client";

import { useState } from "react";

import { ChatBubble } from "./chat-bubble";
import { ChatInput } from "./chat-input";
import { ChatMetaBar } from "./chat-meta-bar";

export type Attachment = { name: string; size: number };

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
};

export function ChatInterface({
  branch,
  added,
  removed,
}: {
  branch: string | null;
  added: number;
  removed: number;
}) {
  const [messages, setMessages] = useState<Message[]>([]);

  function handleSend(content: string, files: File[]) {
    const attachments: Attachment[] = files.map((file) => ({
      name: file.name,
      size: file.size,
    }));
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Bienvenue dans Codex. L'interface est prête, branchez votre backend pour générer de vraies réponses.",
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-44 pt-6">
      <div className="flex-1 space-y-4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-6 pl-4 sm:pl-20">
        <div className="mx-auto max-w-3xl">
          <ChatMetaBar branch={branch} added={added} removed={removed} />
          <ChatInput onSend={handleSend} />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[40vh] flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-medium tracking-tight">
        Bienvenue dans Codex
      </h2>
      <p className="mt-2 text-sm text-white/60">
        Posez une question pour commencer.
      </p>
    </div>
  );
}
