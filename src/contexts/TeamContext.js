import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useRef,
} from "react";
import { teamService } from "../services/teamService";
import { useAuth } from "../auth/AuthContext";
import { useAudit, AUDIT_ACTIONS } from "./AuditContext";

const CACHE_TTL = 5 * 60 * 1000;
const teamCache = { data: null, ts: 0, companyId: null };
const userCache = { data: null, ts: 0, companyId: null };

const TeamContext = createContext(null);

export const TeamProvider = ({ children, companyId, activeTab }) => {
  const { checkPermission, createSubUser } = useAuth();
  const { logAction } = useAudit();

  const [equipes, setEquipes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [equipe, setEquipe] = useState({ nom: "", description: "", responsable: "" });
  const [editingEquipe, setEditingEquipe] = useState(null);
  const [isEditingEquipe, setIsEditingEquipe] = useState(false);

  const loadedRef = useRef(false);

  const fetchTeams = useCallback(async (force = false) => {
    if (!companyId) return;
    const now = Date.now();

    const teamsHit =
      !force &&
      teamCache.companyId === companyId &&
      teamCache.data !== null &&
      now - teamCache.ts < CACHE_TTL;

    const usersHit =
      !force &&
      userCache.companyId === companyId &&
      userCache.data !== null &&
      now - userCache.ts < CACHE_TTL;

    if (teamsHit && usersHit) {
      setEquipes(teamCache.data);
      setUsers(userCache.data);
      return;
    }

    setLoading(true);
    try {
      const [teamsData, usersData] = await Promise.all([
        teamsHit ? Promise.resolve(teamCache.data) : teamService.getTeams(companyId),
        usersHit ? Promise.resolve(userCache.data) : teamService.getUsersOnce(companyId),
      ]);

      if (!teamsHit) {
        teamCache.data = teamsData;
        teamCache.ts = Date.now();
        teamCache.companyId = companyId;
      }
      if (!usersHit) {
        userCache.data = usersData;
        userCache.ts = Date.now();
        userCache.companyId = companyId;
      }

      setEquipes(teamsData);
      setUsers(usersData);
    } catch (err) {
      console.error("Erreur chargement équipes:", err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (activeTab === "equipes" && !loadedRef.current) {
      loadedRef.current = true;
      fetchTeams();
    }
    if (activeTab !== "equipes") loadedRef.current = false;
  }, [activeTab, fetchTeams]);

  const invalidateCache = useCallback(() => {
    teamCache.data = null;
    teamCache.ts = 0;
    userCache.data = null;
    userCache.ts = 0;
  }, []);

  const handleEquipeChange = useCallback(
    (e) => setEquipe((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  const handleEquipeEditChange = useCallback(
    (e) => setEditingEquipe((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  const handleEquipeSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      const result = await teamService.addTeam(companyId, equipe);
      if (result.success) {
        const newEquipe = { ...equipe, id: result.id };
        
        // ✅ AUDIT: Création équipe
        await logAction({
          action: AUDIT_ACTIONS.CREATE_TEAM,
          targetType: 'equipe',
          targetId: result.id,
          targetLabel: equipe.nom,
          after: equipe,
        });
        
        invalidateCache();
        setEquipes((prev) => [...prev, newEquipe]);
        alert(result.message);
        setEquipe({ nom: "", description: "", responsable: "" });
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de l'ajout de l'équipe.");
    }
  }, [companyId, equipe, invalidateCache, logAction]);

  const handleEquipeUpdate = useCallback(async (e) => {
    e.preventDefault();
    try {
      const oldEquipe = equipes.find(eq => eq.id === editingEquipe.id);
      
      const result = await teamService.updateTeam(editingEquipe.id, editingEquipe);
      if (result.success) {
        // ✅ AUDIT: Modification équipe
        await logAction({
          action: AUDIT_ACTIONS.UPDATE_TEAM,
          targetType: 'equipe',
          targetId: editingEquipe.id,
          targetLabel: editingEquipe.nom,
          before: oldEquipe,
          after: editingEquipe,
        });
        
        invalidateCache();
        setEquipes((prev) => prev.map((eq) => (eq.id === editingEquipe.id ? editingEquipe : eq)));
        alert(result.message);
        cancelEquipeEdit();
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de la modification de l'équipe.");
    }
  }, [editingEquipe, equipes, invalidateCache, logAction]);

  const handleEquipeDelete = useCallback(async (equipeId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) return;
    try {
      const equipeToDelete = equipes.find(eq => eq.id === equipeId);
      
      const result = await teamService.deleteTeam(equipeId);
      if (result.success) {
        // ✅ AUDIT: Suppression équipe
        await logAction({
          action: AUDIT_ACTIONS.DELETE_TEAM,
          targetType: 'equipe',
          targetId: equipeId,
          targetLabel: equipeToDelete?.nom,
          before: equipeToDelete,
        });
        
        invalidateCache();
        setEquipes((prev) => prev.filter((eq) => eq.id !== equipeId));
        alert(result.message);
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de la suppression de l'équipe.");
    }
  }, [equipes, invalidateCache, logAction]);

  const handleEquipeEdit = useCallback((eq) => {
    setEditingEquipe({ ...eq });
    setIsEditingEquipe(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const cancelEquipeEdit = useCallback(() => {
    setEditingEquipe(null);
    setIsEditingEquipe(false);
  }, []);

  const value = {
    equipes,
    users,
    loading,
    equipe,
    editingEquipe,
    isEditingEquipe,
    checkPermission,
    createSubUser,
    fetchTeams,
    handleEquipeChange,
    handleEquipeEditChange,
    handleEquipeSubmit,
    handleEquipeUpdate,
    handleEquipeDelete,
    handleEquipeEdit,
    cancelEquipeEdit,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeamContext = () => {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeamContext must be used inside TeamProvider");
  return ctx;
};