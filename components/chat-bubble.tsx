import type { Message } from "./chat-interface";

export function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] space-y-2 rounded-3xl px-5 py-3 text-sm leading-relaxed shadow-sm backdrop-blur-md ${
          isUser
            ? "bg-white/15 text-white"
            : "border border-white/10 bg-black/40 text-white"
        }`}
      >
        {message.content ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : null}
        {message.attachments && message.attachments.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {message.attachments.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-white/80"
              >
                <FileIcon />
                <span className="max-w-[140px] truncate">{file.name}</span>
                <span className="text-white/40">
                  {formatSize(file.size)}
                </span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
