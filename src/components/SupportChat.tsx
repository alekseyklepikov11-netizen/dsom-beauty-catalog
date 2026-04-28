import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant";

interface Msg {
  role: Role;
  content: string;
}

const STORAGE_KEY = "dsom-support-chat-history";
const MAX_HISTORY = 40;

const INITIAL_GREETING: Msg = {
  role: "assistant",
  content:
    "Здравствуйте. Я консультант DSOM — помогу подобрать уход, отвечу на вопросы о составе и применении. С чем могу помочь?",
};

const SupportChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([INITIAL_GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Загрузка истории.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Сохранение истории.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
    } catch {
      // ignore
    }
  }, [messages]);

  // Автоскролл вниз.
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  // Фокус при открытии.
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("support-chat", {
        body: {
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;

      const reply = (data as any)?.message?.trim() || "Извините, не получилось сформулировать ответ.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      console.error("[SupportChat]", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Извините, не удалось связаться с консультантом. Попробуйте ещё раз или напишите нам на info@dsom.ru.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const reset = () => {
    setMessages([INITIAL_GREETING]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Кнопка */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Закрыть чат поддержки" : "Открыть чат поддержки"}
        className={cn(
          "fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full",
          "bg-foreground text-background shadow-lg",
          "flex items-center justify-center transition-all",
          "hover:scale-105 active:scale-95",
          "lg:bottom-6 lg:right-6 lg:w-13 lg:h-13",
        )}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>

      {/* Окно */}
      {open && (
        <div
          className={cn(
            "fixed z-50 bg-background border border-border shadow-2xl",
            "flex flex-col overflow-hidden",
            // mobile: full screen minus top
            "inset-x-3 bottom-20 top-16 rounded-md",
            // desktop: floating panel
            "lg:inset-auto lg:bottom-24 lg:right-6 lg:top-auto lg:w-[400px] lg:h-[600px]",
          )}
          role="dialog"
          aria-label="Чат поддержки DSOM"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-foreground text-background">
            <div>
              <p className="font-display tracking-[0.3em] text-sm">DSOM</p>
              <p className="text-[10px] tracking-luxe uppercase opacity-60 mt-0.5">
                Консультант
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-[10px] tracking-luxe uppercase opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Очистить диалог"
            >
              Сброс
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-secondary/20"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-md px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-background border border-border text-foreground",
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-background border border-border rounded-md px-3.5 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 bg-background">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Напишите сообщение..."
                rows={1}
                disabled={loading}
                className={cn(
                  "flex-1 resize-none rounded-md border border-input bg-background px-3 py-2",
                  "text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                  "max-h-32 min-h-[40px]",
                )}
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || !input.trim()}
                aria-label="Отправить"
                className={cn(
                  "w-10 h-10 shrink-0 rounded-md bg-foreground text-background",
                  "flex items-center justify-center transition-opacity",
                  "disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90",
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 px-1">
              AI-консультант. Серьёзные обращения передаются специалисту.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportChat;
