import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";
import { LanguageProvider } from "./context/LanguageContext";

export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: 'sm:max-w-md sm:mx-auto mt-4 w-full shadow-lg border-gray-100 rounded-2xl',
        }}
      />
    </LanguageProvider>
  );
}
