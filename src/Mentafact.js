// Mentafact.js - Version corrigée

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { useUi } from "./contexts/uiContext";
import { useAppContext } from "./contexts/AppContext";

// ── Contexts métier ──────────────────────────────────────────────────────────
import { AuditProvider } from "./contexts/AuditContext";  // ← DOIT ÊTRE AVANT
import { ClientProvider, useClientContext } from "./contexts/ClientContext";
import { InvoiceProvider, useInvoiceContext } from "./contexts/InvoiceContext";
import { EmployeeProvider, useEmployeeContext } from "./contexts/EmployeeContext";
import { TeamProvider, useTeamContext } from "./contexts/TeamContext";
import { NotificationProvider } from "./contexts/NotificationContext";

// ── Imports statiques ─────────────────────────────────────────────────────────
import Sidebar from "./pages/Sidebare";
import NavbarPremium from "./components/ui/Navbar";

import { getDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import { FaArrowUp } from "react-icons/fa";
import logo from "./assets/Logo_Mf.png";

import { useEmailSender } from "./hooks/useEmailSender";

// ── Lazy loading ─────────────────────────────────────────────────────────────
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ClientsPage = lazy(() => import("./pages/ClientsPage"));
const EmployeesPage = lazy(() => import("./pages/EmployeePage"));
const InvoicesPage = lazy(() => import("./pages/InvoicesPage"));
const PayrollsPage = lazy(() => import("./pages/PayrollsPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const TeamsPage = lazy(() => import("./pages/TeamsPage"));
const AuditPage = lazy(() => import("./pages/AuditPage"));  // ← AJOUTER

const SectionSkeleton = () => (
  <div style={{ padding: "24px", animation: "pulse 1.5s ease-in-out infinite" }}>
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        style={{
          height: "48px",
          background: "var(--skeleton-color, #e2e8f0)",
          borderRadius: "8px",
          marginBottom: "12px",
          opacity: 1 - i * 0.15,
        }}
      />
    ))}
    <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
  </div>
);

const CompanyLoader = () => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", height: "100vh",
    fontFamily: "Inter, sans-serif", color: "#64748b", gap: "16px",
  }}>
    <div style={{
      width: "32px", height: "32px",
      border: "3px solid #e2e8f0", borderTop: "3px solid #3b82f6",
      borderRadius: "50%", animation: "spin 0.8s linear infinite",
    }} />
    <span style={{ fontSize: "14px" }}>Connexion en cours…</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Composant interne — consomme les contexts ────────────────────────────────
