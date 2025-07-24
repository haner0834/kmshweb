import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./auth/AuthContext.tsx";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { ModalProvider } from "./widgets/ModalContext.tsx";
import { DeviceProvider } from "./widgets/DeviceContext.tsx";
import { NavbarButtonsProvider } from "./widgets/NavbarButtonsContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DeviceProvider>
          <ModalProvider>
            <NavbarButtonsProvider>
              <App />
            </NavbarButtonsProvider>
          </ModalProvider>
        </DeviceProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
