import React, { useState, useEffect } from "react";
import { Form as AntdForm, Modal, Button, Input, Select, InputNumber, Alert } from "antd";
const { Option } = Select;

const formatCurrency = (value) => {
    if (typeof value === 'number') {
        return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ');
    }
    return (
        parseFloat(String(value || 0).replace(/\s/g, ''))
            .toFixed(2)
            .replace(/\d(?=(\d{3})+\.)/g, '$& ')
    );
};

const parseAmount = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value.replace(/\s/g, ''));
    return 0;
};

const ModalPaiement = ({ visible, onCancel, onConfirm, invoice, loading }) => {
    const [form] = AntdForm.useForm();
    const [paymentType, setPaymentType] = useState('total');
    const [totalTTC, setTotalTTC] = useState(0);
    // Removed unused paidAmount state
    const [remainingAmount, setRemainingAmount] = useState(0);

    useEffect(() => {
        if (invoice?.totalTTC) {
            const total = parseAmount(invoice.totalTTC);
            setTotalTTC(total);

            const alreadyPaid = parseAmount(invoice.montantPaye);
            setRemainingAmount(total - alreadyPaid);
        }
    }, [invoice]);

    useEffect(() => {
        if (visible) {
            form.resetFields();
            setPaymentType('total');
            form.setFieldsValue({
                montantPaye: remainingAmount > 0 ? remainingAmount : totalTTC,
                typePaiement: 'total'
            });
        }
    }, [visible, form, totalTTC, remainingAmount]);

    const handleTypePaiementChange = (value) => {
        setPaymentType(value);
        if (value === 'total') {
            form.setFieldsValue({ montantPaye: remainingAmount > 0 ? remainingAmount : totalTTC });
        }
    };

    const handleAmountChange = (value) => {
        // No longer tracking paidAmount as state
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // Calcul du montant selon le type de paiement
            const paymentAmount = paymentType === 'total'
                ? remainingAmount > 0 ? remainingAmount : totalTTC
                : values.montantPaye;

            onConfirm({
                ...values,
                montantPaye: paymentAmount,
                totalTTC: totalTTC,
                isFullPayment: paymentType === 'total', // Indication claire du type de paiement
                typePaiement: paymentType // Ajout explicite du type
            });
        } catch (error) {
            console.error("Validation failed:", error);
        }
    };

    return (
        <Modal
            title={`Paiement de la facture ${invoice?.numero} - Total: ${formatCurrency(totalTTC)} FCFA`}
            open={visible}
            onCancel={onCancel}
            className="modal-paiement"
            footer={[
                <Button key="back" onClick={onCancel} className="cancel-button"
                >
                    Annuler
                </Button>,
                <Button
                    className="submit-button"
                    key="submit"
                    type="primary"
                    loading={loading}
                    onClick={handleSubmit}
                >
                    {paymentType === 'acompte' ? 'Enregistrer acompte' : 'Confirmer paiement'}
                </Button>
            ]}
            width={600}
        >
            <AntdForm form={form} layout="vertical">
                {invoice?.montantPaye !== undefined && parseAmount(invoice.montantPaye) > 0 && (
                    <Alert
                        message={`Montant déjà payé: ${formatCurrency(invoice.montantPaye)} FCFA`}
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                <AntdForm.Item
                    name="modePaiement"
                    label="Mode de paiement"
                    initialValue={"cash"}
                    rules={[{ required: true, message: "Ce champ est requis" }]}
                >
                    <Select placeholder="Sélectionnez un mode de paiement">
                        <Option value="cash">Cash</Option>
                        <Option value="cheque">Chèque</Option>
                        <Option value="virement">Virement</Option>
                        <Option value="versement">Versement</Option>
                        <Option value="autre">Autre</Option>
                    </Select>
                </AntdForm.Item>

                <AntdForm.Item
                    name="reference"
                    label="Référence du règlement"
                >
                    <Input placeholder="Numéro de chèque, référence virement, etc." />
                </AntdForm.Item>

                <AntdForm.Item
                    name="typePaiement"
                    label="Type de paiement"
                    rules={[{ required: true, message: "Ce champ est requis" }]}
                >
                    <Select
                        placeholder="Sélectionnez le type de paiement"
                        onChange={handleTypePaiementChange}
                    >
                        <Option value="acompte">Acompte</Option>
                        <Option value="total">Paiement complet</Option>
                    </Select>
                </AntdForm.Item>

                {paymentType === 'acompte' && (
                    <AntdForm.Item
                        name="montantPaye"
                        label={`Montant à payer (Reste: ${formatCurrency(remainingAmount)} FCFA)`}
                        rules={[
                            { required: true, message: "Veuillez entrer le montant" },
                            {
                                validator: (_, value) => {
                                    if (value <= 0) return Promise.reject("Le montant doit être positif");
                                    if (value > remainingAmount) return Promise.reject(`Le montant ne peut dépasser ${formatCurrency(remainingAmount)} FCFA`);
                                    return Promise.resolve();
                                }
                            }
                        ]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            max={remainingAmount}
                            step={1000}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                            parser={(value) => value.replace(/\s?|(,*)/g, "")}
                            onChange={handleAmountChange}
                        />
                    </AntdForm.Item>
                )}

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

export default ModalPaiement;