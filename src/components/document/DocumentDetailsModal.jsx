import React from "react";
import { Modal, Button } from "antd";
import {
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaUser,
  FaMoneyBillWave,
  FaCheckCircle,
  FaCreditCard,
  FaStickyNote,
  FaUserEdit,
  FaCheck
} from "react-icons/fa";
import UserNameLookup from "../other/UserNameLookup";

const DocumentDetailsModal = ({ 
  isVisible, 
  onClose, 
  document, 
  type, 
  getStatus, 
  getTypeColor 
}) => {
  if (!document) return null;

  const status = getStatus(document);

  const DetailItem = ({ label, value, icon, className = "" }) => (
    <div className={`detail-item ${className}`}>
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
          <FaFileInvoiceDollar
            style={{
              color: getTypeColor(),
              marginRight: 10,
              fontSize: "1.5rem",
            }}
          />
          <span>Détails de {document.numero}</span>
        </div>
      }
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button
          key="back"
          onClick={onClose}
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
        <div className="document-details-content">
          <div className="details-card">
            <div className="details-row">
              <DetailItem
                label="Date"
                value={document.date}
                icon={<FaCalendarAlt className="detail-icon" />}
              />
              <DetailItem
                label="Client"
                value={document.clientNom || "Non spécifié"}
                icon={<FaUser className="detail-icon" />}
              />
            </div>

            <div className="details-row">
              <DetailItem
                label="Montant Total"
                value={
                  document.totalTTC
                    ? Number(
                        document.totalTTC
                          .toString()
                          .replace(/\s/g, "")
                          .replace(",", ".")
                      ).toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) + " FCFA"
                    : "0,00 FCFA"
                }
                icon={<FaMoneyBillWave className="detail-icon" />}
                className="amount"
              />
              <DetailItem
                label="Statut"
                value={status}
                icon={<FaCheckCircle className="detail-icon" />}
                className={`status ${status.toLowerCase()}`}
              />
            </div>
          </div>

          <div className="payment-card">
            <div className="card-header">
              <FaCreditCard className="header-icon" />
              <h4>Informations de Paiement</h4>
            </div>

            <div className="details-grid">
              <DetailItem
                label="Montant Payé"
                value={
                  document.montantPaye !== undefined && document.montantPaye !== null
                    ? Number(
                        document.montantPaye
                          .toString()
                          .replace(/\s/g, "")
                          .replace(",", ".")
                      ).toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) + " FCFA"
                    : "0,00 FCFA"
                }
                className="highlight"
              />
              <DetailItem
                label="Mode de Paiement"
                value={
                  document.modePaiement
                    ? document.modePaiement.charAt(0).toUpperCase() + 
                      document.modePaiement.slice(1)
                    : "Non spécifié"
                }
              />
              <DetailItem
                label="Date de Paiement"
                value={
                  document.datePaiement
                    ? new Date(document.datePaiement).toLocaleDateString("fr-FR")
                    : "Non payée"
                }
              />
              <DetailItem
                label="Référence"
                value={document.referencePaiement || "Aucune référence"}
              />
            </div>
          </div>

          <div className="creation-card">
            <DetailItem
              label="Créé par"
              value={
                <>
                  <UserNameLookup userId={document.userId} />
                  <span className="creation-date">
                    le {new Date(document.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </>
              }
              icon={<FaUserEdit className="detail-icon" />}
            />
          </div>

          {document.note && (
            <div className="notes-card">
              <div className="card-header">
                <FaStickyNote className="header-icon" />
                <h4>Notes</h4>
              </div>
              <div className="notes-content">{document.note}</div>
            </div>
          )}
        </div>

        <div className="status-progress-bar">
          <div className="progress-steps-container">
            <ProgressStep completed={!!document.statut} label="Créé" />
            <ProgressStep 
              completed={["en attente", "accompte", "payé"].includes(
                document.statut?.toLowerCase()
              )}
              label="En Attente"
              status={
                document.statut?.toLowerCase() === "en attente" ? "pending" :
                document.statut?.toLowerCase() === "accompte" ? "partial" : "completed"
              }
            />
            <ProgressStep 
              completed={["accompte", "payé"].includes(document.statut?.toLowerCase())}
              label="Accompte"
              status={document.statut?.toLowerCase() === "accompte" ? "partial" : "completed"}
            />
            <ProgressStep 
              completed={document.statut?.toLowerCase() === "payé"}
              label="Payé"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(DocumentDetailsModal);