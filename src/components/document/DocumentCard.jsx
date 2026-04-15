import React from "react";
import {
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaUser
} from "react-icons/fa";
import UserNameLookup from "../other/UserNameLookup";
import DocumentActions from "./DocumentActions";
import { useState } from "react";
// Fonction utilitaire pour la classe de statut
const getStatusClass = (status) => {
  const statusMap = {
    'payé': 'paid',
    'en attente': 'pending',
    'accompte': 'partial',
    'brouillon': 'pending'
  };
  return statusMap[status.toLowerCase()] || 'pending';
};

// Fonction utilitaire pour la classe de carte
const getCardStatusClass = (status) => {
  const statusMap = {
    'payé': 'paid-card',
    'en attente': 'pending-card',
    'accompte': 'partial-card',
    'brouillon': 'pending-card'
  };
  return statusMap[status.toLowerCase()] || 'pending-card';
};

const DocumentCard = ({
  document,
  type,
  getStatus,
  getTypeColor,
  onPreview,
  onDownload,
  onDelete,
  onDuplicate,
  onMarkAsPaid,
  onMarkAsPending,
  navigate,
  selectedClient,
  sendingEmails,
  onSendEmail,
  onShowInfo
}) => {
  const status = getStatus(document);
  const statusClass = getStatusClass(status);
  const cardStatusClass = getCardStatusClass(status);
  const [showActions, setShowActions] = useState(false);

  return (

    <div
      className={`document-card ${cardStatusClass}`}
      onClick={() => onPreview(document)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className="card-header"
        style={{ borderTop: `4px solid ${getTypeColor()}` }}
      >
        <div className="header-status">
          <span className={`status-badge ${statusClass}`}>
            {status}
          </span>
        </div>

        <div className="document-icon">
          <FaFileInvoiceDollar style={{ color: getTypeColor() }} />
        </div>
        <div className="document-info">
          <h3 className="document-number">{document.numero}</h3>
          <p className="document-client">{document.clientNom || "Sans client"}</p>
        </div>
      </div>

      <div className="card-details">
        <div className="detail-item">
          <FaCalendarAlt className="detail-icon" />
          <span>{document.date}</span>
        </div>

        <div className="detail-item">
          <FaMoneyBillWave className="detail-icon" />
          <span>
            {document.totalTTC
              ? Number(
                document.totalTTC.replace(/\s/g, "").replace(",", ".")
              ).toLocaleString("fr-FR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })
              : "0"} FCFA
          </span>
        </div>

        <div className="detail-item">
          <FaUser className="detail-icon" />
          <UserNameLookup userId={document.userId} />
        </div>
      </div>

      <DocumentActions
        document={document}
        type={type}
        getStatus={getStatus}
        onPreview={onPreview}
        onDownload={onDownload}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onMarkAsPaid={onMarkAsPaid}
        onMarkAsPending={onMarkAsPending}
        navigate={navigate}
        selectedClient={selectedClient}
        sendingEmails={sendingEmails}
        onSendEmail={onSendEmail}
        onShowInfo={onShowInfo}
        showActions={showActions} // ← Ajoutez cette prop
        viewMode="card"
      />
    </div>
  );
};

export default React.memo(DocumentCard);