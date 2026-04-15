// components/modals/EmailModal.jsx
import React, { useState, useEffect } from "react";
import { Modal, Button, Input, Form, message } from "antd";
import { FaEnvelope, FaSave, FaPaperPlane, FaTimes } from "react-icons/fa";

const EmailModal = ({
  visible,
  onClose,
  onConfirm,
  document,
  type,
  currentEmail,
  onSaveEmail,
  entityType, // 'client' ou 'employee'
  entityId,
  entityName
}) => {
  const [email, setEmail] = useState(currentEmail || "");
  const [loading, setLoading] = useState(false);
  const [savePermanently, setSavePermanently] = useState(false);

  useEffect(() => {
    if (visible && currentEmail) {
      setEmail(currentEmail);
    } else if (visible && !currentEmail) {
      setEmail("");
    }
  }, [visible, currentEmail]);

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

    setLoading(true);
    try {
      await onConfirm(email);
      message.success(`Email envoyé avec succès à ${email}`);
      onClose();
    } catch (error) {
      message.error(error.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
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

    setLoading(true);
    try {
      // D'abord sauvegarder l'email
      if (onSaveEmail) {
        const saved = await onSaveEmail(entityId, email);
        if (!saved.success) {
          throw new Error(saved.message || "Erreur lors de la sauvegarde");
        }
        message.success(`Email enregistré pour ${entityName}`);
      }

      // Ensuite envoyer l'email
      await onConfirm(email);
      message.success(`Email envoyé avec succès à ${email}`);
      onClose();
    } catch (error) {
      message.error(error.message || "Erreur lors de l'opération");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    const docType = type === "payroll" ? "bulletin de paie" : type;
    return `Envoi du ${docType} - ${document?.numero || ""}`;
  };

  const getEntityLabel = () => {
    return entityType === "client" ? "client" : "employé";
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FaEnvelope style={{ color: "#3b82f6" }} />
          <span>{getTitle()}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      className="email-modal"
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
            />
          </Form.Item>

          {!currentEmail && onSaveEmail && (
            <Form.Item style={{ marginBottom: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={savePermanently}
                  onChange={(e) => setSavePermanently(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <span style={{ color: "#475569", fontSize: "14px" }}>
                  Enregistrer cet email pour {entityName} (utilisable pour les prochains envois)
                </span>
              </label>
            </Form.Item>
          )}
        </Form>

        <div style={{ 
          display: "flex", 
          gap: "12px", 
          justifyContent: "flex-end",
          marginTop: "24px",
          borderTop: "1px solid #e2e8f0",
          paddingTop: "16px"
        }}>
          <Button onClick={onClose} disabled={loading}>
            <FaTimes /> Annuler
          </Button>
          
          {!currentEmail && onSaveEmail && savePermanently ? (
            <Button
              type="primary"
              onClick={handleSaveAndSend}
              loading={loading}
              style={{ background: "#10b981", borderColor: "#10b981" }}
            >
              <FaSave /> Enregistrer & Envoyer
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleSendOnly}
              loading={loading}
              style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
            >
              <FaPaperPlane /> Envoyer
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
    </Modal>
  );
};

export default EmailModal;