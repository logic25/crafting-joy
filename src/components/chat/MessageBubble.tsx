import { ChatMessage } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isCircle = message.senderType === "circle";
  const isFamily = message.senderType === "family";

  return (
    <div className={cn("flex gap-2.5 py-1.5", isFamily && "justify-end")}>
      {/* Circle avatar */}
      {isCircle && (
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-xs font-bold text-primary">C</span>
        </div>
      )}

      <div className={cn("max-w-[80%] space-y-0.5", isFamily && "items-end")}>
        {/* Sender name */}
        <p className={cn(
          "text-[11px] font-medium px-1",
          isCircle ? "text-primary" : "text-muted-foreground text-right"
        )}>
          {message.senderName}
        </p>

        {/* Bubble */}
        <div className={cn(
          "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isCircle
            ? "bg-accent text-accent-foreground rounded-tl-md"
            : "bg-primary text-primary-foreground rounded-tr-md"
        )}>
          {isCircle ? (
            <div className="prose prose-sm max-w-none [&>p]:mb-1 [&>p:last-child]:mb-0">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : (
            <p>{message.content}</p>
          )}
        </div>

        {/* Timestamp */}
        <p className={cn(
          "text-[10px] text-muted-foreground px-1",
          isFamily && "text-right"
        )}>
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </p>
      </div>

      {/* Family avatar */}
      {isFamily && (
        <div className="w-7 h-7 rounded-full bg-warning/15 flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-xs font-bold text-warning">{message.senderName[0]}</span>
        </div>
      )}
    </div>
  );
}
