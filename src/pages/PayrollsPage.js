import React, { useState, useEffect, useCallback, useMemo } from "react";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";
import { FaBuilding, FaPlus } from "react-icons/fa";
import ModernDateRangePicker from "../components/docpayroll/ModernDateRangePicker";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";
import { previewPayrollPdf, downloadPayrollPdf, generateMultiplePayrollsPdf } from '../services/pdf_payrollService';
import { payrollService } from '../services/payrollService';
import ModalPaiementPayroll from "../components/dialogs/ModalPaiementPay";
import { message, Modal, Select, Spin, Progress } from "antd";
import PayrollSection from "../components/DocumentSectionPayroll";


const PayrollsPage = ({
    navigate,
    selectedEmployee,
    companyId,
    employees
}) => {
    const { currentUser } = useAuth();
    const [payrolls, setPayrolls] = useState([]);
    const [allPayrolls, setAllPayrolls] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentPayroll, setCurrentPayroll] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [activeTab, setActiveTab] = useState("all");
    const [loading, setLoading] = useState(false);

    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [companiesLoading, setCompaniesLoading] = useState(false);

    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [departments, setDepartments] = useState([]);

    const [localSearchTerm, setLocalSearchTerm] = useState("");
    const searchTerm = localSearchTerm;
    const setSearchTerm = setLocalSearchTerm;
    // États pour la génération en masse
    const [bulkGeneration, setBulkGeneration] = useState({
        visible: false,
        progress: 0,
        total: 0,
        current: 0,
        status: 'idle',
        generatedCount: 0
    });

    // États pour le téléchargement groupé
    const [bulkDownload, setBulkDownload] = useState({
        visible: false,
        progress: 0,
        total: 0,
        current: 0,
        status: 'idle'
    });

    const Z_INDEX = {
        CONFIRM_MODAL: 1000,
        PROGRESS_MODAL: 2000,
        PAYMENT_MODAL: 1500
    };
    // Ajoutez cet useEffect pour extraire les départements uniques des employés
    useEffect(() => {
        if (employees && employees.length > 0) {
            // Extraire les départements uniques (ignorer les valeurs vides/null/undefined)
            const uniqueDepartments = [...new Set(
                employees
                    .map(emp => emp.departement)
                    .filter(dept => dept && dept.trim() !== '')
            )].sort();

            setDepartments(uniqueDepartments);
        }
    }, [employees]);

    // Charger la liste des entreprises
    useEffect(() => {
        const loadCompanies = async () => {
            if (!currentUser) return;

            if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
                setCompaniesLoading(true);
                try {
                    const companiesRef = collection(db, 'companies');
                    const q = query(companiesRef, orderBy('name'));
                    const unsubscribe = onSnapshot(q, (snapshot) => {
                        const companiesData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        setCompanies(companiesData);
                        setCompaniesLoading(false);
                    });

                    return () => unsubscribe();
                } catch (error) {
                    console.error("Erreur chargement entreprises:", error);
                    setCompaniesLoading(false);
                }
            } else {
                setCompanies([{ id: companyId, name: currentUser.companyName || 'Mon entreprise' }]);
            }
        };

        loadCompanies();
    }, [currentUser, companyId]);

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


    const filterByDateAndDepartment = useCallback((items) => {
        // D'abord filtrer par date
        let filtered = items;

        if (dateRange.from || dateRange.to) {
            filtered = filtered.filter(item => {
                if (!item.periode || !item.periode.au) return false;

                const itemDate = new Date(item.periode.au);
                const fromDate = dateRange.from ? new Date(dateRange.from) : null;
                const toDate = dateRange.to ? new Date(dateRange.to) : null;

                if (fromDate) fromDate.setHours(0, 0, 0, 0);
                if (toDate) toDate.setHours(23, 59, 59, 999);
                itemDate.setHours(12, 0, 0, 0);

                return (
                    (!fromDate || itemDate >= fromDate) &&
                    (!toDate || itemDate <= toDate)
                );
            });
        }
        if (selectedDepartment) {
            // Trouver les employés de ce département
            const employeeIdsInDepartment = employees
                .filter(emp => emp.departement === selectedDepartment)
                .map(emp => emp.id);

            filtered = filtered.filter(item =>
                employeeIdsInDepartment.includes(item.employeeId)
            );
        }

        return filtered;
    }, [dateRange, selectedDepartment, employees]);
    // Chargement des bulletins
    useEffect(() => {
        if (!currentUser) return;

        const targetCompanyId = selectedCompany || companyId;
        if (!targetCompanyId) return;

        const payrollsRef = collection(db, `companies/${targetCompanyId}/payrolls`);
        let conditions = [];

        if (selectedEmployee) {
            conditions.push(where("employeeId", "==", selectedEmployee.id));
        }

        const q = query(payrollsRef, ...conditions, orderBy("periode.au", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const payrollsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                companyId: targetCompanyId,
                periode: {
                    du: typeof doc.data().periode?.du?.toDate === 'function'
                        ? doc.data().periode.du.toDate()
                        : doc.data().periode.du || null,
                    au: typeof doc.data().periode?.au?.toDate === 'function'
                        ? doc.data().periode.au.toDate()
                        : doc.data().periode.au || null
                }
            }));
            setAllPayrolls(payrollsData);
        });

        return () => unsubscribe();
    }, [currentUser, selectedCompany, companyId, selectedEmployee]);

    // Filtrer les bulletins selon l'onglet actif
    useEffect(() => {
        if (activeTab === "all") {
            setPayrolls(allPayrolls);
        } else {
            setPayrolls(allPayrolls.filter(p => p.statut === activeTab));
        }
    }, [allPayrolls, activeTab]);

    // Calcul des compteurs
    const { tabCounts, filteredItems } = useMemo(() => {
        const filteredByDateAndDept = filterByDateAndDepartment(allPayrolls);

        const counts = {
            all: filteredByDateAndDept.length,
            draft: filteredByDateAndDept.filter(p => p.statut === "draft").length,
            validated: filteredByDateAndDept.filter(p => p.statut === "validated").length,
            paid: filteredByDateAndDept.filter(p => p.statut === "paid" || p.statut === "partially_paid").length,
        };

        const itemsToDisplay = filterByDateAndDepartment(payrolls);

        return { tabCounts: counts, filteredItems: itemsToDisplay };
    }, [allPayrolls, payrolls, filterByDateAndDepartment]);


    // Fonction pour générer tous les bulletins filtrés
    const handleGenerateAll = async () => {
        const itemsToGenerate = filterByDateAndDepartment(allPayrolls); // MODIFICATION ICI

        if (itemsToGenerate.length === 0) {
            message.warning("Aucun bulletin à générer");
            return;
        }

        Modal.confirm({
            title: 'Générer tous les bulletins',
            content: (
                <div>
                    <p>Cette action va générer {itemsToGenerate.length} bulletins de paie.</p>
                    {selectedDepartment && <p><strong>Département :</strong> {selectedDepartment}</p>}
                    {dateRange.from && dateRange.to && (
                        <p><strong>Période :</strong> du {dateRange.from.toLocaleDateString('fr-FR')} au {dateRange.to.toLocaleDateString('fr-FR')}</p>
                    )}
                    <p>Voulez-vous continuer ?</p>
                </div>
            ),
            okText: 'Générer',
            cancelText: 'Annuler',
            onOk: async () => {
                setBulkGeneration({
                    visible: true,
                    progress: 0,
                    total: itemsToGenerate.length,
                    current: 0,
                    status: 'generating',
                    generatedCount: 0
                });

                let successCount = 0;
                const errors = [];

                for (let i = 0; i < itemsToGenerate.length; i++) {
                    const payroll = itemsToGenerate[i];
                    try {
                        const newNumber = await payrollService.generatePayrollNumber(
                            selectedCompany || companyId
                        );

                        const selectedEmployee = employees.find(e => e.id === payroll.employeeId);

                        if (!selectedEmployee) {
                            throw new Error(`Employé non trouvé pour le bulletin ${payroll.numero}`);
                        }

                        const cleanDuplicatedPayroll = (original, newNum) => {
                            const { id, createdAt, updatedAt, statut, numero, paymentDetails, montantPaye, validatedAt, paidAt, cancelledAt, ...cleaned } = original;

                            const currentMonthRange = getCurrentMonthDateRange();

                            return {
                                ...cleaned,
                                numero: newNum,
                                statut: "draft",
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                periode: {
                                    du: currentMonthRange.du,
                                    au: currentMonthRange.au
                                }
                            };
                        };

                        const generatedPayroll = cleanDuplicatedPayroll(payroll, newNumber);

                        const payrollData = payrollService.preparePayrollData(
                            generatedPayroll,
                            payroll.calculations || {},
                            selectedEmployee
                        );

                        const result = await payrollService.addPayroll(
                            selectedCompany || companyId,
                            currentUser.uid,
                            payrollData
                        );

                        if (result.success) {
                            successCount++;
                        } else {
                            errors.push(`${payroll.numero}: ${result.message}`);
                        }
                    } catch (error) {
                        errors.push(`${payroll.numero}: ${error.message}`);
                    }

                    setBulkGeneration(prev => ({
                        ...prev,
                        current: i + 1,
                        progress: Math.round(((i + 1) / itemsToGenerate.length) * 100),
                        generatedCount: successCount
                    }));
                }

                setBulkGeneration(prev => ({
                    ...prev,
                    status: 'completed'
                }));

                message.success(`${successCount}/${itemsToGenerate.length} bulletins générés avec succès`);

                if (errors.length > 0) {
                    console.warn("Erreurs de génération:", errors);
                    message.warning(`${errors.length} erreurs lors de la génération`);
                }

                setTimeout(() => {
                    setBulkGeneration(prev => ({ ...prev, visible: false }));
                }, 3000);
            },
            zIndex: Z_INDEX.CONFIRM_MODAL,
            getContainer: false, // Évite les problèmes de hiérarchie
        });
    };

    // Fonction pour télécharger tous les bulletins filtrés
    const handleDownloadAll = async () => {
        const itemsToDownload = filterByDateAndDepartment(allPayrolls); // MODIFICATION ICI

        if (itemsToDownload.length === 0) {
            message.warning("Aucun bulletin à télécharger");
            return;
        }

        Modal.confirm({
            title: 'Télécharger tous les bulletins',
            content: (
                <div>
                    <p>Cette action va télécharger {itemsToDownload.length} bulletins de paie.</p>
                    {selectedDepartment && <p><strong>Département :</strong> {selectedDepartment}</p>}
                    {dateRange.from && dateRange.to && (
                        <p><strong>Période :</strong> du {dateRange.from.toLocaleDateString('fr-FR')} au {dateRange.to.toLocaleDateString('fr-FR')}</p>
                    )}
                    <p>Voulez-vous continuer ?</p>
                </div>
            ),
            okText: 'Télécharger',
            cancelText: 'Annuler',
            onOk: async () => {
                setBulkDownload({
                    visible: true,
                    progress: 0,
                    total: itemsToDownload.length,
                    current: 0,
                    status: 'downloading'
                });

                const preparePayrollData = (payroll) => {
                    const convertFirestoreDate = (date) => {
                        if (!date) return new Date().toISOString().split('T')[0];
                        return date.toDate ? date.toDate().toISOString().split('T')[0] : date;
                    };

                    const employee = employees.find(e => e.id === payroll.employeeId) || {};

                    return {
                        employee: {
                            id: payroll.employeeId,
                            nom: employee.nom || payroll.employeeName?.split(' ')[0] || 'Non',
                            prenom: employee.prenom || payroll.employeeName?.split(' ').slice(1).join(' ') || 'spécifié',
                            matricule: payroll.employeeMatricule || '',
                            poste: payroll.employeePosition || '',
                            salaireBase: payroll.remuneration?.salaireBase || 0,
                            dateEmbauche: employee.dateEmbauche || new Date().toISOString(),
                            adresse: payroll.employeeAddresse || employee.adresse || '',
                            categorie: payroll.employeeCategorie || employee.categorie || '',
                            typeContrat: employee.typeContrat || 'CDI'
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
                            name: selectedCompany ?
                                companies.find(c => c.id === selectedCompany)?.name || "LEADER INTERIM & SERVICES" :
                                "LEADER INTERIM & SERVICES",
                            address: "Ouest Foire, Parcelle N°1, Route de l'aéroport, Dakar",
                            phone: "33-820-88-46 / 78-434-30-16",
                            email: "infos@leaderinterime.com",
                            rc: "SN 2015 B24288",
                            ninea: "0057262212 A2"
                        }
                    };
                };

                try {
                    const blobs = [];
                    const successfulDownloads = [];

                    for (let i = 0; i < itemsToDownload.length; i++) {
                        const payroll = itemsToDownload[i];
                        try {
                            const payrollData = preparePayrollData(payroll);
                            const blob = await generateMultiplePayrollsPdf(
                                payrollData.employee,
                                payrollData.formData,
                                payrollData.calculations,
                                payrollData.companyInfo,
                                i
                            );

                            blobs.push({
                                blob,
                                filename: `bulletin_paie_${payroll.employeeName || 'inconnu'}_${payroll.numero}.pdf`,
                                payroll
                            });

                            successfulDownloads.push(payroll);
                        } catch (error) {
                            console.error(`Erreur téléchargement ${payroll.numero}:`, error);
                        }

                        setBulkDownload(prev => ({
                            ...prev,
                            current: i + 1,
                            progress: Math.round(((i + 1) / itemsToDownload.length) * 100)
                        }));
                    }

                    if (blobs.length > 0) {
                        const JSZip = (await import('jszip')).default;
                        const zip = new JSZip();

                        blobs.forEach(({ blob, filename }) => {
                            zip.file(filename, blob);
                        });

                        const zipBlob = await zip.generateAsync({ type: 'blob' });
                        const zipUrl = URL.createObjectURL(zipBlob);

                        const link = document.createElement('a');
                        link.href = zipUrl;
                        link.download = `bulletins_paie_${new Date().toISOString().split('T')[0]}.zip`;

                        document.body.appendChild(link);
                        link.click();

                        setTimeout(() => {
                            document.body.removeChild(link);
                            URL.revokeObjectURL(zipUrl);
                        }, 100);

                        message.success(`${blobs.length} bulletins téléchargés avec succès`);
                    }

                    setBulkDownload(prev => ({
                        ...prev,
                        status: 'completed'
                    }));

                } catch (error) {
                    console.error("Erreur téléchargement groupé:", error);
                    message.error("Erreur lors du téléchargement groupé");

                    setBulkDownload(prev => ({
                        ...prev,
                        status: 'error'
                    }));
                }

                setTimeout(() => {
                    setBulkDownload(prev => ({ ...prev, visible: false }));
                }, 3000);
            },
            zIndex: Z_INDEX.CONFIRM_MODAL,
            getContainer: false, // Évite les problèmes de hiérarchie
        });
    };

    // Gestion de la suppression
    const handleDelete = async (id) => {
        Modal.confirm({
            title: 'Confirmer la suppression',
            content: 'Êtes-vous sûr de vouloir supprimer ce bulletin de paie ? Cette action est irréversible.',
            okText: 'Supprimer',
            okType: 'danger',
            cancelText: 'Annuler',
            onOk: async () => {
                try {
                    const result = await payrollService.deletePayroll(selectedCompany || companyId, id);
                    if (result.success) {
                        message.success(result.message);
                    } else {
                        message.error(result.message);
                    }
                } catch (error) {
                    console.error("Erreur suppression:", error);
                    message.error("Erreur lors de la suppression");
                }
            },
            zIndex: Z_INDEX.CONFIRM_MODAL,
            getContainer: false, // Évite les problèmes de hiérarchie

        });
    };

    // Gestion des exports
    const handleExport = (format) => {
        const data = filterByDateAndDepartment(allPayrolls); // MODIFICATION ICI
        const fileName = `Bulletins_de_paie${selectedDepartment ? '_' + selectedDepartment : ''}${selectedEmployee ? '_' + selectedEmployee.nom : ''}`;

        const options = {
            from: dateRange.from?.toISOString().split('T')[0] || '',
            to: dateRange.to?.toISOString().split('T')[0] || '',
            department: selectedDepartment || '' // Ajoutez cette info si vos fonctions d'export la supportent
        };

        if (format === 'excel') {
            exportToExcel(data, fileName, options);
        } else {
            exportToPDF(data, fileName, options);
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
                    const result = await payrollService.validatePayroll(selectedCompany || companyId, id);
                    if (result.success) {
                        message.success("Bulletin validé avec succès");
                    } else {
                        message.error(result.message);
                    }
                } catch (error) {
                    console.error("Erreur:", error);
                    message.error("Erreur lors de la validation");
                }
            },
            zIndex: Z_INDEX.CONFIRM_MODAL,
            getContainer: false, // Évite les problèmes de hiérarchie
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
                selectedCompany || companyId,
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
                    const result = await payrollService.cancelPayroll(selectedCompany || companyId, id);
                    if (result.success) {
                        message.success("Bulletin annulé avec succès");
                    } else {
                        message.error(result.message);
                    }
                } catch (error) {
                    console.error("Erreur:", error);
                    message.error("Erreur lors de l'annulation");
                }
            },
            zIndex: Z_INDEX.CONFIRM_MODAL,
            getContainer: false, // Évite les problèmes de hiérarchie
        });
    };

    // Fonction pour préparer les données
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
                name: selectedCompany ?
                    companies.find(c => c.id === selectedCompany)?.name || "LEADER INTERIM & SERVICES" :
                    "LEADER INTERIM & SERVICES",
                address: "Ouest Foire, Parcelle N°1, Route de l'aéroport, Dakar",
                phone: "33-820-88-46 / 78-434-30-16",
                email: "infos@leaderinterime.com",
                rc: "SN 2015 B24288",
                ninea: "0057262212 A2"
            }
        };
    };

    // Aperçu
    const handlePreview = (payroll) => {
        const payrollData = preparePayrollData(payroll);
        previewPayrollPdf(
            payrollData.employee,
            payrollData.formData,
            payrollData.calculations,
            payrollData.companyInfo
        );
    };

    // Téléchargement
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

    // Édition
    const handleEdit = (payroll) => {
        const selectedEmployee = employees.find(e => e.id === payroll.employeeId);

        navigate("/payroll", {
            state: {
                payroll: {
                    id: payroll.id,
                    employeeId: payroll.employeeId,
                    employeeName: payroll.employeeName,
                    employeeMatricule: payroll.employeeMatricule,
                    employeePosition: payroll.employeePosition,
                    employeeAddresse: payroll.employeeAddresse,
                    employeeCategorie: payroll.employeeCategorie,
                    nbreofParts: payroll.nbreofParts || 1,
                    dateEmbauche: payroll.dateEmbauche,
                    typeContrat: payroll.typeContrat,
                    statut: payroll.statut,
                    numero: payroll.numero,
                    createdAt: payroll.createdAt,
                    updatedAt: payroll.updatedAt,
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


    // Remplacez votre fonction getCurrentMonthDateRange par celle-ci
    const getCurrentMonthDateRange = () => {
        const now = new Date();

        // Premier jour du mois en cours (00:00:00 local)
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

        // Dernier jour du mois en cours (00:00:00 local)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Fonction de formatage qui préserve la date locale
        const formatLocalDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        return {
            du: formatLocalDate(firstDay),
            au: formatLocalDate(lastDay)
        };
    };

    // Duplication
    const handleDuplicate = async (payroll) => {
        try {
            const newNumber = await payrollService.generatePayrollNumber(selectedCompany || companyId);
            const selectedEmployee = employees.find(e => e.id === payroll.employeeId);

            const cleanDuplicatedPayroll = (originalPayroll, newNumber) => {
                const { id, createdAt, updatedAt, statut, numero, paymentDetails, montantPaye, validatedAt, paidAt, cancelledAt, ...cleanedData } = originalPayroll;

                // Utiliser la période du mois en cours
                const currentMonthRange = getCurrentMonthDateRange();

                return {
                    ...cleanedData,
                    numero: newNumber,
                    statut: "draft",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    periode: {
                        du: currentMonthRange.du,
                        au: currentMonthRange.au
                    }
                };
            };

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

    // Génération
    const handleGenerate = async (payroll) => {
        Modal.confirm({
            title: 'Générer un nouveau bulletin',
            content: 'Cette action va créer un nouveau bulletin basé sur ce modèle et télécharger automatiquement le PDF.',
            okText: 'Générer',
            cancelText: 'Annuler',
            onOk: async () => {
                try {
                    setLoading(true);

                    const newNumber = await payrollService.generatePayrollNumber(selectedCompany || companyId);
                    const selectedEmployee = employees.find(e => e.id === payroll.employeeId);

                    if (!selectedEmployee) {
                        throw new Error("Employé non trouvé");
                    }

                    const cleanDuplicatedPayroll = (originalPayroll, newNumber) => {
                        const { id, createdAt, updatedAt, statut, numero, paymentDetails, montantPaye, validatedAt, paidAt, cancelledAt, ...cleanedData } = originalPayroll;

                        // Utiliser la période du mois en cours
                        const currentMonthRange = getCurrentMonthDateRange();

                        return {
                            ...cleanedData,
                            numero: newNumber,
                            statut: "draft",
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            periode: {
                                du: currentMonthRange.du,
                                au: currentMonthRange.au
                            }
                        };
                    };

                    const generatedPayroll = cleanDuplicatedPayroll(payroll, newNumber);

                    const payrollData = payrollService.preparePayrollData(
                        generatedPayroll,
                        payroll.calculations || {},
                        selectedEmployee
                    );

                    const result = await payrollService.addPayroll(
                        selectedCompany || companyId,
                        currentUser.uid,
                        payrollData
                    );

                    if (result.success) {
                        message.success("Bulletin généré et enregistré avec succès !");

                        const payrollDataForPdf = preparePayrollData({
                            ...payrollData,
                            id: result.id,
                            numero: newNumber
                        });

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
            },
            zIndex: Z_INDEX.CONFIRM_MODAL,
            getContainer: false, // Évite les problèmes de hiérarchie
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

    // Fonction pour créer un nouveau bulletin
    const handleCreateNew = () => {
        navigate("/payroll");
    };

    // Calcul du nombre total filtré pour les actions de masse
    // Mettez à jour totalFilteredCount
    const totalFilteredCount = useMemo(() => {
        return filterByDateAndDepartment(allPayrolls).length;
    }, [allPayrolls, filterByDateAndDepartment]);

    return (
        <div className="payrolls-page-container">

            {/* NIVEAU 2 - Onglets */}
            <div className="navbar-tabs" style={{
                marginBottom: '16px',
                borderBottom: '2px solid #f0f0f0',
                paddingBottom: '8px'
            }}>
                {['all', 'draft', 'validated', 'paid'].map((tab) => (
                    <button
                        key={tab}
                        className={activeTab === tab ? "active" : ""}
                        onClick={() => setActiveTab(tab)}
                    >
                        {getTabDisplayName(tab)} <span style={{
                            background: activeTab === tab ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            marginLeft: '8px'
                        }}>{tabCounts[tab]}</span>
                    </button>
                ))}
            </div>
            {/* NIVEAU 2 - Filtres principaux */}
            <div className="filters-container">
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    flexWrap: 'wrap'
                }}>
                    {/* Filtre entreprise existant */}
                    {companies.length > 1 && (
                        <div style={{ minWidth: '250px' }}>
                            <Select
                                placeholder="Toutes les entreprises"
                                style={{ width: '100%' }}
                                allowClear
                                loading={companiesLoading}
                                value={selectedCompany}
                                onChange={setSelectedCompany}
                                suffixIcon={<FaBuilding />}
                            />
                        </div>
                    )}

                    {/* NOUVEAU : Filtre département */}
                    {departments.length > 0 && (
                        <div style={{ minWidth: '250px' }}>
                            <Select
                                placeholder="Tous les départements"
                                style={{ width: '100%' }}
                                allowClear
                                value={selectedDepartment}
                                onChange={setSelectedDepartment}
                                options={departments.map(dept => ({
                                    label: dept,
                                    value: dept
                                }))}
                                suffixIcon={<FaBuilding />}
                            />
                        </div>

                    )}
                    {/* Filtre de date existant */}
                    <div style={{ minWidth: '300px' }}>
                        <ModernDateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
                    </div>

                    {/* Résumé des filtres mis à jour */}
                    <div className="date-range-summary" style={{
                    }}>
                        {activeTab === 'all' ? 'Tous les bulletins' :
                            activeTab === 'draft' ? 'Brouillons' :
                                activeTab === 'validated' ? 'Bulletins validés' :
                                    'Bulletins payés'}
                        {selectedDepartment && (
                            <> - Département : {selectedDepartment}</>
                        )}
                        {dateRange.from || dateRange.to ? (
                            <>
                                {" du "}
                                {dateRange.from?.toLocaleDateString('fr-FR') || '...'}
                                {" au "}
                                {dateRange.to?.toLocaleDateString('fr-FR') || '...'}
                            </>
                        ) : " (Toutes dates)"}
                        {selectedCompany && companies.find(c => c.id === selectedCompany) && (
                            <> - {companies.find(c => c.id === selectedCompany)?.name}</>
                        )}
                    </div>
                </div>

                {/* Bouton Créer existant */}
                <div style={{ marginLeft: 'auto' }}>
                    <button
                        onClick={handleCreateNew}
                        className="create-btn"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        <FaPlus /> Nouveau bulletin
                    </button>
                </div>
            </div>

            {/* Modales de progression */}
            <Modal
                title="Génération en cours"
                open={bulkGeneration.visible}
                footer={null}
                zIndex={Z_INDEX.PROGRESS_MODAL}
                maskClosable={false}
                closable={false}
                centered
            >
                <div style={{ textAlign: 'center', padding: '20px', }}>
                    <Spin spinning={bulkGeneration.status === 'generating'} size="large" />
                    <Progress percent={bulkGeneration.progress} status={
                        bulkGeneration.status === 'completed' ? 'success' :
                            bulkGeneration.status === 'error' ? 'exception' : 'active'
                    } />
                    <p>
                        {bulkGeneration.status === 'generating' &&
                            `Génération en cours... ${bulkGeneration.current}/${bulkGeneration.total}`}
                        {bulkGeneration.status === 'completed' &&
                            `Génération terminée ! ${bulkGeneration.generatedCount} bulletins créés`}
                        {bulkGeneration.status === 'error' && 'Erreur lors de la génération'}
                    </p>
                </div>
            </Modal>

            <Modal
                title="Préparation des PDFs"
                open={bulkDownload.visible}
                footer={null}
                zIndex={Z_INDEX.PROGRESS_MODAL}
                maskClosable={false}
                closable={false}
                centered
            >
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin spinning={bulkDownload.status === 'downloading'} size="large" />
                    <Progress percent={bulkDownload.progress} status={
                        bulkDownload.status === 'completed' ? 'success' :
                            bulkDownload.status === 'error' ? 'exception' : 'active'
                    } />
                    <p>
                        {bulkDownload.status === 'downloading' &&
                            `Préparation des PDFs... ${bulkDownload.current}/${bulkDownload.total}`}
                        {bulkDownload.status === 'completed' &&
                            'Téléchargement terminé !'}
                        {bulkDownload.status === 'error' &&
                            'Erreur lors de la préparation des PDFs'}
                    </p>
                </div>
            </Modal>

            {/* Section des bulletins */}
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
                onGenerateAll={handleGenerateAll}
                onDownloadAll={handleDownloadAll}
                onExport={handleExport}
                totalFilteredCount={totalFilteredCount}
                generateAllDisabled={totalFilteredCount === 0}
                downloadAllDisabled={totalFilteredCount === 0}
                selectedDepartment={selectedDepartment}
                onClearDepartment={() => setSelectedDepartment(null)}
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