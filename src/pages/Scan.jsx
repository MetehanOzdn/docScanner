import React, { useState } from "react";
import Scanner from "../components/Scanner";

export default function ScanPage() {
    const [scannedFiles, setScannedFiles] = useState([]);

    const handleScanComplete = (newFile) => {
        setScannedFiles(prevFiles => [...prevFiles, newFile]);
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>DocScanner</h1>
                <p style={styles.subtitle}>Belgelerinizi kolayca tarayın ve kaydedin</p>
            </header>

            <main style={styles.main}>
                <Scanner onScanComplete={handleScanComplete} />
                {scannedFiles.length > 0 && (
                    <div style={styles.scannedFilesContainer}>
                        <h2 style={styles.scannedFilesTitle}>Taranan Belgeler</h2>
                        <ul style={styles.scannedFilesList}>
                            {scannedFiles.map((file, index) => (
                                <li key={index} style={styles.scannedFileItem}>
                                    {/* Assuming 'file' is a string, e.g., filename or image URL */}
                                    {/* You might want to render an image or a link here depending on what 'file' is */}
                                    {typeof file === 'string' ? file : `Belge ${index + 1}`}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </main>

            <footer style={styles.footer}>
                <p>© 2024 DocScanner. Tüm hakları saklıdır.</p>
            </footer>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
        boxSizing: 'border-box',
    },
    header: {
        padding: '15px 10px',
        textAlign: 'center',
        backgroundColor: '#1976d2',
        color: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    title: {
        fontSize: '1.8rem',
        margin: '0',
        marginBottom: '5px',
        fontWeight: '600',
    },
    subtitle: {
        fontSize: '0.9rem',
        margin: '0',
        opacity: '0.85',
    },
    main: {
        flex: 1,
        padding: '15px',
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
    },
    footer: {
        padding: '15px 10px',
        textAlign: 'center',
        backgroundColor: '#e0e0e0',
        borderTop: '1px solid #cccccc',
        fontSize: '0.8rem',
        color: '#555',
    },
    scannedFilesContainer: {
        marginTop: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    scannedFilesTitle: {
        fontSize: '1.2rem',
        margin: '0 0 10px 0',
        color: '#333',
    },
    scannedFilesList: {
        listStyleType: 'none',
        padding: '0',
        margin: '0',
    },
    scannedFileItem: {
        padding: '8px 0',
        borderBottom: '1px solid #eee',
        fontSize: '0.9rem',
        color: '#444',
        ':last-child': {
            borderBottom: 'none',
        }
    }
}; 