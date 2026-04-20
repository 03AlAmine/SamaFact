// src/services/emailService.js
import { generatePdfBlob } from "./pdfService";
import { generatePayrollPdfBlob } from "./pdf_payrollService";

// Configuration de l'API
const API_BASE_URL = process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://samafact.onrender.com'
    : 'http://localhost:3001');

// ========== SERVICE PRINCIPAL ==========

export const emailService = {
  /**
   * Envoi d'email avec PDF en pièce jointe pour les factures
   */
  sendInvoiceWithPdfAttachment: async (document, type = 'facture', onProgress) => {
    try {
      // Callback de progression
      if (onProgress) onProgress('generating_pdf');

      const pdfBlob = await generatePdfBlob(document);

      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error("Le PDF n'a pas pu être généré");
      }

      if (onProgress) onProgress('sending_email');

      const html = buildInvoiceEmailHtml(document, type);
      const subject = getInvoiceEmailSubject(document, type);

      const formData = new FormData();
      formData.append('to', document.clientEmail);
      formData.append('subject', subject);
      formData.append('html', html);
      formData.append('pdf', pdfBlob, `${type}_${document.numero}.pdf`);

      // Timeout de 30 secondes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${API_BASE_URL}/api/send-email-with-pdf`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let data;
      const textResponse = await response.text();

      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error('Erreur parsing JSON:', e);
        data = { message: textResponse };
      }

      if (!response.ok) {
        if (data.success === true) {
          console.warn('⚠️ Réponse non-OK mais email envoyé avec succès');
          return { success: true, data: data.data, warning: 'Statut HTTP non standard' };
        }
        throw new Error(data.error || data.message || "Erreur lors de l'envoi");
      }

      if (onProgress) onProgress('completed');

      return { success: true, data: data.data };

    } catch (error) {
      console.error("❌ Erreur détaillée:", error);

      if (error.name === 'AbortError') {
        throw new Error("Timeout - Le serveur met trop de temps à répondre");
      }

      if (error.message === 'Failed to fetch') {
        console.warn('⚠️ Erreur "Failed to fetch" - vérifiez que le backend répond bien');
        throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion.");
      }

      throw error;
    }
  },

  /**
   * Envoi d'email simple sans PDF
   */
  sendInvoiceEmail: async (to, subject, html, from = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html,
          from
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error("Erreur d'envoi email:", error);
      throw error;
    }
  },

  /**
   * Envoi d'email avec PDF pour les bulletins de paie
   */
  sendPayrollWithPdfAttachment: async (payroll, onProgress) => {
    try {
      if (onProgress) onProgress('generating_pdf');

      // Le bulletin Firestore est stocké à plat (voir payrollService.preparePayrollData).
      // On reconstruit les sous-objets attendus par generatePayrollPdfBlob.
      const employee = {
        nom: payroll.employeeName || '',
        prenom: '',
        matricule: payroll.employeeMatricule || '',
        poste: payroll.employeePosition || '',
        adresse: payroll.employeeAddresse || '',
        categorie: payroll.employeeCategorie || '',
        dateEmbauche: payroll.dateEmbauche || '',
        typeContrat: payroll.typeContrat || 'CDI',
        nbreJoursConges: payroll.nbreJoursConges || 0,
        dateDepart: payroll.dateDepart || null,
        nbreofParts: payroll.nbreofParts || 1,
        salaireBase: payroll.remuneration?.salaireBase || 0,
      };

      const payrollData = {
        numero: payroll.numero || '',
        periode: payroll.periode || {},
        remuneration: payroll.remuneration || {},
        primes: payroll.primes || {},
        retenues: payroll.retenues || {},
      };

      const calculations = payroll.calculations || {};
      const companyInfo = payroll.companyInfo || {};

      const pdfBlob = await generatePayrollPdfBlob(
        employee,
        payrollData,
        calculations,
        companyInfo
      );

      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error("Le PDF du bulletin n'a pas pu être généré");
      }

      if (onProgress) onProgress('sending_email');

      const html = buildPayrollEmailHtml(payroll);
      const subject = getPayrollEmailSubject(payroll);

      const formData = new FormData();
      formData.append('to', payroll.employeeEmail);
      formData.append('subject', subject);
      formData.append('html', html);
      formData.append('pdf', pdfBlob, `bulletin_${payroll.numero}.pdf`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${API_BASE_URL}/api/send-email-with-pdf`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      if (onProgress) onProgress('completed');

      return { success: true, data: data.data };

    } catch (error) {
      console.error("❌ Erreur envoi bulletin:", error);
      if (error.name === 'AbortError') {
        throw new Error("Timeout - Le serveur met trop de temps à répondre");
      }
      throw error;
    }
  },

  /**
   * Envoi d'email avec vérification
   */
  sendWithEmailCheck: async (document, type, providedEmail = null, onProgress) => {
    const emailToUse = providedEmail ||
      (type === 'payroll' ? document.employeeEmail : document.clientEmail);

    if (!emailToUse || !emailToUse.trim()) {
      throw new Error('EMAIL_MISSING');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse)) {
      throw new Error('EMAIL_INVALID');
    }

    if (type === 'payroll') {
      return await emailService.sendPayrollWithPdfAttachment({
        ...document,
        employeeEmail: emailToUse
      }, onProgress);
    } else {
      return await emailService.sendInvoiceWithPdfAttachment({
        ...document,
        clientEmail: emailToUse
      }, type, onProgress);
    }
  },

  /**
   * Sauvegarde l'email d'un client
   */
  saveClientEmail: async (companyId, clientId, email) => {
    try {
      const { db } = await import("../firebase");
      const { doc, updateDoc } = await import("firebase/firestore");

      const clientRef = doc(db, `companies/${companyId}/clients/${clientId}`);
      await updateDoc(clientRef, {
        email: email,
        updatedAt: new Date()
      });

      return { success: true, message: "Email enregistré avec succès" };
    } catch (error) {
      console.error("Erreur sauvegarde email client:", error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Sauvegarde l'email d'un employé
   */
  saveEmployeeEmail: async (companyId, employeeId, email) => {
    try {
      const { db } = await import("../firebase");
      const { doc, updateDoc } = await import("firebase/firestore");

      const employeeRef = doc(db, `companies/${companyId}/employees/${employeeId}`);
      await updateDoc(employeeRef, {
        email: email,
        updatedAt: new Date()
      });

      return { success: true, message: "Email enregistré avec succès" };
    } catch (error) {
      console.error("Erreur sauvegarde email employé:", error);
      return { success: false, message: error.message };
    }
  }
};

// ========== FONCTIONS UTILITAIRES ==========

const getInvoiceEmailSubject = (document, type) => {
  const amount = formatAmount(document.totalTTC);
  const subjects = {
    facture: `📄 Votre facture ${document.numero} - ${amount} FCFA`,
    devis: `📋 Votre devis ${document.numero} - ${amount} FCFA`,
    avoir: `💰 Avoir ${document.numero} - ${amount} FCFA`,
  };
  return subjects[type] || `Document ${document.numero}`;
};

const getDocumentTitle = (type) => {
  const titles = {
    facture: 'FACTURE',
    devis: 'DEVIS',
    avoir: 'AVOIR',
  };
  return titles[type] || 'DOCUMENT';
};

const formatAmount = (amount) => {
  if (!amount) return "0";
  const num = typeof amount === 'string'
    ? parseFloat(amount.replace(/\s/g, '').replace(',', '.'))
    : amount;
  return num.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const buildInvoiceEmailHtml = (document, type) => {
  const amount = formatAmount(document.totalTTC);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${type} ${document.numero}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .greeting { font-size: 16px; margin-bottom: 20px; }
        .attachment-notice { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .attachment-notice p { margin: 0; color: #2e7d32; font-weight: 500; }
        .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #495057; }
        .detail-value { color: #212529; }
        .amount { font-size: 28px; font-weight: bold; color: #4caf50; text-align: center; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
        @media (max-width: 600px) { .container { margin: 10px; } .content { padding: 20px; } .amount { font-size: 24px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>${getDocumentTitle(type)} ${document.numero}</h1><p>${document.date}</p></div>
        <div class="content">
          <div class="greeting">Bonjour <strong>${escapeHtml(document.clientNom)}</strong>,</div>
          <p>Veuillez trouver ci-joint votre ${type} en pièce jointe.</p>
          <div class="attachment-notice"><p>📎 <strong>Pièce jointe :</strong> ${type}_${document.numero}.pdf</p></div>
          <div class="details">
            <div class="detail-row"><span class="detail-label">📅 Date d'émission: </span><span class="detail-value">${document.date}</span></div>
            ${document.dateEcheance ? `<div class="detail-row"><span class="detail-label">⏰ Date d'échéance: </span><span class="detail-value">${document.dateEcheance}</span></div>` : ''}
            <div class="detail-row"><span class="detail-label">💰 Montant ${type === 'devis' ? 'total' : 'TTC'} </span><span class="detail-value amount">${amount} FCFA</span></div>
          </div>
          <p style="margin-top: 20px; color: #6c757d;">Merci de votre confiance.<br><br>Cordialement,<br><strong>L'équipe commerciale</strong></p>
        </div>
        <div class="footer"><p>Cet email a été envoyé automatiquement avec votre document en pièce jointe.</p><p>Merci de ne pas répondre à cet email.</p></div>
      </div>
    </body>
    </html>
  `;
};

const getPayrollEmailSubject = (payroll) => {
  const period = formatPayrollPeriod(payroll.periode);
  return `📄 Bulletin de paie ${payroll.numero} - ${period} - ${payroll.employeeName}`;
};

const formatPayrollPeriod = (periode) => {
  if (!periode?.du || !periode?.au) return '';
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };
  return formatDate(periode.du);
};

const buildPayrollEmailHtml = (payroll) => {
  const periodText = formatPayrollPeriod(payroll.periode);
  const netAPayer = payroll.calculations?.salaireNetAPayer || 0;
  const formattedNet = netAPayer.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bulletin de paie ${payroll.numero}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .greeting { font-size: 16px; margin-bottom: 20px; }
        .attachment-notice { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .attachment-notice p { margin: 0; color: #2e7d32; font-weight: 500; }
        .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #495057; }
        .detail-value { color: #212529; }
        .amount { font-size: 28px; font-weight: bold; color: #4caf50; text-align: center; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
        @media (max-width: 600px) { .container { margin: 10px; } .content { padding: 20px; } .amount { font-size: 24px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>BULLETIN DE PAIE</h1><p>${payroll.numero}</p></div>
        <div class="content">
          <div class="greeting">Bonjour <strong>${escapeHtml(payroll.employeeName)}</strong>,</div>
          <p>Veuillez trouver ci-joint votre bulletin de paie pour la période de <strong>${periodText}</strong>.</p>
          <div class="attachment-notice"><p>📎 <strong>Pièce jointe :</strong> bulletin_${payroll.numero}.pdf</p></div>
          <div class="details">
            <div class="detail-row"><span class="detail-label">📄 Numéro bulletin</span><span class="detail-value">${payroll.numero}</span></div>
            <div class="detail-row"><span class="detail-label">👤 Employé</span><span class="detail-value">${escapeHtml(payroll.employeeName)}</span></div>
            <div class="detail-row"><span class="detail-label">📅 Période</span><span class="detail-value">${periodText}</span></div>
            <div class="detail-row"><span class="detail-label">💰 Salaire net à payer</span><span class="detail-value amount">${formattedNet} FCFA</span></div>
          </div>
          <p style="margin-top: 20px; color: #6c757d;">Merci de votre confiance.<br><br>Cordialement,<br><strong>Service RH / Paie</strong></p>
        </div>
        <div class="footer"><p>Cet email a été envoyé automatiquement avec votre bulletin de paie en pièce jointe.</p><p>Merci de ne pas répondre à cet email.</p></div>
      </div>
    </body>
    </html>
  `;
};

const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};