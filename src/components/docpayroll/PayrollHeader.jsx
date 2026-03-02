import React from "react";
import {
  FaFileSignature,
  FaSearch,
  FaList,
  FaTh,
  FaSortAlphaDown,
  FaSortNumericDown,
  FaMagic,
  FaDownload,
  FaFileExcel,
  FaFilePdf,
  FaBuilding,
  FaTimes
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
  showEmployeeColumn,
  onGenerateAll,
  onDownloadAll,
  onExport,
  totalFilteredCount,
  generateAllDisabled,
  downloadAllDisabled,
  // NOUVELLES PROPS
  selectedDepartment,
  onClearDepartment
}) => (
  <div className="section-header">
    <div className="header-left">
      <div className="title-with-badge">
        <h2 className="section-title">
          <FaFileSignature className="section-icon" style={{ color: '#3b82f6' }} />
          {title} <span className="count-badge">{filteredItemsCount}</span>
        </h2>

        {/* Badge département - juste après le titre */}
        {selectedDepartment && (
          <div className="department-badge">
            <FaBuilding size={12} />
            <span>{selectedDepartment}</span>
            <button
              onClick={onClearDepartment}
              className="department-badge-clear"
              title="Effacer le filtre département"
            >
              <FaTimes size={10} />
            </button>
          </div>
        )}
      </div>

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

      {/* Actions de masse */}
      <div className="export-buttons" style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
        <button
          onClick={onGenerateAll}
          disabled={generateAllDisabled}
          className="generate-all-btn"
          style={{
            cursor: generateAllDisabled ? 'not-allowed' : 'pointer',
            opacity: generateAllDisabled ? 0.5 : 1,
          }}
        >
          <FaMagic /> Générer ({totalFilteredCount})
        </button>

        <button
          onClick={onDownloadAll}
          disabled={downloadAllDisabled}
          className="donwload-zip-btn"
          style={{
            cursor: downloadAllDisabled ? 'not-allowed' : 'pointer',
            opacity: downloadAllDisabled ? 0.5 : 1,
          }}
        >
          <FaDownload /> Télécharger
        </button>

        <button
          onClick={() => onExport('excel')}
          className="export-btn-excel"
        >
          <FaFileExcel /> Excel
        </button>

        <button
          onClick={() => onExport('pdf')}
          className="export-btn-pdf"
        >
          <FaFilePdf /> PDF
        </button>
      </div>
    </div>
  </div>
);

export default React.memo(PayrollHeader);