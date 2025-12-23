import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { db } from '../../firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import PayrollPDF from './PayrollPDF';
import { useAuth } from '../../auth/AuthContext';
import {
    FaArrowLeft,
    FaEye,
    FaSave,
    FaDownload,
    FaSpinner,
    FaCalculator,
    FaFileInvoice,
    FaMoneyBillWave,
    FaChartPie,
    FaCalendarAlt,
    FaUser,
    FaPercentage,
    FaCoins,
    FaBell,
    FaChevronRight,
    FaChevronLeft,
    FaTimes,

} from "react-icons/fa";
import { payrollService } from '../../services/payrollService';
import PDFPreviewDynamic from '../../components/views/PDFPreviewDynamic';
import Notification from '../../components/other/Notification';
import './Payroll.css';

const PayrollForm = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [showPdfModal, setShowPdfModal] = useState(false); // Nouvel état pour la modal
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [payrollNumber, setPayrollNumber] = useState("");
    const [showEmployeeInfo, setShowEmployeeInfo] = useState(true);
    const [lastSavedCalculations, setLastSavedCalculations] = useState(null);
    const [isDuplicating] = useState(location.state?.isDuplicate || false);
    const [activeTab, setActiveTab] = useState('employee');
    const [pdfBlob, setPdfBlob] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const formRef = useRef(null);

    const tabs = [
        { id: 'employee', label: 'Employé', icon: <FaUser /> },
        { id: 'period', label: 'Période', icon: <FaCalendarAlt /> },
        { id: 'remuneration', label: 'Rémunération', icon: <FaMoneyBillWave /> },
        { id: 'deductions', label: 'Retenues', icon: <FaPercentage /> },
        { id: 'bonuses', label: 'Primes', icon: <FaCoins /> },
        { id: 'summary', label: 'Récapitulatif', icon: <FaChartPie /> }
    ];

    // Fonction pour afficher la modal
    const handleShowPdfModal = () => {
        setShowPdfModal(true);
        // Désactiver le scroll du body quand la modal est ouverte
        document.body.style.overflow = 'hidden';
    };

    // Fonction pour fermer la modal
    const handleClosePdfModal = () => {
        setShowPdfModal(false);
        // Réactiver le scroll du body
        document.body.style.overflow = 'auto';
    };

    // Fermer la modal avec la touche Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showPdfModal) {
                handleClosePdfModal();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [showPdfModal]);

    const showNotification = (message, type = 'info') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToSection = (tabId) => {
        const element = document.getElementById(`section-${tabId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    useEffect(() => {
        if (activeTab) {
            scrollToSection(activeTab);
        }
    }, [activeTab]);

    const generatePDFBlob = async () => {
        const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId) || {};
        const doc = (
            <PayrollPDF
                employee={selectedEmployee}
                formData={{ ...formData, numero: payrollNumber }}
                calculations={calculations}
                companyInfo={{
                    name: "LEADER INTERIM & SERVICES",
                    address: "Ouest Foire, Parcelle N°1, Route de l'aéroport, Dakar",
                    phone: "33-820-88-46 / 78-434-30-16",
                    email: "infos@leaderinterime.com",
                    rc: "SN 2015 B24288",
                    ninea: "0057262212 A2"
                }}
            />
        );

        try {
            const blob = await pdf(doc).toBlob();
            setPdfBlob(blob);
        } catch (error) {
            console.error("Erreur génération PDF:", error);
        }
    };

    useEffect(() => {
        if (selectedEmployeeId && employees.length > 0) {
            generatePDFBlob();
        }
    }, [selectedEmployeeId, employees]);

    const getCurrentMonthDateRange = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
            du: firstDay.toISOString().split('T')[0],
            au: lastDay.toISOString().split('T')[0]
        };
    };

    const calculateIR = useCallback((brutFiscal, nbreofParts) => {
        const revenu = brutFiscal / nbreofParts;
        let ir = 0;

        if (revenu > 500000) {
            ir = revenu * 0.40 - 118750;
        } else if (revenu > 400000) {
            ir = revenu * 0.35 - 88750;
        } else if (revenu > 300000) {
            ir = revenu * 0.35 - 78750;
        } else if (revenu > 200000) {
            ir = revenu * 0.30 - 48750;
        } else if (revenu > 150000) {
            ir = revenu * 0.25 - 28750;
        } else if (revenu > 110000) {
            ir = revenu * 0.20 - 18750;
        } else if (revenu > 80000) {
            ir = revenu * 0.15 - 11000;
        } else if (revenu > 60000) {
            ir = revenu * 0.10 - 6000;
        } else if (revenu > 50000) {
            ir = revenu * 0.05 - 2500;
        } else {
            ir = 0;
        }

        ir = Math.max(0, ir);
        return Math.round(ir * nbreofParts);
    }, []);

    const calculateTRIMF = useCallback((brutFiscal) => {
        const brut = parseFloat(brutFiscal) || 0;
        if (brut <= 85000) return 300;
        if (brut <= 133000) return 400;
        if (brut < 1000000) return 500;
        return 1500;
    }, []);

    const [formData, setFormData] = useState({
        periode: getCurrentMonthDateRange(),
        remuneration: {
            tauxHoraire: '0',
            salaireBase: '0',
            sursalaire: '0',
            indemniteDeplacement: '0',
            autresIndemnites: '0',
            avantagesNature: '0'
        },
        primes: {
            transport: '26000',
            panier: '0',
            repas: '0',
            anciennete: '0',
            responsabilite: '0',
            autresPrimes: '0'
        },
        retenues: {
            retenueSalaire: '0',
            qpartipm: '0',
            avances: '0',
            trimf: '300',
            cfce: '0',
            ir: '0'
        }
    });

    const calculations = useMemo(() => {
        const salaireBase = parseFloat(formData.remuneration.salaireBase) || 0;
        const sursalaire = parseFloat(formData.remuneration.sursalaire) || 0;
        const indemniteDeplacement = parseFloat(formData.remuneration.indemniteDeplacement) || 0;
        const autresIndemnites = parseFloat(formData.remuneration.autresIndemnites) || 0;
        const avantagesNature = parseFloat(formData.remuneration.avantagesNature) || 0;

        const transport = parseFloat(formData.primes.transport) || 0;
        const panier = parseFloat(formData.primes.panier) || 0;
        const repas = parseFloat(formData.primes.repas) || 0;
        const anciennete = parseFloat(formData.primes.anciennete) || 0;
        const responsabilite = parseFloat(formData.primes.responsabilite) || 0;
        const autresPrimes = parseFloat(formData.primes.autresPrimes) || 0;

        const retenueSalaire = parseFloat(formData.retenues.retenueSalaire) || 0;
        const qpartipm = parseFloat(formData.retenues.qpartipm) || 0;
        const avances = parseFloat(formData.retenues.avances) || 0;
        const trimf = parseFloat(formData.retenues.trimf) || 0;

        const brutSocial = salaireBase + sursalaire + indemniteDeplacement + autresIndemnites;
        const brutFiscal = brutSocial + avantagesNature;

        const ipresRG = brutSocial * 0.056;
        const ipresRC = 0;
        const cfce = brutFiscal * 0.03;

        const ipresRGP = brutSocial * 0.084;
        const ipresRCP = 0 * 0.036;
        const allocationFamiliale = 63000 * 0.07;
        const accidentTravail = 63000 * 0.01;

        const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId) || {};
        const nbreofParts = selectedEmployee.nbreofParts || 1;
        const ir = calculateIR(brutFiscal, nbreofParts);

        const totalRetenuesPris = retenueSalaire + qpartipm + avances;
        const totalRetenues = retenueSalaire + qpartipm + avances + ipresRG + ipresRC + trimf + ir;
        const totalCotisationsEmp = ipresRG + ipresRC + trimf + ir;
        const totalCotisationsEmployeur = ipresRGP + ipresRCP + allocationFamiliale + accidentTravail + qpartipm + cfce;
        const totalCotisationsSalariales = ipresRG + ipresRC;
        const totalCotisationsPatronales = ipresRGP + ipresRCP;
        const totalCotisations = totalCotisationsEmp + totalCotisationsEmployeur;

        const remunerationNette = brutSocial - totalRetenuesPris;
        const totalPrimes = transport + panier + repas + anciennete + responsabilite + autresPrimes;
        const salaireNetAPayer = remunerationNette + totalPrimes;
        const tooqpartipm = qpartipm * 2;
        const totalfiscales = trimf + cfce + ir;

        return {
            brutSocial,
            brutFiscal,
            cotisationsEmp: totalCotisationsEmp,
            cotisationsEmployeur: totalCotisationsEmployeur,
            cotisationsSalariales: totalCotisationsSalariales,
            cotisationsPatronales: totalCotisationsPatronales,
            cotisationsTotales: totalCotisations,
            salaireNet: remunerationNette,
            totalPrimes,
            salaireNetAPayer,
            totalRetenuesPris,
            totalRetenues,
            tooqpartipm,
            totalfiscales,
            detailsCotisations: {
                ipresRG,
                ipresRC,
                ipresRGP,
                ipresRCP,
                allocationFamiliale,
                accidentTravail,
                trimf,
                qpartipm,
                cfce,
                nbreofParts,
                ir
            }
        };
    }, [formData, selectedEmployeeId, employees, calculateIR]);

    useEffect(() => {
        if (JSON.stringify(calculations) === JSON.stringify(lastSavedCalculations)) {
            return;
        }

        const trimfValue = calculateTRIMF(calculations.brutFiscal);
        setFormData(prev => ({
            ...prev,
            retenues: {
                ...prev.retenues,
                trimf: trimfValue.toString(),
                cfce: calculations.detailsCotisations.cfce.toFixed(0) || '0',
                ir: calculations.detailsCotisations.ir.toFixed(0) || '0'
            }
        }));
        setLastSavedCalculations(calculations);
    }, [calculations, calculateTRIMF, lastSavedCalculations]);

    useEffect(() => {
        const initializeData = async () => {
            try {
                if (location.state && location.state.payroll) {
                    const payroll = location.state.payroll;
                    const convertFirestoreDate = (date) => {
                        if (!date) return new Date().toISOString().split('T')[0];
                        return date.toDate ? date.toDate().toISOString().split('T')[0] : date;
                    };

                    setSelectedEmployeeId(payroll.employeeId || '');

                    if (isDuplicating) {
                        const numero = await payrollService.generatePayrollNumber(currentUser.companyId);
                        setPayrollNumber(numero);
                    } else {
                        setPayrollNumber(payroll.numero || '');
                    }

                    setFormData({
                        periode: {
                            du: convertFirestoreDate(payroll.periode?.du),
                            au: convertFirestoreDate(payroll.periode?.au)
                        },
                        remuneration: {
                            tauxHoraire: payroll.remuneration?.tauxHoraire?.toString() || '0',
                            salaireBase: payroll.remuneration?.salaireBase?.toString() || '0',
                            sursalaire: payroll.remuneration?.sursalaire?.toString() || '0',
                            indemniteDeplacement: payroll.remuneration?.indemniteDeplacement?.toString() || '0',
                            autresIndemnites: payroll.remuneration?.autresIndemnites?.toString() || '0',
                            avantagesNature: payroll.remuneration?.avantagesNature?.toString() || '0'
                        },
                        primes: {
                            transport: payroll.primes?.transport?.toString() || '26000',
                            panier: payroll.primes?.panier?.toString() || '0',
                            repas: payroll.primes?.repas?.toString() || '0',
                            anciennete: payroll.primes?.anciennete?.toString() || '0',
                            responsabilite: payroll.primes?.responsabilite?.toString() || '0',
                            autresPrimes: payroll.primes?.autresPrimes?.toString() || '0'
                        },
                        retenues: {
                            retenueSalaire: payroll.retenues?.retenueSalaire?.toString() || '0',
                            qpartipm: payroll.retenues?.qpartipm?.toString() || '0',
                            avances: payroll.retenues?.avances?.toString() || '0',
                            trimf: payroll.retenues?.trimf?.toString() || '300',
                            cfce: payroll.retenues?.cfce?.toString() || '0',
                            ir: payroll.retenues?.ir?.toString() || '0'
                        }
                    });

                    if (!isDuplicating) {
                        setIsSaved(true);
                    }
                } else {
                    const numero = await payrollService.generatePayrollNumber(currentUser.companyId);
                    setPayrollNumber(numero);
                }
            } catch (error) {
                console.error("Erreur initialisation:", error);
                showNotification("Erreur lors de l'initialisation", "error");
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.companyId) {
            initializeData();
        }
    }, [location.state, currentUser?.companyId, isDuplicating]);

    useEffect(() => {
        const fetchEmployees = async () => {
            if (!currentUser?.companyId) return;

            try {
                const employeesRef = collection(db, `companies/${currentUser.companyId}/employees`);
                const q = query(employeesRef);
                const querySnapshot = await getDocs(q);

                const employeesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setEmployees(employeesData);
            } catch (error) {
                console.error("Error fetching employees: ", error);
                showNotification("Erreur chargement employés", "error");
            }
        };

        fetchEmployees();
    }, [currentUser]);

    useEffect(() => {
        const isEditing = location.state?.payroll?.id && selectedEmployeeId === location.state.payroll.employeeId;
        const isDuplicating = location.state?.isDuplicate;

        if (isEditing || isDuplicating) return;

        if (selectedEmployeeId) {
            const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
            if (selectedEmployee) {
                setFormData(prev => ({
                    ...prev,
                    remuneration: {
                        ...prev.remuneration,
                        salaireBase: selectedEmployee.salaireBase || '',
                        tauxHoraire: (selectedEmployee.salaireBase / 173.33).toFixed(2),
                        indemniteDeplacement: selectedEmployee.indemniteDeplacement || '0',
                        autresIndemnites: selectedEmployee.autresIndemnites || '0'
                    },
                    primes: {
                        transport: selectedEmployee.indemniteTransport || '26000',
                        panier: selectedEmployee.primePanier || '0',
                        repas: selectedEmployee.primeRepas || '0',
                        anciennete: selectedEmployee.primeAnciennete || '0',
                        responsabilite: selectedEmployee.indemniteResponsabilite || '0',
                        autresPrimes: selectedEmployee.autresPrimes || '0'
                    },
                    retenues: {
                        ...prev.retenues,
                        avances: selectedEmployee.avances || '0',
                        retenueSalaire: selectedEmployee.retenueSalaire || '0',
                    }
                }));
            }
        }
    }, [selectedEmployeeId, employees, location.state?.payroll, location.state?.isDuplicate]);

    const handleSave = async () => {
        if (!selectedEmployeeId) {
            showNotification("Veuillez sélectionner un employé", "warning");
            return;
        }

        const isEditing = !!location.state?.payroll?.id && !isDuplicating;

        if (isSaved && !isEditing && !isDuplicating) {
            showNotification("Bulletin déjà enregistré", "warning");
            return;
        }

        try {
            setIsSaving(true);
            const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

            let payrollNum = payrollNumber;
            if (isDuplicating) {
                payrollNum = await payrollService.generatePayrollNumber(currentUser.companyId);
                setPayrollNumber(payrollNum);
            }

            const payrollData = payrollService.preparePayrollData(
                { ...formData, numero: payrollNum },
                calculations,
                selectedEmployee
            );

            const saveFunction = isEditing && !isDuplicating ?
                payrollService.updatePayroll :
                payrollService.addPayroll;

            const { success, message } = await saveFunction(
                currentUser.companyId,
                isEditing ? location.state.payroll.id : currentUser.uid,
                payrollData
            );

            if (success) {
                setIsSaved(true);
                showNotification(message, "success");

                setTimeout(() => {
                    scrollToTop();
                }, 500);
            } else {
                showNotification(message, "error");
            }
        } catch (error) {
            console.error("Erreur d'enregistrement :", error);
            showNotification("Erreur lors de l'enregistrement", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const [section, field] = name.split('.');

        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleInputFocus = (e) => {
        e.target.parentElement.classList.add('payroll-input-focused');
    };

    const handleInputBlur = (e) => {
        e.target.parentElement.classList.remove('payroll-input-focused');
    };

    const formatCurrency = (value) => {
        const numericValue = parseFloat(value) || 0;
        return `${numericValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
    };

    const formatFirestoreDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        if (timestamp.toDate) {
            return timestamp.toDate().toLocaleDateString('fr-FR');
        }
        return timestamp;
    };

    const handleQuickSave = async () => {
        if (isSaved) return;
        await handleSave();
    };

    const renderStatCard = (title, value, icon, color = 'primary') => {
        return (
            <div className={`payroll-stat-card payroll-stat-${color}`}>
                <div className="payroll-stat-icon">{icon}</div>
                <div className="payroll-stat-content">
                    <div className="payroll-stat-title">{title}</div>
                    <div className="payroll-stat-value">{formatCurrency(value)}</div>
                </div>
            </div>
        );
    };

    if (!currentUser) {
        return (
            <div className="payroll-auth-required">
                <div className="payroll-auth-message">
                    <FaBell className="payroll-auth-icon" />
                    <h3>Connexion requise</h3>
                    <p>Veuillez vous connecter pour accéder à cette page</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="payroll-loading-screen">
                <div className="payroll-loading-spinner">
                    <FaSpinner className="payroll-spinner-icon" />
                </div>
                <p>Chargement du bulletin...</p>
            </div>
        );
    }

    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId) || {};

    return (
        <div className="payroll-premium-container">
            {/* Sidebar Navigation */}
            <div className={`payroll-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="payroll-sidebar-header">
                    <button
                        className="payroll-sidebar-toggle"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    >
                        {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                    </button>
                    {!sidebarCollapsed && (
                        <div className="payroll-sidebar-title">
                            <FaFileInvoice />
                            <span>Édition Bulletin</span>
                        </div>
                    )}
                </div>

                <div className="payroll-sidebar-nav">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`payroll-sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            title={tab.label}
                        >
                            <span className="payroll-sidebar-tab-icon">{tab.icon}</span>
                            {!sidebarCollapsed && (
                                <span className="payroll-sidebar-tab-label">{tab.label}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="payroll-sidebar-footer">
                    <button
                        className="payroll-sidebar-action"
                        onClick={handleQuickSave}
                        disabled={isSaving || isSaved}
                    >
                        <FaSave />
                        {!sidebarCollapsed && <span>{isSaved ? 'Enregistré' : 'Enregistrer'}</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="payroll-main-content">
                {/* Header */}
                <header className="payroll-header">
                    <div className="payroll-header-content">
                        <div className="payroll-header-title">
                            <h1>
                                <FaFileInvoice className="payroll-header-icon" />
                                Bulletin de Paie {payrollNumber && `- ${payrollNumber}`}
                            </h1>
                            <div className="payroll-header-subtitle">
                                {selectedEmployeeId ?
                                    `${selectedEmployee.nom} ${selectedEmployee.prenom}` :
                                    'Sélectionnez un employé'}
                            </div>
                        </div>

                        <div className="payroll-header-actions">
                            <button
                                className="payroll-header-btn payroll-preview-btn"
                                onClick={handleShowPdfModal}
                                disabled={!selectedEmployeeId}
                            >
                                <FaEye /> Aperçu PDF
                            </button>

                            {(isSaved || isDuplicating) && (
                                <PDFDownloadLink
                                    document={
                                        <PayrollPDF
                                            employee={selectedEmployee}
                                            formData={{ ...formData, numero: payrollNumber }}
                                            calculations={calculations}
                                            companyInfo={{
                                                name: "LEADER INTERIM & SERVICES",
                                                address: "Ouest Foire, Parcelle N°1, Route de l'aéroport, Dakar",
                                                phone: "33-820-88-46 / 78-434-30-16",
                                                email: "infos@leaderinterime.com",
                                                rc: "SN 2015 B24288",
                                                ninea: "0057262212 A2"
                                            }}
                                        />
                                    }
                                    fileName={`bulletin_paie_${selectedEmployee.nom}_${selectedEmployee.prenom}_${formData.periode.du}_${formData.periode.au}.pdf`}
                                >
                                    {({ loading: pdfLoading }) => (
                                        <button
                                            className="payroll-header-btn payroll-download-btn"
                                            disabled={pdfLoading}
                                        >
                                            {pdfLoading ? <FaSpinner className="spinner" /> : <FaDownload />}
                                            Télécharger PDF
                                        </button>
                                    )}
                                </PDFDownloadLink>
                            )}
                        </div>
                    </div>

                    {/* Stats Bar */}
                    {selectedEmployeeId && (
                        <div className="payroll-stats-bar">
                            {renderStatCard("Brut Fiscal", calculations.brutFiscal, <FaMoneyBillWave />, "primary")}
                            {renderStatCard("Net à Payer", calculations.salaireNetAPayer, <FaCalculator />, "success")}
                            {renderStatCard("Retenues", calculations.totalRetenuesPris, <FaPercentage />, "warning")}
                            {renderStatCard("Primes", calculations.totalPrimes, <FaCoins />, "info")}
                        </div>
                    )}
                </header>

                {/* Form Sections */}
                <div className="payroll-form-sections" ref={formRef}>
                    {/* Section: Employé */}
                    <section id="section-employee" className="payroll-form-section">
                        <div className="payroll-section-header">
                            <FaUser className="payroll-section-icon" />
                            <h2>Informations Employé</h2>
                            <button
                                className="payroll-section-toggle"
                                onClick={() => setShowEmployeeInfo(!showEmployeeInfo)}
                            >
                                {showEmployeeInfo ? 'Masquer' : 'Afficher'}
                            </button>
                        </div>

                        {showEmployeeInfo && (
                            <div className="payroll-form-grid">
                                <div className="payroll-form-group">
                                    <label className="payroll-label">
                                        <FaUser className="payroll-input-icon" />
                                        Sélectionner un employé
                                    </label>
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        className="payroll-select payroll-select-employee"
                                        required
                                    >
                                        <option value="">Choisir un employé...</option>
                                        {employees.map(employee => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.nom} {employee.prenom} - {employee.poste} (Mat: {employee.matricule})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedEmployeeId && (
                                    <div className="payroll-employee-card">
                                        <div className="payroll-employee-header">
                                            <div className="payroll-employee-avatar">
                                                {selectedEmployee.nom?.charAt(0)}{selectedEmployee.prenom?.charAt(0)}
                                            </div>
                                            <div className="payroll-employee-info">
                                                <h3>{selectedEmployee.nom} {selectedEmployee.prenom}</h3>
                                                <p className="payroll-employee-position">{selectedEmployee.poste}</p>
                                            </div>
                                        </div>
                                        <div className="payroll-employee-details">
                                            <div className="payroll-detail-item">
                                                <span className="payroll-detail-label">Matricule:</span>
                                                <span className="payroll-detail-value">{selectedEmployee.matricule}</span>
                                            </div>
                                            <div className="payroll-detail-item">
                                                <span className="payroll-detail-label">Date d'embauche:</span>
                                                <span className="payroll-detail-value">{formatFirestoreDate(selectedEmployee.dateEmbauche)}</span>
                                            </div>
                                            <div className="payroll-detail-item">
                                                <span className="payroll-detail-label">Type de contrat:</span>
                                                <span className="payroll-detail-value">{selectedEmployee.typeContrat}</span>
                                            </div>
                                            <div className="payroll-detail-item">
                                                <span className="payroll-detail-label">Nombre de parts:</span>
                                                <span className="payroll-detail-value">{selectedEmployee.nbreofParts}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Section: Période */}
                    <section id="section-period" className="payroll-form-section">
                        <div className="payroll-section-header">
                            <FaCalendarAlt className="payroll-section-icon" />
                            <h2>Période de Paie</h2>
                        </div>
                        <div className="payroll-form-grid payroll-form-grid-2">
                            <div className="payroll-form-group">
                                <label className="payroll-label">Date de début</label>
                                <div className="payroll-input-wrapper">
                                    <FaCalendarAlt className="payroll-input-icon" />
                                    <input
                                        type="date"
                                        name="periode.du"
                                        value={formData.periode.du}
                                        onChange={handleChange}
                                        onFocus={handleInputFocus}
                                        onBlur={handleInputBlur}
                                        className="payroll-input"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="payroll-form-group">
                                <label className="payroll-label">Date de fin</label>
                                <div className="payroll-input-wrapper">
                                    <FaCalendarAlt className="payroll-input-icon" />
                                    <input
                                        type="date"
                                        name="periode.au"
                                        value={formData.periode.au}
                                        onChange={handleChange}
                                        onFocus={handleInputFocus}
                                        onBlur={handleInputBlur}
                                        className="payroll-input"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section: Rémunération */}
                    <section id="section-remuneration" className="payroll-form-section">
                        <div className="payroll-section-header">
                            <FaMoneyBillWave className="payroll-section-icon" />
                            <h2>Rémunération</h2>
                        </div>
                        <div className="payroll-form-grid payroll-form-grid-3">
                            {[
                                { label: "Salaire de base", name: "remuneration.salaireBase", value: formData.remuneration.salaireBase },
                                { label: "Sursalaire", name: "remuneration.sursalaire", value: formData.remuneration.sursalaire },
                                { label: "Indemnité de déplacement", name: "remuneration.indemniteDeplacement", value: formData.remuneration.indemniteDeplacement },
                                { label: "Autres indemnités", name: "remuneration.autresIndemnites", value: formData.remuneration.autresIndemnites },
                                { label: "Avantages en nature", name: "remuneration.avantagesNature", value: formData.remuneration.avantagesNature }
                            ].map((field, index) => (
                                <div className="payroll-form-group" key={index}>
                                    <label className="payroll-label">{field.label}</label>
                                    <div className="payroll-input-wrapper">
                                        <FaCoins className="payroll-input-icon" />
                                        <input
                                            type="number"
                                            name={field.name}
                                            value={field.value}
                                            onChange={handleChange}
                                            onFocus={handleInputFocus}
                                            onBlur={handleInputBlur}
                                            className="payroll-input"
                                            min="0"
                                            step="100"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section: Retenues */}
                    <section id="section-deductions" className="payroll-form-section">
                        <div className="payroll-section-header">
                            <FaPercentage className="payroll-section-icon" />
                            <h2>Retenues & Cotisations</h2>
                        </div>
                        <div className="payroll-form-grid payroll-form-grid-3">
                            {[
                                { label: "Retenue salaire", name: "retenues.retenueSalaire", value: formData.retenues.retenueSalaire },
                                { label: "Qpart I.P.M", name: "retenues.qpartipm", value: formData.retenues.qpartipm },
                                { label: "Avances", name: "retenues.avances", value: formData.retenues.avances },
                                { label: "TRIMF", name: "retenues.trimf", value: formData.retenues.trimf },
                                { label: "IR", name: "retenues.ir", value: formData.retenues.ir }
                            ].map((field, index) => (
                                <div className="payroll-form-group" key={index}>
                                    <label className="payroll-label">{field.label}</label>
                                    <div className="payroll-input-wrapper">
                                        <FaPercentage className="payroll-input-icon" />
                                        <input
                                            type="number"
                                            name={field.name}
                                            value={field.value}
                                            onChange={handleChange}
                                            onFocus={handleInputFocus}
                                            onBlur={handleInputBlur}
                                            className="payroll-input"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section: Primes */}
                    <section id="section-bonuses" className="payroll-form-section">
                        <div className="payroll-section-header">
                            <FaCoins className="payroll-section-icon" />
                            <h2>Primes et Indemnités</h2>
                        </div>
                        <div className="payroll-form-grid payroll-form-grid-3">
                            {[
                                { label: "Transport", name: "primes.transport", value: formData.primes.transport },
                                { label: "Panier", name: "primes.panier", value: formData.primes.panier },
                                { label: "Repas", name: "primes.repas", value: formData.primes.repas },
                                { label: "Ancienneté", name: "primes.anciennete", value: formData.primes.anciennete },
                                { label: "Responsabilité", name: "primes.responsabilite", value: formData.primes.responsabilite },
                                { label: "Autres primes", name: "primes.autresPrimes", value: formData.primes.autresPrimes }
                            ].map((field, index) => (
                                <div className="payroll-form-group" key={index}>
                                    <label className="payroll-label">{field.label}</label>
                                    <div className="payroll-input-wrapper">
                                        <FaCoins className="payroll-input-icon" />
                                        <input
                                            type="number"
                                            name={field.name}
                                            value={field.value}
                                            onChange={handleChange}
                                            onFocus={handleInputFocus}
                                            onBlur={handleInputBlur}
                                            className="payroll-input"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section: Récapitulatif */}
                    {selectedEmployeeId && (
                        <section id="section-summary" className="payroll-form-section">
                            <div className="payroll-section-header">
                                <FaChartPie className="payroll-section-icon" />
                                <h2>Récapitulatif</h2>
                            </div>

                            <div className="payroll-summary-grid">
                                {/* Cotisations */}
                                <div className="payroll-summary-card">
                                    <h3 className="payroll-summary-title">Détails des Cotisations</h3>
                                    <div className="payroll-summary-list">
                                        <div className="payroll-summary-item">
                                            <span>IPRES RG (5.6%)</span>
                                            <span className="payroll-summary-value">{formatCurrency(calculations.detailsCotisations.ipresRG)}</span>
                                        </div>
                                        <div className="payroll-summary-item">
                                            <span>IPRES RC (2.4%)</span>
                                            <span className="payroll-summary-value">{formatCurrency(calculations.detailsCotisations.ipresRC)}</span>
                                        </div>
                                        <div className="payroll-summary-item">
                                            <span>CFCE (1%)</span>
                                            <span className="payroll-summary-value">{formatCurrency(calculations.detailsCotisations.cfce)}</span>
                                        </div>
                                        <div className="payroll-summary-item payroll-summary-total">
                                            <span>Total Cotisations</span>
                                            <span className="payroll-summary-value">{formatCurrency(calculations.cotisationsEmp)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Salaires */}
                                <div className="payroll-summary-card">
                                    <h3 className="payroll-summary-title">Calcul des Salaires</h3>
                                    <div className="payroll-summary-list">
                                        <div className="payroll-summary-item">
                                            <span>Brut Social</span>
                                            <span className="payroll-summary-value">{formatCurrency(calculations.brutSocial)}</span>
                                        </div>
                                        <div className="payroll-summary-item">
                                            <span>Brut Fiscal</span>
                                            <span className="payroll-summary-value">{formatCurrency(calculations.brutFiscal)}</span>
                                        </div>
                                        <div className="payroll-summary-item">
                                            <span>Rémunération nette</span>
                                            <span className="payroll-summary-value">{formatCurrency(calculations.salaireNet)}</span>
                                        </div>
                                        <div className="payroll-summary-item payroll-summary-highlight">
                                            <span>Salaire Net à Payer</span>
                                            <span className="payroll-summary-value">{formatCurrency(calculations.salaireNetAPayer)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                {/* Boutons flottants */}
                <div className="payroll-floating-buttons">
                    {/* Bouton Aperçu PDF */}
                    <button
                        className="payroll-floating-btn payroll-float-preview"
                        onClick={handleShowPdfModal}
                        disabled={!selectedEmployeeId}
                        title="Aperçu PDF"
                    >
                        <span className="floating-btn-icon">
                            <FaEye />
                        </span>
                        <span className="floating-btn-label">Aperçu PDF</span>
                    </button>

                    {/* Bouton Enregistrer - visible toujours */}
                    <button
                        className={`payroll-floating-btn payroll-float-save ${isSaved ? 'saved' : ''} ${isSaving ? 'payroll-saving' : ''}`}
                        onClick={handleSave}
                        disabled={isSaving || !selectedEmployeeId}
                        title={isDuplicating ? 'Dupliquer' : 'Enregistrer'}
                    >
                        <span className="floating-btn-icon">
                            {isSaving ? <FaSpinner className="spinner" /> : <FaSave />}
                        </span>
                        <span className="floating-btn-label">
                            {isSaving ? 'Enregistrement...' : isSaved ? 'Enregistré' : isDuplicating ? 'Dupliquer' : 'Enregistrer'}
                        </span>
                        {isSaved && !isSaving && <span className="payroll-save-badge">✓</span>}
                    </button>

                    {/* Bouton Télécharger PDF - visible seulement quand enregistré */}
                    {(isSaved || isDuplicating) && selectedEmployeeId && (
                        <PDFDownloadLink
                            document={
                                <PayrollPDF
                                    employee={selectedEmployee}
                                    formData={{ ...formData, numero: payrollNumber }}
                                    calculations={calculations}
                                    companyInfo={{
                                        name: "LEADER INTERIM & SERVICES",
                                        address: "Ouest Foire, Parcelle N°1, Route de l'aéroport, Dakar",
                                        phone: "33-820-88-46 / 78-434-30-16",
                                        email: "infos@leaderinterime.com",
                                        rc: "SN 2015 B24288",
                                        ninea: "0057262212 A2"
                                    }}
                                />
                            }
                            fileName={`bulletin_paie_${selectedEmployee.nom}_${selectedEmployee.prenom}_${formData.periode.du}_${formData.periode.au}.pdf`}
                        >
                            {({ loading: pdfLoading, blob, url, error }) => (
                                <button
                                    className="payroll-floating-btn payroll-float-download"
                                    disabled={pdfLoading}
                                    title="Télécharger PDF"
                                >
                                    <span className="floating-btn-icon">
                                        {pdfLoading ? <FaSpinner className="spinner" /> : <FaDownload />}
                                    </span>
                                    <span className="floating-btn-label">
                                        {pdfLoading ? 'Génération...' : 'Télécharger PDF'}
                                    </span>
                                </button>
                            )}
                        </PDFDownloadLink>
                    )}

                    {/* Bouton Retour */}
                    <button
                        className="payroll-floating-btn payroll-float-back"
                        onClick={() => navigate(-1)}
                        title="Retour"
                    >
                        <span className="floating-btn-icon">
                            <FaArrowLeft />
                        </span>
                        <span className="floating-btn-label">Retour</span>
                    </button>
                </div>
            </div>

            {/* Modal PDF Preview */}
            {showPdfModal && selectedEmployeeId && (
                <div className={`payroll-pdf-modal ${showPdfModal ? 'active' : ''}`} onClick={handleClosePdfModal}>
                    <div className="payroll-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="payroll-modal-header">
                            <h3>
                                <FaFileInvoice />
                                Aperçu du Bulletin de Paie
                            </h3>
                            <button
                                className="payroll-modal-close"
                                onClick={handleClosePdfModal}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="payroll-modal-body">
                            {pdfBlob ? (
                                <PDFPreviewDynamic
                                    width="100%"
                                    height="100%"
                                    document={
                                        <PayrollPDF
                                            employee={selectedEmployee}
                                            formData={{ ...formData, numero: payrollNumber }}
                                            calculations={calculations}
                                            companyInfo={{
                                                name: "LEADER INTERIM & SERVICES",
                                                address: "Ouest Foire, Parcelle N°1, Route de l'aéroport, Dakar",
                                                phone: "33-820-88-46 / 78-434-30-16",
                                                email: "infos@leaderinterime.com",
                                                rc: "SN 2015 B24288",
                                                ninea: "0057262212 A2"
                                            }}
                                        />
                                    }
                                />
                            ) : (
                                <div className="payroll-preview-loading">
                                    <FaSpinner className="payroll-spinner" />
                                    <p>Chargement de l'aperçu PDF...</p>
                                </div>
                            )}
                        </div>

                        <div className="payroll-modal-footer">
                            <button
                                className="payroll-modal-btn payroll-modal-btn-secondary"
                                onClick={handleClosePdfModal}
                            >
                                <FaTimes />
                                Fermer
                            </button>

                            <PDFDownloadLink
                                document={
                                    <PayrollPDF
                                        employee={selectedEmployee}
                                        formData={{ ...formData, numero: payrollNumber }}
                                        calculations={calculations}
                                        companyInfo={{
                                            name: "LEADER INTERIM & SERVICES",
                                            address: "Ouest Foire, Parcelle N°1, Route de l'aéroport, Dakar",
                                            phone: "33-820-88-46 / 78-434-30-16",
                                            email: "infos@leaderinterime.com",
                                            rc: "SN 2015 B24288",
                                            ninea: "0057262212 A2"
                                        }}
                                    />
                                }
                                fileName={`bulletin_paie_${selectedEmployee.nom}_${selectedEmployee.prenom}_${formData.periode.du}_${formData.periode.au}.pdf`}
                            >
                                {({ loading: pdfLoading }) => (
                                    <button
                                        className="payroll-modal-btn payroll-modal-btn-primary"
                                        disabled={pdfLoading}
                                    >
                                        {pdfLoading ? <FaSpinner className="spinner" /> : <FaDownload />}
                                        Télécharger PDF
                                    </button>
                                )}
                            </PDFDownloadLink>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification */}
            {notification.show && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification({ show: false, message: '', type: '' })}
                />
            )}
        </div>
    );
};

export default PayrollForm;