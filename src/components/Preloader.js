import React, { useEffect, useState } from 'react';
import '../css/Preloader.css';

const Preloader = ({ message = "Chargement en cours...", onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [showLoader, setShowLoader] = useState(true);

    useEffect(() => {
        const images = [
            "/assets/bg/bg-fact.jpg",
            "/assets/bg/bg-client.jpg",
            "/assets/bg/bg-stat.jpg",
            "/assets/bg/bg-team.jpg"
        ];

        let loaded = 0;

        images.forEach((src) => {
            const img = new Image();
            img.src = src;

            img.onload = img.onerror = () => {
                loaded++;
                setProgress(Math.round((loaded / images.length) * 100));

                if (loaded === images.length) {
                    // Quand tout est chargé
                    setTimeout(() => {
                        setShowLoader(false);
                        if (onComplete) onComplete();
                    }, 500); // petit délai pour l’animation
                }
            };
        });
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