const MentafactInner = ({ companyId }) => {
  const navigate = useNavigate();
  const { currentUser, logout, canToggleModules } = useAuth();
  const { activeTab, setActiveTab } = useUi();
  const { activeModule, setModuleBasedOnRole } = useAppContext();

  // ── Contexts ──────────────────────────────────────────────────────────────
  const {
    clients,
    client, editingClient, selectedClient, societeInput, setSocieteInput,
    importProgress: clientImportProgress,
    clientFactures, clientDevis, clientAvoirs,
    fetchClients,
    handleChange, handleEditChange, handleSocieteBlur,
    handleSubmit, handleUpdate, handleDeleteClient, handleEdit, cancelEdit,
    loadClientInvoices, handleImportClient,
  } = useClientContext();

  const {
    allFactures, allDevis, allAvoirs,
    stats: invoiceStats,
    activeTab_0, setActiveTab_0,
    handleDeleteFacture,
  } = useInvoiceContext();

  const {
    employees, payrolls, employee, editingEmployee, selectedEmployee,
    nextMatricule, importProgress: employeeImportProgress,
    loadEmployeePayrolls,
    handleChangeemployee, handleEditChangeemployee,
    handleSubmitemployee, handleEditEmployee, handleDeleteEmployee,
    handleUpdateEmployee, handleUpdateEmployeeSuivi, cancelEditEmployee,
    handleImportEmployee,
  } = useEmployeeContext();

  const {
    equipes, isEditingEquipe, editingEquipe, equipe,
    checkPermission, createSubUser,
    handleEquipeChange, handleEquipeEditChange,
    handleEquipeSubmit, handleEquipeUpdate, handleEquipeDelete,
    handleEquipeEdit, cancelEquipeEdit,
  } = useTeamContext();


  const {
    sendingEmails,
    sendEmail,
    EmailModal,
  } = useEmailSender(companyId, async (entityType, entityId, email) => {
    if (entityType === "client") {
      await fetchClients(true);
    }
  });
  // Modifier les fonctions d'envoi pour utiliser sendEmail
  const handleSendInvoiceEmail = useCallback((document) => {
    sendEmail(document, document.type || "facture");
  }, [sendEmail]);

  const handleSendPayrollEmail = useCallback((payroll) => {
    sendEmail(payroll, "payroll");
  }, [sendEmail]);
  // ── Stats consolidées ─────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    ...invoiceStats,
    totalClients: clients.length,
    totalEmployees: employees.length,
    totalPayrolls: payrolls.length,
    totalEquipes: equipes.length,
  }), [invoiceStats, clients.length, employees.length, payrolls.length, equipes.length]);

  // ── Recherche globale ─────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const lowerSearch = useMemo(() => searchTerm.toLowerCase(), [searchTerm]);

  const filteredClients = useMemo(
    () => (clients || []).filter(
      (c) =>
        c.nom?.toLowerCase().includes(lowerSearch) ||
        c.societe?.toLowerCase().includes(lowerSearch) ||
        c.email?.toLowerCase().includes(lowerSearch)
    ),
    [clients, lowerSearch]
  );

  const filteredEmployees = useMemo(
    () => (employees || []).filter(
      (e) =>
        e.nom?.toLowerCase().includes(lowerSearch) ||
        e.prenom?.toLowerCase().includes(lowerSearch) ||
        e.poste?.toLowerCase().includes(lowerSearch) ||
        e.matricule?.toLowerCase().includes(lowerSearch) ||
        e.email?.toLowerCase().includes(lowerSearch)
    ),
    [employees, lowerSearch]
  );

  const filteredEquipes = useMemo(
    () => equipes.filter(
      (eq) =>
        eq.nom.toLowerCase().includes(lowerSearch) ||
        eq.responsable?.toLowerCase().includes(lowerSearch)
    ),
    [equipes, lowerSearch]
  );

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    if (companyId) fetchClients();
  }, [companyId, fetchClients]);

  // ── Gestion module ────────────────────────────────────────────────────────
  const { shouldDefaultToPayroll } = useAuth();
  useEffect(() => {
    const savedModule = localStorage.getItem("activeModule");
    const defaultModule = shouldDefaultToPayroll() ? "payroll" : "mentafact";
    if (canToggleModules() && savedModule) setModuleBasedOnRole(savedModule, currentUser.role);
    else setModuleBasedOnRole(defaultModule, currentUser.role);
  }, [currentUser?.role, setModuleBasedOnRole, canToggleModules, shouldDefaultToPayroll]);

  useEffect(() => {
    if (activeModule === "payroll") {
      if (activeTab === "clients") setActiveTab("employees");
      if (activeTab === "factures") setActiveTab("payrolls");
    } else {
      if (activeTab === "employees") setActiveTab("clients");
      if (activeTab === "payrolls") setActiveTab("factures");
    }
  }, [activeModule, activeTab, setActiveTab]);

  // ── Helpers navigation ────────────────────────────────────────────────────
  const handleCreateInvoice = useCallback(() => {
    if (!selectedClient) { alert("Veuillez sélectionner un client d'abord"); return; }
    navigate("/invoice", { state: { client: selectedClient, type: "facture" } });
  }, [selectedClient, navigate]);

  const handleCreatePayroll = useCallback(() => {
    if (!selectedEmployee) { alert("Veuillez sélectionner un employé d'abord"); return; }
    navigate("/payroll", { state: { employee: selectedEmployee, isEditing: false } });
  }, [selectedEmployee, navigate]);

  const handleLoadClientInvoices = useCallback((clientId) => {
    loadClientInvoices(clientId, allFactures, allDevis, allAvoirs);
  }, [loadClientInvoices, allFactures, allDevis, allAvoirs]);

  // ── Données factures à afficher ───────────────────────────────────────────
  const facturesToDisplay = useMemo(
    () => (activeTab === "clients" && selectedClient ? clientFactures : allFactures),
    [activeTab, selectedClient, clientFactures, allFactures]
  );
  const devisToDisplay = useMemo(
    () => (activeTab === "clients" && selectedClient ? clientDevis : allDevis),
    [activeTab, selectedClient, clientDevis, allDevis]
  );
  const avoirsToDisplay = useMemo(
    () => (activeTab === "clients" && selectedClient ? clientAvoirs : allAvoirs),
    [activeTab, selectedClient, clientAvoirs, allAvoirs]
  );

  // ── Callbacks stables ─────────────────────────────────────────────────────
  const stableSetModuleBasedOnRole = useCallback(
    (module, role) => setModuleBasedOnRole(module, role),
    [setModuleBasedOnRole]
  );

  const stableCanToggleModules = useCallback(
    () => canToggleModules(),
    [canToggleModules]
  );

  const stableLogout = useCallback(
    () => logout(),
    [logout]
  );

  // ── Scroll vers le haut ───────────────────────────────────────────────────
  const smoothScrollToTop = useCallback(() => {
    const start = window.pageYOffset;
    const duration = 600;
    const startTime = performance.now();
    function animateScroll(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      window.scrollTo(0, start * (1 - ease));
      if (progress < 1) requestAnimationFrame(animateScroll);
    }
    requestAnimationFrame(animateScroll);
  }, []);

  // ── Rendu de l'onglet actif ───────────────────────────────────────────────
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardPage
            stats={stats}
            allFactures={allFactures}
            allDevis={allDevis}
            allAvoirs={allAvoirs}
            navigate={navigate}
            clients={clients}
            currentUser={currentUser}
            employees={employees}
            payrolls={payrolls}
          />
        );
      case "clients":
        return (
          <ClientsPage
            clients={clients}
            filteredClients={filteredClients}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedClient={selectedClient}
            loadClientInvoices={handleLoadClientInvoices}
            handleEdit={handleEdit}
            handleDelete={handleDeleteClient}
            client={client}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            editingClient={editingClient}
            handleEditChange={handleEditChange}
            handleUpdate={handleUpdate}
            cancelEdit={cancelEdit}
            societeInput={societeInput}
            setSocieteInput={setSocieteInput}
            handleSocieteBlur={handleSocieteBlur}
            clientFactures={clientFactures}
            handleCreateInvoice={handleCreateInvoice}
            handleImportClient={handleImportClient}
            importProgress={clientImportProgress}
          />
        );
      case "employees":
        return (
          <EmployeesPage
            employees={employees}
            filteredEmployees={filteredEmployees}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedEmployee={selectedEmployee}
            loadEmployeePayrolls={loadEmployeePayrolls}
            handleEdit={handleEditEmployee}
            handleDelete={handleDeleteEmployee}
            employee={employee}
            handleChange={handleChangeemployee}
            handleSubmit={handleSubmitemployee}
            editingEmployee={editingEmployee}
            handleEditChange={handleEditChangeemployee}
            handleUpdate={handleUpdateEmployee}
            handleUpdateSuivi={handleUpdateEmployeeSuivi}
            cancelEdit={cancelEditEmployee}
            handleImportEmployees={handleImportEmployee}
            importProgress={employeeImportProgress}
            nextMatricule={nextMatricule}
            handleCreatePayroll={handleCreatePayroll}
            payrolls={payrolls}
          />
        );
      case "factures":
        return (
          <InvoicesPage
            activeTab_0={activeTab_0}
            setActiveTab_0={setActiveTab_0}
            getFacturesToDisplay={facturesToDisplay}
            getDevisToDisplay={devisToDisplay}
            getAvoirsToDisplay={avoirsToDisplay}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            navigate={navigate}
            handleDeleteFacture={handleDeleteFacture}
            selectedClient={selectedClient}
            companyId={companyId}
            clients={clients}
            allFactures={allFactures}
            sendingEmails={sendingEmails}
            onSendEmail={handleSendInvoiceEmail}

          />
        );
      case "payrolls":
        return (
          <PayrollsPage
            payrolls={payrolls}
            employees={employees}
            selectedEmployee={selectedEmployee}
            companyId={companyId}
            navigate={navigate}
            sendingEmails={sendingEmails}
            onSendEmail={handleSendPayrollEmail}
          />
        );
      case "stats":
        return (
          <StatsPage
            stats={stats}
            allFactures={allFactures}
            clients={clients}
            allDevis={allDevis}
            allAvoirs={allAvoirs}
            employees={employees}
            payrolls={payrolls}
          />
        );
      case "equipes":
        return (
          <TeamsPage
            filteredEquipes={filteredEquipes}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isEditingEquipe={isEditingEquipe}
            editingEquipe={editingEquipe}
            handleEquipeEditChange={handleEquipeEditChange}
            handleEquipeUpdate={handleEquipeUpdate}
            cancelEquipeEdit={cancelEquipeEdit}
            equipe={equipe}
            handleEquipeChange={handleEquipeChange}
            handleEquipeSubmit={handleEquipeSubmit}
            handleEquipeEdit={handleEquipeEdit}
            handleEquipeDelete={handleEquipeDelete}
            checkPermission={checkPermission}
            createSubUser={createSubUser}
          />
        );
      case "audit":
        return <AuditPage />;
      default:
        return <div>Sélectionnez une section</div>;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        logo={logo}
        currentUser={currentUser}
      />

      <NotificationProvider
        allFactures={allFactures}
        employees={employees}
        payrolls={payrolls}
        clients={clients}
      >
        <div className="main-content">
          <NavbarPremium
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            currentUser={currentUser}
            companyId={companyId}
            activeModule={activeModule}
            setModuleBasedOnRole={stableSetModuleBasedOnRole}
            canToggleModules={stableCanToggleModules}
            logout={stableLogout}
          />
          <div className="dashboard-container">
            <Suspense fallback={<SectionSkeleton />}>
              {renderActiveTab()}
            </Suspense>
          </div>
        </div>
      </NotificationProvider>
      <EmailModal />
      <button className="floating-up-button" onClick={smoothScrollToTop}>
        <FaArrowUp className="button-icon" />
        <span className="button-text">Up</span>
      </button>
    </div>
  );
};

