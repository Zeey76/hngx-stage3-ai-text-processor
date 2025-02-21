const Translation = ({
  messageId,
  translation,
  isDarkMode,
  targetLanguages,
}) => {
  return (
    <div
      id={`translation-${messageId}-${
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
          {targetLanguages.find((l) => l.code === translation.language)?.name ||
            translation.language}
        </p>
      )}
    </div>
  );
};

export default Translation;
