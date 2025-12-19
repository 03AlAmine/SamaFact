import React, { useState } from "react";
import {
  FaFileInvoiceDollar,
  FaSearch,
  FaPlus,
  FaList,
  FaTh,
  FaSortAlphaDown,
  FaSortNumericDown,
  FaSpinner
} from "react-icons/fa";

const HeaderSection = ({
  title,
  type,
  getTypeColor,
  filteredItemsCount,
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  sortBy,
  sortOrder,
  toggleSort,
  navigate,
  isMobile
}) => {
  const [isChangingView, setIsChangingView] = useState(false);

  // Fonction pour changer la vue avec indicateur de chargement
  const handleViewChange = async (newViewMode) => {
    if (viewMode === newViewMode || isChangingView) return;

    setIsChangingView(true);

    try {
      // Simuler un délai pour le changement de vue
      await new Promise(resolve => setTimeout(resolve, 300));
      setViewMode(newViewMode);
    } catch (error) {
      console.error("Erreur lors du changement de vue:", error);
    } finally {
      setIsChangingView(false);
    }
  };

  return (
    <div className="section-header">
      <div className="header-left">
        <h2 className="section-title">
          <FaFileInvoiceDollar
            className="section-icon"
            style={{ color: getTypeColor() }}
          />
          {title} <span className="count-badge">{filteredItemsCount}</span>
        </h2>

        {!isMobile && (
          <div className="view-controls">
            <button
              onClick={() => handleViewChange("card")}
              className={`view-btn ${viewMode === "card" ? "active" : ""} ${isChangingView ? "disabled" : ""
                }`}
              disabled={isChangingView}
              title="Vue cartes"
            >
              {isChangingView && viewMode !== "card" ? (
                <FaSpinner className="spinner" />
              ) : (
                <FaTh />
              )}
            </button>
            <button
              onClick={() => handleViewChange("list")}
              className={`view-btn ${viewMode === "list" ? "active" : ""} ${isChangingView ? "disabled" : ""
                }`}
              disabled={isChangingView}
              title="Vue liste"
            >
              {isChangingView && viewMode !== "list" ? (
                <FaSpinner className="spinner" />
              ) : (
                <FaList />
              )}
            </button>
          </div>
        )}

        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            disabled={isChangingView}
          />
        </div>
      </div>

      <div className="header-right">


        <div className="sort-options">
          <div className="sort-label">Trier par:</div>
          <button
            onClick={() => !isChangingView && toggleSort("numero")}
            className={`sort-btn ${sortBy === "numero" ? "active" : ""} ${isChangingView ? "disabled" : ""
              }`}
            disabled={isChangingView}
          >
            <FaSortNumericDown /> Numéro
            {sortBy === "numero" && (
              <span className="sort-indicator">
                {sortOrder === "asc" ? "↑" : "↓"}
              </span>
            )}
          </button>
          <button
            onClick={() => !isChangingView && toggleSort("clientNom")}
            className={`sort-btn ${sortBy === "clientNom" ? "active" : ""} ${isChangingView ? "disabled" : ""
              }`}
            disabled={isChangingView}
          >
            <FaSortAlphaDown /> Client
            {sortBy === "clientNom" && (
              <span className="sort-indicator">
                {sortOrder === "asc" ? "↑" : "↓"}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => !isChangingView && navigate("/invoice", { state: { type } })}
          className="create-btn"
          style={{ backgroundColor: getTypeColor() }}
          disabled={isChangingView}
        >
          <FaPlus className="btn-icon" />
          Créer{" "}
          {type === "facture"
            ? "une Facture"
            : type === "devis"
              ? "un Devis"
              : "un Avoir"}
        </button>
      </div>
    </div>
  );
};

export default React.memo(HeaderSection);