import React, { useState, useEffect } from "react";
import { Form as AntdForm, Modal, Button, Input, Select, InputNumber, Alert } from "antd";

const { Option } = Select;

// Fonctions utilitaires pour la gestion des devises
const formatCurrency = (value) => {
  if (typeof value === 'number') {
    return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ');
  }
  
  const numValue = parseFloat(String(value || 0).replace(/\s/g, ''));
  return isNaN(numValue) 
    ? '0,00' 
    : numValue.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ');
};

// Fonction utilitaire pour formater les dates au format yyyy-MM-dd
const formatDateToYYYYMMDD = (date) => {
  if (!date) return '';
  
  // Si c'est une chaîne, essayer de la convertir en Date
  if (typeof date === 'string') {
    // Vérifier si c'est déjà au format yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Essayer de parser d'autres formats
    date = new Date(date);
  }
  
  // Si c'est un objet Date
  if (date instanceof Date && !isNaN(date)) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Pour la date actuelle si tout échoue
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ModalPaiementPayroll = ({ 
  visible, 
  onCancel, 
  onConfirm, 
  payroll, 
  loading,
  isPayroll = true 
}) => {
  const [form] = AntdForm.useForm();
  const [netAPayer, setNetAPayer] = useState(0);
  const [alreadyPaid, setAlreadyPaid] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [dateValue, setDateValue] = useState('');

  useEffect(() => {
    if (payroll) {
      const netAmount = payroll.calculations?.salaireNetAPayer || 0;
      const paid = payroll.montantPaye || 0;
      
      setNetAPayer(netAmount);
      setAlreadyPaid(paid);
      setRemainingAmount(netAmount - paid);
    }
  }, [payroll]);

  useEffect(() => {
    if (visible) {
      const todayFormatted = formatDateToYYYYMMDD(new Date());
      setDateValue(todayFormatted);
      
      form.resetFields();
      form.setFieldsValue({
        montantPaye: remainingAmount > 0 ? remainingAmount : netAPayer,
        datePaiement: todayFormatted
      });
    }
  }, [visible, form, netAPayer, remainingAmount]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      onConfirm({
        ...values,
        montantPaye: values.montantPaye,
        salaireNetAPayer: netAPayer
      });
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleDateChange = (e) => {
    const value = e.target.value;
    setDateValue(value);
    form.setFieldsValue({ datePaiement: value });
  };

  // Fonction pour valider que la date de paiement n'est pas antérieure à la période de paie
  const validatePaymentDate = (_, value) => {
    if (!value) return Promise.reject('La date de paiement est requise');

    try {
      // S'assurer que la valeur est au format correct
      const formattedValue = formatDateToYYYYMMDD(value);
      const paymentDate = new Date(formattedValue);
      const periodEnd = new Date(payroll.periode.du);

      if (paymentDate < periodEnd) {
        return Promise.reject('La date de paiement ne peut pas être antérieure à la fin de la période de paie');
      }

      return Promise.resolve();
    } catch (error) {
      return Promise.reject('Date invalide');
    }
  };

  return (
    <Modal
      title={`Paiement du bulletin ${payroll?.numero} - Net à payer: ${formatCurrency(netAPayer)} FCFA`}
      open={visible}
      onCancel={onCancel}
      className="modal-paiement"
      footer={[
        <Button key="back" onClick={onCancel} className="cancel-button">
          Annuler
        </Button>,
        <Button
          className="submit-button"
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Confirmer le paiement
        </Button>
      ]}
      width={600}
    >
      <AntdForm form={form} layout="vertical">
        {alreadyPaid > 0 && (
          <Alert
            message={`Montant déjà payé: ${formatCurrency(alreadyPaid)} FCFA - Reste: ${formatCurrency(remainingAmount)} FCFA`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <AntdForm.Item
          name="modePaiement"
          label="Mode de paiement"
          initialValue={"virement"}
          rules={[{ required: true, message: "Ce champ est requis" }]}
        >
          <Select placeholder="Sélectionnez un mode de paiement">
            <Option value="virement">Virement bancaire</Option>
            <Option value="cheque">Chèque</Option>
            <Option value="especes">Espèces</Option>
            <Option value="mobile">Mobile Money</Option>
            <Option value="autre">Autre</Option>
          </Select>
        </AntdForm.Item>

        <AntdForm.Item
          name="reference"
          label="Référence du paiement"
       //   rules={[{ required: true, message: "Ce champ est requis" }]}
        >
          <Input placeholder="Numéro de virement, référence, etc." />
        </AntdForm.Item>

        <AntdForm.Item
          name="datePaiement"
          label="Date de paiement"
          rules={[
            { required: true, message: "La date de paiement est requise" },
            { validator: validatePaymentDate }
          ]}
        >
          <Input 
            type="date" 
            value={dateValue}
            onChange={handleDateChange}
          />
        </AntdForm.Item>

        <AntdForm.Item
          name="montantPaye"
          label={`Montant payé (Net à payer: ${formatCurrency(netAPayer)} FCFA)`}
          rules={[
            { required: true, message: "Veuillez entrer le montant" },
            {
              validator: (_, value) => {
                if (value <= 0) return Promise.reject("Le montant doit être positif");
                if (value > netAPayer) return Promise.reject(`Le montant ne peut dépasser ${formatCurrency(netAPayer)} FCFA`);
                return Promise.resolve();
              }
            }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            max={netAPayer}
            step={1000}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
            parser={(value) => value.replace(/\s?|(,*)/g, "")}
          />
        </AntdForm.Item>

        <AntdForm.Item
          name="note"
          label="Note (facultatif)"
        >
          <Input.TextArea rows={3} placeholder="Informations supplémentaires..." />
        </AntdForm.Item>
      </AntdForm>
    </Modal>
  );
};

export default ModalPaiementPayroll;