import React, { useState, useEffect } from "react";
import DocumentSection from "../components/DocumentSection";
import { exportToExcel, exportToPDF } from "../components/exportUtils";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import ModernDateRangePicker from "../components/ModernDateRangePicker";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext"; // ou ton propre contexte auth
import { downloadPdf, previewPdf } from '../services/pdfService';
import { invoiceService } from '../services/invoiceService';

const InvoicesPage = ({
    activeTab_0,
    setActiveTab_0,
    searchTerm,
    setSearchTerm,
    navigate,
    handleDeleteFacture,
    selectedClient,
    companyId,
}) => {
    const { currentUser } = useAuth(); // récupération de l'utilisateur connecté

    const [factures, setFactures] = useState([]);
    const [devis, setDevis] = useState([]);
    const [avoirs, setAvoirs] = useState([]);

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

    useEffect(() => {
        if (!currentUser || !companyId) return;

        const facturesRef = collection(db, `companies/${companyId}/factures`);

        // Pour chaque type, construire la requête en fonction du rôle
        const buildQuery = (type) => {
            if (currentUser.role === 'admin') {
                // Admin : pas de filtre sur userId, mais filtrage sur le type uniquement
                return query(facturesRef, where("type", "==", type));
            } else {
                // Autres utilisateurs : filtrer sur userId et type
                return query(
                    facturesRef,
                    where("userId", "==", currentUser.uid),
                    where("type", "==", type)
                );
            }
        };

        const qFactures = buildQuery("facture");
        const qDevis = buildQuery("devis");
        const qAvoirs = buildQuery("avoir");

        const unsubFactures = onSnapshot(qFactures, (snapshot) => {
            setFactures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubDevis = onSnapshot(qDevis, (snapshot) => {
            setDevis(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubAvoirs = onSnapshot(qAvoirs, (snapshot) => {
            setAvoirs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubFactures();
            unsubDevis();
            unsubAvoirs();
        };
    }, [currentUser, companyId]);


    // Mettre à jour les éléments filtrés quand la date ou l'onglet change
    useEffect(() => {
        setFilteredItems({
            factures: filterItemsByDate(factures),
            devis: filterItemsByDate(devis),
            avoirs: filterItemsByDate(avoirs)
        });
    }, [dateRange, activeTab_0, factures, devis, avoirs, filterItemsByDate]);

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
    // Remplacez handleDownload par:
    const handleDownload = async (facture) => {
        try {
            await downloadPdf(facture);
        } catch (error) {
            alert(`Échec du téléchargement: ${error.message}`);
        }
    };

    // Ajoutez cette fonction pour l'aperçu:
    const handlePreview = async (facture) => {
        try {
            await previewPdf(facture);
        } catch (error) {
            alert(`Échec de l'aperçu: ${error.message}`);
        }
    };


    // eslint-disable-next-line no-unused-vars
    const [data, setData] = useState({
        facture: {
            // mets ici la structure initiale de ta facture
            Type: [],
            Numéro: [],
            Date: []
        }
    });

    const handleDuplicateDocument = async (document, newType = "facture") => {
        // Créer une nouvelle date pour la facture dupliquée
        const today = new Date();
        const newDate = today.toISOString().split('T')[0];

        // Créer une nouvelle date d'échéance (7 jours plus tard)
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 7);
        const newDueDate = dueDate.toISOString().split('T')[0];

        let newNumber = `Test`; // Valeur temporaire par défaut

        try {
            newNumber = await invoiceService.generateInvoiceNumber(companyId, new Date(), newType);
            setData(prev => ({
                ...prev,
                facture: {
                    ...prev.facture,
                    Type: [newType],
                    Numéro: [newNumber]
                }
            }));
        } catch (error) {
            console.error("Erreur génération numéro:", error);
            setData(prev => ({
                ...prev,
                facture: {
                    ...prev.facture,
                    Type: [newType]
                }
            }));
        }

        navigate("/bill", {
            state: {
                facture: {
                    ...document,
                    id: undefined,  // NE PAS transmettre l'ID original
                    date: newDate,
                    dateEcheance: newDueDate,
                    numero: newNumber,
                    objet: document.objet || "",
                    ribs: document.ribs || [],
                    showSignature: document.showSignature !== false
                },
                isDuplicate: true,
                type: newType,
                client: {
                    nom: document.clientNom || "",
                    adresse: document.clientAdresse || "",
                    ville: document.clientVille || ""
                }
            }
        });

    };

    const handleMarkAsPaid = async (invoiceId, type) => {
        try {
            const result = await invoiceService.markAsPaid(companyId, invoiceId);
            if (result.success) {
                // Optionnel: Afficher une notification
                alert(result.message);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Erreur:", error);
            alert("Une erreur est survenue lors de la mise à jour du statut");
        }
    };
    const handleMarkAsPending = async (invoiceId, type) => {
        try {
            const result = await invoiceService.markAsPending(companyId, invoiceId);
            if (result.success) {
                alert(result.message);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Erreur:", error);
            alert("Une erreur est survenue lors de l'annulation du statut");
        }
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
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onDuplicate={(doc) => handleDuplicateDocument(doc, "facture")}
                    onMarkAsPaid={handleMarkAsPaid}
                    onMarkAsPending={handleMarkAsPending}


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
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onDuplicate={(doc) => handleDuplicateDocument(doc, "devis")}
                    onMarkAsPaid={handleMarkAsPaid}
                    onMarkAsPending={handleMarkAsPending}


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
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onDuplicate={(doc) => handleDuplicateDocument(doc, "avoir")}
                    onMarkAsPaid={handleMarkAsPaid}
                    onMarkAsPending={handleMarkAsPending}


                />
            )}
        </>
    );
};

export default InvoicesPage;