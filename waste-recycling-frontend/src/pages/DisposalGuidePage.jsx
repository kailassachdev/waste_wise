// src/pages/DisposalGuidePage.jsx
import React, { useState, useEffect } from 'react';
import styles from './DisposalGuidePage.module.css';

// --- Static Guide Data (Replace/Expand this later) ---
// Ideally, this data would eventually come from a backend API or CMS
const initialGuideData = [
    {
        id: 1,
        category: 'Plastics',
        items: [
            { name: 'PET Bottles (#1)', icon: '♻️', description: 'Water/soda bottles. Empty, rinse, replace cap (check local rules).', recyclable: true },
            { name: 'HDPE Jugs (#2)', icon: '♻️', description: 'Milk jugs, detergent bottles. Empty, rinse.', recyclable: true },
            { name: 'Plastic Bags/Film', icon: '⚠️', description: 'Usually NOT curbside recyclable. Check supermarket drop-off points.', recyclable: false }, // recyclable: false (curbside)
            { name: 'Styrofoam/Polystyrene (#6)', icon: '❌', description: 'Often not recyclable curbside. Check special local facilities.', recyclable: false },
        ]
    },
    {
        id: 2,
        category: 'Paper & Cardboard',
        items: [
            { name: 'Cardboard Boxes', icon: '📦', description: 'Flatten boxes. Keep clean and dry.', recyclable: true },
            { name: 'Mixed Paper', icon: '📄', description: 'Newspaper, magazines, junk mail, office paper. No shredded paper unless specified.', recyclable: true },
            { name: 'Paper Cups (coated)', icon: '⚠️', description: 'Often have plastic/wax lining. Check local rules; usually not recyclable.', recyclable: false },
            { name: 'Cartons (Milk/Juice)', icon: '🥛', description: 'Empty, rinse, replace cap (check local rules). Often recyclable.', recyclable: true },
        ]
    },
    {
        id: 3,
        category: 'Glass',
        items: [
            { name: 'Bottles & Jars', icon: '🍾', description: 'Empty and rinse. Check local rules for color sorting (clear, brown, green) and caps.', recyclable: true },
            { name: 'Window/Mirror Glass', icon: '❌', description: 'Not recyclable curbside due to different composition/treatment.', recyclable: false },
            { name: 'Light Bulbs', icon: '💡', description: 'Incandescent OK for trash. CFL/LED often need special e-waste disposal.', recyclable: false }, // Special handling needed
        ]
    },
    {
        id: 4,
        category: 'Metals',
        items: [
            { name: 'Aluminum Cans', icon: '🥫', description: 'Empty and rinse (optional).', recyclable: true },
            { name: 'Steel/Tin Cans', icon: '🥫', description: 'Empty and rinse (optional). Labels usually okay.', recyclable: true },
            { name: 'Aluminum Foil/Trays', icon: '✨', description: 'Clean and balled up (check local rules).', recyclable: true }, // Often recyclable if clean
            { name: 'Scrap Metal', icon: '🔩', description: 'Larger items usually require special drop-off.', recyclable: false }, // Special handling
        ]
    },
     {
        id: 5,
        category: 'Hazardous & E-Waste',
        items: [
            { name: 'Batteries', icon: '🔋', description: 'NEVER put in curbside bins (fire hazard!). Take to designated drop-off points.', recyclable: false }, // Special handling
            { name: 'Electronics', icon: '💻', description: 'Computers, phones, TVs. Take to e-waste recycling facility.', recyclable: false }, // Special handling
            { name: 'Paint/Chemicals', icon: '🧪', description: 'Take to household hazardous waste (HHW) collection events/sites.', recyclable: false }, // Special handling
        ]
    },
    // Add more categories like Organics, Textiles etc.
];
// --- End Static Guide Data ---

function DisposalGuidePage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredData, setFilteredData] = useState(initialGuideData);

    // Effect to filter data when searchTerm changes
    useEffect(() => {
        if (!searchTerm) {
            setFilteredData(initialGuideData); // Show all if search is empty
            return;
        }

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const filtered = initialGuideData
            .map(category => {
                // Filter items within each category
                const filteredItems = category.items.filter(item =>
                    item.name.toLowerCase().includes(lowerCaseSearchTerm) ||
                    item.description.toLowerCase().includes(lowerCaseSearchTerm) ||
                    category.category.toLowerCase().includes(lowerCaseSearchTerm) // Also search category name
                );
                // Return the category only if it has matching items
                return { ...category, items: filteredItems };
            })
            .filter(category => category.items.length > 0); // Keep only categories with results

        setFilteredData(filtered);

    }, [searchTerm]); // Re-run effect when searchTerm changes


    return (
        <div className={styles.guideContainer}>
            <h2>Disposal Guide</h2>
            <p>Search for an item or browse categories to find disposal instructions.</p>

            {/* Search Bar */}
            <div className={styles.searchBar}>
                <input
                    type="text"
                    placeholder="Search for items (e.g., plastic bottle, battery, cardboard)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
                {/* Optional: Add a search icon button here */}
            </div>

            {/* Guide Content */}
            <div className={styles.guideContent}>
                {filteredData.length > 0 ? (
                    filteredData.map(category => (
                        <div key={category.id} className={styles.categorySection}>
                            <h3 className={styles.categoryTitle}>{category.category}</h3>
                            <ul className={styles.itemList}>
                                {category.items.map((item, index) => (
                                    <li key={index} className={styles.itemEntry}>
                                        <span className={styles.itemIcon}>{item.icon}</span>
                                        <div className={styles.itemDetails}>
                                            <span className={styles.itemName}>{item.name}</span>
                                            <p className={styles.itemDescription}>{item.description}</p>
                                            <span className={`${styles.recyclableStatus} ${item.recyclable === true ? styles.yes : item.recyclable === false ? styles.no : styles.maybe}`}>
                                                {item.recyclable === true ? 'Recyclable' : item.recyclable === false ? 'Not Recyclable (Curbside)' : 'Check Locally'}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <p className={styles.noResults}>No results found for "{searchTerm}". Try a different term.</p>
                )}
            </div>

            {/* TODO: Add Map Integration Section Later */}
            {/* <div className={styles.mapSection}>
                <h3>Find Nearby Disposal Centers</h3>
                Map component will go here...
            </div> */}
        </div>
    );
}

export default DisposalGuidePage;