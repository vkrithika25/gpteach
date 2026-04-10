import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send, Bot, User } from "lucide-react";
import { Card } from "./ui/card";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

export function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      text: "Hi! I'm here to help with your project. I can help you understand your requirements, suggest implementation strategies, debug issues, and answer questions about distributed systems. How can I help you today?",
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

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (
      lowerMessage.includes("consistency") ||
      lowerMessage.includes("vector clock")
    ) {
      return "Vector clocks are a great choice for tracking causality in distributed systems! Each node maintains a vector of logical clocks. When an event occurs, the node increments its own clock. When sending a message, it includes its vector clock, and the receiver merges it with its own. This helps you detect concurrent operations and resolve conflicts.";
    }

    if (
      lowerMessage.includes("replication") ||
      lowerMessage.includes("quorum")
    ) {
      return "For replication, I'd recommend implementing a quorum-based system. With N replicas, you typically need W nodes to acknowledge a write and R nodes to participate in a read, where W + R > N. This ensures consistency. For example, with N=3, you might use W=2 and R=2. This gives you fault tolerance while maintaining strong consistency.";
    }

    if (
      lowerMessage.includes("consistent hashing") ||
      lowerMessage.includes("dht")
    ) {
      return "Consistent hashing is perfect for this! Map both nodes and keys to points on a ring (0 to 2^32-1). Each key is stored on the first node you encounter when moving clockwise on the ring. When nodes join or leave, only a small portion of keys need to be redistributed. Don't forget to implement virtual nodes to balance the load more evenly.";
    }

    if (
      lowerMessage.includes("gossip") ||
      lowerMessage.includes("failure detection")
    ) {
      return "Gossip protocols are excellent for failure detection in distributed systems. Each node periodically picks random peers and exchanges heartbeat information. If a node hasn't been heard from in T time periods, mark it as suspected. After another timeout, mark it as failed. The probabilistic nature ensures the information spreads quickly even with node failures.";
    }

    if (
      lowerMessage.includes("test") ||
      lowerMessage.includes("testing")
    ) {
      return "Testing distributed systems requires multiple strategies: 1) Unit tests for individual components, 2) Integration tests that simulate network partitions and failures, 3) Chaos testing where you randomly kill nodes or introduce delays, and 4) Performance tests to measure throughput and latency under load. Consider using tools like Docker to simulate multiple nodes locally.";
    }

    if (
      lowerMessage.includes("start") ||
      lowerMessage.includes("begin") ||
      lowerMessage.includes("first")
    ) {
      return "Great question! I'd suggest starting with: 1) Design your data structures (keys, values, node metadata), 2) Implement a single-node version with basic PUT/GET/DELETE, 3) Add consistent hashing for key distribution, 4) Implement node-to-node communication, 5) Add replication, and finally 6) Implement failure detection and recovery. Build incrementally and test each piece!";
    }

    if (
      lowerMessage.includes("partition") ||
      lowerMessage.includes("network partition")
    ) {
      return "Network partitions are challenging! Your system needs to decide between availability and consistency (CAP theorem). With eventual consistency, both partitions can accept writes, then reconcile later using vector clocks. Alternatively, you can use a coordinator that rejects writes when it can't reach a quorum. Think about which approach makes more sense for your use case.";
    }

    // Default responses
    const defaultResponses = [
      "That's a great question! For distributed systems, it's important to consider the trade-offs between consistency, availability, and partition tolerance. What specific aspect would you like to explore?",
      "I can help you break that down. Have you thought about how this component will interact with the rest of your system?",
      "Interesting! One approach would be to start by modeling the data flow. What information needs to be shared between nodes?",
      "Good thinking! Remember that in distributed systems, you need to handle cases where nodes fail or network delays occur. How might that affect your design?",
    ];

    return defaultResponses[
      Math.floor(Math.random() * defaultResponses.length)
    ];
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(
      () => {
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: generateBotResponse(input),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      },
      1000 + Math.random() * 1000,
    );
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
                <p className="text-sm leading-relaxed text-zinc-100">
                  {message.text}
                </p>
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