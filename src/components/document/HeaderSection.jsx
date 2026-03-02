import React, {  } from "react";
import {
  FaFileInvoiceDollar,
  FaSearch,
  FaList,
  FaTh,
  FaSortAlphaDown,
  FaSortNumericDown,
  FaSpinner, FaFileExcel, FaFilePdf
} from "react-icons/fa";

const HeaderSection = ({
  title,
  getTypeColor,
  filteredItemsCount,
  viewMode,
  searchTerm,
  setSearchTerm,
  sortBy,
  sortOrder,
  toggleSort,
  navigate,
  isMobile,
  onExport,
  isChangingTab,
  isChangingView,
setViewMode
}) => {


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
              onClick={() => setViewMode("card")}
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
              onClick={() => setViewMode("list")}
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

        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
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



        <div className="export-buttons">
          <button
            onClick={() => !isChangingTab && onExport('excel')}
            className={`export-btn-excel ${isChangingTab ? "disabled" : ""}`}
            disabled={isChangingTab}
          >
            <FaFileExcel /> Excel
          </button>
          <button
            onClick={() => !isChangingTab && onExport('pdf')}
            className={`export-btn-pdf ${isChangingTab ? "disabled" : ""}`}
            disabled={isChangingTab}
          >
            <FaFilePdf /> PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HeaderSection);