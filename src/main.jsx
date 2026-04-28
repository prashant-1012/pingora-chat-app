import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import AuthProvider from "./features/auth/AuthProvider";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <ProfileProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ProfileProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>
);
