import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import "../../css/SearchBox.css";

const SearchBox = ({ 
  searchTerm, 
  setSearchTerm, 
  placeholder = "Rechercher...",
  className = "",
  onFocus,
  onBlur
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const inputRef = useRef(null);

  // Détection de la taille d'écran
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobileView(width >= 768 && width <= 992);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Expand la searchbox sur mobile
  const handleExpand = () => {
    if (isMobileView) {
      setIsExpanded(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Collapse la searchbox sur mobile
  const handleCollapse = () => {
    if (isMobileView) {
      setIsExpanded(false);
      setSearchTerm(""); // Optionnel: vider la recherche en se fermant
    }
  };

  // Clear la recherche
  const handleClear = () => {
    setSearchTerm("");
    if (isMobileView) {
      inputRef.current?.focus();
    }
  };

  // Gérer la touche Escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (isMobileView && isExpanded) {
        handleCollapse();
      } else {
        setSearchTerm("");
      }
    }
  };

  return (
    <div 
      className={`search-box-container ${className} ${
        isMobileView ? 'mobile-view' : 'desktop-view'
      } ${isExpanded ? 'expanded' : ''}`}
    >
      {/* Icône de recherche toujours visible sur mobile */}
      {(isMobileView && !isExpanded) ? (
        <button 
          className="search-icon-btn"
          onClick={handleExpand}
          title="Rechercher"
          type="button"
        >
          <FaSearch className="search-icon" />
        </button>
      ) : (
        <div className="search-input-wrapper">
          {/* Icône de recherche */}
          <FaSearch className="search-input-icon" />
          
          {/* Champ de recherche */}
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={(e) => {
              onFocus?.(e);
              if (isMobileView) setIsExpanded(true);
            }}
            onBlur={(e) => {
              onBlur?.(e);
              // On ne collapse pas automatiquement pour laisser l'utilisateur finir sa recherche
            }}
            onKeyDown={handleKeyDown}
            className="search-input"
          />
          
          {/* Bouton clear */}
          {searchTerm && (
            <button 
              className="clear-btn"
              onClick={handleClear}
              title="Effacer la recherche"
              type="button"
            >
              <FaTimes />
            </button>
          )}
          
          {/* Bouton de fermeture sur mobile */}
          {isMobileView && isExpanded && (
            <button 
              className="collapse-btn"
              onClick={handleCollapse}
              title="Fermer la recherche"
              type="button"
            >
              <FaTimes />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchBox);