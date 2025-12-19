import React from "react";
import {
  FaEye,
  FaDownload,
  FaTrash,
  FaEdit,
  FaCopy,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaPaperPlane,
  FaPlus,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const DocumentActions = ({
  document,
  type,
  getStatus,
  onPreview,
  onDownload,
  onDelete,
  onDuplicate,
  onMarkAsPaid,
  onMarkAsPending,
  navigate,
  selectedClient,
  sendingEmails,
  onSendEmail,
  onShowInfo,
  viewMode,
  showActions = true
}) => {
  const status = getStatus(document);
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
          onClick={(e) => {
            e.stopPropagation();
            onPreview(document);
          }}
        />
        <ActionButton
          className="download"
          icon={<FaDownload />}
          title="Télécharger"
          onClick={(e) => {
            e.stopPropagation();
            onDownload(document);
          }}
        />
        {!isPaid && (
          <ActionButton
            className="delete"
            icon={<FaTrash />}
            title="Supprimer"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(document.id, type);
            }}
          />
        )}
      </SwiperSlide>

      <SwiperSlide>
        {!isPaid && (
          <ActionButton
            className="edit"
            icon={<FaEdit />}
            title="Modifier"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/invoice", {
                state: {
                  facture: document,
                  client: selectedClient,
                  type: document.type,
                  objet: document.objet,
                  ribs: document.ribs,
                  showSignature: document.showSignature,
                },
              });
            }}
          />
        )}
        <ActionButton
          className="duplicate"
          icon={<FaCopy />}
          title="Dupliquer"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(document);
          }}
        />
        {isPaid ? (
          <ActionButton
            className="unpaid"
            icon={<FaTimes />}
            title="Annuler le paiement"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsPending(document.id, type);
            }}
          />
        ) : (
          <ActionButton
            className="paid"
            icon={<FaCheck />}
            title="Marquer comme payé"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsPaid(document.id, type);
            }}
          />
        )}
      </SwiperSlide>

      <SwiperSlide>
        <ActionButton
          className="info_view"
          icon={<FaInfoCircle />}
          title="Détails"
          onClick={(e) => {
            e.stopPropagation();
            onShowInfo(document);
          }}
        />
        <ActionButton
          className="send"
          icon={sendingEmails[document.id] ? <FaSpinner className="spinnerr" /> : <FaPaperPlane />}
          title="Envoyer par email"
          onClick={(e) => {
            e.stopPropagation();
            onSendEmail(document);
          }}
          disabled={sendingEmails[document.id]}
        />
        <ActionButton
          className="add"
          icon={<FaPlus />}
          title="Ajouter"
          onClick={(e) => e.stopPropagation()}
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
      nextEl: `.swiper-next-${document.id}`,
      prevEl: `.swiper-prev-${document.id}`,
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
            className={`swiper-nav-btn swiper-prev swiper-prev-${document.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <FaChevronLeft />
          </div>
          <div
            className={`swiper-nav-btn swiper-next swiper-next-${document.id}`}
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
          className={`swiper-nav-btn swiper-prev swiper-prev-${document.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <FaChevronLeft />
        </div>
        <div
          className={`swiper-nav-btn swiper-next swiper-next-${document.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <FaChevronRight />
        </div>
      </Swiper>
    </div>
  );
};

export default React.memo(DocumentActions);