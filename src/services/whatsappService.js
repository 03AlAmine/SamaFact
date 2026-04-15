// src/services/whatsappService.js
// Service pour l'envoi de documents par WhatsApp

import { generatePdfBlob } from "./pdfService";
import { generatePayrollPdfBlob } from "./pdf_payrollService";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const whatsappService = {
  /**
   * Envoie une facture par WhatsApp
   * @param {Object} document - Le document (facture, devis, avoir)
   * @param {string} type - Type de document ('facture', 'devis', 'avoir')
   * @param {string} recipientPhone - Numéro WhatsApp du destinataire (optionnel)
   * @param {string} recipientName - Nom du destinataire
   * @param {string} companyName - Nom de l'entreprise
   * @returns {Promise<Object>} - Résultat avec le lien WhatsApp
   */
  sendInvoiceByWhatsApp: async (document, type, recipientPhone = null, recipientName = null, companyName = null) => {
    try {
      // 1. Générer le PDF
      const pdfBlob = await generatePdfBlob(document);
      
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error("Le PDF n'a pas pu être généré");
      }
      
      // 2. Préparer les données pour l'API
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `${type}_${document.numero}.pdf`);
      formData.append('documentType', type);
      formData.append('documentNumber', document.numero);
      formData.append('recipientName', recipientName || document.clientNom);
      formData.append('recipientPhone', recipientPhone || document.clientTelephone || '');
      formData.append('companyName', companyName || document.companyName || 'Leader Interim');
      formData.append('amount', document.totalTTC);
      
      // 3. Appeler l'API pour générer le lien
      const response = await fetch(`${API_BASE_URL}/api/generate-whatsapp-link`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la génération du lien");
      }
      
      // 4. Ouvrir WhatsApp (ou retourner le lien)
      if (data.data.whatsappUrl) {
        // Ouvrir dans un nouvel onglet
        window.open(data.data.whatsappUrl, '_blank');
      }
      
      return {
        success: true,
        data: data.data
      };
      
    } catch (error) {
      console.error("❌ Erreur envoi WhatsApp:", error);
      throw error;
    }
  },
  
  /**
   * Envoie un bulletin de paie par WhatsApp
   * @param {Object} payroll - Le bulletin de paie
   * @param {string} recipientPhone - Numéro WhatsApp (optionnel)
   * @param {string} companyName - Nom de l'entreprise
   * @returns {Promise<Object>}
   */
  sendPayrollByWhatsApp: async (payroll, recipientPhone = null, companyName = null) => {
    try {
      // 1. Générer le PDF
      const pdfBlob = await generatePayrollPdfBlob(
        payroll.employee,
        payroll.formData,
        payroll.calculations,
        payroll.companyInfo
      );
      
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error("Le PDF du bulletin n'a pas pu être généré");
      }
      
      // 2. Préparer les données
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `bulletin_${payroll.numero}.pdf`);
      formData.append('documentType', 'payroll');
      formData.append('documentNumber', payroll.numero);
      formData.append('recipientName', payroll.employeeName);
      formData.append('recipientPhone', recipientPhone || payroll.employeeTelephone || '');
      formData.append('companyName', companyName || payroll.companyName || 'Leader Interim');
      formData.append('amount', payroll.calculations?.salaireNetAPayer);
      
      // 3. Appeler l'API
      const response = await fetch(`${API_BASE_URL}/api/generate-whatsapp-link`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la génération du lien");
      }
      
      // 4. Ouvrir WhatsApp
      if (data.data.whatsappUrl) {
        window.open(data.data.whatsappUrl, '_blank');
      }
      
      return {
        success: true,
        data: data.data
      };
      
    } catch (error) {
      console.error("❌ Erreur envoi bulletin WhatsApp:", error);
      throw error;
    }
  },
  
  /**
   * Génère uniquement le lien (sans ouvrir WhatsApp)
   * @param {Object} document 
   * @param {string} type 
   * @returns {Promise<Object>}
   */
  generateWhatsAppLink: async (document, type) => {
    try {
      const pdfBlob = await generatePdfBlob(document);
      
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `${type}_${document.numero}.pdf`);
      formData.append('documentType', type);
      formData.append('documentNumber', document.numero);
      formData.append('recipientName', document.clientNom);
      formData.append('companyName', document.companyName || 'Leader Interim');
      
      const response = await fetch(`${API_BASE_URL}/api/generate-whatsapp-link`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erreur");
      }
      
      return {
        success: true,
        url: data.data.url,
        whatsappUrl: data.data.whatsappUrl,
        expiresAt: data.data.expiresAt
      };
      
    } catch (error) {
      console.error("❌ Erreur:", error);
      throw error;
    }
  },
  
  /**
   * Vérifie les statistiques d'un document
   * @param {string} documentId 
   * @returns {Promise<Object>}
   */
  getDocumentStats: async (documentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/doc/${documentId}/stats`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Erreur stats:", error);
      return { success: false, error: error.message };
    }
  }
};

export default whatsappService;