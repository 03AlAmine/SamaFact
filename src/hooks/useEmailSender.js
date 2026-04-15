// hooks/useEmailSender.js - Version complète et corrigée

import React, { useState, useCallback } from "react";
import { message } from "antd";
import { emailService } from "../services/emailService";
import EmailModal from "../components/dialogs/EmailModal";

export const useEmailSender = (companyId, onEmailSaved) => {
  const [sendingEmails, setSendingEmails] = useState({});
  const [emailModalState, setEmailModalState] = useState({
    visible: false,
    document: null,
    type: null,
    currentEmail: null,
    entityId: null,
    entityName: null,
    entityType: null
  });

  const sendEmail = useCallback(async (document, type, onSuccess) => {
    const entityType = type === "payroll" ? "employee" : "client";
    const currentEmail = type === "payroll" 
      ? document.employeeEmail 
      : document.clientEmail;
    const entityId = type === "payroll" 
      ? document.employeeId 
      : document.clientId;
    const entityName = type === "payroll" 
      ? document.employeeName 
      : document.clientNom;


    // Si l'email existe déjà, envoyer directement
    if (currentEmail && currentEmail.trim()) {
      setSendingEmails(prev => ({ ...prev, [document.id]: true }));
      
      try {
        await emailService.sendWithEmailCheck(document, type, currentEmail);
        message.success(`Document envoyé avec succès à ${currentEmail}`);
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error("Erreur envoi:", error);
        message.error(error.message || "Erreur lors de l'envoi");
      } finally {
        setSendingEmails(prev => {
          const newState = { ...prev };
          delete newState[document.id];
          return newState;
        });
      }
      return;
    }

    // Sinon, ouvrir le modal pour saisir l'email
    setEmailModalState({
      visible: true,
      document,
      type,
      currentEmail: null,
      entityId,
      entityName,
      entityType
    });
  }, []);

  const handleEmailModalConfirm = useCallback(async (email) => {
    const { document, type } = emailModalState;
    
    setSendingEmails(prev => ({ ...prev, [document.id]: true }));
    
    try {
      const result = await emailService.sendWithEmailCheck(document, type, email);
      message.success(`Document envoyé avec succès à ${email}`);
      return { success: true, result };
    } catch (error) {
      console.error("Erreur envoi:", error);
      message.error(error.message || "Erreur lors de l'envoi");
      throw error;
    } finally {
      setSendingEmails(prev => {
        const newState = { ...prev };
        delete newState[document.id];
        return newState;
      });
    }
  }, [emailModalState]);

  const handleSaveEmail = useCallback(async (entityId, email) => {
    const { type, entityType, document } = emailModalState;
    
    
    try {
      let result;
      if (entityType === "client") {
        result = await emailService.saveClientEmail(companyId, entityId, email);
        // Mettre à jour localement le document pour refléter le changement immédiatement
        if (result.success && document) {
          document.clientEmail = email;
        }
      } else {
        result = await emailService.saveEmployeeEmail(companyId, entityId, email);
        // Mettre à jour localement le document pour refléter le changement immédiatement
        if (result.success && document) {
          document.employeeEmail = email;
        }
      }
      
      if (result.success) {
        message.success(`Email enregistré pour ${emailModalState.entityName}`);
        // Appeler le callback si fourni
        if (onEmailSaved) {
          onEmailSaved(entityType, entityId, email);
        }
      }
      
      return result;
    } catch (error) {
      console.error("Erreur sauvegarde email:", error);
      return { success: false, message: error.message };
    }
  }, [companyId, emailModalState, onEmailSaved]);

  const closeEmailModal = useCallback(() => {
    setEmailModalState(prev => ({ ...prev, visible: false }));
  }, []);

  const EmailModalComponent = useCallback(() => {
    if (!emailModalState.visible) return null;
    
    return (
      <EmailModal
        visible={emailModalState.visible}
        onClose={closeEmailModal}
        onConfirm={handleEmailModalConfirm}
        onSaveEmail={handleSaveEmail}
        document={emailModalState.document}
        type={emailModalState.type}
        currentEmail={emailModalState.currentEmail}
        entityType={emailModalState.entityType}
        entityId={emailModalState.entityId}
        entityName={emailModalState.entityName}
      />
    );
  }, [emailModalState, closeEmailModal, handleEmailModalConfirm, handleSaveEmail]);

  return {
    sendingEmails,
    sendEmail,
    EmailModal: EmailModalComponent,
    closeEmailModal
  };
};