import React from "react";
import { FaFileSignature } from "react-icons/fa";
import PayrollActions from "./PayrollActions";

const PayrollTableRow = React.memo(({
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

  const handleRowClick = (e) => {
    // Empêche le déclenchement si on clique sur les actions
    if (e.target.closest('.actions-celle') || e.target.closest('.action-btn') || 
        e.target.closest('.swiper') || e.target.closest('.table-actions')) {
      return;
    }
    onPreview(payroll);
  };

  return (
    <tr
      key={payroll.id}
      onClick={handleRowClick}
      className={
        status === 'Payé' ? 'paid-row' :
        status === 'Validé' ? 'validated-row' : 'draft-row'
      }
    >
      <td>
        <div className="cell-content">
          <FaFileSignature
            className="cell-icon"
            style={{ color: '#3b82f6' }}
          />
          {payroll.numero}
        </div>
      </td>

      {showEmployeeColumn && <td>{payroll.employeeName || 'Sans employé'}</td>}

      <td>{formatDateRange(payroll.periode)}</td>

      <td className="amount-cell">
        {payroll.calculations?.salaireNetAPayer?.toLocaleString('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }) || '0'} FCFA
      </td>

      <td>
        <span className={`status-badge ${
          status === 'Payé' ? 'paid' :
          status === 'Validé' ? 'validated' : 'draft'
        }`}>
          {status}
        </span>
      </td>

      <td className="actions-celle">
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
          viewMode="table"
        />
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée
  return (
    prevProps.payroll.id === nextProps.payroll.id &&
    prevProps.getStatus(prevProps.payroll) === nextProps.getStatus(nextProps.payroll) &&
    prevProps.sendingEmails[prevProps.payroll.id] === nextProps.sendingEmails[nextProps.payroll.id]
  );
});

export default PayrollTableRow;