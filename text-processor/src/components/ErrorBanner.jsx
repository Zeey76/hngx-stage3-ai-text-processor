const ErrorBanner = ({ isDarkMode, error }) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`p-4 rounded-lg text-center ${
        isDarkMode ? "bg-red-900/50 text-red-200" : "bg-red-50 text-red-600"
      }`}
    >
      {error}
    </div>
  );
};

export default ErrorBanner;
