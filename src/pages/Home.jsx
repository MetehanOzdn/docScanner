import React from "react";
import Scanner from "../components/Scanner";

export default function Home() {
    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Dicom Upload</h1>
                <p style={styles.subtitle}>Belgelerinizi kolayca tarayın ve kaydediniz</p>
            </header>

            <main style={styles.main}>
                <Scanner />
            </main>

            <footer style={styles.footer}>
                <p>© 2024 Dicom Upload. Tüm hakları saklıdır.</p>
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
    }
}; 