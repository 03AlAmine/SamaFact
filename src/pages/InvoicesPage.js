import React, { useState, useEffect, useCallback } from "react";
import DocumentSection from "../components/DocumentSection";
import { exportToExcel, exportToPDF } from "../components/exportUtils";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import ModernDateRangePicker from "../components/ModernDateRangePicker";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";
import { downloadPdf, previewPdf } from '../services/pdfService';
import { invoiceService } from '../services/invoiceService';
import ModalPaiement from "../components/ModalPaiement";
import { message, Modal } from "antd";

const InvoicesPage = ({
    searchTerm,
    setSearchTerm,
    navigate,
    selectedClient,
    companyId,
}) => {
    const { currentUser } = useAuth();
    const [documents, setDocuments] = useState({
        factures: [],
        devis: [],
        avoirs: []
    });
    const [modalVisible, setModalVisible] = useState(false);
    const [currentDocument, setCurrentDocument] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [activeTab, setActiveTab] = useState("factures");
    const currentTab = activeTab || "factures";

    // Fonction pour obtenir le statut d'un document
    const getStatus = (document) => {
        // Convertir les montants en nombres pour comparaison
        const totalTTC = typeof document.totalTTC === 'string'
            ? parseFloat(document.totalTTC.replace(/\s/g, '').replace(',', '.'))
            : document.totalTTC || 0;

        const montantPaye = typeof document.montantPaye === 'string'
            ? parseFloat(document.montantPaye.replace(/\s/g, '').replace(',', '.'))
            : document.montantPaye || 0;

        // Définition d'une marge d'erreur pour les comparaisons (0.01 pour les centimes)
        const EPSILON = 0.01;

        // 1. Si pas de paiement ou montant payé = 0 → "En attente"
        if (montantPaye < EPSILON) {
            return "En attente";
        }
        // 2. Si montant payé est (presque) égal au total → "Payé"
        else if (Math.abs(montantPaye - totalTTC) < EPSILON) {
            return "Payé";
        }
        // 3. Si montant payé > 0 mais < total → "Accompte"
        else if (montantPaye < totalTTC) {
            return "Accompte";
        }
        // Cas par défaut (normalement ne devrait pas arriver)
        return document.statut ?
            document.statut.charAt(0).toUpperCase() + document.statut.slice(1)
            : "En attente";
    };

    // Fonction pour filtrer par date
    const filterByDate = useCallback((items) => {
        if (!dateRange.from && !dateRange.to) return items;

        return items.filter(item => {
            const itemDate = new Date(item.date);
            const fromDate = dateRange.from ? new Date(dateRange.from) : null;
            const toDate = dateRange.to ? new Date(dateRange.to) : null;

            return (
                (!fromDate || itemDate >= fromDate) &&
                (!toDate || itemDate <= toDate)
            );
        });
    }, [dateRange]);

    // Chargement des documents depuis Firestore
    useEffect(() => {
        if (!currentUser || !companyId) return;

        const documentsRef = collection(db, `companies/${companyId}/factures`);

        const buildQuery = (type) => {
            const conditions = [where("type", "==", type)];
            if (currentUser.role !== 'admin') {
                conditions.push(where("userId", "==", currentUser.uid));
            }
            return query(documentsRef, ...conditions);
        };

        const unsubscribe = {
            factures: onSnapshot(buildQuery("facture"), (snapshot) => {
                setDocuments(prev => ({
                    ...prev,
                    factures: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                }));
            }),
            devis: onSnapshot(buildQuery("devis"), (snapshot) => {
                setDocuments(prev => ({
                    ...prev,
                    devis: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                }));
            }),
            avoirs: onSnapshot(buildQuery("avoir"), (snapshot) => {
                setDocuments(prev => ({
                    ...prev,
                    avoirs: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                }));
            })
        };

        return () => {
            Object.values(unsubscribe).forEach(unsub => unsub());
        };
    }, [currentUser, companyId]);

    // Gestion de la suppression avec confirmation
    const handleDelete = async (id, type) => {
        Modal.confirm({
            title: 'Confirmer la suppression',
            content: 'Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.',
            okText: 'Supprimer',
            okType: 'danger',
            cancelText: 'Annuler',
            onOk: async () => {
                try {
                    const result = await invoiceService.deleteInvoice(companyId, id);
                    if (result.success) {
                        message.success(result.message);
                    } else {
                        message.error(result.message);
                    }
                } catch (error) {
                    console.error("Erreur suppression:", error);
                    message.error("Erreur lors de la suppression");
                }
            }
        });
    };

    // Gestion des exports
    const handleExport = (format) => {
        const data = filterByDate(documents[activeTab]);
        const fileName = {
            factures: 'Factures',
            devis: 'Devis',
            avoirs: 'Avoirs'
        }[activeTab];

        if (format === 'excel') {
            exportToExcel(data, fileName, {
                from: dateRange.from?.toISOString().split('T')[0] || '',
                to: dateRange.to?.toISOString().split('T')[0] || ''
            });
        } else {
            exportToPDF(data, fileName, {
                from: dateRange.from?.toISOString().split('T')[0] || '',
                to: dateRange.to?.toISOString().split('T')[0] || ''
            });
        }
    };

    // Duplication de document
    const handleDuplicate = async (document) => {
        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        const newDueDate = dueDate.toISOString().split('T')[0];

        try {
            const newNumber = await invoiceService.generateInvoiceNumber(
                companyId,
                new Date(),
                document.type || activeTab.slice(0, -1)
            );

            navigate("/bill", {
                state: {
                    facture: {
                        ...document,
                        id: undefined,
                        date: today,
                        dateEcheance: newDueDate,
                        numero: newNumber,
                        statut: "en attente"
                    },
                    isDuplicate: true,
                    type: document.type || activeTab.slice(0, -1),
                    client: {
                        nom: document.clientNom || "",
                        adresse: document.clientAdresse || "",
                        ville: document.clientVille || ""
                    }
                }
            });
        } catch (error) {
            console.error("Erreur duplication:", error);
            message.error("Erreur lors de la duplication");
        }
    };

    // Gestion du paiement avec confirmation pour annulation
    const handlePayment = async (id, action) => {
        const docToUpdate = documents[activeTab].find(doc => doc.id === id);
        setCurrentDocument(docToUpdate);

        if (action === 'paid') {
            setModalVisible(true);
        } else {
            Modal.confirm({
                title: 'Confirmer le changement de statut',
                content: 'Êtes-vous sûr de vouloir remettre ce document en attente ?',
                okText: 'Confirmer',
                cancelText: 'Annuler',
                onOk: async () => {
                    try {
                        const result = await invoiceService.markAsPending(companyId, id);
                        if (result.success) {
                            message.success("Statut mis à jour avec succès");
                        } else {
                            message.error(result.message);
                        }
                    } catch (error) {
                        console.error("Erreur:", error);
                        message.error("Erreur lors de la mise à jour du statut");
                    }
                }
            });
        }
    };

    const handleConfirmPayment = async (paymentDetails) => {
        if (!currentDocument) return;

        setPaymentLoading(true);
        try {
            const totalTTC = typeof currentDocument.totalTTC === 'string'
                ? parseFloat(currentDocument.totalTTC.replace(/\s/g, '').replace(',', '.'))
                : currentDocument.totalTTC || 0;

            const montantPaye = typeof paymentDetails.montant === 'string'
                ? parseFloat(paymentDetails.montant.replace(/\s/g, '').replace(',', '.'))
                : paymentDetails.montant || 0;

            const EPSILON = 0.01; // Marge d'erreur

            // Déterminer le statut automatiquement
            let newStatus;
            if (montantPaye < EPSILON) {
                newStatus = "en attente";
            } else if (Math.abs(montantPaye - totalTTC) < EPSILON) {
                newStatus = "payé";
            } else {
                newStatus = "accompte";
            }

            const result = await invoiceService.markAsPaid(
                companyId,
                currentDocument.id,
                {
                    ...paymentDetails,
                    totalTTC: totalTTC,
                    statut: newStatus, // On envoie le statut calculé
                    isFullPayment: newStatus === "payé",
                    isPartialPayment: newStatus === "accompte"
                }
            );

            if (result.success) {
                message.success(`Document marqué comme ${newStatus}`);
                setModalVisible(false);
            } else {
                message.error(result.message);
            }
        } catch (error) {
            console.error("Erreur:", error);
            message.error("Erreur lors du paiement");
        } finally {
            setPaymentLoading(false);
        }
    };

    return (
        <div className="invoices-page-container">
            <div className="navbar-tabs">
                {['factures', 'devis', 'avoirs'].map((tab) => (
                    <button
                        key={tab}
                        className={activeTab === tab ? "active" : ""}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)} ({filterByDate(documents[tab]).length})
                    </button>
                ))}
            </div>

            <div className="filters-container">
                <ModernDateRangePicker dateRange={dateRange} setDateRange={setDateRange} />

                <div className="date-range-summary">
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    {dateRange.from || dateRange.to ? (
                        <>
                            {" du "}
                            {dateRange.from?.toLocaleDateString('fr-FR') || '...'}
                            {" au "}
                            {dateRange.to?.toLocaleDateString('fr-FR') || '...'}
                        </>
                    ) : " (Toutes dates)"}
                </div>

                <div className="export-buttons">
                    <button onClick={() => handleExport('excel')} className="export-btn-excel">
                        <FaFileExcel /> Excel
                    </button>
                    <button onClick={() => handleExport('pdf')} className="export-btn-pdf">
                        <FaFilePdf /> PDF
                    </button>
                </div>
            </div>

            <DocumentSection
                title={currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
                items={filterByDate(documents[activeTab])}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                navigate={navigate}
                onDelete={handleDelete}
                selectedClient={selectedClient}
                type={activeTab.slice(0, -1)} // "factures" -> "facture"
                onPreview={previewPdf}
                onDownload={downloadPdf}
                onDuplicate={handleDuplicate}
                onMarkAsPaid={(id) => handlePayment(id, 'paid')}
                onMarkAsPending={(id) => handlePayment(id, 'pending')}
                getStatus={getStatus}
            />

            <ModalPaiement
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                onConfirm={handleConfirmPayment}
                invoice={currentDocument}
                loading={paymentLoading}
            />
        </div>
    );
};

export default InvoicesPage;