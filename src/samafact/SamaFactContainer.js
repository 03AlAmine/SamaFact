import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import SamaFact from './SamaFact';

const SamaFactContainer = () => {
    const { currentUser } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('companies');
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [stats, setStats] = useState({
        totalCompanies: 0,
        activeCompanies: 0,
        totalUsers: 0,
        adminsCount: 0
    });

    useEffect(() => {
        if (!currentUser || !currentUser.isSuperAdmin) return;

        const loadData = async () => {
            try {
                setLoading(true);

                // Charger les entreprises
                const companiesQuery = query(collection(db, 'companies'));
                const companiesSnapshot = await getDocs(companiesQuery);
                const companiesData = companiesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date()
                }));
                setCompanies(companiesData);

                // Charger les utilisateurs
                const usersQuery = query(collection(db, 'users'));
                const usersSnapshot = await getDocs(usersQuery);
                const usersData = usersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUsers(usersData);

                // Calculer les statistiques
                setStats({
                    totalCompanies: companiesData.length,
                    activeCompanies: companiesData.filter(c => c.status === 'active').length,
                    totalUsers: usersData.length,
                    adminsCount: usersData.filter(u => u.role === 'admin').length
                });

            } catch (error) {
                console.error("Error loading superadmin data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentUser]);

    const handleDeleteCompany = async (companyId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ? Toutes les données associées seront perdues.")) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'companies', companyId));
            setCompanies(companies.filter(c => c.id !== companyId));
            setStats(prev => ({ ...prev, totalCompanies: prev.totalCompanies - 1 }));
        } catch (error) {
            console.error("Error deleting company:", error);
        }
    };

    const handleToggleCompanyStatus = async (companyId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

        try {
            await updateDoc(doc(db, 'companies', companyId), {
                status: newStatus
            });

            setCompanies(companies.map(c =>
                c.id === companyId ? { ...c, status: newStatus } : c
            ));

            setStats(prev => ({
                ...prev,
                activeCompanies: newStatus === 'active'
                    ? prev.activeCompanies + 1
                    : prev.activeCompanies - 1
            }));
        } catch (error) {
            console.error("Error updating company status:", error);
        }
    };

    const filteredCompanies = companies.filter(company =>
        (company.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = users.filter(user =>
        (user.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.companyId ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCompanyUsers = (companyId) => {
        return users.filter(user => user.companyId === companyId);
    };

    return (
        <SamaFact
            loading={loading}
            currentUser={currentUser}
            companies={filteredCompanies}
            users={filteredUsers}
            stats={stats}
            searchTerm={searchTerm}
            activeTab={activeTab}
            selectedCompany={selectedCompany}
            setSearchTerm={setSearchTerm}
            setActiveTab={setActiveTab}
            setSelectedCompany={setSelectedCompany}
            handleDeleteCompany={handleDeleteCompany}
            handleToggleCompanyStatus={handleToggleCompanyStatus}
            getCompanyUsers={getCompanyUsers}
        />
    );
};

export default SamaFactContainer;