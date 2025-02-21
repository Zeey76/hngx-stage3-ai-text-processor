import { useState } from "react";
import { createTranslator } from "../functions/Translator";

export function useTranslation(messages, setMessages, setError) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentlyTranslatingId, setCurrentlyTranslatingId] = useState(null);

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

      // Check API support
      if (!("ai" in self && "translator" in self.ai)) {
        throw new Error(
          "Your browser does not support the translation service."
        );
      }

      // Find the index of the message to translate
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      if (messageIndex === -1) return alert("Message not found");

      // Add a "Translating..." message
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
      scrollToElement(`message-${translatingMessageId}`, 15);

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
      scrollToElement(`translation-${messageId}-${targetLang}`, 12);

      // Reset the select element
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
                    },
                  ],
                }
              : msg
          )
      );
      console.error("Translation error:", error);
      selectElement.value = "";
      scrollToElement(`translation-${messageId}-${errorId}`, 15);
    } finally {
      setIsTranslating(false);
      setCurrentlyTranslatingId(null);
    }
  };

  const scrollToElement = (elementId, offsetMultiplier = 0) => {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        const offset = offsetMultiplier * 16;
        const topPosition =
          element.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({ top: topPosition, behavior: "smooth" });
      }
    }, 100);
  };

  return { handleTranslate, isTranslating, currentlyTranslatingId };
}
