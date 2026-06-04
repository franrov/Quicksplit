import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "es";

const translations = {
  en: {
    addPaymentMethod: "Add payment method",
    all: "All",
    backToHome: "Back to Home",
    backToLogin: "Back to Login",
    changePassword: "Change password",
    changePasswordTitle: "Change Password",
    confirmNewPassword: "Confirm new password",
    createAccount: "Create account",
    createAccountAction: "Create Account",
    createFirstSplit: "Create your first split",
    creating: "Creating...",
    currentPassword: "Current password",
    dark: "Dark",
    depositFunds: "Deposit Funds",
    email: "Email",
    householdExpenses: "Recurring Splits",
    language: "Language",
    light: "Light",
    loadingSplits: "Loading splits...",
    loadingNotifications: "Loading notifications...",
    login: "Log In",
    loginSubtitle: "Log in to manage your splits.",
    loggingIn: "Logging in...",
    markAllRead: "Mark all read",
    name: "Name",
    newPassword: "New password",
    newPasswordHint: "At least 6 characters",
    newSplit: "New Split",
    noEmail: "No email",
    noNotifications: "No notifications",
    noNotificationsBody: "You're all caught up for now.",
    noReminders: "No reminders",
    noRemindersBody: "There are no pending split reminders.",
    noSplitsFound: "No splits found",
    noSplitsYet: "No splits yet",
    noSplitsYetBody: "Create your first split to start sharing expenses with friends.",
    notificationEdwardPaidTitle: "Edward paid $20.60",
    notificationGabrielPaidTitle: "Gabriel paid $20.60",
    notificationIgnacioOwesTitle: "Ignacio owes you $30.00",
    notificationRentTitle: "Rent - April",
    notificationWifiTitle: "WiFi bill upcoming",
    notifications: "Notifications",
    password: "Password",
    paymentMethod: "Payment Method",
    preferences: "Preferences",
    quicksplit: "Quicksplit",
    recentSplits: "Recent Splits",
    repeatNewPassword: "Repeat new password",
    reminders: "Reminders",
    remindersSent: "Reminders sent",
    noPendingRemindersToSend: "No pending reminders to send",
    savePassword: "Save Password",
    saving: "Saving...",
    security: "Security",
    seeAll: "See all",
    signOut: "Sign Out",
    signUp: "Sign Up",
    signupSubtitle: "Start splitting expenses with your friends.",
    splitDetails: "Split Details",
    thisWeek: "This Week",
    theme: "Theme",
    today: "Today",
    toggleEmptyState: "Toggle Empty State",
    togglePopulatedState: "Toggle Populated State",
    viewRecurringBills: "View repeating weekly, bi-weekly, and monthly splits",
    wallet: "Wallet",
    walletBalance: "Wallet balance",
    welcomeBack: "Welcome back",
    yesterday: "Yesterday",
    youAreOwed: "You are owed",
    youOwe: "You owe",
  },
  es: {
    addPaymentMethod: "Agregar método de pago",
    all: "Todo",
    backToHome: "Volver al inicio",
    backToLogin: "Volver al inicio de sesión",
    changePassword: "Cambiar contraseña",
    changePasswordTitle: "Cambiar Contraseña",
    confirmNewPassword: "Confirmar nueva contraseña",
    createAccount: "Crear cuenta",
    createAccountAction: "Crear Cuenta",
    createFirstSplit: "Crear tu primer split",
    creating: "Creando...",
    currentPassword: "Contraseña actual",
    dark: "Oscuro",
    depositFunds: "Depositar Fondos",
    email: "Email",
    householdExpenses: "Splits Recurrentes",
    language: "Idioma",
    light: "Claro",
    loadingSplits: "Cargando splits...",
    loadingNotifications: "Cargando notificaciones...",
    login: "Iniciar Sesión",
    loginSubtitle: "Inicia sesión para manejar tus splits.",
    loggingIn: "Iniciando sesión...",
    markAllRead: "Marcar todo leído",
    name: "Nombre",
    newPassword: "Nueva contraseña",
    newPasswordHint: "Al menos 6 caracteres",
    newSplit: "Nuevo Split",
    noEmail: "Sin email",
    noNotifications: "No hay notificaciones",
    noNotificationsBody: "Estás al día por ahora.",
    noReminders: "No hay recordatorios",
    noRemindersBody: "No hay recordatorios de splits pendientes.",
    noSplitsFound: "No hay splits",
    noSplitsYet: "No hay splits todavia",
    noSplitsYetBody: "Crea tu primer split para empezar a compartir gastos con amigos.",
    notificationEdwardPaidTitle: "Edward pagó $20.60",
    notificationGabrielPaidTitle: "Gabriel pagó $20.60",
    notificationIgnacioOwesTitle: "Ignacio te debe $30.00",
    notificationRentTitle: "Renta - Abril",
    notificationWifiTitle: "Factura de WiFi próxima",
    notifications: "Notificaciones",
    password: "Contraseña",
    paymentMethod: "Método de Pago",
    preferences: "Preferencias",
    quicksplit: "Quicksplit",
    recentSplits: "Splits Recientes",
    repeatNewPassword: "Repite la nueva contraseña",
    reminders: "Recordatorios",
    remindersSent: "Recordatorios enviados",
    noPendingRemindersToSend: "No hay recordatorios pendientes para enviar",
    savePassword: "Guardar Contraseña",
    saving: "Guardando...",
    security: "Seguridad",
    seeAll: "Ver todo",
    signOut: "Cerrar Sesión",
    signUp: "Registrarse",
    signupSubtitle: "Empieza a compartir gastos con tus amigos.",
    splitDetails: "Detalles del Split",
    thisWeek: "Esta Semana",
    theme: "Tema",
    today: "Hoy",
    toggleEmptyState: "Cambiar a Estado Vacío",
    togglePopulatedState: "Cambiar a Estado con Datos",
    viewRecurringBills: "Ver splits semanales, quincenales y mensuales",
    wallet: "Billetera",
    walletBalance: "Balance disponible",
    welcomeBack: "Bienvenido",
    yesterday: "Ayer",
    youAreOwed: "Te deben",
    youOwe: "Debes",
  },
};

type TranslationKey = keyof typeof translations.en;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(
    localStorage.getItem("quicksplitLanguage") === "es" ? "es" : "en"
  );

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  };

  const toggleLanguage = () => {
    setLanguageState((currentLanguage) => (currentLanguage === "en" ? "es" : "en"));
  };

  useEffect(() => {
    localStorage.setItem("quicksplitLanguage", language);
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t: (key) => translations[language][key],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
