const Summary = ({ messageId, summary, isDarkMode }) => {
  return (
    <div
      id={`summary-${messageId}`}
      className={`max-w-[80%] mt-2 p-3 rounded-2xl ${
        isDarkMode
          ? "bg-green-700/30 text-green-100"
          : "bg-green-50 text-green-800"
      }`}
    >
      <p className="text-sm font-medium mb-1">Summary:</p>
      <p className="text-sm leading-relaxed">{summary}</p>
    </div>
  );
};

export default Summary;
