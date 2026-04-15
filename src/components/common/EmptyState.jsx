import React from "react";
import { FaPlus } from "react-icons/fa";
import empty from "../../assets/empty.png";

const COLOR_MAP = { facture: "#4f46e5", devis: "#10b981", avoir: "#f59e0b" };

const EmptyState = ({ title, type, getTypeColor, navigate }) => {
  const typeColor = getTypeColor ? getTypeColor() : (COLOR_MAP[type] ?? "#4f46e5");

  const getButtonText = () => {
    switch (type) {
      case "facture": return "une Facture";
      case "devis": return "un Devis";
      case "avoir": return "un Avoir";
      default: return "un Document";
    }
  };

  return (
    <div className="empty-state">
      <img src={empty} alt="Aucun document" className="empty-image" />
      <h3>Aucun {title.toLowerCase().slice(0, -1)} trouvé</h3>
      <p>Commencez par créer votre premier document</p>
      <button
        onClick={() => navigate("/invoice", { state: { type } })}
        className="create-btn empty-btn"
        style={{ backgroundColor: typeColor }}
      >
        <FaPlus className="btn-icon" />
        Créer {getButtonText()}
      </button>
    </div>
  );
};

export default React.memo(EmptyState);