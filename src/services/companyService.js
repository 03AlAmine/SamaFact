// src/services/companyService.js
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export const companyService = {
    getCompanyInfo: async (companyId) => {
        try {
            if (!companyId) {
                throw new Error("ID d'entreprise manquant");
            }

            const companyRef = doc(db, 'companies', companyId);
            const companySnap = await getDoc(companyRef);

            if (companySnap.exists()) {
                const companyData = companySnap.data();
                return {
                    name: companyData.name || 'Nom de l\'entreprise',
                    logo: companyData.logo || '',
                    logoFileName: companyData.logoFileName || '',
                    rcNumber: companyData.rcNumber || '',
                    ninea: companyData.ninea || '',
                    address: companyData.address || '',
                    region: companyData.region || '',
                    country: companyData.country || '',
                    phone: companyData.phone || '',
                    email: companyData.email || '',
                    website: companyData.website || '',
                    ribCBAO: companyData.ribCBAO || '',
                    ribBIS: companyData.ribBIS || '',
                    ribOther1: companyData.ribOther1 || '',
                    ribOther1Label: companyData.ribOther1Label || '',
                    ribOther2: companyData.ribOther2 || '',
                    ribOther2Label: companyData.ribOther2Label || '',
                    invoiceColor: companyData.invoiceColor || '#218838',
                    invoiceFont: companyData.invoiceFont || 'Helvetica',
                    invoiceTemplate: companyData.invoiceTemplate || 'classic',
                    pdfQuality: companyData.pdfQuality || 'high'
                };
            } else {
                // Retourner des valeurs par défaut si l'entreprise n'existe pas
                return {
                    name: 'Mon Entreprise',
                    rcNumber: '',
                    ninea: '',
                    address: '',
                    region: '',
                    country: '',
                    phone: '',
                    email: '',
                    ribCBAO: '',
                    ribBIS: '',
                    ribOther1: '',
                    ribOther1Label: '',
                    ribOther2: '',
                    ribOther2Label: '',
                    invoiceColor: '#218838',
                    logoFileName: ''
                };
            }
        } catch (error) {
            console.error("Erreur récupération infos entreprise:", error);
            // Retourner des valeurs par défaut en cas d'erreur
            return {
                name: 'Mon Entreprise',
                rcNumber: '',
                ninea: '',
                address: '',
                region: '',
                country: '',
                phone: '',
                email: '',
                ribCBAO: '',
                ribBIS: '',
                ribOther1: '',
                ribOther1Label: '',
                ribOther2: '',
                ribOther2Label: '',
                invoiceColor: '#218838',
                logoFileName: ''
            };
        }
    }
};