// src/components/FeatureCard/FeatureCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './FeatureCard.module.css';

// Props: title, description, linkTo, icon (optional)
function FeatureCard({ title, description, linkTo, icon }) {
    return (
        <Link to={linkTo} className={styles.cardLink}>
            <div className={styles.card}>
                {icon && <div className={styles.iconWrapper}>{icon}</div>}
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
            </div>
        </Link>
    );
}

export default FeatureCard;