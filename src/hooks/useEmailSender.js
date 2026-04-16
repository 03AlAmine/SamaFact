// hooks/useEmailSender.js - Version optimisée

import React, { useState, useCallback, useRef } from "react";
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
  
  const isSendingRef = useRef({}); // Pour suivre les envois par document
  const modalTimeoutRef = useRef(null);

  const sendEmail = useCallback(async (document, type, onSuccess) => {
    const documentId = document.id;
    
    // Éviter les envois multiples pour le même document
    if (isSendingRef.current[documentId]) {
      return;
    }

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

    // Marquer comme en cours d'envoi
    isSendingRef.current[documentId] = true;
    setSendingEmails(prev => ({ ...prev, [documentId]: true }));

    try {
      // Fonction pour mettre à jour le progrès (optionnel)
      const updateProgress = (progress) => {
        // Vous pouvez utiliser ceci pour un spinner plus avancé
      };

      if (currentEmail && currentEmail.trim()) {
        await emailService.sendWithEmailCheck(document, type, currentEmail, updateProgress);
        message.success(`Document envoyé avec succès à ${currentEmail}`);
        if (onSuccess) onSuccess();
      } else {
        // Ouvrir le modal pour saisir l'email
        setEmailModalState({
          visible: true,
          document,
          type,
          currentEmail: null,
          entityId,
          entityName,
          entityType
        });
      }
    } catch (error) {
      console.error("Erreur envoi:", error);
      if (error.message === 'EMAIL_MISSING') {
        setEmailModalState({
          visible: true,
          document,
          type,
          currentEmail: null,
          entityId,
          entityName,
          entityType
        });
      } else if (error.message === 'EMAIL_INVALID') {
        message.error("L'adresse email n'est pas valide");
      } else {
        message.error(error.message || "Erreur lors de l'envoi");
      }
    } finally {
      // Nettoyer l'état d'envoi
      delete isSendingRef.current[documentId];
      setSendingEmails(prev => {
        const newState = { ...prev };
        delete newState[documentId];
        return newState;
      });
    }
  }, []);

  const handleEmailModalConfirm = useCallback(async (email) => {
    const { document, type } = emailModalState;
    const documentId = document.id;
    
    // Éviter les doubles appels
    if (isSendingRef.current[documentId]) {
      return { success: false, error: "Envoi déjà en cours" };
    }
    
    isSendingRef.current[documentId] = true;
    setSendingEmails(prev => ({ ...prev, [documentId]: true }));
    
    try {
      await emailService.sendWithEmailCheck(document, type, email);
      message.success(`Document envoyé avec succès à ${email}`);
      setEmailModalState(prev => ({ ...prev, visible: false }));
      return { success: true };
    } catch (error) {
      console.error("Erreur envoi:", error);
      if (error.message === 'EMAIL_INVALID') {
        message.error("L'adresse email n'est pas valide");
      } else {
        message.error(error.message || "Erreur lors de l'envoi");
      }
      throw error;
    } finally {
      delete isSendingRef.current[documentId];
      setSendingEmails(prev => {
        const newState = { ...prev };
        delete newState[documentId];
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
        if (result.success && document) {
          document.clientEmail = email;
        }
      } else {
        result = await emailService.saveEmployeeEmail(companyId, entityId, email);
        if (result.success && document) {
          document.employeeEmail = email;
        }
      }
      
      if (result.success) {
        message.success(`Email enregistré pour ${emailModalState.entityName}`);
        if (onEmailSaved) {
          onEmailSaved(entityType, entityId, email);
        }
      }
      
      return result;
    } catch (error) {
      console.error("Erreur sauvegarde email:", error);
      message.error(error.message || "Erreur lors de la sauvegarde");
      return { success: false, message: error.message };
    }
  }, [companyId, emailModalState, onEmailSaved]);

  const closeEmailModal = useCallback(() => {
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
    }
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
        loading={!!sendingEmails[emailModalState.document?.id]}
      />
    );
  }, [emailModalState, closeEmailModal, handleEmailModalConfirm, handleSaveEmail, sendingEmails]);

  return {
    sendingEmails,
    sendEmail,
    EmailModal: EmailModalComponent,
    closeEmailModal
  };
};