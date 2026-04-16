// PayrollActions.jsx - Version corrigée avec spinner
import React, { useState, useCallback } from "react";
import {
  FaEye,
  FaDownload,
  FaTrash,
  FaEdit,
  FaCopy,
  FaCheckCircle,
  FaCreditCard,
  FaTimes,
  FaMagic,
  FaPaperPlane,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle
} from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const PayrollActions = React.memo(({
  payroll,
  getStatus,
  onPreview,
  onDownload,
  onDelete,
  onDuplicate,
  onEdit,
  onValidate,
  onGenerate,
  onMarkAsPaid,
  onCancel,
  sendingEmails = {},
  onSendEmail,
  onShowInfo,
  viewMode,
  showActions = true
}) => {
  const status = getStatus(payroll);
  const isPaid = status === "Payé";
  
  // Vérifier si l'envoi est en cours (depuis le hook)
  const isSending = sendingEmails[payroll?.id] === true;
  
  // État local pour l'effet de chargement (fallback)
  const [localSending, setLocalSending] = useState(false);
  
  // Utiliser l'état global ou local
  const showSending = isSending || localSending;

  const handleSendEmail = useCallback(async (e) => {
    e.stopPropagation();
    
    if (showSending) return; // Éviter les envois multiples
    
    // Si pas d'état global, utiliser l'état local
    if (!sendingEmails[payroll?.id]) {
      setLocalSending(true);
    }
    
    try {
      await onSendEmail(payroll);
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
    } finally {
      setLocalSending(false);
    }
  }, [payroll, onSendEmail, sendingEmails, showSending]);

  const ActionButton = ({ className, icon, title, onClick, disabled = false, loading = false }) => (
    <button
      className={`action-btn ${className} ${loading ? 'loading' : ''}`}
      onClick={onClick}
      title={title}
      disabled={disabled || loading}
    >
      {loading ? (
        <FaSpinner className="spinner-animate" />
      ) : (
        icon
      )}
    </button>
  );

  const actionsContent = (
    <>
      <SwiperSlide>
        <ActionButton
          className="view"
          icon={<FaEye />}
          title="Aperçu"
          onClick={(e) => { e.stopPropagation(); onPreview(payroll); }}
        />
        <ActionButton
          className="download"
          icon={<FaDownload />}
          title="Télécharger"
          onClick={(e) => { e.stopPropagation(); onDownload(payroll); }}
        />
        {!isPaid && (
          <ActionButton
            className="delete"
            icon={<FaTrash />}
            title="Supprimer"
            onClick={(e) => { e.stopPropagation(); onDelete(payroll.id); }}
          />
        )}
      </SwiperSlide>

      <SwiperSlide>
        {!isPaid && (
          <ActionButton
            className="edit"
            icon={<FaEdit />}
            title="Modifier"
            onClick={(e) => { e.stopPropagation(); onEdit(payroll); }}
          />
        )}
        <ActionButton
          className="duplicate"
          icon={<FaCopy />}
          title="Dupliquer"
          onClick={(e) => { e.stopPropagation(); onDuplicate(payroll); }}
        />
        {payroll.statut === "draft" ? (
          <ActionButton
            className="validate"
            icon={<FaCheckCircle />}
            title="Valider"
            onClick={(e) => { e.stopPropagation(); onValidate(payroll.id); }}
          />
        ) : payroll.statut === "validated" ? (
          <ActionButton
            className="pay"
            icon={<FaCreditCard />}
            title="Marquer comme payé"
            onClick={(e) => { e.stopPropagation(); onMarkAsPaid(payroll.id); }}
          />
        ) : payroll.statut === "paid" ? (
          <ActionButton
            className="cancel"
            icon={<FaTimes />}
            title="Annuler"
            onClick={(e) => { e.stopPropagation(); onCancel(payroll.id); }}
          />
        ) : null}
      </SwiperSlide>

      <SwiperSlide>
        <ActionButton
          className="generate"
          icon={<FaMagic />}
          title="Générer automatiquement"
          onClick={(e) => { e.stopPropagation(); onGenerate(payroll); }}
        />
        <ActionButton
          className="send"
          icon={<FaPaperPlane />}
          title={showSending ? "Envoi en cours..." : "Envoyer par email"}
          onClick={handleSendEmail}
          disabled={showSending}
          loading={showSending}
        />
        <ActionButton
          className="info_view"
          icon={<FaInfoCircle />}
          title="Détails"
          onClick={(e) => { e.stopPropagation(); onShowInfo(payroll); }}
        />
      </SwiperSlide>
    </>
  );

  // Configuration Swiper commune
  const swiperConfig = {
    loop: true,
    spaceBetween: 10,
    slidesPerView: 1,
    grabCursor: true,
    speed: 800,
    modules: [Autoplay, Navigation],
    autoplay: {
      delay: 3000,
      pauseOnMouseEnter: true,
      disableOnInteraction: false,
    },
    navigation: {
      nextEl: `.swiper-next-${payroll.id}`,
      prevEl: `.swiper-prev-${payroll.id}`,
      disabledClass: "swiper-button-disabled",
    },
    className: "custom-swiper"
  };

  const wrapperClass = viewMode === "card"
    ? `card-actions ${showActions ? 'visible' : ''}`
    : "table-actions";

  return (
    <div className={wrapperClass} onClick={viewMode !== "card" ? (e) => e.stopPropagation() : undefined}>
      <Swiper {...swiperConfig}>
        {actionsContent}

        <div
          className={`swiper-nav-btn swiper-prev swiper-prev-${payroll.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <FaChevronLeft />
        </div>
        <div
          className={`swiper-nav-btn swiper-next swiper-next-${payroll.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <FaChevronRight />
        </div>
      </Swiper>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée - inclure l'état d'envoi
  return (
    prevProps.payroll.id === nextProps.payroll.id &&
    prevProps.getStatus(prevProps.payroll) === nextProps.getStatus(nextProps.payroll) &&
    prevProps.sendingEmails[prevProps.payroll.id] === nextProps.sendingEmails[nextProps.payroll.id]
  );
});

export default PayrollActions;