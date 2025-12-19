import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc } from "firebase/firestore";

const CompanyNameDisplay = ({ companyId }) => {
    const [companyData, setCompanyData] = useState({
        name: "Mon Entreprise",
        logo: null
    });
    const [loading, setLoading] = useState(true);

    // Fonction pour charger le logo
    const loadLogo = (fileName) => {
        if (!fileName) return null;
        
        try {
            return require(`../../assets/logos/${fileName}`);
        } catch (error) {
            console.warn(`Logo ${fileName} non trouvé`);
            return null;
        }
    };

    useEffect(() => {
        const fetchCompanyData = async () => {
            setLoading(true);
            try {
                if (companyId) {
                    const companyRef = doc(db, 'companies', companyId);
                    const companyDoc = await getDoc(companyRef);
                    
                    if (companyDoc.exists()) {
                        const data = companyDoc.data();
                        const logoFileName = data.logoFileName;
                        
                        // Charger le logo correspondant
                        const logo = loadLogo(logoFileName);
                        
                        setCompanyData({
                            name: data.name || "Mon Entreprise",
                            logo: logo
                        });
                    }
                }
            } catch (error) {
                console.error("Erreur lors de la récupération de l'entreprise:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyData();
    }, [companyId]);

    // Charger le logo par défaut une seule fois
    const defaultLogo = require('../../assets/Logo_Mf.png');

    if (loading) {
        return (
            <div className="company-brand">
                <img 
                    src={defaultLogo}
                    alt="Logo par défaut"
                    className="company-logo loading"
                    style={{
                        width: '40px',
                        height: '40px',
                        opacity: 0.6,
                        marginRight: '10px',
                        borderRadius: '50%',
                        border: '1px solid #fcfcfcd7',
                    }}
                />
                <div className="company-details">
                    <span className="company-name">Chargement...</span>
                </div>
            </div>
        );
    }

    // Déterminer quel logo afficher et si c'est le logo par défaut
    const displayedLogo = companyData.logo || defaultLogo;
    const isDefaultLogo = !companyData.logo;

    return (
        <div className="company-brand">
            <img 
                src={displayedLogo}
                alt={isDefaultLogo ? "Logo par défaut" : "Logo entreprise"}
                className="company-logo"
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginRight: '10px',
                    border: isDefaultLogo ? '1px solid #fcfcfcd7' : 'none',
                    boxShadow: isDefaultLogo ? 'none' : '0 4px 6px rgba(255, 255, 255, 0.76)',
                }}
                onError={(e) => {
                    e.target.onerror = null; // Évite les boucles d'erreur
                    e.target.src = defaultLogo;
                    // Mettre à jour le style si le logo échoue
                    e.target.style.border = '1px solid #fcfcfcd7';
                    e.target.style.boxShadow = 'none';
                }}
            />
            <div className="company-details">
                <span className="company-name">{companyData.name}</span>
                <span className="company-status">Premium</span>
            </div>
        </div>
    );
};

export default CompanyNameDisplay;