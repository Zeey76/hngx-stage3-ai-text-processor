import { useState, useRef, useEffect } from "react";
import InputArea from "./components/InputArea";
import Header from "./components/Header";
import { targetLanguages } from "./components/TARGET_LANGUAGES";
import {
  detectLanguage,
  getLanguageName,
  getConfidenceMessage,
} from "./functions/languageDetector";

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isApiSupported, setIsApiSupported] = useState(false);
  const [currentlyTranslatingId, setCurrentlyTranslatingId] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

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

  const handleSend = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      // Detect language first to find if it's English
      const { detectedLanguage } = await detectLanguage(text);
      const { confidence } = await detectLanguage(text);

      // User message with language info
      const userMessage = {
        id: Date.now(),
        text: text,
        isUser: true,
        detectedLanguage: detectedLanguage,
        originalText: text,
        textLength: text.length,
        isAnalyzing: true, // Add this flag
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
          const detectedLanguageName = getLanguageName(detectedLanguage);
          const confidenceMessage = getConfidenceMessage(confidence, text);
          const newDetectionId = Date.now() + 2;

          // Language detection result
          const detectionMessage = {
            id: newDetectionId,
            text: `${confidenceMessage} you're typing in ${detectedLanguageName}!`,
            isUser: false,
            detectedLanguage: detectedLanguage,
            originalText: text,
          };

          // Update the user message to mark analysis as complete
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === userMessage.id
                ? { ...msg, isAnalyzing: false } // Mark analysis as complete
                : msg
            )
          );

          // Replace "Analyzing..." with the actual result
          setMessages((prev) => [...prev.slice(0, -1), detectionMessage]);
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

      const translatorCapabilities = await self.ai.translator.capabilities();
      const translationStatus = translatorCapabilities.languagePairAvailable(
        sourceLang,
        targetLang
      );

      if (translationStatus === "no") {
        throw new Error("Translation not supported for this language pair.");
      }

      let translator;
      if (translationStatus === "after-download") {
        console.log("Downloading language pack...");
        translator = await self.ai.translator.create({
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          monitor(m) {
            m.addEventListener("downloadprogress", (e) => {
              console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
            });
          },
        });
        await translator.ready;
      } else {
        translator = await self.ai.translator.create({
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
        });
      }

      return translator;
    } catch (error) {
      console.error("Error creating translator:", error);
      throw new Error(`Translation setup failed: ${error.message}`);
    }
  };

  const handleTranslate = async (messageId) => {
    // Get the specific select element for this message
    const selectElement = document.querySelector(`#select-${messageId}`);
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
      setCurrentlyTranslatingId(messageId);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, error: "" } : msg))
      );

      // Find the index of the message to translate
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      if (messageIndex === -1) return alert("Message not found");

      // Add a "Translating..." message AFTER the selected message
      const translatingMessageId = Date.now() + 100;
      setMessages((prev) => [
        ...prev.slice(0, messageIndex + 1),
        {
          id: translatingMessageId,
          text: "Translating...",
          isUser: false,
          isTranslating: true,
          originalMessageId: messageId,
        },
        ...prev.slice(messageIndex + 1),
      ]);

      // Scroll to Translating... message
      setTimeout(() => {
        const translationElement = document.getElementById(
          `message-${translatingMessageId}`
        );
        if (translationElement) {
          const offset = 15 * 16;
          const topPosition =
            translationElement.getBoundingClientRect().top +
            window.scrollY -
            offset;

          window.scrollTo({ top: topPosition, behavior: "smooth" });
        }
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
      // Generate a unique error ID
      const errorId = `error-${Date.now()}`;

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
                    {
                      language: "error",
                      text: error.message,
                      errorId: errorId,
                    }, // Add error as a translation
                  ],
                }
              : msg
          )
      );
      console.error("Translation error:", error);
      selectElement.value = "";
      setTimeout(() => {
        const errorElement = document.getElementById(
          `translation-${messageId}-${errorId}`
        );
        if (errorElement) {
          const offset = 15 * 16;
          const topPosition =
            errorElement.getBoundingClientRect().top + window.scrollY - offset;

          window.scrollTo({ top: topPosition, behavior: "smooth" });
        }
      }, 100);
    } finally {
      setIsTranslating(false);
      setCurrentlyTranslatingId(null);
    }
  };

  const handleSummarize = async (messageId) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return alert("Message not found");

    // Store reference to summarize button position for scrolling
    const summarizeButton = document.getElementById(
      `summarize-btn-${messageId}`
    );
    const buttonRect = summarizeButton?.getBoundingClientRect();
    const buttonTopPosition = buttonRect
      ? window.scrollY + buttonRect.top
      : null;

    try {
      // Mark the message as summarizing
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, isSummarizing: true, summaryError: null }
            : msg
        )
      );

      // Scroll to keep button in view
      if (buttonTopPosition) {
        setTimeout(() => {
          window.scrollTo({ top: buttonTopPosition - 100, behavior: "smooth" });
        }, 50);
      }

      // Check if the Summarizer API is supported
      if (!("ai" in self && "summarizer" in self.ai)) {
        throw new Error("Summarizer API is not supported in this browser.");
      }

      const options = {
        sharedContext: "This is a scientific article",
        type: "key-points",
        format: "plain-text",
        length: "medium",
      };

      const { available } = await self.ai.summarizer.capabilities();
      if (available === "no") {
        throw new Error("Summarizer API is not usable.");
      }

      const summarizer = await self.ai.summarizer.create(options);
      if (available === "after-download") {
        summarizer.addEventListener("downloadprogress", (e) => {
          console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
        });
        await summarizer.ready;
      }

      const summary = await summarizer.summarize(message.text, {
        context: "This article is intended for a tech-savvy audience.",
      });

      // Set the summary
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, summary, isSummarizing: false, summaryError: null }
            : msg
        )
      );

      // Scroll to summary
      setTimeout(() => {
        const summaryElement = document.getElementById(`summary-${messageId}`);
        if (summaryElement) {
          const topPosition =
            summaryElement.getBoundingClientRect().top + window.scrollY - 192;
          window.scrollTo({ top: topPosition, behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      console.error("Summarization error:", error);

      // Set error state but keep the original message and button visible
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, summaryError: error.message, isSummarizing: false }
            : msg
        )
      );

      // Scroll back to the button position to keep error message in view
      if (buttonTopPosition) {
        setTimeout(() => {
          window.scrollTo({ top: buttonTopPosition - 100, behavior: "smooth" });
        }, 100);
      }
    }
  };

  // Check if a message is eligible for summarization
  const canSummarize = (message) => {
    return (
      message.isUser &&
      message.detectedLanguage === "en" &&
      message.textLength > 150 &&
      !message.isAnalyzing
    );
  };

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900" : "bg-[hsl(228,33%,97%)]"
      }`}
    >
      {/* Header */}
      <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      {/* Main Chat Area */}
      <div className="max-w-4xl mx-auto pt-16 pb-[10rem]">
        <div className="p-4 space-y-3">
          {error ===
            "Oops! Some language features are not supported on your browser." && (
            <div
              role="alert"
              aria-live="assertive"
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
              aria-live="polite"
            >
              {/* Message content */}
              <div
                id={`message-${message.id}`}
                className={`relative max-w-[80%] group transition-opacity duration-500 ease-in-out ${
                  message.isTranslating || message.isSummarizing
                    ? "opacity-70"
                    : "opacity-100"
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
                  role="article"
                  aria-label={
                    message.isUser ? "Your message" : "Received message"
                  }
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>

              {/* Summarize button */}
              {canSummarize(message) && (
                <div className="mt-2 flex justify-end">
                  <button
                    id={`summarize-btn-${message.id}`}
                    onClick={() => handleSummarize(message.id)}
                    aria-disabled={message.isSummarizing}
                    className={`px-4 py-2 rounded-lg text-sm transition-opacity duration-500 ease-in-out ${
                      isDarkMode
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      message.isSummarizing
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-green-600"
                    }`}
                  >
                    {message.isSummarizing
                      ? "Summarizing..."
                      : message.summaryError
                      ? "Try Again"
                      : message.summary
                      ? "Re-Summarize"
                      : "Summarize"}
                  </button>
                </div>
              )}

              {/* Summary error display */}
              {message.summaryError && (
                <div
                  role="alert"
                  className={`max-w-[80%] mt-2 p-3 rounded-2xl ${
                    isDarkMode
                      ? "bg-red-900/50 text-red-200"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  <p className="text-sm font-medium mb-1">Summary Error:</p>
                  <p className="text-sm leading-relaxed">
                    {message.summaryError}
                  </p>
                </div>
              )}

              {/* Summary display */}
              {message.summary && (
                <div
                  id={`summary-${message.id}`}
                  className={`max-w-[80%] mt-2 p-3 rounded-2xl ${
                    isDarkMode
                      ? "bg-green-700/30 text-green-100"
                      : "bg-green-50 text-green-800"
                  }`}
                >
                  <p className="text-sm font-medium mb-1">Summary:</p>
                  <p className="text-sm leading-relaxed">{message.summary}</p>
                </div>
              )}

              {/* Translation controls */}
              {!message.isUser &&
                message.detectedLanguage &&
                !message.isTranslating && (
                  <div className="mt-2 flex gap-2">
                    <label htmlFor={`select-${message.id}`} className="sr-only">
                      Select language for translation
                    </label>
                    <select
                      id={`select-${message.id}`}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700 text-gray-200"
                          : "bg-white border-gray-300 text-gray-700"
                      } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Translate to
                      </option>
                      {targetLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleTranslate(message.id)}
                      aria-disabled={
                        isTranslating && currentlyTranslatingId === message.id
                      }
                      className={`px-4 py-2 rounded-lg text-sm transition-opacity duration-500 ease-in-out ${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      {isTranslating && currentlyTranslatingId === message.id
                        ? "Translating..."
                        : "Translate"}
                    </button>
                  </div>
                )}

              {/* Translations */}
              {message.translations?.map((translation, index) => (
                <div
                  key={index}
                  id={`translation-${message.id}-${
                    translation.errorId || translation.language
                  }`}
                  className={`max-w-[80%] mt-2 p-3 rounded-2xl ${
                    translation.language === "error"
                      ? isDarkMode
                        ? "bg-red-900/50 text-red-200"
                        : "bg-red-50 text-red-600"
                      : isDarkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                  role="region"
                  aria-live="polite"
                >
                  <p className="text-sm leading-relaxed">{translation.text}</p>
                  {translation.language !== "error" && (
                    <p className="text-xs mt-1 text-gray-400">
                      Translated to{" "}
                      {targetLanguages.find(
                        (l) => l.code === translation.language
                      )?.name || translation.language}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
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
