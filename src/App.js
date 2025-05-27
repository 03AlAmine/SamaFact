import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Dashbill"; // Assure-toi que le chemin est correct
import Bill from "./Fact"; // Exemple d'autre composant
import Side from "./Sidebar"; // Exemple d'autre composant


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bill" element={<Bill />} />
        <Route path="/side" element={<Side />} />
      </Routes>
    </Router>
  );
};

export default App;
