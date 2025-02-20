export const detectLanguage = async (text) => {
  try {
    const detector = await self.ai.languageDetector.create();
    const result = await detector.detect(text);
    return {
      detectedLanguage: result[0].detectedLanguage,
      confidence: result[0].confidence,
    };
  } catch (error) {
    console.error("Language detection failed:", error);
    throw error;
  }
};

export const getLanguageName = (languageCode) => {
  try {
    const languageName = new Intl.DisplayNames(["en"], {
      type: "language",
    }).of(languageCode);
    return languageName || languageCode; // Fallback to code if name is not available
  } catch (error) {
    console.error("Failed to get language name:", error);
    return languageCode; // Fallback to code if an error occurs
  }
};

export function getConfidenceMessage(confidence, text) {
  const isShortText = text.length < 4;

  if (isShortText && confidence > 0.3) {
    return "It's a short text, but I'm fairly sure";
  }

  if (confidence > 0.85) {
    return "I'm very confident";
  } else if (confidence > 0.6) {
    return "I'm fairly sure";
  } else if (confidence > 0.4) {
    return "It seems likely";
  } else {
    return "It's uncertain, but it could be";
  }
}
