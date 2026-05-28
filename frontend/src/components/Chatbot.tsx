import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MessageSquare, X, Send, Bot, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  message: string;
}

interface ChatbotProps {
  user: {
    id: number;
    name?: string;
    email?: string;
  } | null;
}

const API_URL = "http://localhost:8000/api";

export default function Chatbot({ user }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history when open
  useEffect(() => {
    if (isOpen && user?.id) {
      axios
        .get(`${API_URL}/chat/?user_id=${user.id}`)
        .then((res) => {
          setMessages(res.data);
        })
        .catch((err) => {
          console.error("Failed to load chat history:", err);
        });
    }
  }, [isOpen, user?.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!message.trim() || !user?.id) return;

    const userMessage: Message = {
      role: "user",
      message: message.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/chat/`, {
        message: userMessage.message,
        user_id: user.id,
      });

      const botMessage: Message = {
        role: "assistant",
        message: res.data.assistant.message,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          message: "Sorry, TaskFlow AI is experiencing issues. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center border border-red-200/50 cursor-pointer transition-all duration-300 hover:scale-105 z-[9999] bg-gradient-to-r from-red-100 to-emerald-100 text-slate-800 font-bold"
        title="Chat with TaskFlow AI"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[calc(100vw-3rem)] md:w-96 h-[500px] max-h-[calc(100vh-8rem)] bg-white border border-slate-200/80 rounded-2xl flex flex-col overflow-hidden z-[9999] shadow-2xl animate-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div
            style={{ background: "linear-gradient(to right, #fee2e2, #d1fae5)" }}
            className="px-4 py-4 flex items-center justify-between border-b border-red-100/50"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-red-100/40">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">TaskFlow AI</h3>
                <span className="text-[10px] text-slate-500 font-semibold block leading-none">Online & Ready</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-black/5 rounded-lg text-slate-600 transition-colors"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Bot className="w-10 h-10 text-blue-500/70 animate-bounce" />
                <p className="text-sm font-semibold text-slate-800">Hello, I'm TaskFlow AI!</p>
                <p className="text-xs text-slate-600 max-w-[200px]">
                  Ask me about your tasks (e.g., "what's due today?") or anything else.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm shadow-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white text-slate-800 border border-slate-200/50 rounded-tl-none"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-600 border border-slate-200/50 rounded-2xl rounded-tl-none px-4 py-2 flex items-center gap-2 text-sm shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200/60 bg-white flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask TaskFlow AI..."
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />
            <button
              onClick={sendMessage}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm hover:scale-105 flex items-center justify-center cursor-pointer"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
