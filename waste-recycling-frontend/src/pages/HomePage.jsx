// src/pages/HomePage.jsx
import React from 'react';
import styles from './HomePage.module.css'; // Import CSS Module
import FeatureCard from '../components/FeatureCard/FeatureCard';
function HomePage() {

  const features = [
    {
        title: "Scan Waste",
        description: "Identify items instantly using your camera or by uploading an image.",
        linkTo: "/scan",
        icon: "📷" // Placeholder icon
    },
    {
        title: "Disposal Guide",
        description: "Search for items and learn the correct local disposal procedures.",
        linkTo: "/guide",
        icon: "📖" // Placeholder icon
    },
    {
        title: "Leaderboard",
        description: "Track your progress and see how you rank against other eco-warriors.",
        linkTo: "/leaderboard",
        icon: "🏆" // Placeholder icon
    },
    {
        title: "Your Profile",
        description: "View your score, scan history (coming soon!), and manage your account.",
        linkTo: "/profile",
        icon: "👤" // Placeholder icon
    }
];

return (
  <div className={styles.homeContainer}>
      <header className={styles.heroSection}>
          <h1 className={styles.heroTitle}>Welcome to RecycleApp!</h1>
          <p className={styles.heroSubtitle}>Your smart companion for responsible waste disposal.</p>
          {/* Optional: Add a primary call-to-action button */}
          {/* <Link to="/scan" className={styles.heroButton}>Start Scanning</Link> */}
      </header>

      <section className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>Explore Features</h2>
          <div className={styles.featuresGrid}>
              {/* Map over features data to create cards */}
              {features.map((feature, index) => (
                  <FeatureCard
                      key={index}
                      title={feature.title}
                      description={feature.description}
                      linkTo={feature.linkTo}
                      icon={feature.icon}
                  />
              ))}
          </div>
      </section>

       {/* Optional: Add other sections like How it Works, Benefits, etc. */}
       {/* <section className={styles.howItWorksSection}> ... </section> */}

  </div>
);
}

export default HomePage;