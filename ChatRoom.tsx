import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string | null;
  };
}

interface ChatRoomProps {
  challengeId: string;
}

const ChatRoom = ({ challengeId }: ChatRoomProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUser();
    fetchMessages();
    subscribeToMessages();
  }, [challengeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select(`
        id,
        message,
        created_at,
        user_id
      `)
      .eq("challenge_id", challengeId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!error && data) {
      // Fetch profiles separately
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const messagesWithProfiles = data.map(m => ({
        ...m,
        profiles: profileMap.get(m.user_id) || { username: "Anonymous" }
      }));

      setMessages(messagesWithProfiles);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat_${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `challenge_id=eq.${challengeId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          
          // Fetch the profile for the new message
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", newMsg.user_id)
            .maybeSingle();

          setMessages((prev) => [
            ...prev,
            { ...newMsg, profiles: profile || { username: "Anonymous" } },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    const { error } = await supabase.from("chat_messages").insert({
      challenge_id: challengeId,
      user_id: currentUserId,
      message: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No messages yet. Start the conversation! 💬</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {msg.profiles?.username || "Anonymous"}
                    </p>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isOwn ? "opacity-70" : "text-muted-foreground"}`}>
                    {format(new Date(msg.created_at), "HH:mm")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 rounded-xl"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="gradient-primary text-white rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
