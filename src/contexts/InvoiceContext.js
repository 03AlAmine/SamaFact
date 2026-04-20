import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { invoiceService } from "../services/invoiceService";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";
import { useAudit, AUDIT_ACTIONS } from "./AuditContext";

const InvoiceContext = createContext(null);

export const InvoiceProvider = ({ children, companyId }) => {
  const { currentUser } = useAuth();
  const { logAction } = useAudit();

  const [allFactures, setAllFactures] = useState([]);
  const [allDevis, setAllDevis] = useState([]);
  const [allAvoirs, setAllAvoirs] = useState([]);
  const [stats, setStats] = useState({
    totalFactures: 0,
    revenusMensuels: 0,
    facturesImpayees: 0,
    facturesPayees: 0,
    totalDevis: 0,
    totalAvoirs: 0,
  });

  const [activeTab_0, setActiveTab_0] = useState("factures");

  const unsubsRef = useRef([]);

  useEffect(() => {
    if (!companyId) return;

    // Désabonner les anciens listeners avant d'en créer de nouveaux
    unsubsRef.current.forEach((u) => u());
    unsubsRef.current = [];

    const isChargeCompte = currentUser?.role === "charge_compte";

    const filter = (data) =>
      isChargeCompte ? data.filter((f) => f.userId === currentUser.uid) : data;

    const unsubFactures = invoiceService.getInvoices(companyId, "facture", (data) => {
      const filtered = filter(data);
      setAllFactures(filtered);
      const now = new Date();
      setStats((prev) => ({
        ...prev,
        totalFactures: filtered.length,
        revenusMensuels: filtered
          .filter((f) => f?.date && new Date(f.date).getMonth() === now.getMonth())
          .reduce((sum, f) => sum + (parseFloat(f?.totalTTC) || 0), 0),
        facturesImpayees: filtered.filter((f) => f.statut === "en attente").length,
        facturesPayees: filtered.filter((f) => f.statut === "payé").length,
      }));
    });

    const unsubDevis = invoiceService.getInvoices(companyId, "devis", (data) => {
      const filtered = filter(data);
      setAllDevis(filtered);
      setStats((prev) => ({ ...prev, totalDevis: filtered.length }));
    });

    const unsubAvoirs = invoiceService.getInvoices(companyId, "avoir", (data) => {
      const filtered = filter(data);
      setAllAvoirs(filtered);
      setStats((prev) => ({ ...prev, totalAvoirs: filtered.length }));
    });

    [unsubFactures, unsubDevis, unsubAvoirs].forEach((u) => {
      if (typeof u === "function") unsubsRef.current.push(u);
    });

    return () => {
      unsubsRef.current.forEach((u) => u());
      unsubsRef.current = [];
    };
  }, [companyId, currentUser?.role, currentUser?.uid]);

  // ✅ Fonction pour logger la suppression (appelée depuis handleDeleteFacture)
  const handleDeleteFacture = useCallback(async (docId, type, documentData = null) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ce ${type} ?`)) return false;
    try {
      // Récupérer le document avant suppression si non fourni
      let docToDelete = documentData;
      if (!docToDelete) {
        const collectionName = type === 'facture' ? 'factures' : (type === 'devis' ? 'devis' : 'avoirs');
        // Note: Il faudrait récupérer le doc, mais on peut aussi passer les données depuis l'appel
      }
      
      await deleteDoc(doc(db, `companies/${companyId}/factures`, docId));
      await deleteDoc(doc(db, `companies/${companyId}/factures_resume`, docId));
      
      // ✅ AUDIT: Suppression selon le type
      let action;
      switch (type) {
        case 'facture':
          action = AUDIT_ACTIONS.DELETE_INVOICE;
          break;
        case 'devis':
          action = AUDIT_ACTIONS.DELETE_DEVIS;
          break;
        case 'avoir':
          action = AUDIT_ACTIONS.DELETE_AVOIR;
          break;
        default:
          action = AUDIT_ACTIONS.DELETE_INVOICE;
      }
      
      await logAction({
        action,
        targetType: type,
        targetId: docId,
        targetLabel: documentData?.numero || docId,
        before: documentData,
      });
      
      alert(`${type} supprimé avec succès`);
      return true;
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert("Échec de la suppression");
      return false;
    }
  }, [companyId, logAction]);

  // ✅ Fonctions pour les paiements et modifications (à appeler depuis les pages)
  const logInvoicePayment = useCallback(async (invoice, paymentData) => {
    await logAction({
      action: AUDIT_ACTIONS.PAY_INVOICE,
      targetType: 'facture',
      targetId: invoice.id,
      targetLabel: invoice.numero,
      before: { statut: invoice.statut },
      after: { statut: 'payé', montantPaye: paymentData.montantPaye, datePaiement: paymentData.datePaiement },
    });
  }, [logAction]);

  const logInvoiceUpdate = useCallback(async (oldInvoice, newInvoiceData) => {
    await logAction({
      action: AUDIT_ACTIONS.UPDATE_INVOICE,
      targetType: 'facture',
      targetId: oldInvoice.id,
      targetLabel: oldInvoice.numero,
      before: oldInvoice,
      after: newInvoiceData,
    });
  }, [logAction]);

  const logDevisUpdate = useCallback(async (oldDevis, newDevisData) => {
    await logAction({
      action: AUDIT_ACTIONS.UPDATE_DEVIS,
      targetType: 'devis',
      targetId: oldDevis.id,
      targetLabel: oldDevis.numero,
      before: oldDevis,
      after: newDevisData,
    });
  }, [logAction]);

  const value = {
    allFactures,
    allDevis,
    allAvoirs,
    stats,
    activeTab_0,
    setActiveTab_0,
    handleDeleteFacture,
    logInvoicePayment,
    logInvoiceUpdate,
    logDevisUpdate,
  };

  return <InvoiceContext.Provider value={value}>{children}</InvoiceContext.Provider>;
};

export const useInvoiceContext = () => {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error("useInvoiceContext must be used inside InvoiceProvider");
  return ctx;
};