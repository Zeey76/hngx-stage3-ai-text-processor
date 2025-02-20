import { Send } from "lucide-react";

const InputArea = ({
  isDarkMode,
  text,
  setText,
  handleSend,
  isApiSupported,
  isLoading,
}) => {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 p-4 ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      } border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
    >
      <div className="max-w-4xl mx-auto flex gap-2 items-center">
        <textarea
          value={text}
          rows="1"
          onChange={(e) => {
            setText(e.target.value);
            e.target.rows = 1;
            const newRows = Math.min(3, e.target.scrollHeight / 36);
            e.target.rows = newRows;
          }}
          placeholder="Type your message..."
          className={`flex-1 p-3 rounded-xl resize-none ${
            isDarkMode
              ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
              : "bg-gray-100 text-gray-900 border-transparent placeholder-gray-500"
          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          aria-label="Message input"
        />
        <button
          onClick={handleSend}
          disabled={!isApiSupported || isLoading || !text.trim()}
          aria-disabled={!isApiSupported || isLoading || !text.trim()}
          aria-label="Send message"
          className={`p-3 rounded-[0.7rem] transition ${
            !isApiSupported || isLoading || !text.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : isDarkMode
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        >
          <Send size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default InputArea;
