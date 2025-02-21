import Message from "./Message";
import { targetLanguages } from "./TARGET_LANGUAGES";
import { canSummarize } from "../functions/Summarize";

const MessageList = ({
  messages,
  isDarkMode,
  handleTranslate,
  handleSummarize,
  isTranslating,
  currentlyTranslatingId,
}) => {
  return (
    <>
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          isDarkMode={isDarkMode}
          handleTranslate={handleTranslate}
          handleSummarize={handleSummarize}
          isTranslating={isTranslating}
          currentlyTranslatingId={currentlyTranslatingId}
          targetLanguages={targetLanguages}
          canSummarize={canSummarize}
        />
      ))}
    </>
  );
};

export default MessageList;
