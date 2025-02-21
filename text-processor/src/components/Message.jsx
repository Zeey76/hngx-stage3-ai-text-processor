import TranslationControls from "./TranslationControls";
import SummarizeButton from "./SummarizeButton";
import Summary from "./Summary";
import Translation from "./Translation";

const Message = ({
  message,
  isDarkMode,
  handleTranslate,
  handleSummarize,
  isTranslating,
  currentlyTranslatingId,
  targetLanguages,
  canSummarize,
}) => {
  return (
    <div
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
          aria-label={message.isUser ? "Your message" : "Received message"}
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
          aria-hidden="true"
        />
      </div>

      {/* Summarize button */}
      {canSummarize(message) && (
        <SummarizeButton
          messageId={message.id}
          isDarkMode={isDarkMode}
          handleSummarize={handleSummarize}
          isSummarizing={message.isSummarizing}
          summaryError={message.summaryError}
          hasSummary={!!message.summary}
        />
      )}

      {/* Summary error display */}
      {message.summaryError && (
        <div
          role="alert"
          className={`max-w-[80%] mt-2 p-3 rounded-2xl ${
            isDarkMode ? "bg-red-900/50 text-red-200" : "bg-red-50 text-red-600"
          }`}
        >
          <p className="text-sm font-medium mb-1">Summary Error:</p>
          <p className="text-sm leading-relaxed">{message.summaryError}</p>
        </div>
      )}

      {/* Summary display */}
      {message.summary && (
        <Summary
          messageId={message.id}
          summary={message.summary}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Translation controls */}
      {!message.isUser &&
        message.detectedLanguage &&
        !message.isTranslating && (
          <TranslationControls
            messageId={message.id}
            isDarkMode={isDarkMode}
            handleTranslate={handleTranslate}
            isTranslating={isTranslating}
            currentlyTranslatingId={currentlyTranslatingId}
            detectedLanguage={message.detectedLanguage}
            targetLanguages={targetLanguages}
          />
        )}

      {/* Translations */}
      {message.translations?.map((translation, index) => (
        <Translation
          key={index}
          messageId={message.id}
          translation={translation}
          isDarkMode={isDarkMode}
          targetLanguages={targetLanguages}
        />
      ))}
    </div>
  );
};

export default Message;
