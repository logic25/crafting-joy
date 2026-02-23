import { useState, useRef, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCareCircle } from "@/hooks/useCareCircle";
import { useChatHistory, useSaveChatMessage } from "@/hooks/useChatHistory";

type CareCircleData = { careCircleId: string; careRecipientId: string; careRecipientName: string } | null | undefined;

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  senderId: "circle",
  senderName: "Circle",
  senderType: "circle",
  content: "👋 Hi! I'm Circle, your family's AI care assistant. Ask me anything about your loved one's health, medications, appointments, or vitals. I'm here to help coordinate care together.\n\nTip: Type `/feedback` followed by your idea to submit suggestions!",
  timestamp: new Date(),
  type: "text",
};

const Chat = () => {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: careCircleData } = useCareCircle();
  const careCircleId = careCircleData?.careCircleId;

  const { data: savedMessages, isLoading: historyLoading } = useChatHistory(careCircleId);
  const saveMessage = useSaveChatMessage();

  // Convert saved DB messages to ChatMessage format
  const restoredMessages = useMemo<ChatMessage[]>(() => {
    if (!savedMessages) return [];
    return savedMessages.map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderType: m.role === "assistant" ? "circle" as const : "family" as const,
      content: m.content,
      timestamp: new Date(m.created_at),
      type: "text" as const,
    }));
  }, [savedMessages]);

  const allMessages = useMemo(() => {
    return [WELCOME_MESSAGE, ...restoredMessages, ...localMessages];
  }, [restoredMessages, localMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const sendMessage = async (content: string) => {
    const userName = user?.user_metadata?.first_name || "You";

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: user?.id || "1",
      senderName: userName,
      senderType: "family",
      content,
      timestamp: new Date(),
      type: "text",
    };

    setLocalMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Save user message to DB
    if (careCircleId && user) {
      saveMessage.mutate({
        care_circle_id: careCircleId,
        sender_id: user.id,
        sender_name: userName,
        content,
        role: "user",
      });
    }

    const feedbackMatch = content.match(/^\/feedback\s+(.+)/is);

    try {
      let data: any;
      let error: any;

      if (feedbackMatch) {
        const result = await supabase.functions.invoke("circle-chat", {
          body: {
            feedbackMode: true,
            feedbackText: feedbackMatch[1].trim(),
            userName,
            userId: user?.id,
            careCircleId: careCircleId || null,
            messages: [],
          },
        });
        data = result.data;
        error = result.error;
      } else {
        // Build conversation context from all messages (restored + local)
        const allChatMsgs = [...restoredMessages, ...localMessages, userMsg];
        const aiMessages = allChatMsgs.map((m) => ({
          role: m.senderType === "circle" ? ("assistant" as const) : ("user" as const),
          content: m.senderType === "family" ? `${m.senderName}: ${m.content}` : m.content,
        }));

        const result = await supabase.functions.invoke("circle-chat", {
          body: { messages: aiMessages, careCircleId: careCircleId || null },
        });
        data = result.data;
        error = result.error;
      }

      if (error) {
        if (error.message?.includes("429")) {
          toast({ title: "Rate limited", description: "Please wait a moment and try again.", variant: "destructive" });
        } else if (error.message?.includes("402")) {
          toast({ title: "Credits needed", description: "Please add credits to continue using Circle.", variant: "destructive" });
        } else {
          throw error;
        }
        setIsLoading(false);
        return;
      }

      const circleContent = data.content || "I'm not sure how to respond to that.";

      const circleMsg: ChatMessage = {
        id: `circle-${Date.now()}`,
        senderId: "circle",
        senderName: "Circle",
        senderType: "circle",
        content: circleContent,
        timestamp: new Date(),
        type: "text",
      };

      setLocalMessages((prev) => [...prev, circleMsg]);

      // Save AI response to DB
      if (careCircleId) {
        saveMessage.mutate({
          care_circle_id: careCircleId,
          sender_id: "circle",
          sender_name: "Circle",
          content: circleContent,
          role: "assistant",
        });
      }
    } catch (e) {
      console.error("Chat error:", e);
      toast({ title: "Connection error", description: "Couldn't reach Circle. Try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)]">
        <div className="flex-1 overflow-y-auto space-y-1 pb-4 -mx-4 px-4 md:-mx-6 md:px-6">
          {historyLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading chat history…</div>
          ) : (
            allMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-2 py-2 px-1">
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">C</span>
              </div>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse-soft" />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse-soft" style={{ animationDelay: "0.2s" }} />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse-soft" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
};

export default Chat;
