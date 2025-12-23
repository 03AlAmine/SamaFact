import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import emailjs from "emailjs-com";

import PayrollCard from './docpayroll/PayrollCard';
import PayrollTableRow from './docpayroll/PayrollTableRow';
import PayrollHeader from './docpayroll/PayrollHeader';
import LoadingState from './common/LoadingState';
import EmptyState from './common/EmptyState';
import PayrollDetailsModal from './docpayroll/PayrollDetailsModal';

import '../css/DocumentSection.css';

const PayrollSection = ({
  title,
  items,
  searchTerm,
  setSearchTerm,
  onDelete,
  selectedEmployee,
  onDuplicate,
  onDownload,
  onPreview,
  onEdit,
  onValidate,
  onGenerate,
  onMarkAsPaid,
  onCancel,
  getStatus,
  showEmployeeColumn = true
}) => {
  const [sortBy, setSortBy] = useState('numero');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('list');
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingEmails, setSendingEmails] = useState({});
  const navigate = useNavigate();
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
  const prevItemsLengthRef = useRef(0);
  const prevSearchTermRef = useRef(searchTerm);
  const prevViewModeRef = useRef(viewMode);

  // Fonction pour charger plus d'éléments
  const loadMoreItems = useCallback(() => {
    if (loadingMore || !hasMore || items.length === 0) {
      return;
    }

    setLoadingMore(true);

    setTimeout(() => {
      const nextPage = page + 1;

      // Trier les items par ordre descendant (numéro ou date)
      const sortedItems = [...items].sort((a, b) => {
        if (sortBy === 'numero') {
          const numA = parseInt((a.numero || '').replace(/\D/g, ''), 10) || 0;
          const numB = parseInt((b.numero || '').replace(/\D/g, ''), 10) || 0;
          return numB - numA;
        } else if (sortBy === 'periode') {
          const dateA = a.periode?.au ? new Date(a.periode.au) : new Date(0);
          const dateB = b.periode?.au ? new Date(b.periode.au) : new Date(0);
          return dateB - dateA;
        }
        return 0;
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
    return items.filter(item => {
      if (!item) return false;
      const searchLower = (searchTerm || '').toLowerCase();
      const numero = (item.numero || '').toLowerCase();
      const employeeName = (item.employeeName || '').toLowerCase();
      return numero.includes(searchLower) || employeeName.includes(searchLower);
    }).length;
  }, [items, searchTerm]);

  // Précharger l'image de fond
  useEffect(() => {
    const img = new Image();
    img.src = "/bg-fact.jpg";
    img.onload = img.onerror = () => {
      setBackgroundLoaded(true);
    };
  }, []);

  // Gérer le chargement global
  useEffect(() => {
    if (backgroundLoaded) {
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [backgroundLoaded]);

  // Détection responsive
  useEffect(() => {
    const checkResponsive = () => {
      const width = window.innerWidth;

      if (width <= 992) {
        setIsMobile(true);
        // Forcer le mode carte sur mobile
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
        if (sortBy === 'numero') {
          const numA = parseInt((a.numero || '').replace(/\D/g, ''), 10) || 0;
          const numB = parseInt((b.numero || '').replace(/\D/g, ''), 10) || 0;
          return numB - numA;
        } else if (sortBy === 'periode') {
          const dateA = a.periode?.au ? new Date(a.periode.au) : new Date(0);
          const dateB = b.periode?.au ? new Date(b.periode.au) : new Date(0);
          return dateB - dateA;
        }
        return 0;
      });

      // Prendre les premiers items
      const initialItems = sortedItems.slice(0, itemsPerPage);
      setVisibleItems(initialItems);

      // Vérifier s'il y a plus à charger
      const shouldHaveMore = sortedItems.length > itemsPerPage;
      setHasMore(shouldHaveMore);

      prevItemsLengthRef.current = items.length;
      prevSearchTermRef.current = searchTerm;
    } else {
      setVisibleItems([]);
      setHasMore(false);
    }

    // Réinitialiser le scroll
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [items, itemsPerPage, sortBy, searchTerm]);

  // Gérer le changement de viewMode
  const handleViewModeChange = useCallback((newViewMode) => {
    setViewMode(newViewMode);
    prevViewModeRef.current = newViewMode;
  }, []);

  // Effet principal pour initialiser le scroll
  useEffect(() => {
    const itemsLengthChanged = prevItemsLengthRef.current !== items.length;
    const searchTermChanged = prevSearchTermRef.current !== searchTerm;

    // Initialiser seulement si les items ou le terme de recherche changent
    if (itemsLengthChanged || searchTermChanged) {
      initializeInfiniteScroll();
    }
  }, [items.length, searchTerm, initializeInfiniteScroll]);

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

    // Attacher l'observer avec un délai
    const attachObserver = () => {
      if (loaderRef.current) {
        observer.observe(loaderRef.current);
      } else {
        setTimeout(attachObserver, 100);
      }
    };

    attachObserver();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loadMoreItems, viewMode]);

  // Forcer l'initialisation si nécessaire
  useEffect(() => {
    if (items.length > 0 && visibleItems.length === 0 && !loadingMore) {
      initializeInfiniteScroll();
    }
  }, [items.length, visibleItems.length, loadingMore, initializeInfiniteScroll]);

  // Mettre à jour hasMore
  useEffect(() => {
    if (items.length > 0 && visibleItems.length > 0) {
      const sortedItems = [...items].sort((a, b) => {
        if (sortBy === 'numero') {
          const numA = parseInt((a.numero || '').replace(/\D/g, ''), 10) || 0;
          const numB = parseInt((b.numero || '').replace(/\D/g, ''), 10) || 0;
          return numB - numA;
        } else if (sortBy === 'periode') {
          const dateA = a.periode?.au ? new Date(a.periode.au) : new Date(0);
          const dateB = b.periode?.au ? new Date(b.periode.au) : new Date(0);
          return dateB - dateA;
        }
        return 0;
      });

      const currentHasMore = sortedItems.length > visibleItems.length;
      if (currentHasMore !== hasMore) {
        setHasMore(currentHasMore);
      }
    }
  }, [items.length, visibleItems.length, hasMore, sortBy, items]);

  // Reconfigurer l'observer quand le mode d'affichage change
  useEffect(() => {
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
        setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
        return current;
      } else {
        setSortOrder('asc');
        return field;
      }
    });
  }, []);

  const showInfoModal = useCallback((payroll) => {
    setSelectedPayroll(payroll);
    setIsInfoModalVisible(true);
  }, []);

  const handleInfoModalCancel = useCallback(() => {
    setIsInfoModalVisible(false);
  }, []);

  // Filtrage et tri des items visibles
  const filteredItems = useMemo(() => {
    if (visibleItems.length === 0) return [];

    const safeSearch = (searchTerm || '').toLowerCase();

    const filtered = visibleItems.filter(item => {
      if (!item) return false;
      const numero = (item.numero || '').toLowerCase();
      const name = (item.employeeName || '').toLowerCase();
      return numero.includes(safeSearch) || name.includes(safeSearch);
    });

    return filtered.sort((a, b) => {
      let compareValue = 0;
      if (sortBy === 'numero') {
        const numA = parseInt((a.numero || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.numero || '').replace(/\D/g, ''), 10) || 0;
        compareValue = numA - numB;
      } else if (sortBy === 'employeeName') {
        compareValue = (a.employeeName || '').localeCompare(b.employeeName || '');
      } else if (sortBy === 'periode') {
        const dateA = a.periode?.au ? new Date(a.periode.au) : new Date(0);
        const dateB = b.periode?.au ? new Date(b.periode.au) : new Date(0);
        compareValue = dateA - dateB;
      } else if (sortBy === 'salaireNetAPayer') {
        const netA = a.calculations?.salaireNetAPayer || 0;
        const netB = b.calculations?.salaireNetAPayer || 0;
        compareValue = netA - netB;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  }, [visibleItems, searchTerm, sortBy, sortOrder]);

  // Fonction d'envoi d'email
  const sendEmail = useCallback(async (doc) => {
    const missingFields = [];
    if (!doc.employeeName) missingFields.push("nom de l'employé");
    if (!doc.employeeEmail) missingFields.push("email de l'employé");
    if (!doc.numero) missingFields.push("numéro du bulletin");
    if (!doc.calculations?.salaireNetAPayer) missingFields.push("salaire net à payer");
    if (!doc.periode?.du || !doc.periode?.au) missingFields.push("période de paie");

    if (missingFields.length > 0) {
      message.error(`Données manquantes: ${missingFields.join(', ')} ❌`);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(doc.employeeEmail)) {
      message.error("L'adresse email de l'employé n'est pas valide ❌");
      return;
    }

    setSendingEmails(prev => ({ ...prev, [doc.id]: true }));

    const formatDateRange = (periode) => {
      if (!periode?.du || !periode?.au) return '';
      const format = (date) => {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      };
      return `${format(periode.du)} - ${format(periode.au)}`;
    };

    const templateParams = {
      to_name: doc.employeeName,
      to_email: doc.employeeEmail,
      document_numero: doc.numero,
      montant: doc.calculations.salaireNetAPayer.toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }),
      periode: formatDateRange(doc.periode),
    };

    try {
      await emailjs.send(
        "service_samafact",
        "template_samasalaire",
        templateParams,
        "ioK4mXd5cOkG_z4EY"
      );
      message.success(`Email envoyé à ${doc.employeeEmail} ✅`);
    } catch (error) {
      console.error('Erreur emailjs:', error);
      message.error("Erreur lors de l'envoi de l'email ❌");
    } finally {
      setSendingEmails(prev => {
        const newState = { ...prev };
        delete newState[doc.id];
        return newState;
      });
    }
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div
      ref={containerRef}
      className={`document-section-container ${backgroundLoaded ? 'background-loaded' : ''}`}
    >
      <PayrollHeader
        title={title}
        filteredItemsCount={totalFilteredCount}
        viewMode={viewMode}
        setViewMode={handleViewModeChange}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        sortOrder={sortOrder}
        toggleSort={toggleSort}
        navigate={navigate}
        selectedEmployee={selectedEmployee}
        showEmployeeColumn={showEmployeeColumn}
      />

      {totalFilteredCount === 0 ? (
        <EmptyState
          title="Aucun bulletin de paie trouvé"
          message="Commencez par créer votre premier bulletin"
          buttonText="Créer un bulletin"
          onButtonClick={() => navigate("/payroll", { state: { employee: selectedEmployee } })}
          buttonColor="#3b82f6"
        />
      ) : (
        <div className="content-animation">
          {displayMode === "card" ? (
            <div className="cards-grid">
              {filteredItems.map((payroll) => (
                <PayrollCard
                  key={payroll.id}
                  payroll={payroll}
                  showEmployeeColumn={showEmployeeColumn}
                  getStatus={getStatus}
                  onPreview={onPreview}
                  onDownload={onDownload}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onEdit={onEdit}
                  onValidate={onValidate}
                  onGenerate={onGenerate}
                  onMarkAsPaid={onMarkAsPaid}
                  onCancel={onCancel}
                  sendingEmails={sendingEmails}
                  onSendEmail={sendEmail}
                  onShowInfo={showInfoModal}
                />
              ))}

              {/* Élément loader */}
              <div
                ref={loaderRef}
                key={`loader-payroll-${page}-${viewMode}`}
                className="infinite-scroll-loader"
              >
                {loadingMore ? (
                  <div className="loading-spinner">
                    <div className="ant-spin ant-spin-lg ant-spin-spinning">
                      <span className="ant-spin-dot ant-spin-dot-spin">
                        <i className="ant-spin-dot-item"></i>
                        <i className="ant-spin-dot-item"></i>
                        <i className="ant-spin-dot-item"></i>
                        <i className="ant-spin-dot-item"></i>
                      </span>
                    </div>
                    <div className="loading-text">
                      Chargement des bulletins...
                    </div>
                  </div>
                ) : hasMore ? (
                  <div className="has-more-indicator">
                    <div className="has-more-count">
                      {visibleItems.length} sur {items.length} bulletins chargés
                    </div>
                    <small className="has-more-hint">
                      Faites défiler pour charger les bulletins plus anciens
                    </small>
                  </div>
                ) : filteredItems.length > 0 ? (
                  <div className="no-more-data-div">
                    <div className="no-more-data">
                      <span className="check-icon">✓</span>
                      <span className="no-more-text">
                        Tous les bulletins sont chargés ({filteredItems.length} bulletins)
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
                    <th
                      onClick={() => toggleSort('numero')}
                      className={sortBy === 'numero' ? 'active' : ''}
                    >
                      <div className="th-content">
                        Numéro
                        {sortBy === 'numero' && (
                          <span className="sort-indicator">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    {showEmployeeColumn && (
                      <th
                        onClick={() => toggleSort('employeeName')}
                        className={sortBy === 'employeeName' ? 'active' : ''}
                      >
                        <div className="th-content">
                          Employé
                          {sortBy === 'employeeName' && (
                            <span className="sort-indicator">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    )}
                    <th
                      onClick={() => toggleSort('periode')}
                      className={sortBy === 'periode' ? 'active' : ''}
                    >
                      <div className="th-content">
                        Période
                        {sortBy === 'periode' && (
                          <span className="sort-indicator">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('salaireNetAPayer')}
                      className={sortBy === 'salaireNetAPayer' ? 'active' : ''}
                    >
                      <div className="th-content">
                        Net à payer
                        {sortBy === 'salaireNetAPayer' && (
                          <span className="sort-indicator">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((payroll) => (
                    <PayrollTableRow
                      key={payroll.id}
                      payroll={payroll}
                      showEmployeeColumn={showEmployeeColumn}
                      getStatus={getStatus}
                      onPreview={onPreview}
                      onDownload={onDownload}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      onEdit={onEdit}
                      onValidate={onValidate}
                      onGenerate={onGenerate}
                      onMarkAsPaid={onMarkAsPaid}
                      onCancel={onCancel}
                      sendingEmails={sendingEmails}
                      onSendEmail={sendEmail}
                      onShowInfo={showInfoModal}
                    />
                  ))}

                  {/* Ligne loader */}
                  <tr
                    ref={loaderRef}
                    key={`loader-row-payroll-${page}-${viewMode}`}
                    className="loading-row"
                  >
                    <td colSpan={showEmployeeColumn ? 6 : 5} className="loading-cell">
                      {loadingMore ? (
                        <div className="loading-spinner">
                          <div className="ant-spin ant-spin-lg ant-spin-spinning">
                            <span className="ant-spin-dot ant-spin-dot-spin">
                              <i className="ant-spin-dot-item"></i>
                              <i className="ant-spin-dot-item"></i>
                              <i className="ant-spin-dot-item"></i>
                              <i className="ant-spin-dot-item"></i>
                            </span>
                          </div>
                          <div className="loading-text">
                            Chargement des bulletins...
                          </div>
                        </div>
                      ) : hasMore ? (
                        <div className="has-more-indicator">
                          <div className="has-more-count">
                            {visibleItems.length} sur {items.length} bulletins chargés
                          </div>
                          <small className="has-more-hint">
                            Faites défiler pour charger les bulletins plus anciens
                          </small>
                        </div>
                      ) : filteredItems.length > 0 ? (
                        <div className="no-more-data-div">
                          <div className="no-more-data">
                            <span className="check-icon">✓</span>
                            <span className="no-more-text">
                              Tous les bulletins sont chargés ({filteredItems.length} bulletins)
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

      <PayrollDetailsModal
        isVisible={isInfoModalVisible}
        onClose={handleInfoModalCancel}
        payroll={selectedPayroll}
        getStatus={getStatus}
      />
    </div>
  );
};

export default React.memo(PayrollSection);