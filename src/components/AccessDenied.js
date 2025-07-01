import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/AccessDenied.css';
import { useEffect } from 'react';
import Parallax from 'parallax-js';
import { FaLongArrowAltRight } from 'react-icons/fa';

const AccessDenied = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const scene = document.getElementById('scene-denied');
        new Parallax(scene);
    }, []);

    return (
        <section className="wrapper-denied">
            <div className="container-denied">
                <div id="scene-denied" className="scene-denied" data-hover-only="false">
                    <div className="circle-denied" data-depth="1.2"></div>

                    <div className="one-denied" data-depth="0.9">
                        <div className="content">
                            <span className="piece"></span>
                            <span className="piece"></span>
                            <span className="piece"></span>
                        </div>
                    </div>

                    <div className="two-denied" data-depth="0.60">
                        <div className="content">
                            <span className="piece"></span>
                            <span className="piece"></span>
                            <span className="piece"></span>
                        </div>
                    </div>

                    <div className="three-denied" data-depth="0.40">
                        <div className="content">
                            <span className="piece"></span>
                            <span className="piece"></span>
                            <span className="piece"></span>
                        </div>
                    </div>

                    <p className="p-denied" data-depth="0.50">Hum ??? <br /> rebrousse!!!</p>
                    <p className="p-denied" data-depth="0.10">DANGER</p>
                </div>

                <div className="text-denied">
                    <article>
                        <p>Accès strictement interdit! <br />
                        Votre tentative d'accès a été bloquée The Ment@list<br />
                        Merci de bien vouloir retourner à la page d'accueil.</p>
                        <button onClick={() => navigate('/')}>Bredrouille <FaLongArrowAltRight/> </button>
                    </article>
                </div>
            </div>
        </section>
    );
};

export default AccessDenied;