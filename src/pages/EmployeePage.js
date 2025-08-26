import React, { useState, useRef, useEffect } from "react";
import {
  FaUsers, FaEdit, FaTrash, FaBuilding, FaPlus, FaSearch,
  FaFileAlt, FaFileExcel, FaList, FaTh,
  FaSortAlphaDown, FaIdCard, FaMoneyBillWave, FaCalendarAlt, FaEye
} from "react-icons/fa";
import empty_employee from '../assets/empty_employe.png';
import '../css/EmployeePage.css';
import { EmployeeDetailsModal } from '../components/EmployeeModal';
import { Modal, Button } from "antd";

const EmployeesPage = ({
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
  handleUpdateSuivi,
  cancelEdit,
  handleCreatePayroll,
  handleDeletePayroll,
  handleImportEmployees,
  importProgress,
  setImportProgress,
}) => {
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');
  const payrollsSectionRef = useRef(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [loading, setLoading] = useState(true);



  // Précharger l'image de fond
  useEffect(() => {
    const img = new Image();
    img.src = "/bg-client.jpg";
    img.onload = () => {
      setBackgroundLoaded(true);
    };
    img.onerror = () => {
      console.error("Erreur de chargement de l'image de fond");
      setBackgroundLoaded(true); // Continuer même si l'image échoue
    };
  }, []);

  // Gérer le chargement global
  useEffect(() => {
    // Attendre que l'image de fond soit chargée
    if (backgroundLoaded) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500); // Réduit à 0.5s pour plus de fluidité

      return () => clearTimeout(timer);
    }
  }, [backgroundLoaded]);

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


  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
  const [isTrackingModalVisible, setIsTrackingModalVisible] = useState(false);

  const handleViewDetails = (employee) => {
    setSelectedEmployeeDetails(employee);
    setIsInfoModalVisible(true);
  };


  const handleInfoModalCancel = () => {
    setIsInfoModalVisible(false);
  };


  const [trackingData, setTrackingData] = useState({
    joursConges: 0,
    joursCongesUtilises: 0,
    joursAbsence: 0,
    avanceSalaire: 0
  });

  // Ouvrir le modal avec les données actuelles
  const handleOpenTrackingModal = (employee) => {
    setSelectedEmployeeDetails(employee);
    setTrackingData({
      joursConges: employee.joursConges || 0,
      joursCongesUtilises: employee.joursCongesUtilises || 0,
      joursAbsence: employee.joursAbsence || 0,
      avanceSalaire: employee.avanceSalaire || 0
    });
    setIsTrackingModalVisible(true);
  };

  // Soumettre les modifications
  const handleSubmitTracking = async (updatedData) => {
    try {
      const updatedEmployee = {
        ...selectedEmployeeDetails,
        ...updatedData
      };

      await handleUpdateSuivi(updatedEmployee);
      // Ne pas fermer le modal ici - laissez le contrôle à l'utilisateur
    } catch (error) {
      console.error("Erreur mise à jour suivi:", error);
    }
  };
  // Gestion des changements
  const handleTrackingChange = (e) => {
    const { name, value } = e.target;
    setTrackingData(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#2c3e50',
          fontSize: '18px',
          fontWeight: '500',
          fontFamily: 'Inter, sans-serif',
          backgroundColor: '#ecf0f1',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          margin: '40px auto',
          marginTop: '5%',
          maxWidth: '400px'
        }}
      >
        <div
          style={{
            fontSize: '30px',
            marginBottom: '10px',
            animation: 'spin 1.5s linear infinite',
            display: 'inline-block'
          }}
        >
          ⏳
        </div>
        <div>Chargement...</div>

        <style>
          {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
        </style>
      </div>
    );
  }

  const TrackingModal = React.memo(({
    visible,
    onCancel,
    onSubmit,
    employee,
    trackingData,
    onTrackingChange
  }) => {
    // Utilisez un état local pour éviter les rerenders inutiles
    const [localTrackingData, setLocalTrackingData] = useState(trackingData);

    // Mettre à jour l'état local quand les props changent
    useEffect(() => {
      setLocalTrackingData(trackingData);
    }, [trackingData]);

    const handleLocalChange = (e) => {
      const { name, value } = e.target;
      setLocalTrackingData(prev => ({
        ...prev,
        [name]: Number(value)
      }));
    };

    const handleLocalSubmit = (e) => {
      e.preventDefault();
      onSubmit(localTrackingData); // Passez directement les données
    };

    return (
      <Modal
        title={`Suivi congés/absences - ${employee?.prenom} ${employee?.nom}`}
        open={visible}
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel}>Annuler</Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleLocalSubmit}
          >
            Enregistrer
          </Button>
        ]}
        width={800}
        className="employee-form-modal"
        destroyOnHidden
        forceRender
      >
        <div className="employee-form">
          <div className="form-section-title">
            <FaCalendarAlt style={{ marginRight: "10px" }} />
            Suivi des congés et absences
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Jours congés disponibles</label>
              <input
                name="joursConges"
                type="number"
                value={localTrackingData.joursConges}
                onChange={handleLocalChange}
                className="form-input"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Congés utilisés</label>
              <input
                name="joursCongesUtilises"
                type="number"
                value={localTrackingData.joursCongesUtilises}
                onChange={handleLocalChange}
                className="form-input"
                min="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Jours absence</label>
              <input
                name="joursAbsence"
                type="number"
                value={localTrackingData.joursAbsence}
                onChange={handleLocalChange}
                className="form-input"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Avance salaire (FCFA)</label>
              <input
                name="avanceSalaire"
                type="number"
                value={localTrackingData.avanceSalaire}
                onChange={handleLocalChange}
                className="form-input"
                min="0"
              />
            </div>
          </div>
        </div>
      </Modal>
    );
  });

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
                value={editingEmployee.dateEmbauche || ""}
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
          <div className="form-section-title">
            <FaMoneyBillWave style={{ marginRight: "10px" }} />
            Primes et Indemnités Fixes
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-indemniteTransport" className="form-label">
                Indemnité de transport (FCFA)
              </label>
              <input
                id="edit-indemniteTransport"
                name="indemniteTransport"
                type="number"
                value={editingEmployee.indemniteTransport || 26000}
                onChange={handleEditChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-primePanier" className="form-label">
                Prime de panier (FCFA)
              </label>
              <input
                id="edit-primePanier"
                name="primePanier"
                type="number"
                value={editingEmployee.primePanier || 0}
                onChange={handleEditChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-indemniteResponsabilite" className="form-label">
                Indemnité de responsabilité (FCFA)
              </label>
              <input
                id="edit-indemniteResponsabilite"
                name="indemniteResponsabilite"
                type="number"
                value={editingEmployee.indemniteResponsabilite || 0}
                onChange={handleEditChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-indemniteDeplacement" className="form-label">
                Indemnité de déplacement (FCFA)
              </label>
              <input
                id="edit-indemniteDeplacement"
                name="indemniteDeplacement"
                type="number"
                value={editingEmployee.indemniteDeplacement || 0}
                onChange={handleEditChange}
                className="form-input"
              />
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

            <div className="form-section-title">
              <FaMoneyBillWave style={{ marginRight: "10px" }} />
              Primes et Indemnités Fixes
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="indemniteTransport" className="form-label">
                  Indemnité de transport (FCFA)
                </label>
                <input
                  id="indemniteTransport"
                  name="indemniteTransport"
                  type="number"
                  value={employee.indemniteTransport || 26000}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="primePanier" className="form-label">
                  Prime de panier (FCFA)
                </label>
                <input
                  id="primePanier"
                  name="primePanier"
                  type="number"
                  value={employee.primePanier || 0}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="indemniteResponsabilite" className="form-label">
                  Indemnité de responsabilité (FCFA)
                </label>
                <input
                  id="indemniteResponsabilite"
                  name="indemniteResponsabilite"
                  type="number"
                  value={employee.indemniteResponsabilite || 0}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="indemniteDeplacement" className="form-label">
                  Indemnité de déplacement (FCFA)
                </label>
                <input
                  id="indemniteDeplacement"
                  name="indemniteDeplacement"
                  type="number"
                  value={employee.indemniteDeplacement || 0}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Ajouter l'employé
            </button>
          </form>
        )
      )}

      <div
                className={`employees-section ${backgroundLoaded ? 'background-loaded' : ''}`}
        style={{
          backgroundImage: `url(/bg-client.jpg)`,
        }}
      >
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
                <div className={`employee-type-badge ${e.typeContrat}`}>
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
                    <button
                      onClick={(evt) => {
                        evt.stopPropagation();
                        handleViewDetails(e);
                      }}
                      className="action-btn view-btn"
                      title="Voir détails"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={(evt) => {
                        evt.stopPropagation();
                        handleOpenTrackingModal(e); // Passer e au lieu de employee
                      }}
                      className="action-btn tracking-btn"
                    >
                      <FaCalendarAlt />
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
                      {e.dateEmbauche ? new Date(e.dateEmbauche).toLocaleDateString() : 'Non définie'}
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
                    <td>
                      <div className={`employee-badge ${e.typeContrat}`}>
                        {e.typeContrat}
                      </div>
                    </td>
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
                        <button
                          onClick={(evt) => {
                            evt.stopPropagation();
                            handleViewDetails(e);
                          }}
                          className="action-btn view-btn"
                          title="Voir détails"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={(evt) => {
                            evt.stopPropagation();
                            handleOpenTrackingModal(e); // Passer e au lieu de employee
                          }}
                          className="action-btn tracking-btn"
                        >
                          <FaCalendarAlt />
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


      <EmployeeDetailsModal
        isVisible={isInfoModalVisible}
        onCancel={handleInfoModalCancel}
        employee={selectedEmployeeDetails}
      />
      <TrackingModal
        visible={isTrackingModalVisible}
        onCancel={() => setIsTrackingModalVisible(false)}
        onSubmit={(data) => {
          handleSubmitTracking(data);
          setIsTrackingModalVisible(false); // Fermer seulement après soumission
        }}
        employee={selectedEmployeeDetails}
        trackingData={trackingData}
        onTrackingChange={handleTrackingChange}
      />
    </>
  );
};

export default EmployeesPage;