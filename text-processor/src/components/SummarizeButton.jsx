const SummarizeButton = ({
  messageId,
  isDarkMode,
  handleSummarize,
  isSummarizing,
  summaryError,
  hasSummary,
}) => {
  return (
    <div className="mt-2 flex justify-end">
      <button
        id={`summarize-btn-${messageId}`}
        onClick={() => handleSummarize(messageId)}
        aria-disabled={isSummarizing}
        disabled={isSummarizing}
        className={`px-4 py-2 rounded-lg text-sm transition-opacity duration-500 ease-in-out ${
          isDarkMode
            ? "bg-green-600 hover:bg-green-700"
            : "bg-green-500 hover:bg-green-600"
        } text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
          isSummarizing ? "opacity-50 cursor-not-allowed" : "hover:bg-green-600"
        }`}
      >
        {isSummarizing
          ? "Summarizing..."
          : summaryError
          ? "Try Again"
          : hasSummary
          ? "Re-Summarize"
          : "Summarize"}
      </button>
    </div>
  );
};

export default SummarizeButton;
