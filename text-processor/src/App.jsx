import { useState, useRef, useEffect } from "react";
import InputArea from "./components/InputArea";
import Header from "./components/Header";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useScrollToBottom } from "./hooks/useScrollToBottom";
import { useSummarization } from "./hooks/useSummarization";
import { useTranslation } from "./hooks/useTranslation";
import MessageList from "./components/MessageList";
import ErrorBanner from "./components/ErrorBanner";
import { useSend } from "./hooks/useSend";

const App = () => {
  //refs
  const messagesEndRef = useRef(null);

  // UI state
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApiSupported, setIsApiSupported] = useState(false);

  // Custom hooks
  const [isDarkMode, setIsDarkMode] = useLocalStorage("darkMode", false);
  const [messages, setMessages] = useLocalStorage("chatMessages", []);
  const { scrollToBottom } = useScrollToBottom(messagesEndRef);
  const { handleSummarize } = useSummarization(messages, setMessages);
  const { handleTranslate, isTranslating, currentlyTranslatingId } =
    useTranslation(messages, setMessages, setError);
  const { handleSend } = useSend(
    text,
    setIsLoading,
    setMessages,
    setText,
    setError
  );

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("chatMessages");
  };

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && !lastMessage.isTranslating) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    checkApiSupport();
  }, []);

  const checkApiSupport = async () => {
    const hasLanguageDetector = "ai" in self && "languageDetector" in self.ai;
    setIsApiSupported(hasLanguageDetector);
    if (!hasLanguageDetector) {
      setError(
        "Oops! Some language features are not supported on your browser."
      );
    }
  };

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900" : "bg-[hsl(228,33%,97%)]"
      }`}
    >
      {/* Header */}
      <Header
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onClearChat={clearChat}
      />

      {/* Main Chat Area */}
      <div className="max-w-4xl mx-auto pt-16 pb-[10rem]">
        <div className="p-4 space-y-3">
          {error ===
            "Oops! Some language features are not supported on your browser." && (
            <ErrorBanner isDarkMode={isDarkMode} error={error} />
          )}

          <MessageList
            messages={messages}
            isDarkMode={isDarkMode}
            handleTranslate={handleTranslate}
            handleSummarize={handleSummarize}
            isTranslating={isTranslating}
            currentlyTranslatingId={currentlyTranslatingId}
          />
        </div>
      </div>

      <div ref={messagesEndRef} aria-hidden="true" />

      {/* Input Area */}
      <InputArea
        isDarkMode={isDarkMode}
        text={text}
        setText={setText}
        handleSend={handleSend}
        isApiSupported={isApiSupported}
        isLoading={isLoading}
      />
    </div>
  );
};

export default App;
