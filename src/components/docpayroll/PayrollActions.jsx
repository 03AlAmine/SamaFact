import React from "react";
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
  sendingEmails,
  onSendEmail,
  onShowInfo,
  viewMode,
  showActions = true
}) => {
  const status = getStatus(payroll);
  const isPaid = status === "Payé";

  const ActionButton = ({ className, icon, title, onClick, disabled = false }) => (
    <button
      className={`action-btn ${className}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {icon}
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
          icon={sendingEmails[payroll.id] ? <FaSpinner className="spinnerr" /> : <FaPaperPlane />}
          title="Envoyer par email"
          onClick={(e) => { e.stopPropagation(); onSendEmail(payroll); }}
          disabled={sendingEmails[payroll.id]}
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

  // Vue Card
  if (viewMode === "card") {
    return (
      <div className={`card-actions ${showActions ? 'visible' : ''}`}>
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
  }

  // Vue Table avec Swiper
  return (
    <div className="table-actions" onClick={(e) => e.stopPropagation()}>
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
  // Comparaison personnalisée
  return (
    prevProps.payroll.id === nextProps.payroll.id &&
    prevProps.sendingEmails[prevProps.payroll.id] === nextProps.sendingEmails[nextProps.payroll.id]
  );
});

export default PayrollActions;