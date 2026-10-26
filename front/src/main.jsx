import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import TelePage from "./pages/TelePage.jsx";
import './index.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<TelePage/>} />
    </Routes>
  </BrowserRouter>
)