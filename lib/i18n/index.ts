import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";
import ar from "./ar.json";
import fr from "./fr.json";

const resources = {
  ar: { translation: ar },
  fr: { translation: fr },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "ar", // Force Arabic start
  fallbackLng: "ar",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
