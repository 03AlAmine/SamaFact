import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";
import logo from '../assets/LIS.png';

const CompanyNameDisplay = ({ companyId }) => {
    const [companyData, setCompanyData] = useState({
        name: "Mon Entreprise",
        logoUrl: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompanyData = async () => {
            setLoading(true);
            try {
                if (companyId) {
                    const companyRef = doc(db, 'companies', companyId);
                    const companyDoc = await getDoc(companyRef);
                    
                    if (companyDoc.exists()) {
                        setCompanyData({
                            name: companyDoc.data().name || "Mon Entreprise",
                            logoUrl: companyDoc.data().logoUrl || null
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

    if (loading) {
        return (
            <div className="company-brand">
                <img 
                    src={logo}
                    alt="Logo par défaut"
                    className="company-logo loading"
                    style={{
                        width: '40px',
                        height: '40px',
                        opacity: 0.6,
                        marginRight: '10px'
                    }}
                />
                <div className="company-details">
                    <span className="company-name">Chargement...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="company-brand">
            <img 
                src={companyData.logoUrl || logo}
                alt={companyData.logoUrl ? "Logo entreprise" : "Logo par défaut"}
                className="company-logo"
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginRight: '10px',
                    border: companyData.logoUrl ? 'none' : '1px solid #eee'
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