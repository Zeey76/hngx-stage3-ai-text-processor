import { useState, useRef, useEffect } from "react";
import { Moon, Sun, Send } from "lucide-react";

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isApiSupported, setIsApiSupported] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [latestDetectionId, setLatestDetectionId] = useState(null);

  const targetLanguages = [
    { code: "en", name: "English" },
    { code: "fr", name: "French" },
    { code: "es", name: "Spanish" },
    { code: "ru", name: "Russian" },
    { code: "tr", name: "Turkish" },
    { code: "pt", name: "Portuguese" },
  ];

  useEffect(() => {
    if (shouldScrollToBottom) {
      scrollToBottom();
      setShouldScrollToBottom(false);
    }
  }, [messages, shouldScrollToBottom]);

  useEffect(() => {
    checkApiSupport();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  const checkApiSupport = async () => {
    const hasLanguageDetector =
      "ai" in window && "languageDetector" in window.ai;
    const hasTranslator = "ai" in window && "translator" in window.ai;
    setIsApiSupported(hasLanguageDetector && hasTranslator);
    if (!hasLanguageDetector || !hasTranslator) {
      setError("Please enable Chrome AI APIs in chrome://flags");
    }
  };

  const detectLanguage = async (text) => {
    try {
      const detector = await window.ai.languageDetector.create();
      const result = await detector.detect(text);
      return result[0].detectedLanguage;
    } catch (error) {
      console.error("Language detection failed:", error);
      throw error;
    }
  };

  const getLanguageName = (languageCode) => {
    try {
      const languageName = new Intl.DisplayNames(["en"], {
        type: "language",
      }).of(languageCode);
      return languageName || languageCode; // Fallback to code if name is not available
    } catch (error) {
      console.error("Failed to get language name:", error);
      return languageCode; // Fallback to code if an error occurs
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      // Add user message
      const userMessage = {
        id: Date.now(),
        text: text,
        isUser: true,
      };

      // Acknowledgment message
      const analyzingMessage = {
        id: Date.now() + 1,
        text: "Analyzing your message...",
        isUser: false,
      };

      setMessages((prev) => [...prev, userMessage, analyzingMessage]);
      setText("");
      setShouldScrollToBottom(true);

      setTimeout(async () => {
        try {
          const detectedLanguageCode = await detectLanguage(text);
          const detectedLanguageName = getLanguageName(detectedLanguageCode);
          const newDetectionId = Date.now() + 2;

          // Language detection result
          const detectionMessage = {
            id: newDetectionId,
            text: `It looks like you're typing in ${detectedLanguageName}!`,
            isUser: false,
            detectedLanguage: detectedLanguageCode,
            originalText: text,
          };
          
          // Update the latest detection ID
          setLatestDetectionId(newDetectionId);
          
          setMessages((prev) => [...prev.slice(0, -1), detectionMessage]); // Replace "Analyzing..." with the actual result
          setShouldScrollToBottom(true);
        } catch (error) {
          setMessages((prev) => [...prev.slice(0, -1)]);
          setError("Failed to detect language. Please try again.");
          console.error("Error:", error);
        } finally {
          setIsLoading(false);
        }
      }, 1000);
    } catch (error) {
      setError("Failed to process message. Please try again.");
      console.error("Error:", error);
      setIsLoading(false);
    }
  };

  const createTranslator = async (source, target) => {
    try {
      if (!source) {
        throw new Error("Could not determine source language");
      }
      if (source === target) {
        throw new Error("Cannot translate to the same language");
      }

      const translator = await window.ai.translator.create({
        sourceLanguage: source,
        targetLanguage: target,
        // monitor(m) {
        //   m.addEventListener("downloadprogress", (e) => {
        //     console.log(`Downloaded ${e.loaded} of ${e.total} bytes`);
        //   });
        // },
      });

      return translator;
    } catch (error) {
      console.error("Error creating translator:", error);
      throw new Error(`Translation setup failed: ${error.message}`);
    }
  };

  const handleTranslate = async (messageId) => {
    const selectElement = document.querySelector(
      `select[data-message-id="${messageId}"]`
    );
    if (!selectElement) return setError("Could not find language selector.");

    const targetLang = selectElement.value;
    if (!targetLang) return alert("Please select a target language first");

    const message = messages.find((m) => m.id === messageId);
    if (!message) return alert("Message not found");
    if (!message.detectedLanguage || !message.originalText)
      return alert("Source language or text unknown.");
    if (message.translations?.some((t) => t.language === targetLang))
      return alert("Already translated to this language.");

    try {
      setMessages((prev) => [
        ...prev.slice(0, prev.indexOf(message) + 1),
        {
          id: Date.now() + 100,
          text: "Translating...",
          isUser: false,
          isTranslating: true,
          originalMessageId: messageId,
          targetLanguage: targetLang,
        },
        ...prev.slice(prev.indexOf(message) + 1),
      ]);

      const translator = await createTranslator(
        message.detectedLanguage,
        targetLang
      );
      const translatedText = await translator.translate(message.originalText);

      setMessages((prev) =>
        prev
          .filter(
            (msg) => !(msg.isTranslating && msg.originalMessageId === messageId)
          )
          .map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  translations: [
                    ...(msg.translations || []),
                    { language: targetLang, text: translatedText },
                  ],
                }
              : msg
          )
      );
    } catch (error) {
      setMessages((prev) =>
        prev
          .filter(
            (msg) => !(msg.isTranslating && msg.originalMessageId === messageId)
          )
          .map((msg) =>
            msg.id === messageId
              ? { ...msg, error: `Translation failed: ${error.message}` }
              : msg
          )
      );
      console.error("Translation error:", error);
    }
  };

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900" : "bg-[hsl(228,33%,97%)]"
      }`}
    >
      {/* Header */}
      <div
        className={`fixed top-0 w-full p-4 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} z-10`}
      >
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <h1
            className={`text-lg font-semibold uppercase ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            AI-Powered Translator
          </h1>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full ${
              isDarkMode
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="max-w-3xl mx-auto pt-16 pb-[10rem]">
        <div className="p-4 space-y-3">
          {error === "Please enable Chrome AI APIs in chrome://flags" && (
            <div
              className={`p-4 rounded-lg text-center ${
                isDarkMode
                  ? "bg-red-900/50 text-red-200"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {error}
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.isUser ? "items-end" : "items-start"
              }`}
            >
              {/* Message content */}
              <div className="relative max-w-[80%] group">
                <div
                  className={`p-3 rounded-2xl ${
                    message.isUser
                      ? "rounded-tr-none bg-blue-500 text-white"
                      : "rounded-tl-none bg-gray-200 text-gray-900"
                  } ${
                    isDarkMode && message.isUser
                      ? "bg-blue-600"
                      : isDarkMode
                      ? "bg-gray-700 text-white"
                      : ""
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
                {/* Triangle indicator */}
                <div
                  className={`absolute top-0 w-4 h-4 ${
                    message.isUser
                      ? isDarkMode
                        ? "bg-blue-600"
                        : "bg-blue-500"
                      : isDarkMode
                      ? "bg-gray-700"
                      : "bg-gray-200"
                  } ${message.isUser ? "-right-2" : "-left-2"}`}
                  style={{
                    clipPath: message.isUser
                      ? "polygon(0 0, 0% 100%, 100% 0)"
                      : "polygon(0 0, 100% 0, 100% 100%)",
                  }}
                />
              </div>

              {/* Translation Dropdown and Button - Only for the most recent detection */}
              {!message.isUser &&
                message.detectedLanguage &&
                !message.isTranslating &&
                message.id === latestDetectionId && (
                  <div className="mt-2 flex gap-2">
                    <select
                      className={`px-3 py-2 rounded-lg text-sm ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700 text-gray-200"
                          : "bg-white border-gray-300 text-gray-700"
                      } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      defaultValue=""
                      data-message-id={message.id}
                    >
                      <option value="" disabled>
                        Translate to
                      </option>
                      {targetLanguages.map((lang) => (
                        <option
                          key={lang.code}
                          value={lang.code}
                          disabled={lang.code === message.detectedLanguage}
                        >
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleTranslate(message.id)}
                      className={`px-4 py-2 rounded-lg text-sm ${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      Translate
                    </button>
                  </div>
                )}

              {/* Display Translations */}
              {message.translations?.map((translation, index) => (
                <div
                  key={index}
                  className={`max-w-[80%] mt-2 p-3 rounded-2xl ${
                    isDarkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{translation.text}</p>
                  <p className="text-xs mt-1 text-gray-400">
                    Translated to{" "}
                    {targetLanguages.find(
                      (l) => l.code === translation.language
                    )?.name || translation.language}
                  </p>
                </div>
              ))}

              {message.error && (
                <div
                  className={`relative max-w-[80%] mt-2 p-3 rounded-2xl ${
                    isDarkMode
                      ? "bg-red-900/50 text-red-200"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  <p className="text-sm leading-relaxed">
                    {message.error}{" "}
                    <button
                      onClick={() =>
                        setMessages((prevMessages) =>
                          prevMessages.map((m) =>
                            m.id === message.id ? { ...m, error: null } : m
                          )
                        )
                      }
                      className="ml-2 text-sm underline"
                    >
                      Dismiss
                    </button>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div ref={messagesEndRef} />

      {/* Input Area */}
      <div
        className={`fixed bottom-0 left-0 right-0 p-4 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            value={text}
            rows="1"
            onChange={(e) => {
              setText(e.target.value);
              e.target.rows = 1;
              const newRows = Math.min(4, e.target.scrollHeight / 28);
              e.target.rows = newRows;
            }}
            placeholder="Type your message..."
            className={`flex-1 p-3 rounded-2xl resize-none ${
              isDarkMode
                ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                : "bg-gray-100 text-gray-900 border-transparent placeholder-gray-500"
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!isApiSupported || isLoading || !text.trim()}
            className={`p-3 rounded-full transition ${
              !isApiSupported || isLoading || !text.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : isDarkMode
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;