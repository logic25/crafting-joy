import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { chatMessages as initialMessages } from "@/data/mockData";
import { ChatMessage } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCareCircle } from "@/hooks/useCareCircle";

type CareCircleData = { careCircleId: string; careRecipientId: string; careRecipientName: string } | null | undefined;

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: careCircleData } = useCareCircle();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Check if this is a /feedback message
    const feedbackMatch = content.match(/^\/feedback\s+(.+)/is);

    try {
      let data: any;
      let error: any;

      if (feedbackMatch) {
        // Feedback mode — stress test and log
        const result = await supabase.functions.invoke("circle-chat", {
          body: {
            feedbackMode: true,
            feedbackText: feedbackMatch[1].trim(),
            userName,
            userId: user?.id,
            careCircleId: careCircleData?.careCircleId || null,
            messages: [],
          },
        });
        data = result.data;
        error = result.error;
      } else {
        // Normal chat mode
        const aiMessages = [...messages, userMsg].map((m) => ({
          role: m.senderType === "circle" ? ("assistant" as const) : ("user" as const),
          content: m.senderType === "family" ? `${m.senderName}: ${m.content}` : m.content,
        }));

        const result = await supabase.functions.invoke("circle-chat", {
          body: { messages: aiMessages },
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

      const circleMsg: ChatMessage = {
        id: `circle-${Date.now()}`,
        senderId: "circle",
        senderName: "Circle",
        senderType: "circle",
        content: data.content || "I'm not sure how to respond to that.",
        timestamp: new Date(),
        type: "text",
      };

      setMessages((prev) => [...prev, circleMsg]);
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
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-1 pb-4 -mx-4 px-4 md:-mx-6 md:px-6">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
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

        {/* Input */}
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
};

export default Chat;
