import React, { useState, useEffect } from "react";
import DocumentSection from "../components/DocumentSection";
import { exportToExcel, exportToPDF } from "../components/exportUtils";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import ModernDateRangePicker from "../components/ModernDateRangePicker";

const InvoicesPage = ({
    activeTab_0,
    setActiveTab_0,
    getFacturesToDisplay,
    getDevisToDisplay,
    getAvoirsToDisplay,
    searchTerm,
    setSearchTerm,
    navigate,
    handleDeleteFacture,
    selectedClient
}) => {
    const [dateRange, setDateRange] = useState({
        from: null,
        to: null
    });
    const [filteredItems, setFilteredItems] = useState({
        factures: [],
        devis: [],
        avoirs: []
    });

    // Fonction pour filtrer les éléments en fonction de la plage de dates
    const filterItemsByDate = React.useCallback((items) => {
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

    // Mettre à jour les éléments filtrés quand la date ou l'onglet change
    useEffect(() => {
        setFilteredItems({
            factures: filterItemsByDate(getFacturesToDisplay()),
            devis: filterItemsByDate(getDevisToDisplay()),
            avoirs: filterItemsByDate(getAvoirsToDisplay())
        });
    }, [dateRange, activeTab_0, getFacturesToDisplay, getDevisToDisplay, getAvoirsToDisplay, filterItemsByDate]);

    const handleExport = (type) => {
        let data = [];
        let fileName = '';

        switch (activeTab_0) {
            case 'factures':
                data = filteredItems.factures;
                fileName = 'Factures';
                break;
            case 'devis':
                data = filteredItems.devis;
                fileName = 'Devis';
                break;
            case 'avoirs':
                data = filteredItems.avoirs;
                fileName = 'Avoirs';
                break;
            default:
                return;
        }

        if (type === 'excel') {
            exportToExcel(data, fileName, {
                from: dateRange.from ? dateRange.from.toISOString().split('T')[0] : '',
                to: dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''
            });
        } else {
            exportToPDF(data, fileName, {
                from: dateRange.from ? dateRange.from.toISOString().split('T')[0] : '',
                to: dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''
            });
        }
    };
    const handleViewDocument = (document) => {
        // Logique pour afficher le document (peut-être une modale ou une page dédiée)
        console.log("Voir document:", document);
    };

    const handleDownloadDocument = (document) => {
        // Logique pour télécharger le document (génération PDF par exemple)
        console.log("Télécharger document:", document);
    };

const handleDuplicateDocument = (document) => {
    // Créer une nouvelle date pour la facture dupliquée
    const today = new Date();
    const newDate = today.toISOString().split('T')[0];
    
    // Créer une nouvelle date d'échéance (7 jours plus tard)
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 7);
    const newDueDate = dueDate.toISOString().split('T')[0];

    // Créer une copie du document avec les nouvelles dates
    const duplicatedDocument = {
        ...document,
        date: newDate,
        dateEcheance: newDueDate,
        // Le numéro sera généré automatiquement dans le composant Fact
        numero: 'AUTO' // Ceci sera remplacé par le vrai numéro généré
    };

    navigate("/bill", { 
        state: { 
            facture: duplicatedDocument, 
            isDuplicate: true,
            client: {
                nom: document.clientNom,
                adresse: document.clientAdresse
            }
        } 
    });
};

    return (
        <>
            <div className="navbar-tabs">
                <button
                    className={activeTab_0 === "factures" ? "active" : ""}
                    onClick={() => setActiveTab_0("factures")}
                >
                    Factures ({filteredItems.factures.length})
                </button>
                <button
                    className={activeTab_0 === "devis" ? "active" : ""}
                    onClick={() => setActiveTab_0("devis")}
                >
                    Devis ({filteredItems.devis.length})
                </button>
                <button
                    className={activeTab_0 === "avoirs" ? "active" : ""}
                    onClick={() => setActiveTab_0("avoirs")}
                >
                    Avoirs ({filteredItems.avoirs.length})
                </button>
            </div>

            {/* Nouveau filtre de date moderne */}
            <div className="filters-container">
                <ModernDateRangePicker dateRange={dateRange} setDateRange={setDateRange} />

                <div className="date-range-summary-container">
                    <div className="date-range-summary">
                        {activeTab_0 === "factures" && "Factures"}
                        {activeTab_0 === "devis" && "Devis"}
                        {activeTab_0 === "avoirs" && "Avoirs"}
                        {dateRange.from || dateRange.to ? (
                            <>
                                {" du "}
                                {dateRange.from ? dateRange.from.toLocaleDateString('fr-FR') : '...'}
                                {" au "}
                                {dateRange.to ? dateRange.to.toLocaleDateString('fr-FR') : '...'}
                            </>
                        ) : " (Toutes dates)"}
                    </div>
                </div>


                <div className="export-buttons">
                    <button
                        onClick={() => handleExport('excel')}
                        className="export-btn-excel"
                        title="Exporter en Excel"
                    >
                        <FaFileExcel /> Excel
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="export-btn-pdf"
                        title="Exporter en PDF"
                    >
                        <FaFilePdf /> PDF
                    </button>
                </div>
            </div>

            {activeTab_0 === "factures" && (
                <DocumentSection
                    title="Factures"
                    items={filteredItems.factures}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    navigate={navigate}
                    onDelete={handleDeleteFacture}
                    selectedClient={selectedClient}
                    type="facture"
                    onView={handleViewDocument}
                    onDownload={handleDownloadDocument}
                    onDuplicate={handleDuplicateDocument}
                />
            )}
            {activeTab_0 === "devis" && (
                <DocumentSection
                    title="Devis"
                    items={filteredItems.devis}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    navigate={navigate}
                    onDelete={handleDeleteFacture}
                    selectedClient={selectedClient}
                    type="devis"
                    onView={handleViewDocument}
                    onDownload={handleDownloadDocument}
                    onDuplicate={handleDuplicateDocument}
                />
            )}
            {activeTab_0 === "avoirs" && (
                <DocumentSection
                    title="Avoirs"
                    items={filteredItems.avoirs}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    navigate={navigate}
                    onDelete={handleDeleteFacture}
                    selectedClient={selectedClient}
                    type="avoir"
                    onView={handleViewDocument}
                    onDownload={handleDownloadDocument}
                    onDuplicate={handleDuplicateDocument}
                />
            )}
        </>
    );
};

export default InvoicesPage;