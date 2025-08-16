import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { db } from '../firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import PayrollPDF from './PayrollPDF';
import './Payroll.css';
import { useAuth } from '../auth/AuthContext';
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { payrollService } from '../services/payrollService';
import PDFPreviewDynamic from '../components/PDFPreviewDynamic';
import Sidebar from "../Sidebar";


const PayrollForm = () => {
    const { currentUser } = useAuth();
    const location = useLocation(); // Correctement importé depuis react-router-dom
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [, setLoadingData] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [payrollNumber, setPayrollNumber] = useState("");
    const [showEmployeInfo, setShowEmployeInfo] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const togglePreview = () => {
        const newState = !showPreview;
        setShowPreview(newState);

        // Défilement vers le bas seulement quand on affiche l'aperçu
        if (newState) {
            setTimeout(() => {
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
            }, 300);
        }
    };
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
            salaire: '0',
            qpartipm: '0',
            ipm: '0',
            avances: '0',
            trimf: '300',
            cfce: '0',
            ir: '0'
        }
    });

    const [calculations, setCalculations] = useState({
        brutSocial: 0,
        brutFiscal: 0,
        cotisationsSalariales: 0,
        cotisationsPatronales: 0,
        salaireNet: 0,
        salaireNetAPayer: 0,
        detailsCotisations: {
            ipresRG: 0,
            ipresRC: 0,
            ipresRGP: 0,
            ipresRCP: 0,
            allocationFamiliale: 0,
            accidentTravail: 0,
            trimf: 0,
            cfce: 0,
            ir: 0
        }
    });

    // Initialisation des données
    useEffect(() => {
        const initializeData = async () => {
            try {
                if (location.state && location.state.payroll) {
                    const payroll = location.state.payroll;

                    // Ensure all fields have values
                    setFormData({
                        periode: {
                            du: payroll.periode?.du || '',
                            au: payroll.periode?.au || ''
                        },
                        remuneration: {
                            tauxHoraire: payroll.remuneration?.tauxHoraire || '0',
                            salaireBase: payroll.remuneration?.salaireBase || '0',
                            sursalaire: payroll.remuneration?.sursalaire || '0',
                            indemniteDeplacement: payroll.remuneration?.indemniteDeplacement || '0',
                            autresIndemnites: payroll.remuneration?.autresIndemnites || '0',
                            avantagesNature: payroll.remuneration?.avantagesNature || '0'
                        },
                        primes: {
                            transport: payroll.primes?.transport || '26000',
                            panier: payroll.primes?.panier || '0',
                            repas: payroll.primes?.repas || '0',
                            anciennete: payroll.primes?.anciennete || '0',
                            responsabilite: payroll.primes?.responsabilite || '0',
                            autresPrimes: payroll.primes?.autresPrimes || '0'
                        },
                        retenues: {
                            salaire: payroll.retenues?.salaire || '0',
                            qpartipm: payroll.retenues?.qpartipm || '0',
                            ipm: payroll.retenues?.ipm || '0',
                            avances: payroll.retenues?.avances || '0',
                            trimf: payroll.retenues?.trimf || '300',
                            cfce: payroll.retenues?.cfce || '0',
                            ir: payroll.retenues?.ir || '0'
                        }
                    });

                    setCalculations(payroll.calculations || {
                        brutSocial: 0,
                        brutFiscal: 0,
                        cotisationsSalariales: 0,
                        cotisationsPatronales: 0,
                        salaireNet: 0,
                        salaireNetAPayer: 0,
                        detailsCotisations: {
                            ipresRG: 0,
                            ipresRC: 0,
                            ipresRGP: 0,
                            ipresRCP: 0,
                            allocationFamiliale: 0,
                            accidentTravail: 0,
                            trimf: 0,
                            cfce: 0,
                            ir: 0
                        }
                    });

                    setSelectedEmployeeId(payroll.employeeId || '');
                    setPayrollNumber(payroll.numero || '');
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
            } finally {
                setLoadingData(false);
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
                setLoading(false);
            } catch (error) {
                console.error("Error fetching employees: ", error);
                setLoading(false);
            }
        };

        fetchEmployees();
    }, [currentUser]);


    // Mettre à jour le salaire de base quand l'employé est sélectionné
    useEffect(() => {
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
                        ipm: selectedEmployee.retenueIpm || '0',
                        avances: selectedEmployee.avances || '0'
                    }
                }));
            }
        }
    }, [selectedEmployeeId, employees]);

    // Calculs automatiques
    // Déplacez la fonction de calcul en dehors des effets
    const calculatePayroll = useCallback(() => {

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
        const retenueSalaire = parseFloat(formData.retenues.salaire) || 0;
        const qpartipm = parseFloat(formData.retenues.qpartipm) || 0;
        const ipm = parseFloat(formData.retenues.ipm) || 0;
        const avances = parseFloat(formData.retenues.avances) || 0;
        const trimf = parseFloat(formData.retenues.trimf) || 0;

        // Calculs
        const brutSocial = salaireBase + sursalaire + indemniteDeplacement + autresIndemnites;
        const brutFiscal = brutSocial + avantagesNature;

        // Cotisations (exemple)
        const totalRetenues = retenueSalaire + qpartipm + ipm + avances; // + trimf;

        // Cotisations salariales (IPRES)
        const ipresRG = brutSocial * 0.056;
        const ipresRC = 0; //brutSocial * 0.024;
        const cfce = brutFiscal * 0.03;

        /* Calcul de l'IR
        const baseImposable = brutFiscal * 0.7;
        let ir = 0;
        if (baseImposable > 630000) {
            ir = (baseImposable - 630000) * 0.40 + 151200;
        } else if (baseImposable > 420000) {
            ir = (baseImposable - 420000) * 0.30 + 63000;
        } else if (baseImposable > 210000) {
            ir = (baseImposable - 210000) * 0.20 + 21000;
        } else if (baseImposable > 130000) {
            ir = (baseImposable - 130000) * 0.15 + 8000;
        } else if (baseImposable > 50000) {
            ir = (baseImposable - 50000) * 0.10 + 3000;
        } else if (baseImposable > 0) {
            ir = baseImposable * 0.05;
        }*/
        const ir = 0;

        // Cotisations patronales
        const ipresRGP = brutSocial * 0.084;
        const ipresRCP = brutSocial * 0.036;
        const allocationFamiliale = Math.min(brutSocial, 63000) * 0.07;
        const accidentTravail = Math.min(brutSocial, 63000) * 0.01;

        // Totaux
        const totalCotisationsSalariales = ipresRG + ipresRC + cfce + trimf + ir;
        const totalCotisationsPatronales = ipresRGP + ipresRCP + allocationFamiliale + accidentTravail + ipm;
        const salaireNet = brutSocial - retenueSalaire - qpartipm;


        // Salaire Net
        const remunerationNette = brutSocial - totalRetenues;

        // Total Primes
        const totalPrimes = transport + panier + repas + anciennete + responsabilite + autresPrimes;

        // Salaire Net à Payer
        const salaireNetAPayer = remunerationNette + totalPrimes;

        return {
            brutSocial,
            brutFiscal,
            cotisationsSalariales: totalCotisationsSalariales,
            cotisationsPatronales: totalCotisationsPatronales,
            salaireNet,
            salaireNetAPayer,
            detailsCotisations: {
                ipresRG,
                ipresRC,
                ipresRGP,
                ipresRCP,
                allocationFamiliale,
                accidentTravail,
                trimf,
                cfce,
                ir
            }
        };
    }, [
        formData.remuneration.salaireBase,
        formData.remuneration.sursalaire,
        formData.remuneration.indemniteDeplacement,
        formData.remuneration.autresIndemnites,
        formData.remuneration.avantagesNature,
        formData.primes.transport,
        formData.primes.panier,
        formData.primes.repas,
        formData.primes.anciennete,
        formData.primes.responsabilite,
        formData.primes.autresPrimes,
        formData.retenues.salaire,
        formData.retenues.qpartipm,
        formData.retenues.ipm,
        formData.retenues.avances,
        formData.retenues.trimf
    ]);

    // Effet pour les calculs
    useEffect(() => {
        const results = calculatePayroll(); // Exécutez la fonction pour obtenir les résultats
        setCalculations(results);

        // Mise à jour des retenues
        setFormData(prev => ({
            ...prev,
            retenues: {
                ...prev.retenues,
                cfce: results.detailsCotisations.cfce.toFixed(0) || '0',
                ir: results.detailsCotisations.ir.toFixed(0) || '0'
            }
        }));
    }, [calculatePayroll]);
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
            // Ajout d'un nouveau bulletin avec companyId et userId
            return payrollService.addPayroll(
                currentUser.companyId,
                currentUser.uid,   // 👈 l'utilisateur qui crée
                payrollData
            );
        }
    };

    const handleSave = async () => {
        if (!selectedEmployeeId) {
            alert("Veuillez sélectionner un employé");
            return;
        }

        if (isSaved && !location.state?.payroll?.id) {
            alert("Ce bulletin est déjà enregistré. Créez un nouveau bulletin si nécessaire.");
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
                alert(message);
            } else {
                alert(message);
            }
        } catch (error) {
            console.error("Erreur d'enregistrement :", error);
            alert("Erreur lors de l'enregistrement");
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
        // Solution 1: simple replace
        return `${numericValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
    };
    const formatFirestoreDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        if (timestamp.toDate) {
            return timestamp.toDate().toLocaleDateString();
        }
        return timestamp; // fallback if it's already a string
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

            <div className="floating-buttons">
                <button
                    className="floating-show-button"
                    onClick={togglePreview} // pas besoin de () ici
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
                    onClick={() => window.history.back()}
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
                        onClick={togglePreview}  // Utilise la nouvelle fonction
                    >
                        <i className="fas fa-eye"></i> {showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu"}
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
                                    <p><strong>Type de contrat:</strong> {selectedEmployee.typeContrat}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="section">
                    <h2>
                        Période de Paie
                    </h2>
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
                    <h2>
                        Rémunération
                    </h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="label">Taux horaire</label>
                            <input
                                type="number"
                                name="remuneration.tauxHoraire"
                                value={formData.remuneration.tauxHoraire}
                                onChange={handleChange}
                                step="0.01"
                                className="input"
                            />
                        </div>
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
                                name="retenues.salaire"
                                value={formData.retenues.salaire}
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
                            <label className="label">Retenue IPM</label>
                            <input
                                type="number"
                                name="retenues.ipm"
                                value={formData.retenues.ipm}
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
                        <h2 >Détails des Cotisations</h2>
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
                        <h2 style={{ marginTop: '3rem' }}>
                            Salaires
                        </h2>
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
                            onClick={togglePreview}  // Utilise la nouvelle fonction
                        >
                            <i className={`fas fa-${showPreview ? 'eye-slash' : 'eye'}`}></i>
                            {showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu"}
                        </button>

                        <button
                            className="success-button"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Enregistrement...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i> {isSaved ? "Mettre à jour" : "Enregistrer"}
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
                                                <i className="fas fa-spinner fa-spin"></i> Génération...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-file-download"></i> Télécharger
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
