import React, { useState, useRef } from "react";
import {
  FaUsers, FaEdit, FaTrash, FaBuilding, FaPlus, FaSearch,
  FaFileAlt, FaFileExcel, FaList, FaTh,
  FaSortAlphaDown, FaIdCard, FaMoneyBillWave, FaCalendarAlt
} from "react-icons/fa";
import empty_employee from '../assets/empty_employe.png';
import '../css/EmployeePage.css';

const EmployeesPage = ({
  employees,
  filteredEmployees,
  searchTerm,
  setSearchTerm,
  selectedEmployee,
  loadEmployeePayrolls,
  handleEdit,
  handleDelete,
  employee,
  handleChange,
  handleSubmit,
  editingEmployee,
  handleEditChange,
  handleUpdate,
  cancelEdit,
  handleCreatePayroll,
  handleDeletePayroll,
  handleImportEmployees,
  importProgress,
  setImportProgress
}) => {
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');
  const payrollsSectionRef = useRef(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleFileUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (handleImportEmployees) handleImportEmployees(e);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let compareValue;
    if (sortBy === 'nom') {
      compareValue = a.nom.localeCompare(b.nom);
    } else if (sortBy === 'poste') {
      compareValue = a.poste.localeCompare(b.poste);
    } else if (sortBy === 'dateEmbauche') {
      compareValue = new Date(a.dateEmbauche) - new Date(b.dateEmbauche);
    }
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  const handleEmployeeClick = (employeeId) => {
    loadEmployeePayrolls(employeeId);
    setTimeout(() => {
      payrollsSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  return (
    <>
      {editingEmployee ? (
        <form onSubmit={handleUpdate} className="employee-form">
          <h2 className="form-title">
            <FaEdit style={{ marginRight: "10px" }} />
            Modifier l'employé
          </h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-nom" className="form-label">Nom <span className="required">*</span></label>
              <input
                id="edit-nom"
                name="nom"
                value={editingEmployee.nom}
                onChange={handleEditChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-prenom" className="form-label">Prénom <span className="required">*</span></label>
              <input
                id="edit-prenom"
                name="prenom"
                value={editingEmployee.prenom}
                onChange={handleEditChange}
                required
                className="form-input"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-adresse" className="form-label">Adresse <span className="required">*</span></label>
              <input
                id="edit-adresse"
                name="adresse"
                value={editingEmployee.adresse}
                onChange={handleEditChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-categorie" className="form-label">Catégorie <span className="required">*</span></label>
              <input
                id="edit-categorie"
                name="categorie"
                value={editingEmployee.categorie}
                onChange={handleEditChange}
                required
                className="form-input"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-poste" className="form-label">Poste <span className="required">*</span></label>
              <input
                id="edit-poste"
                name="poste"
                value={editingEmployee.poste}
                onChange={handleEditChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-departement" className="form-label">Département</label>
              <input
                id="edit-departement"
                name="departement"
                value={editingEmployee.departement}
                onChange={handleEditChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-matricule" className="form-label">Matricule <span className="required">*</span></label>
              <input
                id="edit-matricule"
                name="matricule"
                value={editingEmployee.matricule}
                onChange={handleEditChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-dateEmbauche" className="form-label">Date d'embauche <span className="required">*</span></label>
              <input
                id="edit-dateEmbauche"
                name="dateEmbauche"
                type="date"
                value={editingEmployee.dateEmbauche}
                onChange={handleEditChange}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-salaire" className="form-label">Salaire brut <span className="required">*</span></label>
              <input
                id="edit-salaire"
                name="salaireBase"
                type="number"
                value={editingEmployee.salaireBase}
                onChange={handleEditChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-typeContrat" className="form-label">Type de contrat</label>
              <select
                id="edit-typeContrat"
                name="typeContrat"
                value={editingEmployee.typeContrat}
                onChange={handleEditChange}
                className="form-input"
              >
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Stage">Stage</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={cancelEdit} className="cancel-btn">
              Annuler
            </button>
            <button type="submit" className="update-btn">
              Mettre à jour
            </button>
          </div>
        </form>
      ) : (
        showAddForm && (
          <form onSubmit={handleSubmit} className="employee-form">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="form-title">
                <FaPlus style={{ marginRight: "10px" }} />
                Ajouter un nouvel employé
              </h2>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nom" className="form-label">Nom <span className="required">*</span></label>
                <input
                  id="nom"
                  name="nom"
                  value={employee.nom}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="prenom" className="form-label">Prénom <span className="required">*</span></label>
                <input
                  id="prenom"
                  name="prenom"
                  value={employee.prenom}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="adresse" className="form-label">Adresse <span className="required">*</span></label>
                <input
                  id="adresse"
                  name="adresse"
                  value={employee.adresse}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="categorie" className="form-label">Catégorie <span className="required">*</span></label>
                <input
                  id="categorie"
                  name="categorie"
                  value={employee.categorie}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="poste" className="form-label">Poste <span className="required">*</span></label>
                <input
                  id="poste"
                  name="poste"
                  value={employee.poste}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="departement" className="form-label">Département</label>
                <input
                  id="departement"
                  name="departement"
                  value={employee.departement}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="matricule" className="form-label">Matricule <span className="required">*</span></label>
                <input
                  id="matricule"
                  name="matricule"
                  value={employee.matricule}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dateEmbauche" className="form-label">Date d'embauche <span className="required">*</span></label>
                <input
                  id="dateEmbauche"
                  name="dateEmbauche"
                  type="date"
                  value={employee.dateEmbauche}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="salaireBase" className="form-label">Salaire brut <span className="required">*</span></label>
                <input
                  id="salaireBase"
                  name="salaireBase"
                  type="number"
                  value={employee.salaireBase}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="typeContrat" className="form-label">Type de contrat</label>
                <select
                  id="typeContrat"
                  name="typeContrat"
                  value={employee.typeContrat}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Stage">Stage</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Ajouter l'employé
            </button>
          </form>
        )
      )}

      <div className="employees-section">
        <div className="section-header">
          <div className="header-left">
            <h2 className="section-title">
              <FaUsers style={{ marginRight: "10px" }} />
              Employés ({sortedEmployees.length})
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
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="sort-options">
              <div className="sort-label">Trier par:</div>
              <button
                onClick={() => toggleSort('nom')}
                className={`sort-btn ${sortBy === 'nom' ? 'active' : ''}`}
              >
                <FaSortAlphaDown /> Nom
                {sortBy === 'nom' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </button>
              <button
                onClick={() => toggleSort('poste')}
                className={`sort-btn ${sortBy === 'poste' ? 'active' : ''}`}
              >
                <FaSortAlphaDown /> Poste
                {sortBy === 'poste' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </button>
            </div>

            <button
              className="primary-btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <FaPlus /> {showAddForm ? "Fermer" : "Ajouter"}
            </button>

            <label htmlFor="file-upload" className="import-btn">
              <FaFileExcel /> Importer
              <input
                id="file-upload"
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {importProgress && (
          <div className="import-progress">
            <div>{importProgress}</div>
            {importProgress.includes("réussis") && (
              <button onClick={() => setImportProgress(null)} className="close-btn">
                Fermer
              </button>
            )}
          </div>
        )}

        {sortedEmployees.length === 0 ? (
          <div className="empty-state">
            <img src={empty_employee} alt="Aucun employé" className="empty-image" />
            <h3>Aucun employé trouvé</h3>
            <p>Commencez par créer votre premier employé</p>
            <button
              className="primary-btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <FaPlus /> Ajouter un employé
            </button>
          </div>
        ) : viewMode === 'card' ? (
          <div className="employees-grid">
            {sortedEmployees.map((e) => (
              <div
                key={e.id}
                className={`employee-card ${selectedEmployee?.id === e.id ? 'active' : ''}`}
                onClick={() => handleEmployeeClick(e.id)}
              >
                <div className="employee-type-badge">
                  {e.typeContrat}
                </div>

                <div className="employee-header">
                  <div className="employee-avatar">
                    {e.prenom.charAt(0).toUpperCase()}{e.nom.charAt(0).toUpperCase()}
                  </div>
                  <div className="employee-info">
                    <div className="employee-name">{e.prenom} {e.nom}</div>
                    <div className="employee-position">{e.poste}</div>
                  </div>
                  <div className="employee-actions">
                    <button
                      onClick={(evt) => {
                        evt.stopPropagation();
                        handleEdit(e);
                      }}
                      className="action-btn edit-btn"
                      title="Modifier"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={(evt) => {
                        evt.stopPropagation();
                        handleDelete(e.id);
                      }}
                      className="action-btn delete-btn"
                      title="Supprimer"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className="employee-details">
                  <div className="employee-detail">
                    <FaIdCard className="detail-icon" />
                    <span className="detail-value">{e.matricule}</span>
                  </div>
                  
                  <div className="employee-detail">
                    <FaCalendarAlt className="detail-icon" />
                    <span className="detail-value">
                      {new Date(e.dateEmbauche).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="employee-detail">
                    <FaMoneyBillWave className="detail-icon" />
                    <span className="detail-value">
                      {e.salaireBase?.toLocaleString()} FCFA
                    </span>
                  </div>
                  
                  <div className="employee-detail">
                    <FaBuilding className="detail-icon" />
                    <span className="detail-value">{e.departement}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="employees-table-container">
            <table className="employees-table">
              <thead>
                <tr>
                  <th
                    onClick={() => toggleSort('nom')}
                    className={sortBy === 'nom' ? 'active' : ''}
                  >
                    <div className="th-content">
                      Nom
                      {sortBy === 'nom' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('poste')}
                    className={sortBy === 'poste' ? 'active' : ''}
                  >
                    <div className="th-content">
                      Poste
                      {sortBy === 'poste' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th>Matricule</th>
                  <th>Salaire</th>
                  <th>Contrat</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedEmployees.map((e) => (
                  <tr
                    key={e.id}
                    className={selectedEmployee?.id === e.id ? 'active' : ''}
                    onClick={() => handleEmployeeClick(e.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="cell-content">
                        <div className="employee-avatar-small">
                          {e.prenom.charAt(0).toUpperCase()}{e.nom.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="employee-name">{e.prenom} {e.nom}</div>
                          <div className="employee-department">{e.departement}</div>
                        </div>
                      </div>
                    </td>
                    <td>{e.poste}</td>
                    <td>{e.matricule}</td>
                    <td>{e.salaireBase?.toLocaleString()} FCFA</td>
                    <td>{e.typeContrat}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={(evt) => {
                            evt.stopPropagation();
                            handleEdit(e);
                          }}
                          className="action-btn edit-btn"
                          title="Modifier"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={(evt) => {
                            evt.stopPropagation();
                            handleDelete(e.id);
                          }}
                          className="action-btn delete-btn"
                          title="Supprimer"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedEmployee && (
        <div className="payrolls-section" ref={payrollsSectionRef}>
          <div className="payrolls-header">
            <h2 className="section-title">
              <FaFileAlt /> Fiches de paie de {selectedEmployee.prenom} {selectedEmployee.nom}
            </h2>
            <div className="payrolls-actions">
              <button onClick={handleCreatePayroll} className="create-payroll-btn">
                <FaPlus /> Générer une fiche
              </button>
            </div>
          </div>

          {/* Section des fiches de paie à implémenter ici */}
        </div>
      )}
    </>
  );
};

export default EmployeesPage;