import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import { Toaster } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function App() {
  const [token, setToken] = useState(localStorage.getItem("gcc_token") || null);
  const [email, setEmail] = useState(localStorage.getItem("gcc_email") || null);

  const login = (tkn, em) => {
    localStorage.setItem("gcc_token", tkn);
    localStorage.setItem("gcc_email", em);
    setToken(tkn);
    setEmail(em);
  };

  const logout = () => {
    localStorage.removeItem("gcc_token");
    localStorage.removeItem("gcc_email");
    setToken(null);
    setEmail(null);
  };

  return (
    <AuthContext.Provider value={{ token, email, login, logout }}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={token ? <Navigate to="/" /> : <LoginPage />} />
            <Route path="/*" element={token ? <DashboardPage /> : <Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" theme="dark" richColors />
        <div className="noise-overlay" />
      </div>
    </AuthContext.Provider>
  );
}

export default App;
