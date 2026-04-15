import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {  Spin } from "antd";
import DocumentCard from "./document/DocumentCard";
import DocumentTableRow from "./document/DocumentTableRow";
import DocumentDetailsModal from "./document/DocumentDetailsModal";
import LoadingState from "./common/LoadingState";
import HeaderSection from "./document/HeaderSection";
import EmptyState from "./common/EmptyState";


const DocumentSection = ({
  title,
  items,
  searchTerm,
  setSearchTerm,
  navigate,
  onDelete,
  selectedClient,
  type,
  onDuplicate,
  onDownload,
  onPreview,
  onMarkAsPaid,
  onMarkAsPending,
  getStatus,
  onExport,
  getTypeColor,
  selectedFilterClient,
  onClearClientFilter,
  onSendEmail,
}) => {
  const [sortBy, setSortBy] = useState("numero");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("card");
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [backgroundLoaded] = useState(false);
  const [loading] = useState(false); // ← false directement
  const [sendingEmails] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  // États pour le scroll infini
  const [visibleItems, setVisibleItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const itemsPerPage = 20;
  const loaderRef = useRef(null);
  const observerRef = useRef(null);
  const containerRef = useRef(null);

  // Références pour détecter les changements
  const prevTypeRef = useRef(type);
  const prevItemsLengthRef = useRef(0);
  // 🔥 NOUVEAU : Référence pour suivre le mode précédent

  // Fonction pour charger plus d'éléments
  const loadMoreItems = useCallback(() => {
    if (loadingMore || !hasMore || items.length === 0) {
      return;
    }

    setLoadingMore(true);

    setTimeout(() => {
      const nextPage = page + 1;

      // Trier les items par ordre descendant
      const sortedItems = [...items].sort((a, b) => {
        if (sortBy === "numero") {
          const numA = parseInt(a.numero.replace(/\D/g, "")) || 0;
          const numB = parseInt(b.numero.replace(/\D/g, "")) || 0;
          return numB - numA;
        }
        return new Date(b.date) - new Date(a.date);
      });

      // Calculer les indices
      const startIndex = nextPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const nextItems = sortedItems.slice(startIndex, endIndex);

      if (nextItems.length > 0) {
        setVisibleItems(prev => [...prev, ...nextItems]);
        setPage(nextPage);

        // Vérifier s'il reste des éléments à charger
        const nextHasMore = sortedItems.length > (nextPage + 1) * itemsPerPage;
        setHasMore(nextHasMore);
      } else {
        setHasMore(false);
      }

      setLoadingMore(false);
    }, 300);
  }, [page, loadingMore, hasMore, items, itemsPerPage, sortBy]);

  // Calcul du nombre total filtré
  const totalFilteredCount = useMemo(() => {
    const count = items.filter(item =>
      item.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.clientNom && item.clientNom.toLowerCase().includes(searchTerm.toLowerCase()))
    ).length;
    return count;
  }, [items, searchTerm]);




  // Détection responsive
  useEffect(() => {
    const checkResponsive = () => {
      const width = window.innerWidth;

      if (width <= 992) {
        setIsMobile(true);
        // 🔥 CORRECTION : Forcer le mode carte sur mobile
        setViewMode("card");
      } else {
        setIsMobile(false);
      }
    };

    checkResponsive();
    window.addEventListener("resize", checkResponsive);
    window.addEventListener("orientationchange", checkResponsive);

    return () => {
      window.removeEventListener("resize", checkResponsive);
      window.removeEventListener("orientationchange", checkResponsive);
    };
  }, []);

  // Fonction pour initialiser le scroll infini
  const initializeInfiniteScroll = useCallback(() => {
    // Réinitialiser les états
    setPage(0);
    setVisibleItems([]);
    setLoadingMore(false);

    if (items.length > 0) {
      // Trier par ordre descendant
      const sortedItems = [...items].sort((a, b) => {
        if (sortBy === "numero") {
          const numA = parseInt(a.numero.replace(/\D/g, "")) || 0;
          const numB = parseInt(b.numero.replace(/\D/g, "")) || 0;
          return numB - numA;
        }
        return new Date(b.date) - new Date(a.date);
      });

      // Prendre les premiers items
      const initialItems = sortedItems.slice(0, itemsPerPage);
      setVisibleItems(initialItems);

      // Vérifier s'il y a plus à charger
      const shouldHaveMore = sortedItems.length > itemsPerPage;
      setHasMore(shouldHaveMore);

      prevItemsLengthRef.current = items.length;
    } else {
      setVisibleItems([]);
      setHasMore(false);
    }

    // Réinitialiser le scroll
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [items, itemsPerPage, sortBy]);


  // 🔥 CORRECTION : Effet principal amélioré
  useEffect(() => {
    const typeChanged = prevTypeRef.current !== type;
    const itemsLengthChanged = prevItemsLengthRef.current !== items.length;

    // Initialiser seulement si le type change ou si les items changent
    if (typeChanged || itemsLengthChanged) {
      initializeInfiniteScroll();
      prevTypeRef.current = type;
    }

    // 🔥 CORRECTION : Ne pas réinitialiser quand on change juste le mode d'affichage
    // Le changement de viewMode ne doit pas affecter le scroll infini
  }, [type, items.length, initializeInfiniteScroll]);

  // Configuration de l'Observer
  useEffect(() => {
    if (!hasMore || loadingMore) {
      return;
    }

    // Nettoyer l'ancien observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadMoreItems();
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0.1
      }
    );

    observerRef.current = observer;

    // Attacher l'observer avec un délai pour s'assurer que le DOM est mis à jour
    const attachObserver = () => {
      if (loaderRef.current) {
        observer.observe(loaderRef.current);
      } else {
        // Réessayer après un court délai
        setTimeout(attachObserver, 100);
      }
    };

    attachObserver();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loadMoreItems, viewMode]); // 🔥 Ajout de viewMode dans les dépendances

  // 🔥 CORRECTION : Forcer l'initialisation si nécessaire
  useEffect(() => {
    if (items.length > 0 && visibleItems.length === 0 && !loadingMore) {
      initializeInfiniteScroll();
    }
  }, [items.length, visibleItems.length, loadingMore, initializeInfiniteScroll]);

  // Mettre à jour hasMore
  useEffect(() => {
    if (items.length > 0 && visibleItems.length > 0) {
      const sortedItems = [...items].sort((a, b) => {
        if (sortBy === "numero") {
          const numA = parseInt(a.numero.replace(/\D/g, "")) || 0;
          const numB = parseInt(b.numero.replace(/\D/g, "")) || 0;
          return numB - numA;
        }
        return new Date(b.date) - new Date(a.date);
      });

      const currentHasMore = sortedItems.length > visibleItems.length;
      if (currentHasMore !== hasMore) {
        setHasMore(currentHasMore);
      }
    }
  }, [items.length, visibleItems.length, hasMore, sortBy, items]);

  // 🔥 CORRECTION : Reconfigurer l'observer quand le mode d'affichage change
  useEffect(() => {
    // Réattacher l'observer quand le viewMode change
    if (observerRef.current && loaderRef.current && hasMore && !loadingMore) {
      setTimeout(() => {
        if (observerRef.current && loaderRef.current) {
          observerRef.current.unobserve(loaderRef.current);
          observerRef.current.observe(loaderRef.current);
        }
      }, 100);
    }
  }, [viewMode, hasMore, loadingMore]);

  const displayMode = isMobile ? "card" : viewMode;


  const toggleSort = useCallback((field) => {
    setSortBy(current => {
      if (current === field) {
        setSortOrder(order => order === "asc" ? "desc" : "asc");
        return current;
      } else {
        setSortOrder("asc");
        return field;
      }
    });
  }, []);

  const showInfoModal = useCallback((document) => {
    setSelectedDocument(document);
    setIsInfoModalVisible(true);
  }, []);

  const handleInfoModalCancel = useCallback(() => {
    setIsInfoModalVisible(false);
  }, []);

  // Filtrage et tri
  const filteredItems = useMemo(() => {
    if (visibleItems.length === 0) return [];

    const filtered = visibleItems.filter(
      (item) =>
        item.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.clientNom &&
          item.clientNom.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === "numero") {
        const numA = parseInt(a.numero.replace(/\D/g, "")) || 0;
        const numB = parseInt(b.numero.replace(/\D/g, "")) || 0;
        compareValue = numA - numB;
      } else if (sortBy === "clientNom") {
        compareValue = (a.clientNom || "").localeCompare(b.clientNom || "");
      } else if (sortBy === "date") {
        compareValue = new Date(a.date) - new Date(b.date);
      } else if (sortBy === "totalTTC") {
        const amountA = typeof a.totalTTC === 'string'
          ? parseFloat(a.totalTTC.replace(/\s/g, '').replace(',', '.'))
          : a.totalTTC || 0;
        const amountB = typeof b.totalTTC === 'string'
          ? parseFloat(b.totalTTC.replace(/\s/g, '').replace(',', '.'))
          : b.totalTTC || 0;
        compareValue = amountA - amountB;
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });
  }, [visibleItems, searchTerm, sortBy, sortOrder]);

  // Fonction d'envoi d'email
  const sendEmail = useCallback(async (doc) => {
    // Utiliser le hook useEmailSender à la place
    // Mais comme DocumentSection n'a pas accès au hook, 
    // on va recevoir onSendEmail en prop
    onSendEmail(doc);
  }, [onSendEmail]);


  if (loading) {
    return <LoadingState />;
  }

  return (
    <div
      ref={containerRef}
      className={`document-section-container ${backgroundLoaded ? "background-loaded" : ""
        }`}
    >
      <HeaderSection
        title={title}
        type={type}
        getTypeColor={getTypeColor}
        filteredItemsCount={totalFilteredCount}
        viewMode={viewMode}
        setViewMode={setViewMode} // 🔥 Utiliser la nouvelle fonction
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        sortOrder={sortOrder}
        toggleSort={toggleSort}
        navigate={navigate}
        isMobile={isMobile}
        onExport={onExport}
        selectedFilterClient={selectedFilterClient}
        onClearClientFilter={onClearClientFilter}

      />

      {totalFilteredCount === 0 ? (
        <EmptyState
          title={title}
          type={type}
          getTypeColor={getTypeColor}
          navigate={navigate}
        />
      ) : (
        <div className="content-animation">
          {displayMode === "card" ? (
            <div className="cards-grid">
              {filteredItems.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  type={type}
                  getStatus={getStatus}
                  getTypeColor={getTypeColor}
                  onPreview={onPreview}
                  onDownload={onDownload}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onMarkAsPaid={onMarkAsPaid}
                  onMarkAsPending={onMarkAsPending}
                  navigate={navigate}
                  selectedClient={selectedClient}
                  sendingEmails={sendingEmails}
                  onSendEmail={sendEmail}
                  onShowInfo={showInfoModal}
                />
              ))}

              {/* Élément loader */}
              <div
                ref={loaderRef}
                key={`loader-${type}-${page}-${viewMode}`} // 🔥 Ajout de viewMode dans la clé
                className="infinite-scroll-loader"
              >
                {loadingMore ? (
                  <div className="loading-spinner">
                    <Spin size="large" />
                    <div className="loading-text">
                      Chargement des documents...
                    </div>
                  </div>
                ) : hasMore ? (
                  <div className="has-more-indicator">
                    <div className="has-more-count">
                      {visibleItems.length} sur {items.length} documents chargés
                    </div>
                    <small className="has-more-hint">
                      Faites défiler pour charger les documents plus anciens
                    </small>
                  </div>
                ) : filteredItems.length > 0 ? (
                  <div className="no-more-data-div">
                    <div className="no-more-data">
                      <span className="check-icon">✓</span>
                      <span className="no-more-text">
                        Tous les documents sont chargés ({filteredItems.length} documents)
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="documents-table">
                <thead>
                  <tr>
                    {["numero", "clientNom", "date", "totalTTC"].map((field) => (
                      <th
                        key={field}
                        onClick={() => toggleSort(field)}
                        className={sortBy === field ? "active" : ""}
                      >
                        <div className="th-content">
                          {
                            {
                              numero: "Numéro",
                              clientNom: "Client",
                              date: "Date",
                              totalTTC: "Montant",
                            }[field]
                          }
                          {sortBy === field && (
                            <span className="sort-indicator">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((document) => (
                    <DocumentTableRow
                      key={document.id}
                      document={document}
                      type={type}
                      getStatus={getStatus}
                      getTypeColor={getTypeColor}
                      onPreview={onPreview}
                      onDownload={onDownload}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      onMarkAsPaid={onMarkAsPaid}
                      onMarkAsPending={onMarkAsPending}
                      navigate={navigate}
                      selectedClient={selectedClient}
                      sendingEmails={sendingEmails}
                      onSendEmail={sendEmail}
                      onShowInfo={showInfoModal}
                    />
                  ))}

                  {/* Ligne loader */}
                  <tr
                    ref={loaderRef}
                    key={`loader-row-${type}-${page}-${viewMode}`} // 🔥 Ajout de viewMode dans la clé
                    className="loading-row"
                  >
                    <td colSpan="6" className="loading-cell">
                      {loadingMore ? (
                        <div className="loading-spinner">
                          <Spin size="large" />
                          <div className="loading-text">
                            Chargement des documents...
                          </div>
                        </div>
                      ) : hasMore ? (
                        <div className="has-more-indicator">
                          <div className="has-more-count">
                            {visibleItems.length} sur {items.length} documents chargés
                          </div>
                          <small className="has-more-hint">
                            Faites défiler pour charger les documents plus anciens
                          </small>
                        </div>
                      ) : filteredItems.length > 0 ? (
                        <div className="no-more-data-div">
                          <div className="no-more-data">
                            <span className="check-icon">✓</span>
                            <span className="no-more-text">
                              Tous les documents sont chargés ({filteredItems.length} documents)
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <DocumentDetailsModal
        isVisible={isInfoModalVisible}
        onClose={handleInfoModalCancel}
        document={selectedDocument}
        type={type}
        getStatus={getStatus}
        getTypeColor={getTypeColor}
      />
    </div>
  );
};

export default React.memo(DocumentSection);