// EmployeeDetailsModal.js
import React, { useMemo } from "react";
import {
  FaUser, FaCalendarAlt, FaIdCard, FaBuilding, FaMoneyBillWave,
  FaCheckCircle, FaPercentage, FaChartLine, FaEnvelope, FaPhone,
  FaMapMarkerAlt, FaBriefcase, FaUsers, FaFileInvoiceDollar,
  FaPlane, FaUtensils, FaCar, FaShieldAlt, FaPlaneArrival,
  FaClipboardList, FaClock, FaChartBar, FaAward, FaStar,
  FaRegClock, FaHandHoldingUsd, FaUserCheck, FaChartPie, FaTimes,
  FaCalculator, FaReceipt
} from "react-icons/fa";
import { Modal, Tag, Progress, Divider, Row, Col, Tooltip } from "antd";

// Helper pour formater les montants
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return "0 FCFA";
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

// Helper pour formater les dates
const formatDate = (date) => {
  if (!date) return "Non définie";
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Composant pour afficher une métrique avec icône
const MetricCard = ({ icon, label, value, color, suffix = "", tooltip = "" }) => (
  <Tooltip title={tooltip}>
    <div className="employee-metric-card" style={{ borderLeftColor: color }}>
      <div className="employee-metric-icon" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="employee-metric-content">
        <span className="employee-metric-label">{label}</span>
        <span className="employee-metric-value">{value}{suffix}</span>
      </div>
    </div>
  </Tooltip>
);

// Composant pour la section info
const InfoSection = ({ title, icon, children, color }) => (
  <div className="employee-info-section">
    <div className="employee-section-header" style={{ borderBottomColor: color }}>
      <div className="employee-section-icon" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <h3 className="employee-section-title">{title}</h3>
    </div>
    <div className="employee-section-content">
      {children}
    </div>
  </div>
);

// Composant pour un champ d'information
const InfoField = ({ label, value, icon, color = "#4361ee" }) => (
  <div className="employee-info-field">
    <div className="employee-info-field-icon" style={{ color, background: `${color}10` }}>
      {icon}
    </div>
    <div className="employee-info-field-content">
      <span className="employee-info-field-label">{label}</span>
      <span className="employee-info-field-value">{value || "Non renseigné"}</span>
    </div>
  </div>
);

export const EmployeeDetailsModal = ({ isVisible, onCancel, employee }) => {
  // Calcul des congés
  const congesStats = useMemo(() => {
    if (!employee) return { accumulated: 0, currentYear: 0, used: 0, remaining: 0, totalUsed: 0 };

    const dateEmbauche = employee.dateEmbauche ? new Date(employee.dateEmbauche) : null;
    const aujourdHui = new Date();
    let accumulated = employee.joursConges || 0;
    let currentYear = 0;
    let totalUsed = employee.joursCongesUtilises || 0;
    
    if (dateEmbauche) {
      const moisTotaux = (aujourdHui.getFullYear() - dateEmbauche.getFullYear()) * 12 +
        (aujourdHui.getMonth() - dateEmbauche.getMonth());
      accumulated = Math.max(0, moisTotaux * 2.5);
      
      const debutAnnee = new Date(aujourdHui.getFullYear(), 0, 1);
      const dateDebutPeriode = dateEmbauche > debutAnnee ? dateEmbauche : debutAnnee;
      if (dateDebutPeriode <= aujourdHui) {
        const moisEcoules = (aujourdHui.getFullYear() - dateDebutPeriode.getFullYear()) * 12 +
          (aujourdHui.getMonth() - dateDebutPeriode.getMonth());
        currentYear = Math.max(0, moisEcoules * 2.5);
      }
    }
    
    const used = employee.joursCongesUtilisesAnnee || 0;
    const remaining = Math.max(0, currentYear - used);
    
    return { accumulated: Math.floor(accumulated), currentYear: Math.floor(currentYear), used, remaining, totalUsed };
  }, [employee]);

  // Calcul du salaire net avec IR
  const salaireDetails = useMemo(() => {
    if (!employee) return { brut: 0, netAvantImpots: 0, ir: 0, netApresImpots: 0 };
    
    const salaireBase = parseFloat(employee.salaireBase || 0);
    const sursalaire = parseFloat(employee.sursalaire || 0);
    const ipm = parseFloat(employee.ipm || 0);
    const ir = parseFloat(employee.ir || 0);
    const transport = parseFloat(employee.indemniteTransport || 0);
    const panier = parseFloat(employee.primePanier || 0);
    const responsabilite = parseFloat(employee.indemniteResponsabilite || 0);
    const deplacement = parseFloat(employee.indemniteDeplacement || 0);
    
    const brut = salaireBase + sursalaire;
    const netAvantImpots = brut - ipm + transport + panier + responsabilite + deplacement;
    const netApresImpots = Math.max(0, netAvantImpots - ir);
    
    return { brut, ipm, ir, netAvantImpots, netApresImpots };
  }, [employee]);

  // Calcul du pourcentage de congés utilisés
  const congesPercentage = useMemo(() => {
    if (congesStats.currentYear === 0) return 0;
    return Math.min(100, Math.round((congesStats.used / congesStats.currentYear) * 100));
  }, [congesStats]);

  if (!employee) return null;

  const contratColors = {
    CDI: "#10b981",
    CDD: "#f59e0b",
    CTT: "#8b5cf6",
    Stage: "#3b82f6",
    Freelance: "#ec4899"
  };

  const contratColor = contratColors[employee.typeContrat] || "#64748b";

  return (
    <Modal
      open={isVisible}
      onCancel={onCancel}
      footer={null}
      width={950}
      className="employee-details-modal premium"
      closeIcon={<FaTimes />}
      style={{ top: 20 }}
    >
      {/* En-tête avec gradient */}
      <div className="employee-modal-header-premium">
        <div className="employee-modal-header-bg" />
        <div className="employee-modal-avatar">
          <span>
            {employee.prenom?.charAt(0).toUpperCase()}
            {employee.nom?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="employee-modal-header-info">
          <h2 className="employee-modal-name">{employee.prenom} {employee.nom}</h2>
          <div className="employee-modal-badges">
            <Tag color={contratColor} className="employee-type-tag">
              <FaCheckCircle /> {employee.typeContrat || "CDI"}
            </Tag>
            <Tag color="blue" className="employee-matricule-tag">
              <FaIdCard /> Matricule: {employee.matricule || "N/A"}
            </Tag>
          </div>
          <p className="employee-modal-position">
            <FaBriefcase /> {employee.poste || "Poste non défini"}
            {employee.departement && ` · ${employee.departement}`}
          </p>
        </div>
      </div>

      <div className="employee-modal-content">
        {/* Métriques clés */}
        <div className="employee-metrics-grid">
          <MetricCard 
            icon={<FaMoneyBillWave />} 
            label="Salaire brut" 
            value={formatAmount(salaireDetails.brut)} 
            color="#10b981"
            tooltip="Salaire brut mensuel (base + sursalaire)"
          />
          <MetricCard 
            icon={<FaChartLine />} 
            label="Salaire net" 
            value={formatAmount(salaireDetails.netApresImpots)} 
            color="#4361ee"
            tooltip="Salaire net après IPM, primes et IR"
          />
          <MetricCard 
            icon={<FaCalendarAlt />} 
            label="Ancienneté" 
            value={employee.dateEmbauche ? 
              `${Math.floor((new Date() - new Date(employee.dateEmbauche)) / (1000 * 60 * 60 * 24 * 365.25))} ans` : 
              "N/A"} 
            color="#f59e0b"
            tooltip="Depuis la date d'embauche"
          />
          <MetricCard 
            icon={<FaStar />} 
            label="Catégorie" 
            value={employee.categorie || "Non définie"} 
            color="#8b5cf6"
            tooltip="Catégorie professionnelle"
          />
        </div>

        <Divider style={{ margin: "16px 0" }} />

        {/* Grille d'informations */}
        <Row gutter={[24, 24]}>
          {/* Colonne gauche - Informations personnelles */}
          <Col xs={24} md={12}>
            <InfoSection title="Informations personnelles" icon={<FaUser />} color="#4361ee">
              <InfoField label="Nom complet" value={`${employee.prenom} ${employee.nom}`} icon={<FaUser />} />
              <InfoField label="Date d'embauche" value={formatDate(employee.dateEmbauche)} icon={<FaCalendarAlt />} />
              <InfoField label="Matricule" value={employee.matricule} icon={<FaIdCard />} />
              <InfoField label="Département" value={employee.departement || "Non défini"} icon={<FaBuilding />} />
              <InfoField label="Poste" value={employee.poste || "Non défini"} icon={<FaBriefcase />} />
              <InfoField label="Type de contrat" value={employee.typeContrat || "CDI"} icon={<FaFileInvoiceDollar />} />
              <InfoField label="Nombre de parts" value={employee.nbreofParts || "1"} icon={<FaUsers />} />
            </InfoSection>

            <InfoSection title="Contact" icon={<FaEnvelope />} color="#10b981" style={{ marginTop: 24 }}>
              <InfoField label="Email" value={employee.email} icon={<FaEnvelope />} />
              <InfoField label="Téléphone" value={employee.telephone || "Non renseigné"} icon={<FaPhone />} />
              <InfoField label="Adresse" value={employee.adresse || "Non renseignée"} icon={<FaMapMarkerAlt />} />
            </InfoSection>
          </Col>

          {/* Colonne droite - Rémunération et primes */}
          <Col xs={24} md={12}>
            <InfoSection title="Rémunération détaillée" icon={<FaCalculator />} color="#10b981">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="employee-salary-item">
                    <span className="employee-salary-label">Salaire de base</span>
                    <span className="employee-salary-value">{formatAmount(employee.salaireBase)}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="employee-salary-item">
                    <span className="employee-salary-label">Sursalaire</span>
                    <span className="employee-salary-value accent">{formatAmount(employee.sursalaire)}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="employee-salary-item">
                    <span className="employee-salary-label">Salaire brut</span>
                    <span className="employee-salary-value">{formatAmount(salaireDetails.brut)}</span>
                  </div>
                </Col>
              </Row>
              
              <Divider style={{ margin: "16px 0" }} />
              
              <div className="employee-deductions-title">
                <FaReceipt /> Déductions et taxes
              </div>
              <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
                <Col span={12}>
                  <div className="employee-salary-item deduction">
                    <span className="employee-salary-label">IPM (Impôt minimum)</span>
                    <span className="employee-salary-value danger">{formatAmount(salaireDetails.ipm)}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="employee-salary-item deduction ir-item">
                    <span className="employee-salary-label">IR (Impôt sur le Revenu)</span>
                    <span className="employee-salary-value danger">- {formatAmount(salaireDetails.ir)}</span>
                  </div>
                </Col>
              </Row>
              
              <Divider style={{ margin: "16px 0" }} />
              
              <div className="employee-net-summary">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div className="employee-salary-item">
                      <span className="employee-salary-label">Net avant impôts</span>
                      <span className="employee-salary-value">{formatAmount(salaireDetails.netAvantImpots)}</span>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="employee-salary-item highlight">
                      <span className="employee-salary-label">Net à payer</span>
                      <span className="employee-salary-value success">{formatAmount(salaireDetails.netApresImpots)}</span>
                    </div>
                  </Col>
                </Row>
              </div>
            </InfoSection>

            <InfoSection title="Primes et indemnités" icon={<FaUserCheck />} color="#8b5cf6" style={{ marginTop: 24 }}>
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <div className="employee-prime-item">
                    <FaCar className="prime-icon" />
                    <div>
                      <span className="prime-label">Transport</span>
                      <span className="prime-value">{formatAmount(employee.indemniteTransport)}</span>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="employee-prime-item">
                    <FaUtensils className="prime-icon" />
                    <div>
                      <span className="prime-label">Panier</span>
                      <span className="prime-value">{formatAmount(employee.primePanier)}</span>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="employee-prime-item">
                    <FaShieldAlt className="prime-icon" />
                    <div>
                      <span className="prime-label">Responsabilité</span>
                      <span className="prime-value">{formatAmount(employee.indemniteResponsabilite)}</span>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="employee-prime-item">
                    <FaPlaneArrival className="prime-icon" />
                    <div>
                      <span className="prime-label">Déplacement</span>
                      <span className="prime-value">{formatAmount(employee.indemniteDeplacement)}</span>
                    </div>
                  </div>
                </Col>
              </Row>
              
              <div className="employee-primes-total">
                <span>Total primes mensuelles</span>
                <strong>
                  {formatAmount(
                    (parseFloat(employee.indemniteTransport || 0) +
                     parseFloat(employee.primePanier || 0) +
                     parseFloat(employee.indemniteResponsabilite || 0) +
                     parseFloat(employee.indemniteDeplacement || 0))
                  )}
                </strong>
              </div>
            </InfoSection>
          </Col>
        </Row>

        {/* Section Congés et absences */}
        <InfoSection title="Suivi des congés et absences" icon={<FaRegClock />} color="#f59e0b">
          <div className="employee-leave-stats">
            <div className="employee-leave-card">
              <div className="leave-stat">
                <span className="leave-label">Congés accumulés</span>
                <span className="leave-value">{congesStats.accumulated} <small>jours</small></span>
                <span className="leave-hint">Depuis l'embauche</span>
              </div>
              <div className="leave-stat">
                <span className="leave-label">Congés (année en cours)</span>
                <span className="leave-value">{congesStats.currentYear} <small>jours</small></span>
                <span className="leave-hint">{new Date().getFullYear()}</span>
              </div>
              <div className="leave-stat">
                <span className="leave-label">Utilisés (cette année)</span>
                <span className="leave-value warning">{congesStats.used} <small>jours</small></span>
              </div>
              <div className="leave-stat">
                <span className="leave-label">Solde disponible</span>
                <span className="leave-value success">{congesStats.remaining} <small>jours</small></span>
              </div>
            </div>
            
            <div className="employee-progress-section">
              <div className="progress-header">
                <span>Progression des congés {new Date().getFullYear()}</span>
                <span className="progress-percent">{congesPercentage}%</span>
              </div>
              <Progress 
                percent={congesPercentage} 
                strokeColor="#f59e0b"
                trailColor="#e2e8f0"
                size="small"
                showInfo={false}
              />
              <div className="employee-absence-info">
                <div className="absence-item">
                  <FaClipboardList />
                  <span>Jours d'absence: <strong>{employee.joursAbsence || 0}</strong> jours</span>
                </div>
                <div className="absence-item">
                  <FaHandHoldingUsd />
                  <span>Avance sur salaire: <strong>{formatAmount(employee.avanceSalaire)}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </InfoSection>

        {/* Note de bas de page */}
        <div className="employee-modal-footer-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>
            Les montants sont exprimés en FCFA. Le salaire net à payer correspond au salaire brut moins l'IPM et l'IR, 
            plus les primes et indemnités.
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default EmployeeDetailsModal;