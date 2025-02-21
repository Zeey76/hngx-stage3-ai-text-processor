export function useSummarization(messages, setMessages) {
  const handleSummarize = async (messageId) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return alert("Message not found");

    // Store reference to summarize button position for scrolling
    const summarizeButton = document.getElementById(
      `summarize-btn-${messageId}`
    );
    const buttonRect = summarizeButton?.getBoundingClientRect();
    const buttonTopPosition = buttonRect
      ? window.scrollY + buttonRect.top
      : null;

    try {
      // Mark the message as summarizing
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, isSummarizing: true, summaryError: null }
            : msg
        )
      );

      // Scroll to keep button in view
      if (buttonTopPosition) {
        setTimeout(() => {
          window.scrollTo({ top: buttonTopPosition - 100, behavior: "smooth" });
        }, 50);
      }

      // Check if the Summarizer API is supported
      if (!("ai" in self && "summarizer" in self.ai)) {
        throw new Error(
          "The Summarizer API is not supported in your current browser."
        );
      }

      const options = {
        sharedContext: "This is a user message",
        type: "key-points",
        format: "plain-text",
        length: "medium",
      };

      const { available } = await self.ai.summarizer.capabilities();
      if (available === "no") {
        throw new Error("Summarizer API is not usable.");
      }

      const summarizer = await self.ai.summarizer.create(options);
      if (available === "after-download") {
        console.log("yes");
        summarizer.addEventListener("downloadprogress", (e) => {
          console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
        });
        await summarizer.ready;
      }

      const summary = await summarizer.summarize(message.text);

      // Set the summary
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, summary, isSummarizing: false, summaryError: null }
            : msg
        )
      );

      // Scroll to summary
      setTimeout(() => {
        const summaryElement = document.getElementById(`summary-${messageId}`);
        if (summaryElement) {
          const topPosition =
            summaryElement.getBoundingClientRect().top + window.scrollY - 192;
          window.scrollTo({ top: topPosition, behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      console.error("Summarization error:", error);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, summaryError: error.message, isSummarizing: false }
            : msg
        )
      );

      // Scroll back to the button position to keep error message in view
      if (buttonTopPosition) {
        setTimeout(() => {
          window.scrollTo({ top: buttonTopPosition - 100, behavior: "smooth" });
        }, 100);
      }
    }
  };
  return { handleSummarize };
}
