import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { db } from '../firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import PayrollPDF from './PayrollPDF';
import './Payroll.css';
import { useAuth } from '../auth/AuthContext';
import { FaArrowLeft, FaEye, FaEyeSlash, FaSave, FaDownload, FaSpinner, FaUser, FaCalendar, FaMoneyBill, FaReceipt, FaCog } from "react-icons/fa";
import { payrollService } from '../../services/payrollService';
import PDFPreviewDynamic from '../../components/views/PDFPreviewDynamic';
import Notification from '../../components/other/Notification';
import LoadingState from '../../components/common/LoadingState';

// Fonctions utilitaires
const formatCurrency = (value) => {
  const numericValue = parseFloat(value) || 0;
  return `${numericValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
};

const formatFirestoreDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  if (timestamp.toDate) {
    return timestamp.toDate().toLocaleDateString();
  }
  return timestamp;
};

const getCurrentMonthDateRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    du: firstDay.toISOString().split('T')[0],
    au: lastDay.toISOString().split('T')[0]
  };
};

// Composant Header
const PayrollHeader = ({
  payroll,
  onSave,
  saving,
  isSaved,
  showPreview,
  onTogglePreview,
  onBack,
  pdfData,
  selectedEmployee
}) => {
  return (
    <header className="pr-header">
      <div className="pr-header-left">
        <button className="pr-back-button" onClick={onBack}>
          <FaArrowLeft className="button-icon" />
          <span className="button-text">Quitter</span>
        </button>
        <div className="pr-header-title">
          <h1>
            {payroll?.id ? 'Modifier le bulletin' : 'Nouveau bulletin'} - Paie
          </h1>
          {payroll?.numero && <span className="pr-payroll-number">{payroll.numero}</span>}
          {selectedEmployee && (
            <span className="pr-employee-name">
              {selectedEmployee.nom} {selectedEmployee.prenom}
            </span>
          )}
        </div>
      </div>

      <div className="pr-header-actions">
        <button
          onClick={() => onTogglePreview(!showPreview)}
          className="pr-btn-preview"
        >
          <i className={`fas fa-${showPreview ? 'eye-slash' : 'eye'}`}></i>
          {showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu"}
        </button>

        <button
          onClick={() => onSave()}
          disabled={saving}
          className="pr-btn-save"
        >
          {saving ? (
            <>
              <FaSpinner className="spinner" /> Enregistrement...
            </>
          ) : (
            <>
              <FaSave />
              {payroll?.id ? 'Mettre à jour' : 'Enregistrer'}
            </>
          )}
        </button>

        {isSaved && (
          <PDFDownloadLink
            document={pdfData}
            fileName={`bulletin_paie_${selectedEmployee?.nom}_${selectedEmployee?.prenom}.pdf`}
            className="pr-btn-download"
          >
            {({ loading }) => (
              loading
                ? <><FaSpinner className="spinner" /> Génération...</>
                : <><FaDownload /> Télécharger</>
            )}
          </PDFDownloadLink>
        )}
      </div>
    </header>
  );
};

// Navigation horizontale
const HorizontalNavigation = ({ activeSection, onSectionChange, payroll }) => {
  const sections = [
    {
      id: 'employee',
      label: '👤 Employé',
      icon: FaUser,
      completed: !!payroll?.employeeId,
      description: 'Sélection employé'
    },
    {
      id: 'period',
      label: '📅 Période',
      icon: FaCalendar,
      completed: !!payroll?.periode?.du && !!payroll?.periode?.au,
      description: 'Période de paie'
    },
    {
      id: 'remuneration',
      label: '💰 Rémunération',
      icon: FaMoneyBill,
      completed: true,
      description: 'Salaire et primes'
    },
    {
      id: 'deductions',
      label: '📊 Retenues',
      icon: FaReceipt,
      completed: true,
      description: 'Cotisations et impôts'
    },
    {
      id: 'summary',
      label: '📈 Synthèse',
      icon: FaCog,
      completed: true,
      description: 'Récapitulatif'
    }
  ];

  return (
    <nav className="pr-horizontal-nav">
      <div className="pr-nav-header">
        <h3>Création de bulletin de paie</h3>
        <p>Suivez les étapes pour compléter le bulletin</p>
      </div>

      <div className="pr-nav-tabs">
        {sections.map(section => (
          <button
            key={section.id}
            className={`pr-nav-tab ${activeSection === section.id ? 'active' : ''} ${section.completed ? 'completed' : ''}`}
            onClick={() => onSectionChange(section.id)}
          >
            <span className="pr-tab-icon">
              <section.icon />
            </span>
            <span className="pr-tab-label">{section.label}</span>
            <span className="pr-tab-description">{section.description}</span>
            {section.completed && <div className="pr-tab-completed">✓</div>}
          </button>
        ))}
      </div>
    </nav>
  );
};

// Section Employé
const EmployeeSection = ({ 
  employees = [], 
  selectedEmployee, 
  onEmployeeChange, 
  error,
  showEmployeeInfo,
  onToggleEmployeeInfo 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(employee =>
    employee.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.poste?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pr-section">
      <div className="pr-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Informations de l'employé</h2>
          <p>Sélectionnez l'employé pour ce bulletin de paie</p>
        </div>
        <button
          className="pr-toggle-btn"
          onClick={onToggleEmployeeInfo}
        >
          {showEmployeeInfo ? "Masquer" : "Afficher"}
        </button>
      </div>

      {showEmployeeInfo && (
        <>
          {/* Employé sélectionné */}
          {selectedEmployee && (
            <div className="pr-selected-employee">
              <div className="pr-selected-employee-header">
                <h4>✅ Employé sélectionné</h4>
                <button
                  onClick={() => onEmployeeChange(null)}
                  className="pr-btn-clear-employee"
                >
                  <i className="fas fa-times"></i>
                  Changer
                </button>
              </div>
              <div className="pr-selected-employee-info">
                <div className="pr-employee-avatar">
                  {(selectedEmployee.nom?.charAt(0) || 'E').toUpperCase()}
                </div>
                <div className="pr-employee-details">
                  <h3>{selectedEmployee.nom} {selectedEmployee.prenom}</h3>
                  <div className="pr-employee-meta">
                    <span><strong>Poste:</strong> {selectedEmployee.poste}</span>
                    <span><strong>Matricule:</strong> {selectedEmployee.matricule}</span>
                    <span><strong>Contrat:</strong> {selectedEmployee.typeContrat}</span>
                  </div>
                  <div className="pr-employee-financial">
                    <span><strong>Salaire base:</strong> {formatCurrency(selectedEmployee.salaireBase)}</span>
                    <span><strong>Parts fiscales:</strong> {selectedEmployee.nbreofParts || 1}</span>
                    <span><strong>Embauche:</strong> {formatFirestoreDate(selectedEmployee.dateEmbauche)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recherche d'employés */}
          {!selectedEmployee && (
            <>
              <div className="pr-employee-search">
                <div className="pr-search-input-wrapper">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Rechercher un employé..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-search-input"
                  />
                </div>
              </div>

              {error && (
                <div className="pr-error-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              <div className="pr-employees-grid">
                {filteredEmployees.map(employee => (
                  <div
                    key={employee.id}
                    className={`pr-employee-card ${selectedEmployee?.id === employee.id ? 'selected' : ''}`}
                    onClick={() => onEmployeeChange(employee)}
                  >
                    <div className="pr-employee-avatar">
                      {(employee.nom?.charAt(0) || 'E').toUpperCase()}
                    </div>
                    <div className="pr-employee-info">
                      <h4>{employee.nom} {employee.prenom}</h4>
                      <p className="pr-employee-position">
                        <i className="fas fa-briefcase"></i>
                        {employee.poste || 'Poste non renseigné'}
                      </p>
                      <div className="pr-employee-details">
                        <span><i className="fas fa-id-card"></i> {employee.matricule}</span>
                        <span><i className="fas fa-file-contract"></i> {employee.typeContrat}</span>
                        <span><i className="fas fa-money-bill"></i> {formatCurrency(employee.salaireBase)}</span>
                      </div>
                    </div>
                    <div className="pr-employee-check">
                      <i className="fas fa-check"></i>
                    </div>
                  </div>
                ))}
              </div>

              {filteredEmployees.length === 0 && (
                <div className="pr-empty-state">
                  <i className="fas fa-users"></i>
                  <h3>Aucun employé trouvé</h3>
                  <p>
                    {searchTerm
                      ? `Aucun résultat pour "${searchTerm}"`
                      : 'Créez d\'abord un employé dans l\'espace employés'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

// Section Période
const PeriodSection = ({ periode, onPeriodeChange, errors }) => {
  return (
    <div className="pr-section">
      <div className="pr-section-header">
        <h2>Période de paie</h2>
        <p>Définissez la période concernée par ce bulletin</p>
      </div>

      <div className="pr-period-grid">
        <div className="pr-form-group">
          <label>Date de début *</label>
          <input
            type="date"
            value={periode.du}
            onChange={(e) => onPeriodeChange({ ...periode, du: e.target.value })}
            className={errors?.periode ? 'error' : ''}
          />
          {errors?.periode && <span className="pr-field-error">{errors.periode}</span>}
        </div>

        <div className="pr-form-group">
          <label>Date de fin *</label>
          <input
            type="date"
            value={periode.au}
            onChange={(e) => onPeriodeChange({ ...periode, au: e.target.value })}
            className={errors?.periode ? 'error' : ''}
          />
        </div>
      </div>

      <div className="pr-period-info">
        <div className="pr-period-card">
          <i className="fas fa-calendar-week"></i>
          <div>
            <h4>Période sélectionnée</h4>
            <p>Du {periode.du} au {periode.au}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Section Rémunération
const RemunerationSection = ({ remuneration, primes, onRemunerationChange, onPrimesChange }) => {
  return (
    <div className="pr-section">
      <div className="pr-section-header">
        <h2>Rémunération et primes</h2>
        <p>Configurez les éléments de rémunération et les primes</p>
      </div>

      <div className="pr-remuneration-grid">
        <div className="pr-form-group">
          <label>Salaire de base</label>
          <input
            type="number"
            value={remuneration.salaireBase}
            onChange={(e) => onRemunerationChange({ ...remuneration, salaireBase: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="pr-form-group">
          <label>Sursalaire</label>
          <input
            type="number"
            value={remuneration.sursalaire}
            onChange={(e) => onRemunerationChange({ ...remuneration, sursalaire: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="pr-form-group">
          <label>Indemnité déplacement</label>
          <input
            type="number"
            value={remuneration.indemniteDeplacement}
            onChange={(e) => onRemunerationChange({ ...remuneration, indemniteDeplacement: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="pr-form-group">
          <label>Autres indemnités</label>
          <input
            type="number"
            value={remuneration.autresIndemnites}
            onChange={(e) => onRemunerationChange({ ...remuneration, autresIndemnites: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="pr-form-group">
          <label>Avantages en nature</label>
          <input
            type="number"
            value={remuneration.avantagesNature}
            onChange={(e) => onRemunerationChange({ ...remuneration, avantagesNature: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="pr-section-subheader">
        <h3>Primes et indemnités</h3>
      </div>

      <div className="pr-primes-grid">
        <div className="pr-form-group">
          <label>Transport</label>
          <input
            type="number"
            value={primes.transport}
            onChange={(e) => onPrimesChange({ ...primes, transport: e.target.value })}
            placeholder="26000"
          />
        </div>

        <div className="pr-form-group">
          <label>Panier</label>
          <input
            type="number"
            value={primes.panier}
            onChange={(e) => onPrimesChange({ ...primes, panier: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="pr-form-group">
          <label>Repas</label>
          <input
            type="number"
            value={primes.repas}
            onChange={(e) => onPrimesChange({ ...primes, repas: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="pr-form-group">
          <label>Ancienneté</label>
          <input
            type="number"
            value={primes.anciennete}
            onChange={(e) => onPrimesChange({ ...primes, anciennete: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="pr-form-group">
          <label>Responsabilité</label>
          <input
            type="number"
            value={primes.responsabilite}
            onChange={(e) => onPrimesChange({ ...primes, responsabilite: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="pr-form-group">
          <label>Autres primes</label>
          <input
            type="number"
            value={primes.autresPrimes}
            onChange={(e) => onPrimesChange({ ...primes, autresPrimes: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
};

// Section Retenues
const DeductionsSection = ({ retenues, onRetenuesChange, calculations }) => {
  return (
    <div className="pr-section">
      <div className="pr-section-header">
        <h2>Retenues et cotisations</h2>
        <p>Configurez les retenues sur salaire et les cotisations sociales</p>
      </div>

      <div className="pr-deductions-grid">
        <div className="pr-form-group">
          <label>Retenue salaire</label>
          <input
            type="number"
            value={retenues.retenueSalaire}
            onChange={(e) => onRetenuesChange({ ...retenues, retenueSalaire: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="pr-form-group">
          <label>Qpart I.P.M</label>
          <input
            type="number"
            value={retenues.qpartipm}
            onChange={(e) => onRetenuesChange({ ...retenues, qpartipm: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="pr-form-group">
          <label>Avances</label>
          <input
            type="number"
            value={retenues.avances}
            onChange={(e) => onRetenuesChange({ ...retenues, avances: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="pr-form-group">
          <label>TRIMF</label>
          <input
            type="number"
            value={retenues.trimf}
            onChange={(e) => onRetenuesChange({ ...retenues, trimf: e.target.value })}
            placeholder="300"
          />
        </div>

        <div className="pr-form-group">
          <label>CFCE</label>
          <input
            type="number"
            value={retenues.cfce}
            onChange={(e) => onRetenuesChange({ ...retenues, cfce: e.target.value })}
            placeholder="0"
            readOnly
          />
        </div>

        <div className="pr-form-group">
          <label>IR</label>
          <input
            type="number"
            value={retenues.ir}
            onChange={(e) => onRetenuesChange({ ...retenues, ir: e.target.value })}
            placeholder="0"
            readOnly
          />
        </div>
      </div>

      {/* Aperçu des cotisations calculées */}
      <div className="pr-calculations-preview">
        <h4>📊 Cotisations calculées automatiquement</h4>
        <div className="pr-calculations-grid">
          <div className="pr-calculation-item">
            <span>IPRES RG (5.6%):</span>
            <strong>{formatCurrency(calculations.detailsCotisations.ipresRG)}</strong>
          </div>
          <div className="pr-calculation-item">
            <span>IPRES RC (2.4%):</span>
            <strong>{formatCurrency(calculations.detailsCotisations.ipresRC)}</strong>
          </div>
          <div className="pr-calculation-item">
            <span>CFCE (3%):</span>
            <strong>{formatCurrency(calculations.detailsCotisations.cfce)}</strong>
          </div>
          <div className="pr-calculation-item">
            <span>IR (selon barème):</span>
            <strong>{formatCurrency(calculations.detailsCotisations.ir)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

// Section Synthèse
const SummarySection = ({ calculations, selectedEmployee }) => {
  if (!selectedEmployee) {
    return (
      <div className="pr-section">
        <div className="pr-empty-state">
          <i className="fas fa-chart-bar"></i>
          <h3>Sélectionnez un employé</h3>
          <p>Veuillez sélectionner un employé pour voir le récapitulatif</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pr-section">
      <div className="pr-section-header">
        <h2>Synthèse de la paie</h2>
        <p>Récapitulatif complet des calculs de paie</p>
      </div>

      <div className="pr-summary-grid">
        <div className="pr-summary-card">
          <h3>Rémunération brute</h3>
          <div className="pr-summary-amount primary">
            {formatCurrency(calculations.brutSocial)}
          </div>
          <div className="pr-summary-details">
            <span>Salaire base: {formatCurrency(calculations.brutSocial)}</span>
            <span>Brut fiscal: {formatCurrency(calculations.brutFiscal)}</span>
          </div>
        </div>

        <div className="pr-summary-card">
          <h3>Cotisations salariales</h3>
          <div className="pr-summary-amount secondary">
            {formatCurrency(calculations.cotisationsSalariales)}
          </div>
          <div className="pr-summary-details">
            <span>IPRES RG: {formatCurrency(calculations.detailsCotisations.ipresRG)}</span>
            <span>IPRES RC: {formatCurrency(calculations.detailsCotisations.ipresRC)}</span>
          </div>
        </div>

        <div className="pr-summary-card">
          <h3>Retenues et impôts</h3>
          <div className="pr-summary-amount warning">
            {formatCurrency(calculations.totalfiscales)}
          </div>
          <div className="pr-summary-details">
            <span>TRIMF: {formatCurrency(calculations.detailsCotisations.trimf)}</span>
            <span>CFCE: {formatCurrency(calculations.detailsCotisations.cfce)}</span>
            <span>IR: {formatCurrency(calculations.detailsCotisations.ir)}</span>
          </div>
        </div>

        <div className="pr-summary-card highlight">
          <h3>Salaire net à payer</h3>
          <div className="pr-summary-amount success">
            {formatCurrency(calculations.salaireNetAPayer)}
          </div>
          <div className="pr-summary-details">
            <span>Rémunération nette: {formatCurrency(calculations.salaireNet)}</span>
            <span>Total primes: {formatCurrency(calculations.totalPrimes)}</span>
          </div>
        </div>
      </div>

      {/* Détails complets */}
      <div className="pr-detailed-summary">
        <h3>Détails des calculs</h3>
        <div className="pr-details-grid">
          <div className="pr-details-column">
            <h4>Gains</h4>
            <div className="pr-details-item">
              <span>Brut social:</span>
              <span>{formatCurrency(calculations.brutSocial)}</span>
            </div>
            <div className="pr-details-item">
              <span>Brut fiscal:</span>
              <span>{formatCurrency(calculations.brutFiscal)}</span>
            </div>
            <div className="pr-details-item">
              <span>Total primes:</span>
              <span>{formatCurrency(calculations.totalPrimes)}</span>
            </div>
          </div>

          <div className="pr-details-column">
            <h4>Retenues</h4>
            <div className="pr-details-item">
              <span>Cotisations salariales:</span>
              <span>{formatCurrency(calculations.cotisationsSalariales)}</span>
            </div>
            <div className="pr-details-item">
              <span>IR:</span>
              <span>{formatCurrency(calculations.detailsCotisations.ir)}</span>
            </div>
            <div className="pr-details-item">
              <span>TRIMF + CFCE:</span>
              <span>{formatCurrency(calculations.totalfiscales)}</span>
            </div>
          </div>

          <div className="pr-details-column">
            <h4>Totaux</h4>
            <div className="pr-details-item total">
              <span>Salaire net à payer:</span>
              <span>{formatCurrency(calculations.salaireNetAPayer)}</span>
            </div>
            <div className="pr-details-item">
              <span>Cotisations employeur:</span>
              <span>{formatCurrency(calculations.cotisationsEmployeur)}</span>
            </div>
            <div className="pr-details-item">
              <span>Coût total employeur:</span>
              <span>{formatCurrency(calculations.brutSocial + calculations.cotisationsEmployeur)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Aperçu PDF
const PreviewPanel = ({ payroll, calculations, selectedEmployee }) => {
  if (!selectedEmployee) {
    return (
      <div className="pr-preview-panel">
        <div className="pr-preview-placeholder">
          <i className="fas fa-file-invoice"></i>
          <h3>Aperçu du bulletin</h3>
          <p>Sélectionnez un employé pour voir l'aperçu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pr-preview-panel">
      <div className="pr-preview-header">
        <h3>Aperçu du bulletin de paie</h3>
        <span className="pr-preview-badge">
          {payroll.numero}
        </span>
      </div>

      <PDFPreviewDynamic
        width="100%"
        height="800px"
        style={{
          marginTop: '1rem',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)'
        }}
        document={
          <PayrollPDF
            employee={selectedEmployee}
            formData={payroll}
            calculations={calculations}
            companyInfo={{
              name: "LEADER INTERIM & SERVICES",
              address: "Ouest Foire, Parcelle N°1, Route de l'aéroport, Dakar",
              phone: "33-820-88-46 / 78-434-30-16",
              email: "infos@leaderinterime.com",
              rc: "SN 2015 B24288",
              ninea: "0057262212 A2"
            }}
          />
        }
      />
    </div>
  );
};

// Composant principal COMPLET
const PayrollEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [payroll, setPayroll] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState('employee');
  const [showPreview, setShowPreview] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [showEmployeeInfo, setShowEmployeeInfo] = useState(true);
  const [lastSavedCalculations, setLastSavedCalculations] = useState(null);
  const [isDuplicating, setIsDuplicating] = useState(location.state?.isDuplicate || false);
  const [duplicationComplete, setDuplicationComplete] = useState(false);

  // Fonction de notification
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // Fonctions de calcul (conservées de votre code original)
  const calculateIR = useCallback((brutFiscal, nbreofParts) => {
    const revenu = brutFiscal / nbreofParts;
    let ir = 0;

    if (revenu > 500000) {
      ir = revenu * 0.40 - 118750;
    } else if (revenu > 400000) {
      ir = revenu * 0.35 - 88750;
    } else if (revenu > 300000) {
      ir = revenu * 0.35 - 78750;
    } else if (revenu > 200000) {
      ir = revenu * 0.30 - 48750;
    } else if (revenu > 150000) {
      ir = revenu * 0.25 - 28750;
    } else if (revenu > 110000) {
      ir = revenu * 0.20 - 18750;
    } else if (revenu > 80000) {
      ir = revenu * 0.15 - 11000;
    } else if (revenu > 60000) {
      ir = revenu * 0.10 - 6000;
    } else if (revenu > 50000) {
      ir = revenu * 0.05 - 2500;
    } else {
      ir = 0;
    }

    ir = Math.max(0, ir);
    return Math.round(ir * nbreofParts);
  }, []);

  const calculateTRIMF = useCallback((brutFiscal) => {
    const brut = parseFloat(brutFiscal) || 0;
    if (brut <= 85000) return 300;
    if (brut <= 133000) return 400;
    if (brut < 1000000) return 500;
    return 1500;
  }, []);

  // Calculs (adaptés de votre code)
  const calculations = useMemo(() => {
    if (!payroll) return {
      brutSocial: 0,
      brutFiscal: 0,
      cotisationsEmp: 0,
      cotisationsEmployeur: 0,
      cotisationsSalariales: 0,
      cotisationsPatronales: 0,
      salaireNet: 0,
      totalPrimes: 0,
      salaireNetAPayer: 0,
      totalRetenuesPris: 0,
      totalRetenues: 0,
      tooqpartipm: 0,
      totalfiscales: 0,
      detailsCotisations: {
        ipresRG: 0,
        ipresRC: 0,
        ipresRGP: 0,
        ipresRCP: 0,
        allocationFamiliale: 0,
        accidentTravail: 0,
        trimf: 0,
        qpartipm: 0,
        cfce: 0,
        nbreofParts: 1,
        ir: 0
      }
    };

    const salaireBase = parseFloat(payroll.remuneration?.salaireBase) || 0;
    const sursalaire = parseFloat(payroll.remuneration?.sursalaire) || 0;
    const indemniteDeplacement = parseFloat(payroll.remuneration?.indemniteDeplacement) || 0;
    const autresIndemnites = parseFloat(payroll.remuneration?.autresIndemnites) || 0;
    const avantagesNature = parseFloat(payroll.remuneration?.avantagesNature) || 0;

    const brutSocial = salaireBase + sursalaire + indemniteDeplacement + autresIndemnites;
    const brutFiscal = brutSocial + avantagesNature;

    // Cotisations
    const ipresRG = brutSocial * 0.056;
    const ipresRC = 0;
    const cfce = brutFiscal * 0.03;

    // Cotisations patronales
    const ipresRGP = brutSocial * 0.084;
    const ipresRCP = 0;
    const allocationFamiliale = 63000 * 0.07;
    const accidentTravail = 63000 * 0.01;

    // IR
    const selectedEmployee = employees.find(emp => emp.id === payroll.employeeId) || {};
    const nbreofParts = selectedEmployee.nbreofParts || 1;
    const ir = calculateIR(brutFiscal, nbreofParts);

    // Primes
    const transport = parseFloat(payroll.primes?.transport) || 0;
    const panier = parseFloat(payroll.primes?.panier) || 0;
    const repas = parseFloat(payroll.primes?.repas) || 0;
    const anciennete = parseFloat(payroll.primes?.anciennete) || 0;
    const responsabilite = parseFloat(payroll.primes?.responsabilite) || 0;
    const autresPrimes = parseFloat(payroll.primes?.autresPrimes) || 0;
    const totalPrimes = transport + panier + repas + anciennete + responsabilite + autresPrimes;

    // Retenues
    const retenueSalaire = parseFloat(payroll.retenues?.retenueSalaire) || 0;
    const qpartipm = parseFloat(payroll.retenues?.qpartipm) || 0;
    const avances = parseFloat(payroll.retenues?.avances) || 0;
    const trimf = calculateTRIMF(brutFiscal);

    const totalRetenuesPris = retenueSalaire + qpartipm + avances;
    const totalRetenues = retenueSalaire + qpartipm + avances + ipresRG + ipresRC + trimf + ir;
    
    const remunerationNette = brutSocial - totalRetenuesPris;
    const salaireNetAPayer = remunerationNette + totalPrimes;

    const totalCotisationsEmp = ipresRG + ipresRC + trimf + ir;
    const totalCotisationsEmployeur = ipresRGP + ipresRCP + allocationFamiliale + accidentTravail + qpartipm + cfce;
    const totalCotisationsSalariales = ipresRG + ipresRC;
    const totalCotisationsPatronales = ipresRGP + ipresRCP;
    const tooqpartipm = qpartipm * 2;
    const totalfiscales = trimf + cfce + ir;

    return {
      brutSocial,
      brutFiscal,
      cotisationsEmp: totalCotisationsEmp,
      cotisationsEmployeur: totalCotisationsEmployeur,
      cotisationsSalariales: totalCotisationsSalariales,
      cotisationsPatronales: totalCotisationsPatronales,
      salaireNet: remunerationNette,
      totalPrimes,
      salaireNetAPayer,
      totalRetenuesPris,
      totalRetenues,
      tooqpartipm,
      totalfiscales,
      detailsCotisations: {
        ipresRG,
        ipresRC,
        ipresRGP,
        ipresRCP,
        allocationFamiliale,
        accidentTravail,
        trimf,
        qpartipm,
        cfce,
        nbreofParts,
        ir
      }
    };
  }, [payroll, employees, calculateIR, calculateTRIMF]);

  // Mettre à jour les retenues basées sur les calculs
  useEffect(() => {
    if (!payroll || JSON.stringify(calculations) === JSON.stringify(lastSavedCalculations)) {
      return;
    }

    const trimfValue = calculateTRIMF(calculations.brutFiscal);

    setPayroll(prev => ({
      ...prev,
      retenues: {
        ...prev.retenues,
        trimf: trimfValue.toString(),
        cfce: calculations.detailsCotisations.cfce.toFixed(0) || '0',
        ir: calculations.detailsCotisations.ir.toFixed(0) || '0'
      }
    }));

    setLastSavedCalculations(calculations);
  }, [calculations, calculateTRIMF, lastSavedCalculations, payroll]);

  // Chargement initial des données
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        // Charger les employés
        const employeesData = await loadEmployees();
        setEmployees(employeesData);

        let payrollData;
        if (location.state && location.state.payroll) {
          const existingPayroll = location.state.payroll;
          const isDuplicate = location.state.isDuplicate || false;

          setIsDuplicating(isDuplicate);

          // Transformer les données Firestore
          payrollData = transformPayrollData(existingPayroll);

          // Pour la duplication, générer un nouveau numéro
          if (isDuplicate) {
            const numero = await payrollService.generatePayrollNumber(currentUser.companyId);
            payrollData.numero = numero;
          }

          if (!isDuplicate) {
            setIsSaved(true);
          }
        } else {
          payrollData = await createNewPayroll();
          setIsSaved(false);
        }

        setPayroll(payrollData);

      } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        setPayroll(await createNewPayroll());
        setIsSaved(false);
        showNotification("Erreur lors de l'initialisation des données", "error");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.companyId) {
      initializeData();
    } else {
      setLoading(false);
    }
  }, [location.state, currentUser?.companyId]);

  // Chargement des employés
  const loadEmployees = async () => {
    try {
      if (!currentUser?.companyId) {
        return [];
      }

      const employeesRef = collection(db, `companies/${currentUser.companyId}/employees`);
      const q = query(employeesRef);
      const querySnapshot = await getDocs(q);

      const employeesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || null
      }));

      return employeesData;

    } catch (error) {
      console.error('❌ Erreur chargement employés:', error);
      showNotification("Erreur lors du chargement des employés", "error");
      return [];
    }
  };

  const transformPayrollData = (firebaseData) => {
    const convertFirestoreDate = (date) => {
      if (!date) return new Date().toISOString().split('T')[0];
      return date.toDate ? date.toDate().toISOString().split('T')[0] : date;
    };

    return {
      id: firebaseData.id,
      numero: firebaseData.numero || '',
      employeeId: firebaseData.employeeId,
      periode: {
        du: convertFirestoreDate(firebaseData.periode?.du),
        au: convertFirestoreDate(firebaseData.periode?.au)
      },
      remuneration: {
        tauxHoraire: firebaseData.remuneration?.tauxHoraire?.toString() || '0',
        salaireBase: firebaseData.remuneration?.salaireBase?.toString() || '0',
        sursalaire: firebaseData.remuneration?.sursalaire?.toString() || '0',
        indemniteDeplacement: firebaseData.remuneration?.indemniteDeplacement?.toString() || '0',
        autresIndemnites: firebaseData.remuneration?.autresIndemnites?.toString() || '0',
        avantagesNature: firebaseData.remuneration?.avantagesNature?.toString() || '0'
      },
      primes: {
        transport: firebaseData.primes?.transport?.toString() || '26000',
        panier: firebaseData.primes?.panier?.toString() || '0',
        repas: firebaseData.primes?.repas?.toString() || '0',
        anciennete: firebaseData.primes?.anciennete?.toString() || '0',
        responsabilite: firebaseData.primes?.responsabilite?.toString() || '0',
        autresPrimes: firebaseData.primes?.autresPrimes?.toString() || '0'
      },
      retenues: {
        retenueSalaire: firebaseData.retenues?.retenueSalaire?.toString() || '0',
        qpartipm: firebaseData.retenues?.qpartipm?.toString() || '0',
        avances: firebaseData.retenues?.avances?.toString() || '0',
        trimf: firebaseData.retenues?.trimf?.toString() || '300',
        cfce: firebaseData.retenues?.cfce?.toString() || '0',
        ir: firebaseData.retenues?.ir?.toString() || '0'
      },
      status: firebaseData.statut || 'draft'
    };
  };

  const createNewPayroll = async () => {
    try {
      const numero = await payrollService.generatePayrollNumber(currentUser.companyId);

      return {
        type: 'payroll',
        numero: numero,
        employeeId: null,
        periode: getCurrentMonthDateRange(),
        remuneration: {
          tauxHoraire: '0',
          salaireBase: '0',
          sursalaire: '0',
          indemniteDeplacement: '0',
          autresIndemnites: '0',
          avantagesNature: '0'
        },
        primes: {
          transport: '26000',
          panier: '0',
          repas: '0',
          anciennete: '0',
          responsabilite: '0',
          autresPrimes: '0'
        },
        retenues: {
          retenueSalaire: '0',
          qpartipm: '0',
          avances: '0',
          trimf: '300',
          cfce: '0',
          ir: '0'
        },
        status: 'draft'
      };
    } catch (error) {
      console.error('Erreur génération numéro:', error);
      const now = new Date();
      const year = now.getFullYear();
      return {
        type: 'payroll',
        numero: `PAY-${year}-001`,
        employeeId: null,
        periode: getCurrentMonthDateRange(),
        remuneration: {
          tauxHoraire: '0',
          salaireBase: '0',
          sursalaire: '0',
          indemniteDeplacement: '0',
          autresIndemnites: '0',
          avantagesNature: '0'
        },
        primes: {
          transport: '26000',
          panier: '0',
          repas: '0',
          anciennete: '0',
          responsabilite: '0',
          autresPrimes: '0'
        },
        retenues: {
          retenueSalaire: '0',
          qpartipm: '0',
          avances: '0',
          trimf: '300',
          cfce: '0',
          ir: '0'
        },
        status: 'draft'
      };
    }
  };

  // Mettre à jour le salaire de base quand l'employé est sélectionné
  useEffect(() => {
    if (!payroll?.employeeId) return;

    // Ne pas exécuter cette mise à jour si on est en mode édition ou duplication
    const isEditing = location.state?.payroll?.id && payroll.employeeId === location.state.payroll.employeeId;
    const isDuplicating = location.state?.isDuplicate;

    if (isEditing || isDuplicating) {
      return;
    }

    const selectedEmployee = employees.find(emp => emp.id === payroll.employeeId);
    if (selectedEmployee) {
      setPayroll(prev => ({
        ...prev,
        remuneration: {
          ...prev.remuneration,
          salaireBase: selectedEmployee.salaireBase?.toString() || '0',
          tauxHoraire: ((selectedEmployee.salaireBase || 0) / 173.33).toFixed(2),
          indemniteDeplacement: selectedEmployee.indemniteDeplacement?.toString() || '0',
          autresIndemnites: selectedEmployee.autresIndemnites?.toString() || '0'
        },
        primes: {
          transport: selectedEmployee.indemniteTransport?.toString() || '26000',
          panier: selectedEmployee.primePanier?.toString() || '0',
          repas: selectedEmployee.primeRepas?.toString() || '0',
          anciennete: selectedEmployee.primeAnciennete?.toString() || '0',
          responsabilite: selectedEmployee.indemniteResponsabilite?.toString() || '0',
          autresPrimes: selectedEmployee.autresPrimes?.toString() || '0'
        },
        retenues: {
          ...prev.retenues,
          avances: selectedEmployee.avances?.toString() || '0',
          retenueSalaire: selectedEmployee.retenueSalaire?.toString() || '0',
        }
      }));
    }
  }, [payroll?.employeeId, employees, location.state?.payroll, location.state?.isDuplicate]);

  // Gestionnaires d'événements
  const handleEmployeeChange = (employee) => {
    setPayroll(prev => ({
      ...prev,
      employeeId: employee ? employee.id : null
    }));
    setErrors(prev => ({ ...prev, employee: null }));
  };

  // Validation
  const validatePayroll = () => {
    const newErrors = {};

    if (!payroll?.employeeId) {
      newErrors.employee = 'Employé requis';
      setActiveSection('employee');
    }

    if (!payroll?.periode?.du || !payroll?.periode?.au) {
      newErrors.periode = 'Période requise';
      setActiveSection('period');
    }

    if (!payroll?.numero) {
      newErrors.numero = 'Numéro de bulletin requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sauvegarde
  const handleSave = async () => {
    if (!validatePayroll()) {
      showNotification("Veuillez corriger les erreurs avant de sauvegarder", "warning");
      return;
    }

    const isEditing = !!location.state?.payroll?.id && !isDuplicating;

    if (isSaved && !isEditing && !isDuplicating) {
      showNotification("Ce bulletin est déjà enregistré. Créez un nouveau bulletin si nécessaire.", "warning");
      return;
    }

    try {
      setSaving(true);
      const selectedEmployee = employees.find(emp => emp.id === payroll.employeeId);

      if (!selectedEmployee) {
        showNotification("Employé non trouvé", "error");
        return;
      }

      let payrollNum = payroll.numero;
      if (isDuplicating) {
        payrollNum = await payrollService.generatePayrollNumber(currentUser.companyId);
        setPayroll(prev => ({ ...prev, numero: payrollNum }));
      }

      // Préparer les données avec votre service existant
      const payrollData = payrollService.preparePayrollData(
        { ...payroll, numero: payrollNum },
        calculations,
        selectedEmployee
      );

      let result;
      if (isEditing) {
        result = await payrollService.updatePayroll(currentUser.companyId, location.state.payroll.id, payrollData);
      } else {
        result = await payrollService.addPayroll(currentUser.companyId, currentUser.uid, payrollData);
      }

      if (result.success) {
        if (!isDuplicating) {
          setIsSaved(true);
        } else {
          setDuplicationComplete(true);
          setIsSaved(true);
        }

        showNotification(result.message, "success");
      } else {
        showNotification(result.message, "error");
      }
    } catch (error) {
      console.error("Erreur d'enregistrement :", error);
      showNotification("Erreur lors de l'enregistrement", "error");
    } finally {
      setSaving(false);
    }
  };

  // Récupérer l'employé sélectionné
  const selectedEmployee = payroll?.employeeId 
    ? employees.find(emp => emp.id === payroll.employeeId) 
    : null;

  if (loading) {
    return <LoadingState message="Chargement de l'éditeur de bulletins..." />;
  }

  if (!payroll) {
    return (
      <div className="pr-loading-container">
        <div className="pr-loading-spinner">❌</div>
        <div>Erreur de chargement</div>
      </div>
    );
  }

  return (
    <div className="pr-payroll-editor">
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ show: false, message: '', type: '' })}
        />
      )}

      <PayrollHeader
        payroll={payroll}
        onSave={handleSave}
        saving={saving}
        isSaved={isSaved}
        showPreview={showPreview}
        onTogglePreview={setShowPreview}
        onBack={() => navigate(-1)}
        pdfData={
          <PayrollPDF
            employee={selectedEmployee}
            formData={payroll}
            calculations={calculations}
            companyInfo={{
              name: "LEADER INTERIM & SERVICES",
              address: "Ouest Foire, Parcelle N°1, Route de l'aéroport, Dakar",
              phone: "33-820-88-46 / 78-434-30-16",
              email: "infos@leaderinterime.com",
              rc: "SN 2015 B24288",
              ninea: "0057262212 A2"
            }}
          />
        }
        selectedEmployee={selectedEmployee}
      />

      <div className="pr-main-layout">
        <HorizontalNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          payroll={payroll}
        />

        <div className="pr-content-area">
          <div className="pr-editor-content">
            {activeSection === 'employee' && (
              <EmployeeSection
                employees={employees}
                selectedEmployee={selectedEmployee}
                onEmployeeChange={handleEmployeeChange}
                error={errors.employee}
                showEmployeeInfo={showEmployeeInfo}
                onToggleEmployeeInfo={() => setShowEmployeeInfo(!showEmployeeInfo)}
              />
            )}

            {activeSection === 'period' && (
              <PeriodSection
                periode={payroll.periode}
                onPeriodeChange={(newPeriode) => setPayroll({ ...payroll, periode: newPeriode })}
                errors={errors}
              />
            )}

            {activeSection === 'remuneration' && (
              <RemunerationSection
                remuneration={payroll.remuneration}
                primes={payroll.primes}
                onRemunerationChange={(newRemuneration) => setPayroll({ ...payroll, remuneration: newRemuneration })}
                onPrimesChange={(newPrimes) => setPayroll({ ...payroll, primes: newPrimes })}
              />
            )}

            {activeSection === 'deductions' && (
              <DeductionsSection
                retenues={payroll.retenues}
                onRetenuesChange={(newRetenues) => setPayroll({ ...payroll, retenues: newRetenues })}
                calculations={calculations}
              />
            )}

            {activeSection === 'summary' && (
              <SummarySection
                calculations={calculations}
                selectedEmployee={selectedEmployee}
              />
            )}
          </div>

          {showPreview && (
            <PreviewPanel
              payroll={payroll}
              calculations={calculations}
              selectedEmployee={selectedEmployee}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollEditor;