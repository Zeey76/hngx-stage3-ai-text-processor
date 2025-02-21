const TranslationControls = ({
    messageId,
    isDarkMode,
    handleTranslate,
    isTranslating,
    currentlyTranslatingId,
    detectedLanguage,
    targetLanguages
  }) => {
    return (
      <div className="mt-2 flex gap-2">
        <label htmlFor={`select-${messageId}`} className="sr-only">
          Select language for translation
        </label>
        <select
          id={`select-${messageId}`}
          className={`px-3 py-2 rounded-lg text-sm ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-gray-200"
              : "bg-white border-gray-300 text-gray-700"
          } border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isTranslating && currentlyTranslatingId === messageId
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          defaultValue=""
          disabled={isTranslating && currentlyTranslatingId === messageId}
        >
          <option value="" disabled>
            Translate to
          </option>
          {targetLanguages.map((lang) => (
            <option
              key={lang.code}
              value={lang.code}
              disabled={
                lang.code === detectedLanguage ||
                (isTranslating && currentlyTranslatingId === messageId)
              }
            >
              {lang.name}
            </option>
          ))}
        </select>
  
        <button
          onClick={() => handleTranslate(messageId)}
          aria-disabled={isTranslating && currentlyTranslatingId === messageId}
          disabled={isTranslating && currentlyTranslatingId === messageId}
          className={`px-4 py-2 rounded-lg text-sm transition-opacity duration-500 ease-in-out ${
            isDarkMode
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isTranslating && currentlyTranslatingId === messageId
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-blue-600"
          }`}
        >
          {isTranslating && currentlyTranslatingId === messageId
            ? "Translating..."
            : "Translate"}
        </button>
      </div>
    );
  };
  
  export default TranslationControls;