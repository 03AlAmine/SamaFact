import React from "react";
import { FaPlus } from "react-icons/fa";
import empty from "../../assets/empty.png";

const EmptyState = ({ title, type, getTypeColor, navigate }) => {
  // Fonction de secours si getTypeColor n'est pas fournie
  const getDefaultColor = () => {
    switch (type) {
      case "facture": return "#4f46e5";
      case "devis": return "#10b981";
      case "avoir": return "#f59e0b";
      default: return "#4f46e5";
    }
  };

  // Utiliser getTypeColor si elle existe, sinon utiliser la fonction par défaut
  const typeColor = getTypeColor ? getTypeColor() : getDefaultColor();

  // Texte du bouton selon le type
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