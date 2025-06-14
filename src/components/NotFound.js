import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/NotFound.css'; // Vous créerez ce fichier CSS séparément
import { useEffect } from 'react';
import Parallax from 'parallax-js';
const NotFound = () => {
    const navigate = useNavigate();


    useEffect(() => {
        const scene = document.getElementById('scene');
        new Parallax(scene);
    }, []);
    return (
        <>
            <section className="wrapper-error">
                <div className="container-error">
                    <div id="scene" className="scene" data-hover-only="false">
                        <div className="circle" data-depth="1.2"></div>

                        <div className="one" data-depth="0.9">
                            <div className="content">
                                <span className="piece"></span>
                                <span className="piece"></span>
                                <span className="piece"></span>
                            </div>
                        </div>

                        <div className="two" data-depth="0.60">
                            <div className="content">
                                <span className="piece"></span>
                                <span className="piece"></span>
                                <span className="piece"></span>
                            </div>
                        </div>

                        <div className="three" data-depth="0.40">
                            <div className="content">
                                <span className="piece"></span>
                                <span className="piece"></span>
                                <span className="piece"></span>
                            </div>
                        </div>

                        <p className="p404" data-depth="0.50">404</p>
                        <p className="p404" data-depth="0.10">404</p>
                    </div>

                    <div className="text">
                        <article>
                            <p>Uh oh! Looks like you got lost. <br />Go back to the homepage if you dare!</p>
                            <button onClick={() => navigate('/')}>i dare!</button>
                        </article>
                    </div>
                </div>
            </section>
        </>
    );
};

export default NotFound;