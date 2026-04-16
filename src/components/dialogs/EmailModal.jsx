// components/dialogs/EmailModal.jsx
import React, { useState, useEffect } from "react";
import { Modal, Button, Input, Form, message, Spin } from "antd";
import { FaEnvelope, FaSave, FaPaperPlane, FaTimes, FaSpinner } from "react-icons/fa";

const EmailModal = ({
  visible,
  onClose,
  onConfirm,
  document,
  type,
  currentEmail,
  onSaveEmail,
  entityType,
  entityId,
  entityName,
  loading = false
}) => {
  const [email, setEmail] = useState(currentEmail || "");
  const [savePermanently, setSavePermanently] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (visible) {
      if (currentEmail) {
        setEmail(currentEmail);
      } else {
        setEmail("");
      }
      setSavePermanently(false);
    }
  }, [visible, currentEmail]);

  // Nettoyer l'état quand le modal se ferme
  useEffect(() => {
    if (!visible) {
      setIsSaving(false);
      setIsSending(false);
    }
  }, [visible]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOnly = async () => {
    if (!email.trim()) {
      message.error("Veuillez entrer une adresse email");
      return;
    }

    if (!validateEmail(email)) {
      message.error("L'adresse email n'est pas valide");
      return;
    }

    setIsSending(true);
    try {
      await onConfirm(email);
      // Le message de succès est déjà géré dans useEmailSender
      onClose();
    } catch (error) {
      // L'erreur est déjà gérée dans useEmailSender
      console.error("Erreur:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveAndSend = async () => {
    if (!email.trim()) {
      message.error("Veuillez entrer une adresse email");
      return;
    }

    if (!validateEmail(email)) {
      message.error("L'adresse email n'est pas valide");
      return;
    }

    setIsSaving(true);
    try {
      // D'abord sauvegarder l'email
      if (onSaveEmail) {
        const saved = await onSaveEmail(entityId, email);
        if (!saved.success) {
          throw new Error(saved.message || "Erreur lors de la sauvegarde");
        }
      }

      // Ensuite envoyer l'email
      setIsSending(true);
      await onConfirm(email);
      onClose();
    } catch (error) {
      // L'erreur est déjà gérée
      console.error("Erreur:", error);
    } finally {
      setIsSaving(false);
      setIsSending(false);
    }
  };

  const getTitle = () => {
    const docType = type === "payroll" ? "bulletin de paie" : type;
    return `Envoi du ${docType} - ${document?.numero || ""}`;
  };

  const getEntityLabel = () => {
    return entityType === "client" ? "client" : "employé";
  };

  const isLoading = loading || isSending || isSaving;

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FaEnvelope style={{ color: "#3b82f6" }} />
          <span>{getTitle()}</span>
        </div>
      }
      open={visible}
      onCancel={!isLoading ? onClose : undefined}
      footer={null}
      width={500}
      className="email-modal"
      closable={!isLoading}
      maskClosable={!isLoading}
    >
      <div style={{ padding: "8px 0" }}>
        <p style={{ marginBottom: "16px", color: "#64748b" }}>
          Veuillez renseigner l'adresse email du {getEntityLabel()} <strong>{entityName}</strong>
          {currentEmail && <span style={{ color: "#10b981" }}> (Email existant: {currentEmail})</span>}
        </p>

        <Form layout="vertical">
          <Form.Item
            label="Adresse email"
            required
            style={{ marginBottom: "16px" }}
          >
            <Input
              type="email"
              placeholder="exemple@domaine.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              prefix={<FaEnvelope style={{ color: "#94a3b8" }} />}
              size="large"
              autoFocus
              onPressEnter={handleSendOnly}
              disabled={isLoading}
            />
          </Form.Item>

          {!currentEmail && onSaveEmail && (
            <Form.Item style={{ marginBottom: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: isLoading ? "not-allowed" : "pointer" }}>
                <input
                  type="checkbox"
                  checked={savePermanently}
                  onChange={(e) => setSavePermanently(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: isLoading ? "not-allowed" : "pointer" }}
                  disabled={isLoading}
                />
                <span style={{ color: "#475569", fontSize: "14px" }}>
                  Enregistrer cet email pour {entityName} (utilisable pour les prochains envois)
                </span>
              </label>
            </Form.Item>
          )}
        </Form>

        {/* Indicateur de progression */}
        {isLoading && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            gap: "12px",
            padding: "12px",
            background: "#f0fdf4",
            borderRadius: "8px",
            marginBottom: "16px"
          }}>
            <Spin size="small" />
            <span style={{ color: "#166534", fontSize: "14px" }}>
              {isSaving ? "Enregistrement de l'email..." : "Envoi du document en cours..."}
            </span>
          </div>
        )}

        <div style={{ 
          display: "flex", 
          gap: "12px", 
          justifyContent: "flex-end",
          marginTop: "24px",
          borderTop: "1px solid #e2e8f0",
          paddingTop: "16px"
        }}>
          <Button onClick={onClose} disabled={isLoading}>
            <FaTimes /> Annuler
          </Button>
          
          {!currentEmail && onSaveEmail && savePermanently ? (
            <Button
              type="primary"
              onClick={handleSaveAndSend}
              loading={isLoading}
              style={{ background: "#10b981", borderColor: "#10b981" }}
              disabled={isLoading}
            >
              {isLoading ? <FaSpinner className="spin" /> : <FaSave />}
              {isLoading ? " En cours..." : " Enregistrer & Envoyer"}
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleSendOnly}
              loading={isLoading}
              style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
              disabled={isLoading}
            >
              {isLoading ? <FaSpinner className="spin" /> : <FaPaperPlane />}
              {isLoading ? " Envoi en cours..." : " Envoyer"}
            </Button>
          )}
        </div>

        {!currentEmail && (
          <p style={{ 
            fontSize: "12px", 
            color: "#94a3b8", 
            marginTop: "16px",
            textAlign: "center",
            background: "#f8fafc",
            padding: "8px",
            borderRadius: "6px"
          }}>
            💡 Astuce : Cochez "Enregistrer" pour ne plus avoir à saisir l'email à l'avenir
          </p>
        )}
      </div>

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Modal>
  );
};

export default EmailModal;