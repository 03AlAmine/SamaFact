import React, { useState, useEffect } from "react";
import { Form as AntdForm, Modal, Button, Input, Select, InputNumber } from "antd";
const { Option } = Select;

const formatCurrency = (value) => {
    return (
        parseFloat(value?.toString().replace(/\s/g, '') || 0)
            .toFixed(2)
            .replace(/\d(?=(\d{3})+\.)/g, '$& ')
    );
};

const ModalPaiement = ({ visible, onCancel, onConfirm, invoice, loading }) => {
    const [form] = AntdForm.useForm();
    const [isAcompte, setIsAcompte] = useState(false);
    const [totalTTC, setTotalTTC] = useState(0);

    useEffect(() => {
        if (invoice?.totalTTC) {
            const total = parseFloat(invoice.totalTTC.replace(/\s/g, ''));
            setTotalTTC(total);
        }
    }, [invoice]);

    useEffect(() => {
        if (visible) {
            form.resetFields();
            setIsAcompte(false);
        }
    }, [visible, form]);


    const handleTypePaiementChange = (value) => {
        setIsAcompte(value === "acompte");
        if (value === "total") {
            form.setFieldsValue({ montantPaye: totalTTC });
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onConfirm({
                ...values,
                totalTTC: totalTTC
            });
        } catch (error) {
            console.error("Validation failed:", error);
        }
    };

    const formItems = [
        React.createElement(
            AntdForm.Item,
            {
                key: "modePaiement",
                name: "modePaiement",
                label: "Mode de paiement",
                rules: [{ required: true, message: "Ce champ est requis" }]
            },
            React.createElement(
                Select,
                { placeholder: "Sélectionnez un mode de paiement" },
                React.createElement(Option, { value: "cheque" }, "Chèque"),
                React.createElement(Option, { value: "virement" }, "Virement"),
                React.createElement(Option, { value: "versement" }, "Versement"),
                React.createElement(Option, { value: "cash" }, "Cash")
            )
        ),
        React.createElement(
            AntdForm.Item,
            {
                key: "reference",
                name: "reference",
                label: "Référence du règlement"
            },
            React.createElement(Input, {
                placeholder: "Numéro de chèque, référence virement, etc."
            })
        ),
        React.createElement(
            AntdForm.Item,
            {
                key: "typePaiement",
                name: "typePaiement",
                label: "Indication de paiement",
                rules: [{ required: true, message: "Ce champ est requis" }]
            },
            React.createElement(
                Select,
                {
                    placeholder: "Type de paiement",
                    onChange: handleTypePaiementChange
                },
                React.createElement(Option, { value: "acompte" }, "Acompte"),
                React.createElement(Option, { value: "total" }, "Paiement de la totalité")
            )
        )
    ];

    if (isAcompte) {
        const montantPaye = form.getFieldValue("montantPaye") || 0;
        const reste = totalTTC - montantPaye;

        formItems.push(
            React.createElement(
                AntdForm.Item,
                {
                    key: "montantPaye",
                    name: "montantPaye",
                    label: `Montant payé (FCFA) - Reste: ${formatCurrency(reste)} FCFA`,
                    rules: [
                        { required: true, message: "Veuillez entrer le montant" },
                        {
                            validator: (_, value) => {
                                if (value <= 0) return Promise.reject(new Error("Le montant doit être positif"));
                                if (value > totalTTC) return Promise.reject(new Error("L'acompte ne peut dépasser le total"));
                                return Promise.resolve();
                            }
                        }
                    ]
                },
                React.createElement(InputNumber, {
                    style: { width: "100%" },
                    min: 0,
                    max: totalTTC,
                    step: 1000,
                    formatter: (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " "),
                    parser: (value) => value.replace(/\s?|(,*)/g, ""),
                    onChange: () => form.validateFields(["montantPaye"])
                })
            )
        );
    }

    formItems.push(
        React.createElement(
            AntdForm.Item,
            {
                key: "note",
                name: "note",
                label: "Note (facultatif)"
            },
            React.createElement(Input.TextArea, {
                rows: 3,
                placeholder: "Informations supplémentaires..."
            })
        )
    );

    return React.createElement(
        Modal,
        {
            title: `Paiement de la facture ${invoice?.numero} - Montant total: ${formatCurrency(totalTTC)} FCFA`,
            open: visible,
            onCancel: onCancel,
            footer: [
                React.createElement(
                    Button,
                    {
                        key: "back",
                        onClick: onCancel
                    },
                    "Annuler"
                ),
                React.createElement(
                    Button,
                    {
                        key: "submit",
                        type: "primary",
                        loading: loading,
                        onClick: handleSubmit
                    },
                    "Confirmer le paiement"
                )
            ]
        },
        React.createElement(
            AntdForm,
            {
                form: form,
                layout: "vertical"
            },
            ...formItems
        )

    );
};

export default ModalPaiement;
