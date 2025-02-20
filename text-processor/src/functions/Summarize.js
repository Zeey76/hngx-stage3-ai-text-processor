// To check if a message is eligible for summarization
export const canSummarize = (message) => {
  return (
    message.isUser &&
    message.detectedLanguage === "en" &&
    message.textLength > 150 &&
    !message.isAnalyzing
  );
};
