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
  const [latestDetectionId, setLatestDetectionId] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const targetLanguages = [
    { code: "en", name: "English" },
    { code: "fr", name: "French" },
    { code: "es", name: "Spanish" },
    { code: "ru", name: "Russian" },
    { code: "tr", name: "Turkish" },
    { code: "pt", name: "Portuguese" },
    { code: "py", name: "Portse" },
  ];

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && !lastMessage.isTranslating) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    checkApiSupport();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkApiSupport = async () => {
    const hasLanguageDetector = "ai" in self && "languageDetector" in self.ai;
    const hasTranslator = "ai" in self && "translator" in self.ai;
    setIsApiSupported(hasLanguageDetector && hasTranslator);
    if (!hasLanguageDetector || !hasTranslator) {
      setError(
        "Oops! Some language features are not supported on your browser."
      );
    }
  };

  const detectLanguage = async (text) => {
    try {
      const detector = await self.ai.languageDetector.create();
      const result = await detector.detect(text);
      return {
        detectedLanguage: result[0].detectedLanguage,
        confidence: result[0].confidence,
      };
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

  function getConfidenceMessage(confidence) {
    const isShortText = text.length < 4;

    if (isShortText && confidence > 0.3) {
      return "It's a short text, but I'm fairly sure";
    }

    if (confidence > 0.85) {
      return "I'm very confident";
    } else if (confidence > 0.6) {
      return "I'm fairly sure";
    } else if (confidence > 0.4) {
      return "It seems likely";
    } else {
      return "It's uncertain, but it could be";
    }
  }

  const handleSend = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError("");
    setLatestDetectionId(null);

    try {
      // User message
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

      // Reset textarea rows to 1
      const textarea = document.querySelector("textarea");
      if (textarea) {
        textarea.rows = 1;
      }

      setTimeout(async () => {
        try {
          const { detectedLanguage, confidence } = await detectLanguage(text);
          const detectedLanguageName = getLanguageName(detectedLanguage);
          const confidenceMessage = getConfidenceMessage(confidence);
          const newDetectionId = Date.now() + 2;

          // Language detection result
          const detectionMessage = {
            id: newDetectionId,
            text: `${confidenceMessage} you're typing in ${detectedLanguageName}!`,
            isUser: false,
            detectedLanguage: detectedLanguage,
            originalText: text,
          };

          setLatestDetectionId(newDetectionId);

          setMessages((prev) => [...prev.slice(0, -1), detectionMessage]); // Replace "Analyzing..." with the actual result
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

  const createTranslator = async (sourceLang, targetLang) => {
    try {
      if (!sourceLang) {
        throw new Error("Could not determine source language");
      }

      if (sourceLang === targetLang) {
        throw new Error("Cannot translate to the same language");
      }

      const translator = await self.ai.translator.create({
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      });

      return translator;
    } catch (error) {
      console.error("Error creating translator:", error);
      throw new Error(`Translation setup failed: ${error.message}`);
    }
  };

  const handleTranslate = async (messageId) => {
    const selectElement = document.querySelector("select");
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
      setIsTranslating(true);

      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, error: "" } : msg))
      );

      // Add a "Translating..." message
      const translatingMessageId = Date.now() + 100;
      setMessages((prev) => [
        ...prev,
        {
          id: translatingMessageId,
          text: "Translating...",
          isUser: false,
          isTranslating: true,
          originalMessageId: messageId,
        },
      ]);

      // Scroll to the "Translating..." message
      setTimeout(() => {
        document
          .getElementById(`message-${translatingMessageId}`)
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);

      // Perform translation
      const translator = await createTranslator(
        message.detectedLanguage,
        targetLang
      );
      const translatedText = await translator.translate(message.originalText);

      //A simple delay to make it feel less abrupt
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update the messages state with the new translation
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

      // Scroll to the newly added translation
      setTimeout(() => {
        const translationElement = document.getElementById(
          `translation-${messageId}-${targetLang}`
        );
        if (translationElement) {
          const offset = 12 * 16;
          const topPosition =
            translationElement.getBoundingClientRect().top +
            window.scrollY -
            offset;

          window.scrollTo({ top: topPosition, behavior: "smooth" });
        }
      }, 100);

      // Reset the select element to "Translate To"
      selectElement.value = "";
    } catch (error) {
      setMessages((prev) =>
        prev
          .filter(
            (msg) => !(msg.isTranslating && msg.originalMessageId === messageId)
          )
          .map((msg) =>
            msg.id === messageId ? { ...msg, error: error.message } : msg
          )
      );
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
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
        <div className="max-w-4xl mx-auto flex justify-between items-center">
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
      <div className="max-w-4xl mx-auto pt-16 pb-[10rem]">
        <div className="p-4 space-y-3">
          {error ===
            "Oops! Some language features are not supported on your browser." && (
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
              <div
                id={`message-${message.id}`}
                className={`relative max-w-[80%] group transition-opacity duration-500 ease-in-out ${
                  message.isTranslating ? "opacity-70" : "opacity-100"
                }`}
              >
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

              {!message.isUser &&
                // message.detectedLanguage &&
                // !message.isTranslating &&
                message.id === latestDetectionId && (
                  <div className="mt-2 flex gap-2">
                    <select
                      className={`px-3 py-2 rounded-lg text-sm ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700 text-gray-200"
                          : "bg-white border-gray-300 text-gray-700"
                      } border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isTranslating ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      defaultValue=""
                      disabled={isTranslating}
                    >
                      <option value="" disabled>
                        Translate to
                      </option>
                      {targetLanguages.map((lang) => (
                        <option
                          key={lang.code}
                          value={lang.code}
                          disabled={
                            lang.code === message.detectedLanguage ||
                            isTranslating
                          }
                        >
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleTranslate(message.id)}
                      disabled={isTranslating}
                      className={`px-4 py-2 rounded-lg text-sm transition-opacity duration-500 ease-in-out ${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isTranslating
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-blue-600"
                      }`}
                    >
                      {isTranslating ? "Translating..." : "Translate"}
                    </button>
                  </div>
                )}

              {/* Translations */}
              {message.translations?.map((translation, index) => (
                <div
                  key={index}
                  id={`translation-${message.id}-${translation.language}`}
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
                  <p className="text-sm leading-relaxed">{message.error}</p>
                  <button
                    onClick={() =>
                      setMessages((prevMessages) =>
                        prevMessages.map((m) =>
                          m.id === message.id ? { ...m, error: null } : m
                        )
                      )
                    }
                    className="mt-1 text-sm underline"
                  >
                    Dismiss
                  </button>
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
        <div className="max-w-4xl mx-auto flex gap-2 items-center">
          <textarea
            value={text}
            rows="1"
            onChange={(e) => {
              setText(e.target.value);
              e.target.rows = 1;
              const newRows = Math.min(3, e.target.scrollHeight / 36);
              e.target.rows = newRows;
            }}
            placeholder="Type your message..."
            className={`flex-1 p-3 rounded-xl resize-none ${
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
            className={`p-3 rounded-[0.7rem] transition ${
              !isApiSupported || isLoading || !text.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : isDarkMode
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
