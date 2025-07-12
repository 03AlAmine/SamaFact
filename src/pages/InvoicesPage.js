import React, { useState, useEffect } from "react";
import DocumentSection from "../components/DocumentSection";
import { exportToExcel, exportToPDF } from "../components/exportUtils";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import ModernDateRangePicker from "../components/ModernDateRangePicker";
import InvoicePDF from "../bill/InvoicePDF";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext"; // ou ton propre contexte auth

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
    selectedClient,
    companyId
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
    const handleViewDocument = (document) => {
        // Logique pour afficher le document (peut-être une modale ou une page dédiée)
        console.log("Voir document:", document);
    };

    // Dans le composant parent qui utilise DocumentSection
    const handleDownload = async (facture) => {
        try {
            // Transformation des données avec l'objet correctement placé
            const pdfData = {
                facture: {
                    Numéro: [facture.numero || ""],
                    Date: [facture.date || ""],
                    DateEcheance: [facture.dateEcheance || ""],
                    Objet: [facture.objet || "Non spécifié"], // L'objet doit être ici
                    Type: [facture.type || "facture"]
                },
                client: {
                    Nom: [facture.clientNom || ""],
                    Adresse: [facture.clientAdresse || ""],
                    Ville: [facture.clientVille || ""]
                },
                items: facture.items ? {
                    Designation: facture.items.map(i => i.designation || ""),
                    Quantite: facture.items.map(i => i.quantite || ""),
                    "Prix Unitaire": facture.items.map(i => i.prixUnitaire || ""),
                    TVA: facture.items.map(i => i.tva || ""),
                    "Montant HT": facture.items.map(i => i.montantHT || ""),
                    "Montant TVA": facture.items.map(i => i.montantTVA || ""),
                    "Prix Total": facture.items.map(i => i.prixTotal || "")
                } : {
                    Designation: [],
                    Quantite: [],
                    "Prix Unitaire": [],
                    TVA: [],
                    "Montant HT": [],
                    "Montant TVA": [],
                    "Prix Total": []
                },
                totals: {
                    "Total HT": [facture.totalHT || "0"],
                    "Total TVA": [facture.totalTVA || "0"],
                    "Total TTC": [facture.totalTTC || "0"]
                }
            };

            console.log("Données envoyées au PDF:", pdfData); // Vérifiez que l'objet est présent

            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(
                <InvoicePDF
                    data={pdfData}
                    ribType={facture.ribs || ["CBAO"]} // Assurez-vous que c'est toujours un tableau
                    objet={facture.objet || "Non spécifié"} // Passage direct de l'objet
                />
            ).toBlob();
            // Téléchargement
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${facture.type}_${facture.numero}.pdf`;
            document.body.appendChild(link);
            link.click();

            // Nettoyage
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);

        } catch (error) {
            console.error("Échec du téléchargement:", error);
            alert(`Échec du téléchargement: ${error.message}`);
        }
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
                type: document.type, // <--- AJOUTÉ ICI

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
                    onDownload={handleDownload}
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
                    onDownload={handleDownload}
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
                    onDownload={handleDownload}
                    onDuplicate={handleDuplicateDocument}

                />
            )}
        </>
    );
};

export default InvoicesPage;