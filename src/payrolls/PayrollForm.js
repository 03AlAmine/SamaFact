import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { db } from '../firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import PayrollPDF from './PayrollPDF';
import './Payroll.css';
import { useAuth } from '../auth/AuthContext';
import { FaArrowLeft, FaEye, FaEyeSlash, FaSave, FaDownload, FaSpinner } from "react-icons/fa";
import { payrollService } from '../services/payrollService';
import PDFPreviewDynamic from '../components/PDFPreviewDynamic';
import Sidebar from "../Sidebar";
import Notification from '../components/Notification';

const PayrollForm = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [showPreview, setShowPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [payrollNumber, setPayrollNumber] = useState("");
    const [showEmployeInfo, setShowEmployeInfo] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [lastSavedCalculations, setLastSavedCalculations] = useState(null);

    const showNotification = (message, type = 'info') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const togglePreview = () => {
        const newState = !showPreview;
        setShowPreview(newState);

        if (newState) {
            setTimeout(() => {
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
            }, 300);
        }
    };

    // Fonction pour calculer automatiquement l'IR selon le barème 2013
    const calculateIR = useCallback((brutFiscal, nbreofParts) => {
        const revenu = brutFiscal / nbreofParts;
        let ir = 0;

        // Barème corrigé basé sur les valeurs réelles du PDF
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

    // Fonction pour calculer automatiquement le TRIMF
    const calculateTRIMF = useCallback((brutFiscal) => {
        const brut = parseFloat(brutFiscal) || 0;

        if (brut <= 85000) return 300;
        if (brut <= 133000) return 400;
        if (brut < 1000000) return 500;
        return 1500;
    }, []);

    // États pour le formulaire de paie
    const [formData, setFormData] = useState({
        periode: {
            du: new Date().toISOString().split('T')[0],
            au: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
        },
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

    // Calculs dérivés avec useMemo pour éviter les recalculs inutiles
    const calculations = useMemo(() => {
        // Rémunération
        const salaireBase = parseFloat(formData.remuneration.salaireBase) || 0;
        const sursalaire = parseFloat(formData.remuneration.sursalaire) || 0;
        const indemniteDeplacement = parseFloat(formData.remuneration.indemniteDeplacement) || 0;
        const autresIndemnites = parseFloat(formData.remuneration.autresIndemnites) || 0;
        const avantagesNature = parseFloat(formData.remuneration.avantagesNature) || 0;

        // Primes
        const transport = parseFloat(formData.primes.transport) || 0;
        const panier = parseFloat(formData.primes.panier) || 0;
        const repas = parseFloat(formData.primes.repas) || 0;
        const anciennete = parseFloat(formData.primes.anciennete) || 0;
        const responsabilite = parseFloat(formData.primes.responsabilite) || 0;
        const autresPrimes = parseFloat(formData.primes.autresPrimes) || 0;

        // Retenues
        const retenueSalaire = parseFloat(formData.retenues.retenueSalaire) || 0;
        const qpartipm = parseFloat(formData.retenues.qpartipm) || 0;
        const avances = parseFloat(formData.retenues.avances) || 0;
        const trimf = parseFloat(formData.retenues.trimf) || 0;

        // Calculs
        const brutSocial = salaireBase + sursalaire + indemniteDeplacement + autresIndemnites;
        const brutFiscal = brutSocial + avantagesNature;

        // Cotisations salariales (IPRES)
        const ipresRG = brutSocial * 0.056;
        const ipresRC = 0; // brutSocial * 0.024;
        const cfce = brutFiscal * 0.03;

        // Cotisations patronales
        const ipresRGP = brutSocial * 0.084;
        const ipresRCP = 0 * 0.036;
        const allocationFamiliale = 63000 * 0.07;
        const accidentTravail = 63000 * 0.01;

        // Calcul de l'IR
        const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId) || {};
        const nbreofParts = selectedEmployee.nbreofParts || 1;
        const ir = calculateIR(brutFiscal, nbreofParts);

        // Totaux
        const totalRetenuesPris = retenueSalaire + qpartipm + avances;
        const totalRetenues = retenueSalaire + qpartipm + avances + ipresRG + ipresRC + trimf + ir;
        const totalCotisationsEmp = ipresRG + ipresRC + trimf + ir;
        const totalCotisationsEmployeur = ipresRGP + ipresRCP + allocationFamiliale + accidentTravail + qpartipm + cfce;
        const totalCotisationsSalariales = ipresRG + ipresRC;
        const totalCotisationsPatronales = ipresRGP + ipresRCP;
        const totalCotisations = totalCotisationsEmp + totalCotisationsEmployeur;

        // Salaire Net
        const remunerationNette = brutSocial - totalRetenuesPris;
        const totalPrimes = transport + panier + repas + anciennete + responsabilite + autresPrimes;
        const salaireNetAPayer = remunerationNette + totalPrimes;
        const tooqpartipm = qpartipm * 2
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

    // Mettre à jour les retenues basées sur les calculs - CORRECTION ICI
    useEffect(() => {
        // Éviter la boucle infinie en vérifiant si les calculs ont changé
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

    // Initialisation des données
    useEffect(() => {
        const initializeData = async () => {
            try {
                if (location.state && location.state.payroll) {
                    const payroll = location.state.payroll;

                    // Mettre à jour l'employé sélectionné
                    setSelectedEmployeeId(payroll.employeeId || '');

                    // Mettre à jour le numéro de bulletin
                    setPayrollNumber(payroll.numero || '');

                    // Fonction pour convertir les dates Firestore
                    const convertFirestoreDate = (date) => {
                        if (!date) return new Date().toISOString().split('T')[0];
                        return date.toDate ? date.toDate().toISOString().split('T')[0] : date;
                    };

                    // Mettre à jour les données du formulaire
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

                    setIsSaved(true);
                } else {
                    const numero = await payrollService.generatePayrollNumber(currentUser.companyId);
                    setPayrollNumber(numero);
                }
            } catch (error) {
                console.error("Erreur initialisation:", error);
                const now = new Date();
                const year = now.getFullYear();
                setPayrollNumber(`PAY-${year}-TEMP`);
                showNotification("Erreur lors de l'initialisation des données", "error");
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.companyId) {
            initializeData();
        }
    }, [location.state, currentUser?.companyId]);

    // Chargement des employés
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
                showNotification("Erreur lors du chargement des employés", "error");
            }
        };

        fetchEmployees();
    }, [currentUser]);

    // Mettre à jour le salaire de base quand l'employé est sélectionné
    // Mettre à jour le salaire de base quand l'employé est sélectionné
    useEffect(() => {
        // Ne pas exécuter cette mise à jour si on est en mode édition
        if (location.state?.payroll?.id && selectedEmployeeId === location.state.payroll.employeeId) {
            return;
        }

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
    }, [selectedEmployeeId, employees, location.state?.payroll]); // Ajouter location.state?.payroll aux dépendances

    // Sauvegarde du bulletin
    const savePayrollToFirestore = async (payrollData, isUpdate = false) => {
        if (!currentUser?.companyId) {
            throw new Error("Company ID not available");
        }

        if (isUpdate && location.state?.payroll?.id) {
            return payrollService.updatePayroll(
                currentUser.companyId,
                location.state.payroll.id,
                payrollData
            );
        } else {
            return payrollService.addPayroll(
                currentUser.companyId,
                currentUser.uid,
                payrollData
            );
        }
    };

    const handleSave = async () => {
        if (!selectedEmployeeId) {
            showNotification("Veuillez sélectionner un employé", "warning");
            return;
        }

        if (isSaved && !location.state?.payroll?.id) {
            showNotification("Ce bulletin est déjà enregistré. Créez un nouveau bulletin si nécessaire.", "warning");
            return;
        }

        try {
            setIsSaving(true);
            const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

            const payrollData = payrollService.preparePayrollData(
                { ...formData, numero: payrollNumber },
                calculations,
                selectedEmployee
            );

            const { success, message } = await savePayrollToFirestore(
                payrollData,
                !!location.state?.payroll?.id
            );

            if (success) {
                setIsSaved(true);
                showNotification(message, "success");
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

    const handleEmployeeChange = (e) => {
        setSelectedEmployeeId(e.target.value);
    };

    const formatCurrency = (value) => {
        const numericValue = parseFloat(value) || 0;
        return `${numericValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
    };

    const formatFirestoreDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        if (timestamp.toDate) {
            return timestamp.toDate().toLocaleDateString();
        }
        return timestamp;
    };

    if (!currentUser) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>Veuillez vous connecter pour accéder à cette page</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="loading-container-all">
                <div className="loading-spinner-all">⏳</div>
                <div>Chargement...</div>
            </div>
        );
    }

    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId) || {};

    return (
        <div className="dashboard-layoute">
            {notification.show && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification({ show: false, message: '', type: '' })}
                />
            )}

            <div className="floating-buttons">
                <button
                    className="floating-show-button"
                    onClick={togglePreview}
                >
                    {showPreview ? (
                        <>
                            <FaEyeSlash className="button-icon" />
                            <span className="button-text">Masquer</span>
                        </>
                    ) : (
                        <>
                            <FaEye className="button-icon" />
                            <span className="button-text">Aperçu</span>
                        </>
                    )}
                </button>

                <button
                    className="floating-back-button"
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft className="button-icon" />
                    <span className="button-text">Quitter</span>
                </button>
            </div>

            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                activeTab="payrolls"
                setActiveTab={() => { }}
            />

            <div className="container">
                <div className='pre-header' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 className="header">Bulletin de Paie</h1>
                    <button
                        className="button primary-button"
                        onClick={togglePreview}
                    >
                        {showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu"}
                    </button>
                </div>

                <div className="section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>Informations du client</h2>
                        <button
                            className="first-btn"
                            onClick={() => setShowEmployeInfo(!showEmployeInfo)}
                            style={{ fontSize: '0.9rem' }}
                        >
                            {showEmployeInfo ? "Masquer" : "Afficher"}
                        </button>
                    </div>
                    {showEmployeInfo && (
                        <>
                            <div className="form-group">
                                <label className="label">Employé</label>
                                <select
                                    value={selectedEmployeeId}
                                    onChange={handleEmployeeChange}
                                    className="select"
                                    required
                                >
                                    <option value="">Sélectionner un employé</option>
                                    {employees.map(employee => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.nom} {employee.prenom} - {employee.poste} (Mat: {employee.matricule})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedEmployeeId && (
                                <div className="client-info-box">
                                    <h3>Informations de l'employé</h3>
                                    <p><strong>Nom:</strong> {selectedEmployee.nom} {selectedEmployee.prenom}</p>
                                    <p><strong>Poste:</strong> {selectedEmployee.poste}</p>
                                    <p><strong>Matricule:</strong> {selectedEmployee.matricule}</p>
                                    <p><strong>Date d'embauche:</strong> {formatFirestoreDate(selectedEmployee.dateEmbauche)}</p>
                                    <p><strong>Salaire de base:</strong> {formatCurrency(selectedEmployee.salaireBase)}</p>
                                    <p><strong>Nombre de parts:</strong> {selectedEmployee.nbreofParts}</p>
                                    <p><strong>Type de contrat:</strong> {selectedEmployee.typeContrat}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="section">
                    <h2>Période de Paie</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="label">Du</label>
                            <input
                                type="date"
                                name="periode.du"
                                value={formData.periode.du}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Au</label>
                            <input
                                type="date"
                                name="periode.au"
                                value={formData.periode.au}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="section">
                    <h2>Rémunération</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="label">Salaire de base</label>
                            <input
                                type="number"
                                name="remuneration.salaireBase"
                                value={formData.remuneration.salaireBase}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Sursalaire</label>
                            <input
                                type="number"
                                name="remuneration.sursalaire"
                                value={formData.remuneration.sursalaire}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Indemnité de déplacement</label>
                            <input
                                type="number"
                                name="remuneration.indemniteDeplacement"
                                value={formData.remuneration.indemniteDeplacement}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Autres indemnités</label>
                            <input
                                type="number"
                                name="remuneration.autresIndemnites"
                                value={formData.remuneration.autresIndemnites}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Avantages en nature</label>
                            <input
                                type="number"
                                name="remuneration.avantagesNature"
                                value={formData.remuneration.avantagesNature}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                    </div>
                </div>

                <div className="section">
                    <h2>Cotisations sociales & impôts</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="label">Retenue salaire</label>
                            <input
                                type="number"
                                name="retenues.retenueSalaire"
                                value={formData.retenues.retenueSalaire}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Retenue Qpart I.P.M</label>
                            <input
                                type="number"
                                name="retenues.qpartipm"
                                value={formData.retenues.qpartipm}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Avances</label>
                            <input
                                type="number"
                                name="retenues.avances"
                                value={formData.retenues.avances}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">TRIMF</label>
                            <input
                                type="number"
                                name="retenues.trimf"
                                value={formData.retenues.trimf}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">IR</label>
                            <input
                                type="number"
                                name="retenues.ir"
                                value={formData.retenues.ir}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                    </div>
                </div>

                <div className="section">
                    <h2>Primes et Indemnités</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="label">Indemnité de transport</label>
                            <input
                                type="number"
                                name="primes.transport"
                                value={formData.primes.transport}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Prime de panier</label>
                            <input
                                type="number"
                                name="primes.panier"
                                value={formData.primes.panier}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Prime de repas</label>
                            <input
                                type="number"
                                name="primes.repas"
                                value={formData.primes.repas}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Prime d'ancienneté</label>
                            <input
                                type="number"
                                name="primes.anciennete"
                                value={formData.primes.anciennete}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Indemnité de responsabilité</label>
                            <input
                                type="number"
                                name="primes.responsabilite"
                                value={formData.primes.responsabilite}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Autres primes</label>
                            <input
                                type="number"
                                name="primes.autresPrimes"
                                value={formData.primes.autresPrimes}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                    </div>
                </div>

                {selectedEmployeeId && (
                    <div className="section">
                        <h2>Détails des Cotisations</h2>
                        <div className="table-container">
                            <table className="totals-table">
                                <tbody>
                                    <tr>
                                        <td>IPRES RG (5.6%):</td>
                                        <td>{formatCurrency(calculations.detailsCotisations.ipresRG)}</td>
                                    </tr>
                                    <tr>
                                        <td>IPRES RC (2.4%):</td>
                                        <td>{formatCurrency(calculations.detailsCotisations.ipresRC)}</td>
                                    </tr>
                                    <tr>
                                        <td>CFCE (1%):</td>
                                        <td>{formatCurrency(calculations.detailsCotisations.cfce)}</td>
                                    </tr>
                                    <tr>
                                        <td>IR:</td>
                                        <td>{formatCurrency(calculations.detailsCotisations.ir)}</td>
                                    </tr>
                                    <tr>
                                        <td>Cotisations Salariales:</td>
                                        <td>{formatCurrency(calculations.cotisationsSalariales)}</td>
                                    </tr>
                                    <tr>
                                        <td>Cotisations Patronales:</td>
                                        <td>{formatCurrency(calculations.cotisationsPatronales)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <h2 style={{ marginTop: '3rem' }}>Salaires</h2>
                        <div className="table-container">
                            <table className="totals-table">
                                <tbody>
                                    <tr>
                                        <td>Brut Social:</td>
                                        <td>{formatCurrency(calculations.brutSocial)}</td>
                                    </tr>
                                    <tr>
                                        <td>Brut Fiscal:</td>
                                        <td>{formatCurrency(calculations.brutFiscal)}</td>
                                    </tr>
                                    <tr>
                                        <td>Remuneration nette:</td>
                                        <td>{formatCurrency(calculations.salaireNet)}</td>
                                    </tr>
                                    <tr>
                                        <td>Salaire Net à Payer:</td>
                                        <td className="highlight">{formatCurrency(calculations.salaireNetAPayer)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="preview-container">
                    <div className="button-group">
                        <button
                            className="primary-button"
                            onClick={togglePreview}
                        >
                            {showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu"}
                        </button>

                        <button
                            className="success-button"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <FaSpinner className="spinner" /> Enregistrement...
                                </>
                            ) : (
                                <>
                                    <FaSave /> {isSaved ? "Mettre à jour" : "Enregistrer"}
                                </>
                            )}
                        </button>

                        {isSaved && (
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
                                    <button className="info-button" disabled={pdfLoading}>
                                        {pdfLoading ? (
                                            <>
                                                <FaSpinner className="spinner" /> Génération...
                                            </>
                                        ) : (
                                            <>
                                                <FaDownload /> Télécharger
                                            </>
                                        )}
                                    </button>
                                )}
                            </PDFDownloadLink>
                        )}
                    </div>

                    {showPreview && (
                        <PDFPreviewDynamic
                            width="100%"
                            height="800px"
                            style={{ marginTop: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default PayrollForm;