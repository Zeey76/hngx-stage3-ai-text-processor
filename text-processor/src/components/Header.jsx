import {Sun, Moon} from "lucide-react"
const Header = ({isDarkMode, setIsDarkMode}) => {
  return (
    <div
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
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full ${
              isDarkMode
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
      </div>
  )
}

export default Header
