import {
  detectLanguage,
  getConfidenceMessage,
  getLanguageName,
} from "../functions/languageDetector";
export function useSend(text, setIsLoading, setMessages, setText, setError) {
  const handleSend = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      // To detect language to find if it's English
      const { detectedLanguage } = await detectLanguage(text);
      const { confidence } = await detectLanguage(text);

      // User message
      const userMessage = {
        id: Date.now(),
        text: text,
        isUser: true,
        detectedLanguage: detectedLanguage,
        originalText: text,
        textLength: text.length,
        isAnalyzing: true,
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
              msg.id === userMessage.id ? { ...msg, isAnalyzing: false } : msg
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
      }, 300);
    } catch (error) {
      setError("Failed to process message. Please try again.");
      console.error("Error:", error);
      setIsLoading(false);
    }
  };
  return { handleSend };
}
