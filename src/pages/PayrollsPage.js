import React, { useState, useEffect, useCallback, useMemo } from "react";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import ModernDateRangePicker from "../components/docpayroll/ModernDateRangePicker";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";
import { previewPayrollPdf, downloadPayrollPdf } from '../services/pdf_payrollService';
import { payrollService } from '../services/payrollService';
import ModalPaiementPayroll from "../components/dialogs/ModalPaiementPay";
import { message, Modal } from "antd";
import PayrollSection from "../components/DocumentSectionPayroll";

const PayrollsPage = ({
    searchTerm,
    setSearchTerm,
    navigate,
    selectedEmployee,
    companyId,
    employees
}) => {
    const { currentUser } = useAuth();
    const [payrolls, setPayrolls] = useState([]);
    const [allPayrolls, setAllPayrolls] = useState([]); // Nouvel état pour tous les bulletins
    const [modalVisible, setModalVisible] = useState(false);
    const [currentPayroll, setCurrentPayroll] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [activeTab, setActiveTab] = useState("all"); // all, draft, validated, paid
    const [, setLoading] = useState(false);
    // Fonction pour obtenir le statut d'un bulletin
    const getStatus = (payroll) => {
        const statusMap = {
            draft: "Brouillon",
            validated: "Validé",
            paid: "Payé",
            partially_paid: "Partiellement payé",
        };
        return statusMap[payroll.statut] || payroll.statut;
    };

    // Fonction pour filtrer par date
    const filterByDate = useCallback((items) => {
        if (!dateRange.from && !dateRange.to) return items;

        return items.filter(item => {
            if (!item.periode || !item.periode.au) return false;

            const itemDate = new Date(item.periode.au);
            const fromDate = dateRange.from ? new Date(dateRange.from) : null;
            const toDate = dateRange.to ? new Date(dateRange.to) : null;

            // Réinitialiser l'heure pour une comparaison correcte
            if (fromDate) fromDate.setHours(0, 0, 0, 0);
            if (toDate) toDate.setHours(23, 59, 59, 999);
            itemDate.setHours(12, 0, 0, 0);

            return (
                (!fromDate || itemDate >= fromDate) &&
                (!toDate || itemDate <= toDate)
            );
        });
    }, [dateRange]);

    // Chargement de TOUS les bulletins depuis Firestore (sans filtre de statut)
    useEffect(() => {
        if (!currentUser || !companyId) return;

        const payrollsRef = collection(db, `companies/${companyId}/payrolls`);
        let conditions = [];

        // Filtre par employé si sélectionné
        if (selectedEmployee) {
            conditions.push(where("employeeId", "==", selectedEmployee.id));
        }

        // NE PAS filtrer par statut ici pour avoir tous les bulletins
        const q = query(payrollsRef, ...conditions, orderBy("periode.au", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const payrollsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                periode: {
                    du: typeof doc.data().periode.du?.toDate === 'function'
                        ? doc.data().periode.du.toDate()
                        : doc.data().periode.du || null,
                    au: typeof doc.data().periode.au?.toDate === 'function'
                        ? doc.data().periode.au.toDate()
                        : doc.data().periode.au || null
                }
            }));
            setAllPayrolls(payrollsData); // Stocker tous les bulletins
        });

        return () => unsubscribe();
    }, [currentUser, companyId, selectedEmployee]); // Retirer activeTab des dépendances

    // Filtrer les bulletins selon l'onglet actif
    useEffect(() => {
        if (activeTab === "all") {
            setPayrolls(allPayrolls);
        } else {
            setPayrolls(allPayrolls.filter(p => p.statut === activeTab));
        }
    }, [allPayrolls, activeTab]);

    // Calcul des compteurs pour chaque onglet
    const { tabCounts, filteredItems } = useMemo(() => {
        const filteredByDate = filterByDate(allPayrolls); // Utiliser allPayrolls pour les compteurs

        const counts = {
            all: filteredByDate.length,
            draft: filteredByDate.filter(p => p.statut === "draft").length,
            validated: filteredByDate.filter(p => p.statut === "validated").length,
            paid: filteredByDate.filter(p => p.statut === "paid" || p.statut === "partially_paid").length,
        };

        // Filtrer les éléments pour l'affichage (utiliser payrolls qui est déjà filtré par statut)
        const itemsToDisplay = filterByDate(payrolls);

        return { tabCounts: counts, filteredItems: itemsToDisplay };
    }, [allPayrolls, payrolls, filterByDate]);

    // Gestion de la suppression avec confirmation
    const handleDelete = async (id) => {
        Modal.confirm({
            title: 'Confirmer la suppression',
            content: 'Êtes-vous sûr de vouloir supprimer ce bulletin de paie ? Cette action est irréversible.',
            okText: 'Supprimer',
            okType: 'danger',
            cancelText: 'Annuler',
            onOk: async () => {
                try {
                    const result = await payrollService.deletePayroll(companyId, id);
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
        const data = filterByDate(allPayrolls); // Exporter tous les bulletins filtrés par date
        const fileName = `Bulletins_de_paie_${selectedEmployee ? selectedEmployee.nom : ''}`;

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

    // Gestion de la validation
    const handleValidate = async (id) => {
        Modal.confirm({
            title: 'Confirmer la validation',
            content: 'Êtes-vous sûr de vouloir valider ce bulletin de paie ?',
            okText: 'Valider',
            cancelText: 'Annuler',
            onOk: async () => {
                try {
                    const result = await payrollService.validatePayroll(companyId, id);
                    if (result.success) {
                        message.success("Bulletin validé avec succès");
                    } else {
                        message.error(result.message);
                    }
                } catch (error) {
                    console.error("Erreur:", error);
                    message.error("Erreur lors de la validation");
                }
            }
        });
    };

    // Gestion du paiement
    const handlePayment = (id) => {
        const payrollToPay = allPayrolls.find(p => p.id === id);
        setCurrentPayroll(payrollToPay);
        setModalVisible(true);
    };

    const handleConfirmPayment = async (paymentDetails) => {
        if (!currentPayroll) return;

        setPaymentLoading(true);
        try {
            const result = await payrollService.markAsPaid(
                companyId,
                currentPayroll.id,
                paymentDetails
            );

            if (result.success) {
                message.success("Bulletin marqué comme payé");
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

    // Gestion de l'annulation
    const handleCancel = async (id) => {
        Modal.confirm({
            title: 'Confirmer l\'annulation',
            content: 'Êtes-vous sûr de vouloir annuler ce bulletin de paie ?',
            okText: 'Confirmer',
            okType: 'danger',
            cancelText: 'Retour',
            onOk: async () => {
                try {
                    const result = await payrollService.cancelPayroll(companyId, id);
                    if (result.success) {
                        message.success("Bulletin annulé avec succès");
                    } else {
                        message.error(result.message);
                    }
                } catch (error) {
                    console.error("Erreur:", error);
                    message.error("Erreur lors de l'annulation");
                }
            }
        });
    };

    // Fonction pour préparer les données communes
    const preparePayrollData = (payroll) => {
        const convertFirestoreDate = (date) => {
            if (!date) return new Date().toISOString().split('T')[0];
            return date.toDate ? date.toDate().toISOString().split('T')[0] : date;
        };

        return {
            employee: {
                id: payroll.employeeId,
                nom: payroll.employeeName?.split(' ')[0] || 'Non',
                prenom: payroll.employeeName?.split(' ').slice(1).join(' ') || 'spécifié',
                matricule: payroll.employeeMatricule || '',
                poste: payroll.employeePosition || '',
                salaireBase: payroll.remuneration?.salaireBase || 0,
                dateEmbauche: payroll.dateEmbauche || new Date().toISOString(),
                adresse: payroll.employeeAddresse || '',
                categorie: payroll.employeeCategorie || '',
                typeContrat: payroll.typeContrat || 'CDI'
            },
            formData: {
                periode: {
                    du: convertFirestoreDate(payroll.periode?.du),
                    au: convertFirestoreDate(payroll.periode?.au)
                },
                remuneration: {
                    salaireBase: payroll.remuneration?.salaireBase || 0,
                    sursalaire: payroll.remuneration?.sursalaire || 0,
                    indemniteDeplacement: payroll.remuneration?.indemniteDeplacement || 0,
                    autresIndemnites: payroll.remuneration?.autresIndemnites || 0,
                    avantagesNature: payroll.remuneration?.avantagesNature || 0
                },
                primes: {
                    transport: payroll.primes?.transport || 0,
                    panier: payroll.primes?.panier || 0,
                    repas: payroll.primes?.repas || 0,
                    anciennete: payroll.primes?.anciennete || 0,
                    responsabilite: payroll.primes?.responsabilite || 0,
                    autresPrimes: payroll.primes?.autresPrimes || 0
                },
                retenues: {
                    retenueSalaire: payroll.retenues?.retenueSalaire || 0,
                    qpartipm: payroll.retenues?.qpartipm || 0,
                    ipm: payroll.retenues?.ipm || 0,
                    avances: payroll.retenues?.avances || 0,
                    trimf: payroll.retenues?.trimf || 0,
                    cfce: payroll.retenues?.cfce || 0,
                    ir: payroll.retenues?.ir || 0
                },
                numero: payroll.numero || 'NONUM'
            },
            calculations: payroll.calculations || {},
            companyInfo: {
                name: "LEADER INTERIM & SERVICES",
                address: "Ouest Foire, Parcelle N°1, Route de l'aéroport, Dakar",
                phone: "33-820-88-46 / 78-434-30-16",
                email: "infos@leaderinterime.com",
                rc: "SN 2015 B24288",
                ninea: "0057262212 A2"
            }
        };
    };

    // Utilisation pour l'aperçu
    const handlePreview = (payroll) => {
        const payrollData = preparePayrollData(payroll);
        previewPayrollPdf(
            payrollData.employee,
            payrollData.formData,
            payrollData.calculations,
            payrollData.companyInfo
        );
    };

    // Utilisation pour le téléchargement
    const handleDownload = async (payroll) => {
        const payrollData = preparePayrollData(payroll);
        try {
            await downloadPayrollPdf(
                payrollData.employee,
                payrollData.formData,
                payrollData.calculations,
                payrollData.companyInfo
            );
        } catch (error) {
            console.error(error);
            alert("Erreur lors du téléchargement");
        }
    };


    const handleEdit = (payroll) => {
        const selectedEmployee = employees.find(e => e.id === payroll.employeeId);

        navigate("/payroll", {
            state: {
                payroll: {
                    // Données de base
                    id: payroll.id,
                    employeeId: payroll.employeeId,
                    employeeName: payroll.employeeName,
                    employeeMatricule: payroll.employeeMatricule,
                    employeePosition: payroll.employeePosition,
                    employeeAddresse: payroll.employeeAddresse,
                    employeeCategorie: payroll.employeeCategorie,
                    nbreofParts: payroll.nbreofParts || 1, // Ajout important!
                    dateEmbauche: payroll.dateEmbauche,
                    typeContrat: payroll.typeContrat,
                    statut: payroll.statut,
                    numero: payroll.numero,
                    createdAt: payroll.createdAt,
                    updatedAt: payroll.updatedAt,

                    // Données structurées comme attendues par PayrollForm
                    periode: payroll.periode,
                    remuneration: payroll.remuneration || {
                        tauxHoraire: '0',
                        salaireBase: '0',
                        sursalaire: '0',
                        indemniteDeplacement: '0',
                        autresIndemnites: '0',
                        avantagesNature: '0'
                    },
                    primes: payroll.primes || {
                        transport: '26000',
                        panier: '0',
                        repas: '0',
                        anciennete: '0',
                        responsabilite: '0',
                        autresPrimes: '0'
                    },
                    retenues: payroll.retenues || {
                        retenueSalaire: '0',
                        qpartipm: '0',
                        avances: '0',
                        trimf: '300',
                        cfce: '0',
                        ir: '0'
                    },
                    calculations: payroll.calculations || {},
                },
                employee: selectedEmployee,
                isEditing: true
            }
        });
    };

    // Fonction utilitaire pour nettoyer les données de duplication
    const cleanDuplicatedPayroll = (originalPayroll, newNumber) => {
        const {
            id,
            createdAt,
            updatedAt,
            statut,
            numero,
            paymentDetails,
            montantPaye,
            validatedAt,
            paidAt,
            cancelledAt,
            ...cleanedData
        } = originalPayroll;

        return {
            ...cleanedData,
            numero: newNumber,
            statut: "draft",
            createdAt: new Date(),
            updatedAt: new Date(),
            periode: {
                du: new Date().toISOString().split('T')[0],
                au: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
            }
        };
    };

    // Utilisation dans handleDuplicate
    const handleDuplicate = async (payroll) => {
        try {
            const newNumber = await payrollService.generatePayrollNumber(companyId);
            const selectedEmployee = employees.find(e => e.id === payroll.employeeId);

            // Nettoyer les données pour la duplication
            const duplicatedPayroll = cleanDuplicatedPayroll(payroll, newNumber);

            navigate("/payroll", {
                state: {
                    payroll: duplicatedPayroll,
                    employee: selectedEmployee,
                    isDuplicate: true
                }
            });

        } catch (error) {
            console.error("Erreur lors de la duplication:", error);
            message.error("Erreur lors de la duplication du bulletin");
        }
    };

    // Fonction pour générer automatiquement un bulletin
const handleGenerate = async (payroll) => {
    Modal.confirm({
        title: 'Générer un nouveau bulletin',
        content: 'Cette action va créer un nouveau bulletin basé sur ce modèle et télécharger automatiquement le PDF.',
        okText: 'Générer',
        cancelText: 'Annuler',
        onOk: async () => {
            try {
                setLoading(true);
                
                const newNumber = await payrollService.generatePayrollNumber(companyId);
                const selectedEmployee = employees.find(e => e.id === payroll.employeeId);

                if (!selectedEmployee) {
                    throw new Error("Employé non trouvé");
                }

                // Préparer les données pour le nouveau bulletin
                const generatedPayroll = {
                    ...cleanDuplicatedPayroll(payroll, newNumber),
                    periode: {
                        du: new Date().toISOString().split('T')[0],
                        au: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
                    }
                };

                const payrollData = payrollService.preparePayrollData(
                    generatedPayroll,
                    payroll.calculations || {},
                    selectedEmployee
                );

                // Enregistrer en base de données
                const result = await payrollService.addPayroll(
                    companyId,
                    currentUser.uid,
                    payrollData
                );

                if (result.success) {
                    message.success("Bulletin généré et enregistré avec succès !");
                    
                    // Préparer les données pour le PDF
                    const payrollDataForPdf = preparePayrollData({
                        ...payrollData,
                        id: result.id,
                        numero: newNumber
                    });
                    
                    // Télécharger le PDF
                    await downloadPayrollPdf(
                        payrollDataForPdf.employee,
                        payrollDataForPdf.formData,
                        payrollDataForPdf.calculations,
                        payrollDataForPdf.companyInfo
                    );
                    
                } else {
                    message.error(result.message);
                }
            } catch (error) {
                console.error("Erreur lors de la génération:", error);
                message.error(error.message || "Erreur lors de la génération du bulletin");
            } finally {
                setLoading(false);
            }
        }
    });
};

    // Fonction pour obtenir le nom affiché de l'onglet
    const getTabDisplayName = (tab) => {
        const names = {
            'all': 'Tous',
            'draft': 'Brouillons',
            'validated': 'Validés',
            'paid': 'Payés',
        };
        return names[tab] || tab;
    };

    return (
        <div className="payrolls-page-container">
            <div className="navbar-tabs">
                {['all', 'draft', 'validated', 'paid'].map((tab) => (
                    <button
                        key={tab}
                        className={activeTab === tab ? "active" : ""}
                        onClick={() => setActiveTab(tab)}
                    >
                        {getTabDisplayName(tab)} ({tabCounts[tab]})
                    </button>
                ))}
            </div>

            <div className="filters-container">
                <ModernDateRangePicker dateRange={dateRange} setDateRange={setDateRange} />

                <div className="date-range-summary">
                    {activeTab === 'all' ? 'Tous les bulletins' :
                        activeTab === 'draft' ? 'Brouillons' :
                            activeTab === 'validated' ? 'Bulletins validés' :
                                activeTab === 'paid' ? 'Bulletins payés' : 'Bulletins annulés'}
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

            <PayrollSection
                title="Bulletins de paie"
                items={filteredItems}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                navigate={navigate}
                onDelete={handleDelete}
                onEdit={handleEdit}
                selectedEmployee={selectedEmployee}
                type="payroll"
                onPreview={handlePreview}
                onDownload={handleDownload}
                onDuplicate={handleDuplicate}
                onGenerate={handleGenerate}
                onValidate={handleValidate}
                onMarkAsPaid={handlePayment}
                onCancel={handleCancel}
                getStatus={getStatus}
                showEmployeeColumn={!selectedEmployee}
            />

            <ModalPaiementPayroll
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                onConfirm={handleConfirmPayment}
                payroll={currentPayroll}
                loading={paymentLoading}
            />
        </div>
    );
};

export default PayrollsPage;