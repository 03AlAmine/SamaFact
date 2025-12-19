import React, { useState } from "react";
import {
  FaFileSignature,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaUser
} from "react-icons/fa";
import UserNameLookup from "../other/UserNameLookup";
import PayrollActions from "./PayrollActions";

const PayrollCard = ({
  payroll,
  showEmployeeColumn,
  getStatus,
  onPreview,
  onDownload,
  onDelete,
  onDuplicate,
  onEdit,
  onValidate,
  onGenerate,
  onMarkAsPaid,
  onCancel,
  sendingEmails,
  onSendEmail,
  onShowInfo
}) => {
  const status = getStatus(payroll);

  const formatDateRange = (periode) => {
    if (!periode?.du || !periode?.au) return '';
    const format = (date) => {
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    };
    return `${format(periode.du)} - ${format(periode.au)}`;
  };

  const [showActions, setShowActions] = useState(false);

  return (
    <div
      key={payroll.id}
      className={`document-card ${status === "Payé" ? "paid-card" :
          status === "Validé" ? "validated-card" : ""
        }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onPreview(payroll)}
    >
      <div className="card-header" style={{ borderTop: '4px solid #28a745' }}>
        <div className="header-status">
          <span className={`status-badge ${status === "Payé" ? "paid" :
              status === "Validé" ? "validated" : "draft"
            }`}>
            {status}
          </span>
        </div>

        <div className="document-icon">
          <FaFileSignature style={{ color: '#3b82f6' }} />
        </div>
        <div className="document-info">
          <h3 className="document-number">{payroll.numero}</h3>
          {showEmployeeColumn && (
            <p className="document-client">{payroll.employeeName || "Sans employé"}</p>
          )}
        </div>
      </div>

      <div className="card-details">
        <div className="detail-item">
          <FaCalendarAlt className="detail-icon" />
          <span>{formatDateRange(payroll.periode)}</span>
        </div>

        <div className="detail-item">
          <FaMoneyBillWave className="detail-icon" />
          <span>
            {payroll.calculations?.salaireNetAPayer?.toLocaleString('fr-FR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }) || '0'} FCFA
          </span>
        </div>

        <div className="detail-item">
          <FaUser className="detail-icon" />
          <UserNameLookup userId={payroll.userId} />
        </div>
      </div>

      <PayrollActions
        payroll={payroll}
        showEmployeeColumn={showEmployeeColumn}
        getStatus={getStatus}
        onPreview={onPreview}
        onDownload={onDownload}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onEdit={onEdit}
        onValidate={onValidate}
        onGenerate={onGenerate}
        onMarkAsPaid={onMarkAsPaid}
        onCancel={onCancel}
        sendingEmails={sendingEmails}
        onSendEmail={onSendEmail}
        onShowInfo={onShowInfo}
        showActions={showActions} // ← Ajoutez cette prop

        viewMode="card"
      />
    </div>
  );
};

export default React.memo(PayrollCard);