import React, { useState, useCallback, useMemo } from "react";
import DocumentSection from "../components/DocumentSection";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";
import { FaSpinner, FaPlus } from "react-icons/fa";
import ModernDateRangePicker from "../components/docpayroll/ModernDateRangePicker";
import { downloadPdf, previewPdf } from '../services/pdfService';
import { invoiceService } from '../services/invoiceService';
import ModalPaiement from "../components/dialogs/ModalPaiement";
import { message, Modal } from "antd";

const InvoicesPage = ({
    navigate,
    selectedClient,
    companyId,
    getFacturesToDisplay,
    getDevisToDisplay,
    getAvoirsToDisplay,
    viewMode,
    setViewMode,
    type,

}) => {

    const [modalVisible, setModalVisible] = useState(false);
    const [currentDocument, setCurrentDocument] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [activeTab, setActiveTab] = useState("factures");
    const [isChangingTab, setIsChangingTab] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState("");
    const searchTerm = localSearchTerm;
    const setSearchTerm = setLocalSearchTerm;
    const currentTab = activeTab || "factures";

    const typeMapping = {
        factures: "facture",
        devis: "devis",
        avoirs: "avoir"
    };

    // 🔥 OPTIMISATION : Débounce pour les changements d'onglet
    const handleTabChange = useCallback(async (tab) => {
        if (activeTab === tab || isChangingTab) return;

        setIsChangingTab(true);

        try {
            // Délai réduit pour un meilleur UX
            await new Promise(resolve => setTimeout(resolve, 200));
            setActiveTab(tab);
        } catch (error) {
            console.error("Erreur lors du changement d'onglet:", error);
        } finally {
            setIsChangingTab(false);
        }
    }, [activeTab, isChangingTab]);

    const [isChangingView,] = useState(false);

    // 🔥 OPTIMISATION : Mémoïsation des données filtrées par onglet
    const tabData = useMemo(() => {
        return {
            factures: getFacturesToDisplay() || [],
            devis: getDevisToDisplay() || [],
            avoirs: getAvoirsToDisplay() || [],
        };
    }, [getFacturesToDisplay, getDevisToDisplay, getAvoirsToDisplay]);

    // Fonction pour filtrer par date
    const filterByDate = useCallback((items) => {
        if (!dateRange.from && !dateRange.to) return items || [];

        return (items || []).filter(item => {
            const itemDate = new Date(item.date);
            const fromDate = dateRange.from ? new Date(dateRange.from) : null;
            const toDate = dateRange.to ? new Date(dateRange.to) : null;

            return (
                (!fromDate || itemDate >= fromDate) &&
                (!toDate || itemDate <= toDate)
            );
        });
    }, [dateRange]);

    // 🔥 OPTIMISATION : Mémoïsation des données filtrées par date
    const filteredTabData = useMemo(() => {
        return {
            factures: filterByDate(tabData.factures),
            devis: filterByDate(tabData.devis),
            avoirs: filterByDate(tabData.avoirs),
        };
    }, [tabData, filterByDate]);

    // 🔥 OPTIMISATION : Mémoïsation des compteurs filtrés
    const filteredTabCounts = useMemo(() => {
        return {
            factures: filteredTabData.factures.length,
            devis: filteredTabData.devis.length,
            avoirs: filteredTabData.avoirs.length,
        };
    }, [filteredTabData]);

    // Fonction pour obtenir les documents de l'onglet actif
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const getDocuments = useCallback(() => {
        return filteredTabData[activeTab] || [];
    });

    // Fonction pour obtenir le statut d'un document (optimisée)
    const getStatus = useCallback((document) => {
        if (!document) return "Attente";

        // Si déjà un statut calculé, on le retourne
        if (document.calculatedStatus) {
            return document.calculatedStatus;
        }

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
            return "Attente";
        }
        // 2. Si montant payé est (presque) égal au total → "Payé"
        else if (Math.abs(montantPaye - totalTTC) < EPSILON) {
            return "Payé";
        }
        // 3. Si montant payé > 0 mais < total → "Accompte"
        else if (montantPaye < totalTTC) {
            return "Accompte";
        }
        // Cas par défaut
        return document.statut ?
            document.statut.charAt(0).toUpperCase() + document.statut.slice(1)
            : "En attente";
    }, []);

    // Gestion de la suppression avec confirmation (optimisée)
    const handleDelete = useCallback(async (id, type) => {
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
    }, [companyId]);

    // Gestion des exports (optimisée)
    const handleExport = useCallback((format) => {
        const currentDocuments = getDocuments();
        const filteredData = currentDocuments
            .filter(item => {
                // Filtre par recherche
                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                        item.numero?.toLowerCase().includes(searchLower) ||
                        (item.clientNom && item.clientNom.toLowerCase().includes(searchLower)) ||
                        (item.objet && item.objet.toLowerCase().includes(searchLower))
                    );
                }
                return true;
            })
            .filter(item => {
                // Filtre par client sélectionné
                if (selectedClient) {
                    return item.clientNom === selectedClient.nom;
                }
                return true;
            });

        const fileName = {
            factures: 'Factures',
            devis: 'Devis',
            avoirs: 'Avoirs'
        }[activeTab];

        if (format === 'excel') {
            exportToExcel(filteredData, fileName);
        } else {
            exportToPDF(filteredData, fileName);
        }
    }, [activeTab, searchTerm, selectedClient, getDocuments]);

    // Gestion du paiement (optimisée)
    const handlePayment = useCallback(async (id, action) => {
        const currentDocuments = getDocuments();
        const docToUpdate = currentDocuments.find(doc => doc.id === id);
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
    }, [companyId, getDocuments]);

    // Duplication de document (optimisée)
    const handleDuplicate = useCallback(async (document) => {
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

            navigate("/invoice", {
                state: {
                    facture: {
                        ...document,
                        id: undefined,
                        date: today,
                        dateEcheance: newDueDate,
                        numero: newNumber,
                        statut: "en attente",
                        clientId: document.clientId
                    },
                    isDuplicate: true,
                    type: document.type || activeTab.slice(0, -1),
                    client: {
                        id: document.clientId,
                        nom: document.clientNom || "",
                        adresse: document.clientAdresse || "",
                        ville: document.clientVille || "",
                        email: document.clientEmail || "",
                    }
                }
            });
        } catch (error) {
            console.error("Erreur duplication:", error);
            message.error("Erreur lors de la duplication");
        }
    }, [companyId, activeTab, navigate]);

    const handleConfirmPayment = useCallback(async (paymentDetails) => {
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
                    statut: newStatus,
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
    }, [currentDocument, companyId]);

    // Remplacer le getTypeColor actuel par :
    const getTypeColor = useCallback(() => {
        switch (activeTab) {
            case "factures": return "#4f46e5"; // Indigo pour les factures
            case "devis": return "#10b981";    // Vert pour les devis
            case "avoirs": return "#f59e0b";   // Orange pour les avoirs
            default: return "#4f46e5";
        }
    }, [activeTab]); // Dépendance sur activeTab
    const getSingularType = useCallback(() => {
        switch (activeTab) {
            case "factures": return "facture";
            case "devis": return "devis";
            case "avoirs": return "avoir";
            default: return "facture";
        }
    }, [activeTab]);
    return (
        <div className="invoices-page-container">
            <div className="navbar-tabs">
                {['factures', 'devis', 'avoirs'].map((tab) => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? "active" : ""} ${isChangingTab ? "disabled" : ""
                            }`}
                        data-type={tab}
                        onClick={() => handleTabChange(tab)}
                        disabled={isChangingTab}
                    >
                        {isChangingTab && activeTab === tab ? (
                            <FaSpinner className="tab-spinner" />
                        ) : null}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        <span className="count-badge">{filteredTabCounts[tab]}</span>
                    </button>
                ))}
            </div>

            <div className="filters-container">
                <ModernDateRangePicker
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    disabled={isChangingTab}
                />

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

                <div style={{ marginLeft: 'auto' }}>
                    <button
                        onClick={() => !isChangingView && navigate("/invoice", { state: { type: getSingularType() } })}
                        className="create-btn"
                        style={{ backgroundColor: getTypeColor() }}
                        disabled={isChangingTab}
                    >
                        <FaPlus className="btn-icon" />
                        Créer{" "}
                        {activeTab === "factures"
                            ? "une Facture"
                            : activeTab === "devis"
                                ? "un Devis"
                                : "un Avoir"}
                    </button>

                </div>
            </div>

            <DocumentSection
                title={currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
                items={getDocuments()}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                navigate={navigate}
                onDelete={handleDelete}
                selectedClient={selectedClient}
                type={typeMapping[activeTab]}
                onPreview={previewPdf}
                onDownload={downloadPdf}
                onDuplicate={handleDuplicate}
                onMarkAsPaid={(id) => !isChangingTab && handlePayment(id, 'paid')}
                onMarkAsPending={(id) => !isChangingTab && handlePayment(id, 'pending')}
                getStatus={getStatus}
                onExport={handleExport}
                getTypeColor={getTypeColor}
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

export default React.memo(InvoicesPage);