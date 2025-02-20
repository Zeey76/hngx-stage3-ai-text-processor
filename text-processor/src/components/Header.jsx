import { Sun, Moon } from "lucide-react";

const Header = ({ isDarkMode, setIsDarkMode, onClearChat }) => {
  return (
    <header
      className={`fixed top-0 w-full p-4 ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      } border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} z-10`}
    >
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <h1
          className={`text-lg font-semibold uppercase ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          AI-Powered Translator
        </h1>
        <div className="flex items-center gap-3">
          {/* Clear Chat Button */}
          <button
            onClick={onClearChat}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
              isDarkMode
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-red-400 hover:bg-red-500 text-white"
            }`}
            aria-label="Clear chat history"
          >
            Clear Chat <span className="sr-only">Clear Chat</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full transition focus:outline-none focus:ring-2 focus:ring-gray-500 ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
