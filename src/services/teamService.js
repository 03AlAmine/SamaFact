import { db } from "../firebase";
import { collection, addDoc, query, doc, deleteDoc, updateDoc, where, getDocs } from "firebase/firestore";

export const teamService = {
  getTeams: async (companyId) => {
    const q = query(collection(db, "teams"), where("companyId", "==", companyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  addTeam: async (companyId, teamData) => {
    try {
      await addDoc(collection(db, "teams"), {
        ...teamData,
        companyId,
        createdAt: new Date()
      });
      return { success: true, message: "Équipe ajoutée avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de l'ajout de l'équipe." };
    }
  },

  updateTeam: async (teamId, teamData) => {
    try {
      await updateDoc(doc(db, "teams", teamId), teamData);
      return { success: true, message: "Équipe modifiée avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la modification de l'équipe." };
    }
  },

  deleteTeam: async (teamId) => {
    try {
      await deleteDoc(doc(db, "teams", teamId));
      return { success: true, message: "Équipe supprimée avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la suppression de l'équipe." };
    }
  }
};