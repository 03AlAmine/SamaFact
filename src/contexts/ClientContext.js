import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { clientService } from "../services/clientService";
import { useAuth } from "../auth/AuthContext";
import { useAudit, AUDIT_ACTIONS } from "./AuditContext";

const ClientContext = createContext(null);

export const ClientProvider = ({ children, companyId }) => {
  const { currentUser } = useAuth();
  const { logAction } = useAudit();

  // ── État ──────────────────────────────────────────────────────────────────
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef(null);

  const [client, setClient] = useState({
    nom: "", adresse: "", email: "", telephone: "",
    societe: "", type: "client", anciensNoms: [],
  });
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [societeInput, setSocieteInput] = useState("");
  const [importProgress, setImportProgress] = useState("");

  const [clientFactures, setClientFactures] = useState([]);
  const [clientDevis, setClientDevis] = useState([]);
  const [clientAvoirs, setClientAvoirs] = useState([]);

  // ── Listener temps réel (onSnapshot) ─────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;

    setLoading(true);

    // Désabonner l'ancien listener s'il existe
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    const unsub = clientService.getClients(companyId, (data) => {
      setClients(data);
      setLoading(false);
    });

    if (typeof unsub === "function") {
      unsubRef.current = unsub;
    }

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [companyId]);

  // Conservé pour compatibilité avec les appels existants (import, email, etc.)
  const fetchClients = useCallback(() => {
    // Avec onSnapshot, Firestore met à jour automatiquement — rien à faire
  }, []);



  // ── Handlers CRUD avec AUDIT ────────────────────────────────────────────────
  const handleChange = useCallback(
    (e) => setClient((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  const handleEditChange = useCallback(
    (e) => setEditingClient((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  const handleSocieteBlur = useCallback(() => {
    if (!editingClient) return;
    const currentName = (editingClient.societe || "").trim();
    const newName = societeInput.trim();
    if (!newName || currentName === newName) return;
    setEditingClient((prev) => ({
      ...prev,
      societe: newName,
      anciensNoms: [
        ...(prev.anciensNoms || []),
        { nom: currentName, dateChangement: new Date().toISOString() },
      ],
    }));
  }, [editingClient, societeInput]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const result = await clientService.addClient(companyId, client);
    if (result.success) {
      alert(result.message);

      await logAction({
        action: AUDIT_ACTIONS.CREATE_CLIENT,
        targetType: 'client',
        targetId: result.client.id,
        targetLabel: client.nom || client.societe,
        after: client,
      });

      setClient({ nom: "", adresse: "", email: "", telephone: "", societe: "", type: "client", anciensNoms: [] });
      // onSnapshot met à jour clients automatiquement
    } else {
      alert(result.message);
    }
  }, [companyId, client, logAction]);

  const handleUpdate = useCallback(async (e) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      const currentClientData = clients.find((c) => c.id === editingClient.id);
      const isNameChanged = currentClientData?.nom !== editingClient.nom;
      let anciensNoms = [...(editingClient.anciensNoms || [])];
      if (isNameChanged && currentClientData?.nom) {
        anciensNoms.push({
          nom: currentClientData.nom,
          date: new Date().toISOString(),
          userId: currentUser.uid,
          raison: "Modification manuelle",
        });
      }
      const updatedClient = {
        ...editingClient,
        anciensNoms,
        updatedAt: new Date().toISOString(),
        nomNormalized: editingClient.nom.toLowerCase().trim(),
      };
      const result = await clientService.updateClient(companyId, editingClient.id, updatedClient);
      if (result.success) {
        await logAction({
          action: AUDIT_ACTIONS.UPDATE_CLIENT,
          targetType: 'client',
          targetId: editingClient.id,
          targetLabel: editingClient.nom || editingClient.societe,
          before: currentClientData,
          after: updatedClient,
        });

        // onSnapshot met à jour clients automatiquement
        if (selectedClient?.id === editingClient.id) setSelectedClient(updatedClient);
        alert(`Client "${updatedClient.nom}" mis à jour avec succès ✅`);
        if (isNameChanged) {
          alert(
            `Note : Le nom a été changé de "${currentClientData.nom}" à "${updatedClient.nom}".\n` +
            `• Les nouvelles factures utiliseront le nouveau nom\n` +
            `• Les duplications de factures utiliseront le nouveau nom\n` +
            `• Les anciennes factures garderont l'ancien nom pour l'historique`
          );
        }
        cancelEdit();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Erreur mise à jour client:", err);
      alert("Erreur lors de la mise à jour du client");
    }
  }, [companyId, editingClient, clients, selectedClient, currentUser?.uid, logAction]);

  const handleDeleteClient = useCallback(async (clientId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) return false;

    try {
      const clientToDelete = clients.find((c) => c.id === clientId);

      const result = await clientService.deleteClient(companyId, clientId);
      if (result.success) {
        await logAction({
          action: AUDIT_ACTIONS.DELETE_CLIENT,
          targetType: 'client',
          targetId: clientId,
          targetLabel: clientToDelete?.nom || clientToDelete?.societe,
          before: clientToDelete,
        });

        // onSnapshot retire le client automatiquement de la liste
        // Nettoyer la sélection si c'était le client sélectionné
        if (selectedClient?.id === clientId) {
          setSelectedClient(null);
          setClientFactures([]);
          setClientDevis([]);
          setClientAvoirs([]);
        }

        alert("Client supprimé avec succès");
        return true;
      } else {
        alert(result.message || "Échec de la suppression");
        return false;
      }
    } catch (err) {
      console.error("Erreur suppression client:", err);
      let errorMessage = "Échec de la suppression du client";
      if (err.code === "permission-denied") errorMessage = "Vous n'avez pas les droits pour supprimer ce client";
      else if (err.code === "not-found") errorMessage = "Client déjà supprimé ou introuvable";
      alert(errorMessage);
      return false;
    }
  }, [companyId, clients, selectedClient, logAction]);

  const handleEdit = useCallback((clientToEdit) => {
    const currentClient = clients.find((c) => c.id === clientToEdit.id);
    if (currentClient && currentClient.nom !== clientToEdit.nom) {
      const confirmMessage =
        `Vous allez modifier le nom du client de "${currentClient.nom}" à "${clientToEdit.nom}".\n\n` +
        `⚠️ Important :\n• Les nouvelles factures utiliseront le nouveau nom\n` +
        `• Les anciennes factures garderont l'ancien nom\n` +
        `• Les duplications futures utiliseront le nouveau nom\n• Souhaitez-vous continuer ?`;
      if (!window.confirm(confirmMessage)) return;
    }
    setEditingClient({ ...clientToEdit });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [clients]);

  const cancelEdit = useCallback(() => {
    setEditingClient(null);
  }, []);

  const loadClientInvoices = useCallback((clientId, allFactures, allDevis, allAvoirs) => {
    const clientObj = clients.find((c) => c.id === clientId);
    setSelectedClient(clientObj);
    setClientFactures(allFactures.filter((f) => f.clientId === clientId));
    setClientDevis(allDevis.filter((d) => d.clientId === clientId));
    setClientAvoirs(allAvoirs.filter((a) => a.clientId === clientId));
  }, [clients]);

  const handleImportClient = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportProgress("Début de l'import...");
    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setImportProgress("Conversion des données...");
      const clientsToImport = jsonData
        .map((row) => ({
          societe: row["Responsable"] || row["Nom"] || "",
          nom: row["Raison sociale"] || row["Société"] || "",
          email: row["Email"] || row["E-mail"] || "",
          telephone: row["Téléphone"] || row["Phone"] || "",
          adresse: row["Adresse"] || row["Address"] || "",
          ville: row["Ville"] || row["City"] || "",
          type: (row["Type"] || "client").toLowerCase(),
        }))
        .filter((c) => c.nom.trim() !== "");
      if (clientsToImport.length === 0) {
        setImportProgress("Aucun client valide trouvé dans le fichier");
        return;
      }
      setImportProgress(`Importation de ${clientsToImport.length} clients...`);
      let importedCount = 0;
      for (const c of clientsToImport) {
        try {
          const result = await clientService.addClient(companyId, c);
          if (result.success) {
            importedCount++;
            await logAction({
              action: AUDIT_ACTIONS.CREATE_CLIENT,
              targetType: 'client',
              targetId: result.client.id,
              targetLabel: c.nom || c.societe,
              after: c,
              metadata: { import: true },
            });
          }
        } catch (err) {
          console.error("Erreur import client:", err);
        }
      }
      // onSnapshot met à jour la liste automatiquement
      setImportProgress(`${importedCount}/${clientsToImport.length} clients importés avec succès`);
    } catch (err) {
      console.error("Erreur import:", err);
      setImportProgress("Erreur lors de l'import: " + err.message);
    } finally {
      if (e.target) e.target.value = "";
    }
  }, [companyId, logAction]);

  const value = {
    clients,
    loading,
    client,
    editingClient,
    selectedClient,
    societeInput,
    setSocieteInput,
    importProgress,
    clientFactures,
    clientDevis,
    clientAvoirs,
    fetchClients,
    handleChange,
    handleEditChange,
    handleSocieteBlur,
    handleSubmit,
    handleUpdate,
    handleDeleteClient,
    handleEdit,
    cancelEdit,
    loadClientInvoices,
    handleImportClient,
  };

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
};

export const useClientContext = () => {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useClientContext must be used inside ClientProvider");
  return ctx;
};
