import React, { useState, useEffect, useCallback } from "react";
import { exportToExcel, exportToPDF } from "../components/exportUtils";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import ModernDateRangePicker from "../components/ModernDateRangePicker";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";
import { previewPayrollPdf, downloadPayrollPdf } from '../services/pdf_payrollService';
import { payrollService } from '../services/payrollService';
import ModalPaiement from "../components/ModalPaiement";
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
    const [modalVisible, setModalVisible] = useState(false);
    const [currentPayroll, setCurrentPayroll] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [activeTab, setActiveTab] = useState("all"); // all, draft, validated, paid, cancelled

    // Fonction pour obtenir le statut d'un bulletin
    const getStatus = (payroll) => {
        const statusMap = {
            draft: "Brouillon",
            validated: "Validé",
            paid: "Payé",
            cancelled: "Annulé"
        };
        return statusMap[payroll.statut] || payroll.statut;
    };

    // Fonction pour filtrer par date
    const filterByDate = useCallback((items) => {
        if (!dateRange.from && !dateRange.to) return items;

        return items.filter(item => {
            const itemDate = new Date(item.periode.au);
            const fromDate = dateRange.from ? new Date(dateRange.from) : null;
            const toDate = dateRange.to ? new Date(dateRange.to) : null;

            return (
                (!fromDate || itemDate >= fromDate) &&
                (!toDate || itemDate <= toDate)
            );
        });
    }, [dateRange]);

    // Chargement des bulletins depuis Firestore
    useEffect(() => {
        if (!currentUser || !companyId) return;

        const payrollsRef = collection(db, `companies/${companyId}/payrolls`);
        let conditions = [];

        // Filtre par employé si sélectionné
        if (selectedEmployee) {
            conditions.push(where("employeeId", "==", selectedEmployee.id));
        }

        // Filtre par statut si différent de "all"
        if (activeTab !== "all") {
            conditions.push(where("statut", "==", activeTab));
        }

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
            setPayrolls(payrollsData);
        });

        return () => unsubscribe();
    }, [currentUser, companyId, selectedEmployee, activeTab]);

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
        const data = filterByDate(payrolls);
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

    // Duplication de bulletin
    const handleDuplicate = async (payroll) => {
        try {
            const newNumber = await payrollService.generatePayrollNumber(companyId);

            navigate("/payroll", {
                state: {
                    payroll: {
                        ...payroll,
                        id: undefined,
                        numero: newNumber,
                        statut: "draft",
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    isDuplicate: true,
                    employee: employees.find(e => e.id === payroll.employeeId)
                }
            });
        } catch (error) {
            console.error("Erreur duplication:", error);
            message.error("Erreur lors de la duplication");
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
        const payrollToPay = payrolls.find(p => p.id === id);
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
            okText: 'Annuler',
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

    // Dans votre gestionnaire de preview/download
    const handlePreview = (payroll) => {
        // Conversion des dates Firestore si nécessaire
        const convertFirestoreDate = (date) => {
            if (!date) return new Date().toISOString().split('T')[0];
            return date.toDate ? date.toDate().toISOString().split('T')[0] : date;
        };

        // Structure complète des données pour le PDF
        const payrollData = {
            employee: {
                id: payroll.employeeId,
                nom: payroll.employeeName?.split(' ')[0] || 'Non',
                prenom: payroll.employeeName?.split(' ').slice(1).join(' ') || 'spécifié',
                matricule: payroll.matricule || '',
                poste: payroll.poste || '',
                salaireBase: payroll.remuneration?.salaireBase || 0,
                dateEmbauche: payroll.dateEmbauche || new Date().toISOString(),
                address: payroll.address || '',
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
                    salaire: payroll.retenues?.salaire || 0,
                    qpartipm: payroll.retenues?.qpartipm || 0,
                    ipm: payroll.retenues?.ipm || 0,
                    avances: payroll.retenues?.avances || 0,
                    trimf: payroll.retenues?.trimf || 0,
                    cfce: payroll.retenues?.cfce || 0,
                    ir: payroll.retenues?.ir || 0
                },
                numero: payroll.numero || 'NONUM'
            },
            calculations: {
                brutSocial: payroll.calculations?.brutSocial || 0,
                brutFiscal: payroll.calculations?.brutFiscal || 0,
                cotisationsSalariales: payroll.calculations?.cotisationsSalariales || 0,
                cotisationsPatronales: payroll.calculations?.cotisationsPatronales || 0,
                salaireNet: payroll.calculations?.salaireNet || 0,
                salaireNetAPayer: payroll.calculations?.salaireNetAPayer || 0,
                detailsCotisations: {
                    ipresRG: payroll.calculations?.detailsCotisations?.ipresRG || 0,
                    ipresRC: payroll.calculations?.detailsCotisations?.ipresRC || 0,
                    ipresRGP: payroll.calculations?.detailsCotisations?.ipresRGP || 0,
                    ipresRCP: payroll.calculations?.detailsCotisations?.ipresRCP || 0,
                    allocationFamiliale: payroll.calculations?.detailsCotisations?.allocationFamiliale || 0,
                    accidentTravail: payroll.calculations?.detailsCotisations?.accidentTravail || 0,
                    trimf: payroll.calculations?.detailsCotisations?.trimf || 0,
                    cfce: payroll.calculations?.detailsCotisations?.cfce || 0,
                    ir: payroll.calculations?.detailsCotisations?.ir || 0
                }
            },
            companyInfo: {
                name: "LEADER INTERIM & SERVICES",
                address: "Ouest Foire, Parcelle N°1, Route de l'aéroport, Dakar",
                phone: "33-820-88-46 / 78-434-30-16",
                email: "infos@leaderinterime.com",
                rc: "SN 2015 B24288",
                ninea: "0057262212 A2"
            }
        };

        console.log('Données envoyées au PDF:', payrollData); // Pour débogage

        previewPayrollPdf(
            payrollData.employee,
            payrollData.formData,
            payrollData.calculations,
            payrollData.companyInfo
        );
    };

    // Exemple d'appel
    const handleDownload = async (payroll) => {
        try {
            await downloadPayrollPdf(
                {
                    id: payroll.employeeId,
                    nom: payroll.employeeName?.split(' ')[0] || '',
                    prenom: payroll.employeeName?.split(' ').slice(1).join(' ') || '',
                    matricule: payroll.matricule || '',
                    poste: payroll.poste || '',
                    salaireBase: payroll.remuneration?.salaireBase || 0
                },
                {
                    periode: payroll.periode,
                    remuneration: payroll.remuneration,
                    primes: payroll.primes,
                    retenues: payroll.retenues,
                    numero: payroll.numero
                },
                payroll.calculations,
                {
                   // name: "VOTRE ENTREPRISE",
                    // ... autres infos
                }
            );
        } catch (error) {
            console.error(error);
            alert("Erreur lors du téléchargement");
        }
    };
    return (
        <div className="payrolls-page-container">
            <div className="navbar-tabs">
                {['all', 'draft', 'validated', 'paid', 'cancelled'].map((tab) => (
                    <button
                        key={tab}
                        className={activeTab === tab ? "active" : ""}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'all' ? 'Tous' :
                            tab === 'draft' ? 'Brouillons' :
                                tab === 'validated' ? 'Validés' :
                                    tab === 'paid' ? 'Payés' : 'Annulés'} ({filterByDate(payrolls.filter(p =>
                                        tab === 'all' ? true : p.statut === tab
                                    )).length})
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
                items={filterByDate(payrolls.filter(p =>
                    activeTab === 'all' ? true : p.statut === activeTab
                ))}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                navigate={navigate}
                onDelete={handleDelete}
                selectedEmployee={selectedEmployee}
                type="payroll"
                onPreview={handlePreview}
                onDownload={handleDownload}
                onDuplicate={handleDuplicate}
                onValidate={handleValidate}
                onMarkAsPaid={handlePayment}
                onCancel={handleCancel}
                getStatus={getStatus}
                showEmployeeColumn={!selectedEmployee}
            />

            <ModalPaiement
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                onConfirm={handleConfirmPayment}
                payroll={currentPayroll}
                loading={paymentLoading}
                isPayroll={true}
            />
        </div>
    );
};

export default PayrollsPage;