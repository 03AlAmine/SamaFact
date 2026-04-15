// src/hooks/useWhatsAppSender.js
// Hook pour l'envoi de documents par WhatsApp

import React, { useState, useCallback } from "react";
import { message, Modal, Input, Form } from "antd";
import { WhatsAppOutlined, PhoneOutlined } from "@ant-design/icons";
import { whatsappService } from "../services/whatsappService";

export const useWhatsAppSender = (companyId, onSuccess) => {
  const [sendingWhatsApp, setSendingWhatsApp] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [currentType, setCurrentType] = useState(null);
  const [form] = Form.useForm();

  /**
   * Envoie un document par WhatsApp
   */
  const sendByWhatsApp = useCallback(async (document, type, onComplete) => {
    // Déterminer si c'est un bulletin ou une facture
    const isPayroll = type === "payroll";
    const currentPhone = isPayroll ? document.employeeTelephone : document.clientTelephone;
    const currentName = isPayroll ? document.employeeName : document.clientNom;
    
    // Ouvrir le modal pour saisir/confirmer le numéro
    setCurrentDocument(document);
    setCurrentType(type);
    
    form.setFieldsValue({
      phone: currentPhone || '',
      name: currentName || ''
    });
    
    setModalVisible(true);
  }, [form]);
  
  /**
   * Confirme l'envoi
   */
  const confirmSend = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const { phone, name } = values;
      
      if (!phone || !phone.trim()) {
        message.warning("Veuillez saisir un numéro de téléphone WhatsApp");
        return;
      }
      
      setModalVisible(false);
      
      // Marquer comme en cours d'envoi
      const docId = currentDocument.id;
      setSendingWhatsApp(prev => ({ ...prev, [docId]: true }));
      
      let result;
      
      if (currentType === "payroll") {
        result = await whatsappService.sendPayrollByWhatsApp(
          currentDocument,
          phone,
          name
        );
      } else {
        result = await whatsappService.sendInvoiceByWhatsApp(
          currentDocument,
          currentType,
          phone,
          name
        );
      }
      
      if (result.success) {
        message.success(`Lien WhatsApp généré avec succès !`);
        if (onSuccess) onSuccess(currentDocument, currentType);
      }
      
    } catch (error) {
      console.error("Erreur:", error);
      message.error(error.message || "Erreur lors de l'envoi WhatsApp");
    } finally {
      const docId = currentDocument?.id;
      if (docId) {
        setSendingWhatsApp(prev => {
          const newState = { ...prev };
          delete newState[docId];
          return newState;
        });
      }
    }
  }, [currentDocument, currentType, form, onSuccess]);
  
  /**
   * Ferme le modal
   */
  const closeModal = useCallback(() => {
    setModalVisible(false);
    form.resetFields();
  }, [form]);
  
  /**
   * Composant Modal WhatsApp
   */
  const WhatsAppModal = useCallback(() => {
    return (
      <Modal
        title={
          <span>
            <WhatsAppOutlined style={{ color: '#25D366', marginRight: 8 }} />
            Envoyer par WhatsApp
          </span>
        }
        open={modalVisible}
        onCancel={closeModal}
        onOk={confirmSend}
        okText="Envoyer"
        cancelText="Annuler"
        okButtonProps={{ style: { backgroundColor: '#25D366', borderColor: '#25D366' } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="phone"
            label="Numéro WhatsApp"
            rules={[
              { required: true, message: "Veuillez saisir le numéro WhatsApp" },
              { pattern: /^[0-9+\s\-()]{8,20}$/, message: "Format de numéro invalide" }
            ]}
            tooltip="Format: +221 78 123 45 67 ou 781234567"
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="+221 78 123 45 67"
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="Nom du destinataire"
            rules={[{ required: true, message: "Veuillez saisir le nom" }]}
          >
            <Input placeholder="Nom du client/employé" size="large" />
          </Form.Item>
          
          <div style={{ 
            background: '#f0f9f0', 
            padding: 12, 
            borderRadius: 8,
            marginTop: 8,
            fontSize: 12,
            color: '#2e7d32'
          }}>
            <WhatsAppOutlined style={{ marginRight: 8 }} />
            Le lien sera valable 7 jours. Le destinataire pourra visualiser et télécharger le document directement.
          </div>
        </Form>
      </Modal>
    );
  }, [modalVisible, form, closeModal, confirmSend]);
  
  return {
    sendingWhatsApp,
    sendByWhatsApp,
    WhatsAppModal,
    isModalOpen: modalVisible
  };
};

export default useWhatsAppSender;