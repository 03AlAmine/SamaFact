import React from "react";
import {
  FaFileSignature,
  FaSearch,
  FaPlus,
  FaList,
  FaTh,
  FaSortAlphaDown,
  FaSortNumericDown
} from "react-icons/fa";

const PayrollHeader = ({
  title,
  filteredItemsCount,
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  sortBy,
  sortOrder,
  toggleSort,
  navigate,
  selectedEmployee,
  showEmployeeColumn
}) => (
  <div className="section-header">
    <div className="header-left">
      <h2 className="section-title">
        <FaFileSignature className="section-icon" style={{ color: '#3b82f6' }} />
        {title} <span className="count-badge">{filteredItemsCount}</span>
      </h2>

      <div className="view-controls">
        <button
          onClick={() => setViewMode('card')}
          className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
          title="Vue cartes"
        >
          <FaTh />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
          title="Vue liste"
        >
          <FaList />
        </button>
      </div>
    </div>

    <div className="header-right">
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

      <div className="sort-options">
        <div className="sort-label">Trier par:</div>
        <button
          onClick={() => toggleSort('numero')}
          className={`sort-btn ${sortBy === 'numero' ? 'active' : ''}`}
        >
          <FaSortNumericDown /> Numéro
          {sortBy === 'numero' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
        </button>
        {showEmployeeColumn && (
          <button
            onClick={() => toggleSort('employeeName')}
            className={`sort-btn ${sortBy === 'employeeName' ? 'active' : ''}`}
          >
            <FaSortAlphaDown /> Employé
            {sortBy === 'employeeName' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
          </button>
        )}
      </div>

      <button
        onClick={() => navigate("/payroll", { state: { employee: selectedEmployee } })}
        className="create-btn"
        style={{ backgroundColor: '#3b82f6' }}
      >
        <FaPlus className="btn-icon" />
        Créer un bulletin
      </button>
    </div>
  </div>
);

export default React.memo(PayrollHeader);