import React, { useEffect, useState } from 'react';
import '../css/Preloader.css';

const Preloader = ({ message = "Chargement en cours...", onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [showLoader, setShowLoader] = useState(true);

    useEffect(() => {
        // Animation de la progress bar
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + 1;
            });
        }, 30);

        // Fin du chargement
        const completionTimer = setTimeout(() => {
            if (onComplete) {
                setShowLoader(false);
                onComplete();
            }
        }, 3000); // Durée totale du preloader

        return () => {
            clearInterval(progressInterval);
            clearTimeout(completionTimer);
        };
    }, [onComplete]);

    if (!showLoader) return null;

    return (
        <div className="preloader-overlay">
            <div className="preloader-container">
                <div className="preloader-animation">
                    <div className="orbital-spinner">
                        <div className="orbit"></div>
                        <div className="planet"></div>
                        <div className="moon"></div>
                    </div>
                </div>
                <div className="preloader-text">
                    {message.split('').map((letter, index) => (
                        <span
                            key={index}
                            className="letter"
                            style={{
                                animationDelay: `${index * 0.05}s`,
                                color: `hsl(${index * 10 + 200}, 80%, 60%)`
                            }}
                        >
                            {letter === ' ' ? '\u00A0' : letter}
                        </span>
                    ))}
                </div>
                <div className="preloader-progress">
                    <div
                        className="progress-bar"
                        style={{ width: `${progress}%` }}
                    ></div>
                    <div className="progress-text">{progress}%</div>
                </div>
            </div>
        </div>
    );
};

export default Preloader;