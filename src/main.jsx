import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
import AuthProvider from "./features/auth/AuthProvider";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      {/*
        AuthProvider must be INSIDE Redux Provider (it uses useDispatch/useSelector).
        AuthProvider must wrap App (it gates rendering until Firebase auth is resolved).
      */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
  </StrictMode>
);
