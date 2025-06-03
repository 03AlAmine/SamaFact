// Pour l'exemple, nous simulons le service d'équipe
// En production, vous utiliseriez Firebase comme pour les autres services

export const teamService = {
  getTeams: () => {
    // Simuler une requête asynchrone
    return Promise.resolve([
      { id: "1", nom: "Équipe Commerciale", description: "Ventes et marketing", responsable: "Jean Dupont" },
      { id: "2", nom: "Équipe Technique", description: "Développement produit", responsable: "Marie Martin" },
      { id: "3", nom: "Équipe Support", description: "Support client", responsable: "Pierre Lambert" }
    ]);
  },

  addTeam: async (teamData) => {
    // Simuler une création
    return Promise.resolve({ 
      success: true, 
      id: Date.now().toString(),
      message: "Équipe ajoutée avec succès !" 
    });
  },

  updateTeam: async (teamId, teamData) => {
    // Simuler une mise à jour
    return Promise.resolve({ 
      success: true, 
      message: "Équipe modifiée avec succès !" 
    });
  },

  deleteTeam: async (teamId) => {
    // Simuler une suppression
    return Promise.resolve({ 
      success: true, 
      message: "Équipe supprimée avec succès !" 
    });
  }
};