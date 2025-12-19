import React from "react";
import { Modal, Button } from "antd";
import {
  FaFileSignature,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaUser,
  FaCheckCircle,
  FaCreditCard,
  FaUserEdit,
  FaCheck
} from "react-icons/fa";
import UserNameLookup from "../other/UserNameLookup";

const PayrollDetailsModal = ({ 
  isVisible, 
  onClose, 
  payroll, 
  getStatus 
}) => {
  if (!payroll) return null;

  const status = getStatus(payroll);

  const formatDateRange = (periode) => {
    if (!periode?.du || !periode?.au) return '';
    const format = (date) => {
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    };
    return `${format(periode.du)} - ${format(periode.au)}`;
  };

  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' FCFA';
  };

  const DetailItem = ({ label, value, icon, className = "", fullWidth = false }) => (
    <div className={`detail-item ${className} ${fullWidth ? 'full-width' : ''}`}>
      <span className="detail-label">
        {icon}
        {label}
      </span>
      <span className="detail-value">{value}</span>
    </div>
  );

  const ProgressStep = ({ completed, label, status = "completed" }) => (
    <div className={`progress-step ${status}`}>
      <div className="step-circle">
        {completed && <FaCheck className="check-icon" />}
      </div>
      <div className="step-label">{label}</div>
      <div className="step-connector"></div>
    </div>
  );

  return (
    <Modal
      title={
        <div className="modal-title">
          <FaFileSignature style={{ color: '#3b82f6', marginRight: 10, fontSize: "1.5rem" }} />
          <span>Détails de {payroll.numero}</span>
        </div>
      }
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button
          key="back"
          onClick={onClose}
          style={{
            padding: "10px 24px",
            height: "auto",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontWeight: 500,
            transition: "all 0.3s",
          }}
          className="close-button"
        >
          Fermer
        </Button>,
      ]}
      width={700}
      className="document-details-modal-container"
      style={{ top: 20 }}
    >
      <div className="document-details-content-container">
        {/* Section Principale */}
        <div className="document-details-content">
          {/* Section Informations Générales */}
          <div className="details-card">
            <div className="details-row">
              <DetailItem
                label="Employé"
                value={payroll.employeeName || "Non spécifié"}
                icon={<FaUser className="detail-icon" />}
              />
              <DetailItem
                label="Période"
                value={formatDateRange(payroll.periode)}
                icon={<FaCalendarAlt className="detail-icon" />}
              />
            </div>

            <div className="details-row">
              <DetailItem
                label="Net à payer"
                value={formatCurrency(payroll.calculations?.salaireNetAPayer)}
                icon={<FaMoneyBillWave className="detail-icon" />}
                className="amount"
              />
              <DetailItem
                label="Statut"
                value={status}
                icon={<FaCheckCircle className="detail-icon" />}
                className={`status ${payroll.statut === "paid" ? "paid" :
                  payroll.statut === "validated" ? "validated" : "draft"}`}
              />
            </div>
          </div>

          {/* Section Rémunération */}
          <div className="payment-card">
            <div className="card-header">
              <FaCreditCard className="header-icon" />
              <h4>Rémunération</h4>
            </div>

            <div className="details-grid two-columns">
              <DetailItem
                label="Salaire de base"
                value={formatCurrency(payroll.remuneration?.salaireBase)}
              />
              <DetailItem
                label="Sursalaire"
                value={formatCurrency(payroll.remuneration?.sursalaire)}
              />
              <DetailItem
                label="Indemnité déplacement"
                value={formatCurrency(payroll.remuneration?.indemniteDeplacement)}
              />
              <DetailItem
                label="Avantages en nature"
                value={formatCurrency(payroll.remuneration?.avantagesNature)}
              />
            </div>
          </div>

          {/* Section Primes */}
          <div className="payment-card">
            <div className="card-header">
              <FaMoneyBillWave className="header-icon" />
              <h4>Primes</h4>
            </div>

            <div className="details-grid two-columns">
              <DetailItem
                label="Transport"
                value={formatCurrency(payroll.primes?.transport)}
              />
              <DetailItem
                label="Panier"
                value={formatCurrency(payroll.primes?.panier)}
              />
              <DetailItem
                label="Responsabilité"
                value={formatCurrency(payroll.primes?.responsabilite)}
              />
              <DetailItem
                label="Autres primes"
                value={formatCurrency(payroll.primes?.autresPrimes)}
              />
            </div>
          </div>

          {/* Section Cotisations et Retenues */}
          {(payroll.calculations?.cotisationsSalariales || payroll.calculations?.cotisationsPatronales) && (
            <div className="payment-card">
              <div className="card-header">
                <FaMoneyBillWave className="header-icon" />
                <h4>Cotisations</h4>
              </div>

              <div className="details-grid two-columns">
                {payroll.calculations.cotisationsSalariales && (
                  <DetailItem
                    label="Cotisations salariales"
                    value={formatCurrency(payroll.calculations.cotisationsSalariales)}
                  />
                )}
                {payroll.calculations.cotisationsPatronales && (
                  <DetailItem
                    label="Cotisations patronales"
                    value={formatCurrency(payroll.calculations.cotisationsPatronales)}
                  />
                )}
                {payroll.calculations.impotRevenu && (
                  <DetailItem
                    label="Impôt sur le revenu"
                    value={formatCurrency(payroll.calculations.impotRevenu)}
                  />
                )}
                {payroll.calculations.totalRetenues && (
                  <DetailItem
                    label="Total retenues"
                    value={formatCurrency(payroll.calculations.totalRetenues)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Section Paiement (si payé) */}
          {payroll.statut === "paid" && (
            <div className="payment-card">
              <div className="card-header">
                <FaCreditCard className="header-icon" />
                <h4>Paiement</h4>
              </div>

              <div className="details-grid">
                <DetailItem
                  label="Date de paiement"
                  value={payroll.paymentDate ? 
                    new Date(payroll.paymentDate).toLocaleDateString('fr-FR') : 
                    "Non spécifiée"
                  }
                />
                <DetailItem
                  label="Méthode"
                  value={
                    payroll.paymentMethod === "virement" ? "Virement bancaire" :
                    payroll.paymentMethod === "cheque" ? "Chèque" :
                    payroll.paymentMethod === "especes" ? "Espèces" :
                    payroll.paymentMethod || "Non spécifié"
                  }
                />
                <DetailItem
                  label="Référence"
                  value={payroll.paymentReference || 'Aucune référence'}
                />
              </div>
            </div>
          )}

          {/* Section Création */}
          <div className="creation-card">
            <DetailItem
              label="Créé par"
              value={
                <>
                  <UserNameLookup userId={payroll.userId} />
                  <span className="creation-date">
                    le {new Date(payroll.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </>
              }
              icon={<FaUserEdit className="detail-icon" />}
              fullWidth={true}
            />
          </div>

          {/* Section Notes (si existante) */}
          {payroll.note && (
            <div className="notes-card">
              <div className="card-header">
                <FaFileSignature className="header-icon" />
                <h4>Notes</h4>
              </div>
              <div className="notes-content">{payroll.note}</div>
            </div>
          )}
        </div>

        {/* Barre de progression verticale */}
        <div className="status-progress-bar">
          <div className="progress-steps-container">
            <ProgressStep 
              completed={!!payroll.statut} 
              label="Créé" 
            />
            <ProgressStep 
              completed={['validated', 'paid'].includes(payroll.statut)} 
              label="Validé" 
            />
            <ProgressStep 
              completed={payroll.statut === 'paid'} 
              label="Payé" 
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(PayrollDetailsModal);