import React from "react";
import { FaFileInvoiceDollar } from "react-icons/fa";
import DocumentActions from "./DocumentActions";

// Fonction utilitaire pour la classe de statut
const getStatusClass = (status) => {
  const statusMap = {
    'payé': 'paid',
    'en attente': 'pending',
    'accompte': 'partial',
    'brouillon': 'pending',
    'Attente': 'pending',
    'Payé': 'paid',
    'Accompte': 'partial'
  };
  return statusMap[status.toLowerCase()] || 'pending';
};

// Fonction utilitaire pour la classe de ligne
const getRowStatusClass = (status) => {
  const statusMap = {
    'payé': 'paid-row',
    'en attente': 'pending-row',
    'accompte': 'partial-row',
    'brouillon': 'pending-row',
    'Attente': 'pending-row',
    'Payé': 'paid-row',
    'Accompte': 'partial-row'
  };
  return statusMap[status.toLowerCase()] || 'pending-row';
};

// Fonction pour formater le montant
const formatAmount = (amount) => {
  if (!amount) return "0";
  return Number(
    amount.toString().replace(/\s/g, "").replace(",", ".")
  ).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const DocumentTableRow = React.memo(({
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
  const rowStatusClass = getRowStatusClass(status);

  // Gestion du clic sur la ligne (sauf les actions)
  const handleRowClick = (e) => {
    // Empêche le déclenchement si on clique sur les actions
    if (e.target.closest('.actions-celle') || e.target.closest('.action-btn') || 
        e.target.closest('.swiper') || e.target.closest('.table-actions')) {
      return;
    }
    onPreview(document);
  };

  // Vérifier si le contenu est long
  const isLongContent = (content, maxLength = 15) => {
    return content && content.length > maxLength;
  };

  const formattedAmount = formatAmount(document.totalTTC);
  const amountText = `${formattedAmount} FCFA`;

  return (
    <tr
      onClick={handleRowClick}
      className={rowStatusClass}
    >
      {/* Colonne Numéro */}
      <td data-fulltext={document.numero}>
        <div className="cell-content">
          <FaFileInvoiceDollar
            className="cell-icon"
            style={{ color: getTypeColor() }}
          />
          <span className={`text-ellipsis ${isLongContent(document.numero, 12) ? "text-long" : ""}`}>
            {document.numero}
          </span>
        </div>
      </td>

      {/* Colonne Client */}
      <td data-fulltext={document.clientNom || "Sans client"}>
        <span className={`client-name-custum ${isLongContent(document.clientNom, 25) ? "text-long" : ""}`}>
          {document.clientNom || "Sans client"}
        </span>
      </td>

      {/* Colonne Date */}
      <td data-fulltext={document.date}>
        <span className={`text-ellipsis ${isLongContent(document.date, 10) ? "text-long" : ""}`}>
          {document.date}
        </span>
      </td>

      {/* Colonne Montant */}
      <td
        className="amount-cell"
        data-fulltext={amountText}
      >
        <span className={`amount-text ${isLongContent(amountText, 12) ? "text-long" : ""}`}>
          {formattedAmount}{" "}
          <span className="fcfa-custum">FCFA</span>
        </span>
      </td>

      {/* Colonne Statut */}
      <td data-fulltext={status}>
        <span className={`status-badge ${statusClass}`}>
          {status}
        </span>
      </td>

      {/* Colonne Actions */}
      <td className="actions-celle" onClick={(e) => e.stopPropagation()}>
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
          viewMode="table"
        />
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée
  return (
    prevProps.document.id === nextProps.document.id &&
    prevProps.getStatus(prevProps.document) === nextProps.getStatus(nextProps.document) &&
    prevProps.sendingEmails[prevProps.document.id] === nextProps.sendingEmails[nextProps.document.id]
  );
});

export default DocumentTableRow;