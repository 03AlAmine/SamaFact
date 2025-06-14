// components/Preloader.js
import React from 'react';
import '../css/Preloader.css';

const Preloader = () => {
    return (
        <div className="preloader-overlay">
            <div className="preloader-container">
                <div className="preloader-spinner"></div>
                <div className="preloader-text">Chargement de Mentafact...</div>
            </div>
        </div>
    );
};

export default Preloader;