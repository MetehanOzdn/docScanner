import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevicesList } from '../hooks/useDevicesList'; // Import the custom hook

const DevicesList = () => {
    const navigate = useNavigate();
    const { devices, loading, error } = useDevicesList(); // Use the custom hook

    if (loading) {
        return <div style={styles.centeredMessage}>Yükleniyor...</div>;
    }

    if (error) {
        return <div style={{ ...styles.centeredMessage, ...styles.errorMessage }}>{error}</div>;
    }

    return (
        <div style={styles.pageContainer}>
            <header style={styles.header}>
                <h1 style={styles.mainTitle}>Cihaz Listesi</h1>
                <p style={styles.subTitle}>
                    {devices.length > 0 ? `${devices.length} cihaz bulundu.` : "Cihaz bulunamadı."}
                </p>
            </header>
            <div style={styles.listContainer}>
                {devices.map(device => (
                    <div key={device.id} style={styles.deviceItem} onClick={() => navigate('/patients', { state: { device } })}>
                        <div style={styles.patientInfo}>
                            <h2 style={styles.patientName}>{device.Name}</h2>
                        </div>
                        <div style={{ ...styles.buttonLabel, ...styles.aetBadge }}>
                            {device.AET}
                        </div>
                        <div style={{ ...styles.buttonLabel, ...styles.modalityBadge }}>
                            {device.Modality}
                        </div>
                    </div>
                ))}
            </div>
            <footer style={styles.footer}>
                <p>© {new Date().getFullYear()} Dicom Upload</p>
            </footer>
        </div>
    );
};

const styles = {
    pageContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        padding: '10px',
        boxSizing: 'border-box',
        fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    header: {
        width: '100%',
        maxWidth: '900px',
        textAlign: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    mainTitle: {
        color: '#1976d2',
        fontSize: '1.8em',
        margin: '0 0 8px 0',
    },
    subTitle: {
        color: '#555',
        fontSize: '0.9em',
        margin: '0',
    },
    listContainer: {
        width: '100%',
        maxWidth: '900px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', // Adjusted minmax for better fit
        gap: '15px',
        padding: '0',
    },
    deviceItem: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        aspectRatio: '1 / 1',
        boxSizing: 'border-box',
        color: '#fff',
        overflow: 'hidden',
    },
    patientInfo: {
        textAlign: 'center',
        overflow: 'hidden',
        width: '100%',
    },
    patientName: {
        fontSize: '1.5em',
        fontWeight: 'bold',
        color: '#000',
        margin: '0',
    },
    deviceDetail: {
        display: 'none', // Detayları gizle, buton olarak gösterilecek
    },
    buttonLabel: {
        position: 'absolute',
        bottom: '10px',
        padding: '6px 14px',
        borderRadius: '50px',
        fontSize: '0.8em',
        fontWeight: 'bold',
        color: '#fff',
    },
    aetBadge: {
        left: '10px',
        backgroundColor: '#f44336', // Kırmızı
    },
    modalityBadge: {
        right: '10px',
        backgroundColor: '#673ab7', // Mor
    },
    footer: {
        width: '100%',
        maxWidth: '900px',
        textAlign: 'center',
        marginTop: '30px',
        padding: '15px',
        fontSize: '0.85em',
        color: '#777',
        borderTop: '1px solid #ddd',
    },
    centeredMessage: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        fontSize: '1.2em',
        color: '#555',
    },
    errorMessage: {
        color: '#d32f2f', // A common error color
        fontWeight: '500',
    }
};

export default DevicesList;