// ─── Composant racine — ORDRE CORRECT DES PROVIDERS ───────────────────────────
const Mentafact = () => {
  const { currentUser } = useAuth();
  const { activeTab } = useUi();
  const [companyId, setCompanyId] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchCompanyId = async () => {
      try {
        const cacheKey = `companyId_${currentUser.uid}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setCompanyId(cached);
          setCompanyLoading(false);
          return;
        }

        let id = currentUser.companyId;
        if (!id) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) id = userDoc.data().companyId;
        }
        if (id) {
          localStorage.setItem(cacheKey, id);
          setCompanyId(id);
        }
      } catch (err) {
        console.error("Error fetching companyId:", err);
      } finally {
        setCompanyLoading(false);
      }
    };

    fetchCompanyId();
  }, [currentUser]);

  if (companyLoading) return <CompanyLoader />;

  return (
    <AuditProvider>
      <ClientProvider companyId={companyId}>
        <InvoiceProvider companyId={companyId}>
          <EmployeeProvider companyId={companyId} activeTab={activeTab}>
            <TeamProvider companyId={companyId} activeTab={activeTab}>
              <MentafactInner companyId={companyId} />
            </TeamProvider>
          </EmployeeProvider>
        </InvoiceProvider>
      </ClientProvider>
    </AuditProvider>
  );
};

export default Mentafact;