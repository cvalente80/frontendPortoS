import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { AuthUXProvider } from "./context/AuthUXContext";
import { initGoogleTracking } from "./lib/tracking";
import './index.css'; // Assumindo que tem um ficheiro de estilos global

const basename = (import.meta as any).env?.BASE_URL || '/';

initGoogleTracking();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthUXProvider>
          <App />
        </AuthUXProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);



