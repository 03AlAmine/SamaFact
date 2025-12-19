import { pdf } from '@react-pdf/renderer';
import PayrollPDF from '../data/payrolls/PayrollPDF';

// Conversion optimisée des dates
const convertDate = (date) => {
    if (!date) return new Date().toISOString().split('T')[0];
    if (date.toDate) return date.toDate().toISOString().split('T')[0];
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return date; // Supposant que c'est déjà une string ISO
};

// Validation des nombres avec gestion des strings
const validateNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
};

// Structure de données complète avec valeurs par défaut
const getDefaultPayrollData = () => ({
    employee: {
        nom: 'Non spécifié',
        prenom: '',
        matricule: '',
        poste: '',
        dateEmbauche: new Date().toISOString().split('T')[0],
        address: '',
        typeContrat: 'CDI',
        salaireBase: 0
    },
    formData: {
        periode: {
            du: new Date().toISOString().split('T')[0],
            au: new Date().toISOString().split('T')[0]
        },
        remuneration: {
            salaireBase: 0,
            sursalaire: 0,
            indemniteDeplacement: 0,
            autresIndemnites: 0,
            avantagesNature: 0
        },
        primes: {
            transport: 0,
            panier: 0,
            repas: 0,
            anciennete: 0,
            responsabilite: 0,
            autresPrimes: 0
        },
        retenues: {
            salaire: 0,
            qpartipm: 0,
            ipm: 0,
            avances: 0,
            trimf: 0,
            cfce: 0,
            ir: 0
        },
        numero: 'NONUM'
    },
    calculations: {
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
    },
    companyInfo: {
        name: "LEADER INTERIM & SERVICES",
        address: "Ouest Foire, Parcelle N°1, Route de l'aéroport, Dakar",
        phone: "33-820-88-46 / 78-434-30-16",
        email: "infos@leaderinterime.com",
        rc: "SN 2015 B24288",
        ninea: "0057262212 A2"
    }
});

export const generatePayrollPdfBlob = async (employee, formData, calculations, companyInfo) => {
    try {
        const defaults = getDefaultPayrollData();

        // Fusion profonde des données
        const payload = {
            employee: { ...defaults.employee, ...employee },
            formData: {
                ...defaults.formData,
                ...formData,
                periode: {
                    du: convertDate(formData?.periode?.du),
                    au: convertDate(formData?.periode?.au)
                },
                remuneration: Object.fromEntries(
                    Object.entries(defaults.formData.remuneration).map(([key]) => [
                        key,
                        validateNumber(formData?.remuneration?.[key])
                    ])
        )},
            calculations: {
                ...defaults.calculations,
                ...Object.fromEntries(
                    Object.entries(calculations || {}).map(([key, val]) => [
                        key,
                        typeof val === 'object'
                            ? { ...defaults.calculations[key], ...val }
                            : validateNumber(val)
                    ])
      )},
            companyInfo: { ...defaults.companyInfo, ...companyInfo }
        };

        console.debug('[PDF Service] Données finales:', JSON.stringify(payload, null, 2));

        const blob = await pdf(
            <PayrollPDF {...payload} />
        ).toBlob();

        return blob;
    } catch (error) {
        console.error('[PDF Service] Erreur:', {
            message: error.message,
            stack: error.stack,
            inputData: { employee, formData, calculations }
        });
        throw error;
    }
};

export const downloadPayrollPdf = async (employee, formData, calculations, companyInfo) => {
    try {
        const blob = await generatePayrollPdfBlob(employee, formData, calculations, companyInfo);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const period = {
            du: convertDate(formData?.periode?.du),
            au: convertDate(formData?.periode?.au)
        };

        link.download = `bulletin_paie_${employee?.nom || 'inconnu'}_${employee?.prenom || 'inconnu'}_${period.du}_${period.au}.pdf`;

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    } catch (error) {
        console.error('[PDF Service] Échec du téléchargement:', error);
        throw error;
    }
};

export const previewPayrollPdf = async (employee, formData, calculations, companyInfo) => {
    try {
        const blob = await generatePayrollPdfBlob(employee, formData, calculations, companyInfo);
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');

        if (!newWindow) {
            const modal = document.createElement('div');
            modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 1000;
        display: flex; justify-content: center; align-items: center;
      `;

            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'width: 80%; height: 90%; border: none';
            iframe.src = url;

            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Fermer';
            closeBtn.style.cssText = `
        position: absolute; top: 20px; right: 20px; padding: 10px 20px;
        background: #ff4444; color: white; border: none; border-radius: 5px;
        cursor: pointer;
      `;
            closeBtn.onclick = () => modal.remove();

            modal.append(iframe, closeBtn);
            document.body.append(modal);
        }
    } catch (error) {
        console.error('[PDF Service] Échec de l\'aperçu:', error);
        throw error;
    }
};