import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import "../../css/SearchBox.css";
import useDebounce from "../../hooks/useDebounce";

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

  // inputValue = ce que l'utilisateur tape (immédiat, pour l'affichage)
  // searchTerm = ce qui déclenche les filtres (différé de 250ms)
  const [inputValue, setInputValue] = useState(searchTerm);
  const debouncedValue = useDebounce(inputValue, 250);
  const inputRef = useRef(null);

  // Propage la valeur debouncée vers le parent (Mentafact)
  useEffect(() => {
    setSearchTerm(debouncedValue);
  }, [debouncedValue, setSearchTerm]);

  // Sync si le parent réinitialise searchTerm (ex: changement d'onglet)
  useEffect(() => {
    if (searchTerm === "") setInputValue("");
  }, [searchTerm]);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobileView(width >= 768 && width <= 992);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleExpand = () => {
    if (isMobileView) {
      setIsExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleCollapse = () => {
    if (isMobileView) {
      setIsExpanded(false);
      setInputValue("");
    }
  };

  const handleClear = () => {
    setInputValue("");           // vide l'affichage immédiatement
    setSearchTerm("");           // vide aussi le filtre sans attendre le délai
    if (isMobileView) inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      if (isMobileView && isExpanded) handleCollapse();
      else { setInputValue(""); setSearchTerm(""); }
    }
  };

  return (
    <div
      className={`search-box-container ${className} ${
        isMobileView ? "mobile-view" : "desktop-view"
      } ${isExpanded ? "expanded" : ""}`}
    >
      {isMobileView && !isExpanded ? (
        <button className="search-icon-btn" onClick={handleExpand} title="Rechercher" type="button">
          <FaSearch className="search-icon" />
        </button>
      ) : (
        <div className="search-input-wrapper">
          <FaSearch className="search-input-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}                          
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={(e) => {
              onFocus?.(e);
              if (isMobileView) setIsExpanded(true);
            }}
            onBlur={onBlur}
            onKeyDown={handleKeyDown}
            className="search-input"
          />
          {inputValue && (
            <button className="clear-btn" onClick={handleClear} title="Effacer" type="button">
              <FaTimes />
            </button>
          )}
          {isMobileView && isExpanded && (
            <button className="collapse-btn" onClick={handleCollapse} title="Fermer" type="button">
              <FaTimes />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchBox);