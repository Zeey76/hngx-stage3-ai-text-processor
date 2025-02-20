export const createTranslator = async (sourceLang, targetLang) => {
    try {
      if (!sourceLang) {
        throw new Error("Could not determine source language");
      }

      if (sourceLang === targetLang) {
        throw new Error("Cannot translate to the same language");
      }

      const translatorCapabilities = await self.ai.translator.capabilities();
      const translationStatus = translatorCapabilities.languagePairAvailable(
        sourceLang,
        targetLang
      );

      if (translationStatus === "no") {
        throw new Error("Translation not supported for this language pair.");
      }

      let translator;
      if (translationStatus === "after-download") {
        console.log("Downloading language pack...");
        translator = await self.ai.translator.create({
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          monitor(m) {
            m.addEventListener("downloadprogress", (e) => {
              console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
            });
          },
        });
        await translator.ready;
      } else {
        translator = await self.ai.translator.create({
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
        });
      }

      return translator;
    } catch (error) {
      console.error("Error creating translator:", error);
      throw new Error(`Translation setup failed: ${error.message}`);
    }
  };