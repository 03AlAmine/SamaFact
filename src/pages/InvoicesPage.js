import React, { useState, useCallback, useMemo } from "react";
import DocumentSection from "../components/DocumentSection";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";
import { FaSpinner, FaPlus, FaUser } from "react-icons/fa";
import ModernDateRangePicker from "../components/common/ModernDateRangePicker";
import { downloadPdf, previewPdf } from '../services/pdfService';
import { invoiceService } from '../services/invoiceService';
import ModalPaiement from "../components/dialogs/ModalPaiement";
import { message, Modal, Select } from "antd";

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
    clients = [], // Nouvelle prop pour la liste des clients
    sendingEmails = {},
    onSendEmail
}) => {

    const [modalVisible, setModalVisible] = useState(false);
    const [currentDocument, setCurrentDocument] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [activeTab, setActiveTab] = useState("factures");
    const [isChangingTab, setIsChangingTab] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState("");
    const [selectedFilterClient, setSelectedFilterClient] = useState(null); // NOUVEAU : Filtre client
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
            await new Promise(resolve => setTimeout(resolve, 200));
            setActiveTab(tab);
            // Réinitialiser le filtre client quand on change d'onglet (optionnel)
            // setSelectedFilterClient(null);
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
            factures: getFacturesToDisplay || [],     // ← pas de ()
            devis: getDevisToDisplay || [],
            avoirs: getAvoirsToDisplay || [],
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

    // Fonction pour filtrer par client (NOUVELLE)
    const filterByClient = useCallback((items) => {
        if (!selectedFilterClient) return items || [];

        return (items || []).filter(item =>
            item.clientId === selectedFilterClient.id ||
            item.clientNom === selectedFilterClient.nom
        );
    }, [selectedFilterClient]);

    // 🔥 OPTIMISATION : Données filtrées par date ET par client
    const filteredTabData = useMemo(() => {
        const filteredByDate = {
            factures: filterByDate(tabData.factures),
            devis: filterByDate(tabData.devis),
            avoirs: filterByDate(tabData.avoirs),
        };

        const filteredByClient = {
            factures: filterByClient(filteredByDate.factures),
            devis: filterByClient(filteredByDate.devis),
            avoirs: filterByClient(filteredByDate.avoirs),
        };

        return filteredByClient;
    }, [tabData, filterByDate, filterByClient]);

    // 🔥 OPTIMISATION : Compteurs filtrés
    const filteredTabCounts = useMemo(() => {
        return {
            factures: filteredTabData.factures.length,
            devis: filteredTabData.devis.length,
            avoirs: filteredTabData.avoirs.length,
        };
    }, [filteredTabData]);

    // Fonction pour obtenir les documents de l'onglet actif
    const getDocuments = useCallback(() => {
        return filteredTabData[activeTab] || [];
    }, [filteredTabData, activeTab]);

    // Fonction pour obtenir le statut d'un document (optimisée)
    const getStatus = useCallback((document) => {
        if (!document) return "Attente";

        if (document.calculatedStatus) {
            return document.calculatedStatus;
        }

        const totalTTC = typeof document.totalTTC === 'string'
            ? parseFloat(document.totalTTC.replace(/\s/g, '').replace(',', '.'))
            : document.totalTTC || 0;

        const montantPaye = typeof document.montantPaye === 'string'
            ? parseFloat(document.montantPaye.replace(/\s/g, '').replace(',', '.'))
            : document.montantPaye || 0;

        const EPSILON = 0.01;

        if (montantPaye < EPSILON) {
            return "Attente";
        } else if (Math.abs(montantPaye - totalTTC) < EPSILON) {
            return "Payé";
        } else if (montantPaye < totalTTC) {
            return "Accompte";
        }
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
                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                        item.numero?.toLowerCase().includes(searchLower) ||
                        (item.clientNom && item.clientNom.toLowerCase().includes(searchLower)) ||
                        (item.objet && item.objet.toLowerCase().includes(searchLower))
                    );
                }
                return true;
            });

        const fileName = {
            factures: 'Factures',
            devis: 'Devis',
            avoirs: 'Avoirs'
        }[activeTab];

        const clientSuffix = selectedFilterClient ? `_${selectedFilterClient.nom}` : '';

        if (format === 'excel') {
            exportToExcel(filteredData, `${fileName}${clientSuffix}`);
        } else {
            exportToPDF(filteredData, `${fileName}${clientSuffix}`);
        }
    }, [activeTab, searchTerm, getDocuments, selectedFilterClient]);

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

            const montantPaye = typeof paymentDetails.montantPaye === 'string'
                ? parseFloat(paymentDetails.montantPaye.replace(/\s/g, '').replace(',', '.'))
                : paymentDetails.montantPaye || 0;

            const EPSILON = 0.01;

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
                const statusLabel = newStatus === "payé" ? "payé ✓" : newStatus === "accompte" ? "acompte enregistré ✓" : newStatus;
                message.success(`Document marqué comme ${statusLabel}`);
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

    const getTypeColor = useCallback(() => {
        switch (activeTab) {
            case "factures": return "#4f46e5";
            case "devis": return "#10b981";
            case "avoirs": return "#f59e0b";
            default: return "#4f46e5";
        }
    }, [activeTab]);

    const getSingularType = useCallback(() => {
        switch (activeTab) {
            case "factures": return "facture";
            case "devis": return "devis";
            case "avoirs": return "avoir";
            default: return "facture";
        }
    }, [activeTab]);

    // Nettoyer le filtre client
    const handleClearClientFilter = useCallback(() => {
        setSelectedFilterClient(null);
    }, []);

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
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    flexWrap: 'wrap'
                }}>
                    {/* NOUVEAU : Filtre Client */}
                    {clients.length > 0 && (
                        <div style={{ minWidth: '250px' }}>
                            <Select
                                placeholder="Tous les clients"
                                style={{ width: '100%' }}
                                allowClear
                                value={selectedFilterClient?.id}
                                onChange={(value) => {
                                    const client = clients.find(c => c.id === value);
                                    setSelectedFilterClient(client || null);
                                }}
                                options={clients.map(client => ({
                                    label: client.nom || client.societe || client.name,
                                    value: client.id
                                }))}
                                suffixIcon={<FaUser />}
                            />
                        </div>
                    )}

                    {/* Filtre de date existant */}
                    <div style={{ minWidth: '300px' }}>
                        <ModernDateRangePicker
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            disabled={isChangingTab}
                        />
                    </div>

                    {/* Résumé des filtres mis à jour */}
                    <div className="date-range-summary">
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        {selectedFilterClient && (
                            <> - Client : {selectedFilterClient.nom || selectedFilterClient.societe}</>
                        )}
                        {dateRange.from || dateRange.to ? (
                            <>
                                {" du "}
                                {dateRange.from?.toLocaleDateString('fr-FR') || '...'}
                                {" au "}
                                {dateRange.to?.toLocaleDateString('fr-FR') || '...'}
                            </>
                        ) : " (Toutes dates)"}
                    </div>

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
                selectedFilterClient={selectedFilterClient}
                onClearClientFilter={handleClearClientFilter}
                sendingEmails={sendingEmails}
                onSendEmail={onSendEmail}

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