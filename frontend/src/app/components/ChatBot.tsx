import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send, Bot, User } from "lucide-react";
import { Card } from "./ui/card";
import { useProjects } from "../contexts/ProjectContext";
import { teachRespond, ContextMessage } from "../lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

export function ChatBot() {
  const { backendSessionId } = useProjects();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      text: "Hi! I'm GPTeach — I'm here to help you understand your project specification. I won't give you the answers, but I'll help you think through the problem. What would you like to explore?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildRecentContext = (): ContextMessage[] => {
    // Send the last 10 messages as context (skip the initial greeting)
    return messages.slice(-10).map((m) => ({
      role: m.sender === "user" ? ("student" as const) : ("assistant" as const),
      content: m.text,
    }));
  };

  const handleSend = async () => {
    if (!input.trim() || !backendSessionId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: new Date(),
    };

    const currentInput = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await teachRespond({
        session_id: backendSessionId,
        student_message: currentInput,
        recent_context: buildRecentContext(),
      });

      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: response.assistant_message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Sorry, I couldn't reach the server. Please make sure the backend is running and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("Teach request failed:", err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="font-semibold text-zinc-100">Chat</h2>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4 bg-zinc-950">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.sender === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`flex-shrink-0 size-8 rounded-full flex items-center justify-center ${
                message.sender === "bot"
                  ? "bg-blue-900"
                  : "bg-green-900"
              }`}
            >
              {message.sender === "bot" ? (
                <Bot className="size-4 text-blue-300" />
              ) : (
                <User className="size-4 text-green-300" />
              )}
            </div>

            <div
              className={`flex-1 max-w-[80%] ${message.sender === "user" ? "items-end" : ""}`}
            >
              <Card
                className={`p-3 border ${
                  message.sender === "user"
                    ? "bg-green-950 border-green-900"
                    : "bg-blue-950 border-blue-900"
                }`}
              >
                {message.sender === "bot" ? (
                  <div className="max-w-none prose prose-invert prose-zinc prose-sm prose-headings:text-zinc-50 prose-p:text-zinc-200 prose-strong:text-zinc-100 prose-ul:text-zinc-200 prose-ol:text-zinc-200 prose-li:my-0 prose-a:text-blue-300 prose-a:no-underline hover:prose-a:underline prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-code:text-zinc-100">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" />
                        ),
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-zinc-100 whitespace-pre-wrap">{message.text}</p>
                )}
              </Card>
              <p className="text-xs text-zinc-500 mt-1 px-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 size-8 rounded-full bg-blue-900 flex items-center justify-center">
              <Bot className="size-4 text-blue-300" />
            </div>
            <Card className="p-3 bg-blue-950 border-blue-900">
              <div className="flex gap-1">
                <div
                  className="size-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="size-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="size-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900">
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask me anything about your project..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="min-h-20 resize-none bg-zinc-950 border-zinc-700 text-zinc-100"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}