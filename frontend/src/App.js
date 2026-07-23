import React, { useState, useEffect } from "react";
import Routes from "./routes";
import "react-toastify/dist/ReactToastify.css";

// O ThemeProvider é gerenciado pelo contexto DarkMode em routes/index.js
// Não definimos um tema aqui para evitar conflito de temas

const App = () => {
  useEffect(() => {
    // Garante que o locale correto é carregado
    const i18nlocale = localStorage.getItem("i18nextLng");
    if (!i18nlocale) {
      localStorage.setItem("i18nextLng", "pt-BR");
    }
  }, []);

  return <Routes />;
};

export default App;
