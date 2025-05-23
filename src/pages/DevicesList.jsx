import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DevicesList = () => {
    const navigate = useNavigate();
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                setLoading(true);
                console.log("response");
                const response = await fetch('/api/Device');
                console.log(response);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                setDevices(data);

                setError(null);
            } catch (e) {
                console.error("Failed to fetch devices:", e);
                setError("Cihazlar yüklenemedi: " + e.message);
                setDevices([]); // Hata durumunda boş dizi ata
            } finally {
                setLoading(false);
            }
        };

        fetchDevices();
    }, []);

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
                    <div key={device.id} style={styles.deviceItem} onClick={() => navigate('/users')}> {/* Gecici olarak /users'a yonlendiriyor */}
                        <div style={styles.userInfo}>
                            <h2 style={styles.userName}>{device.Name}</h2>
                            <p style={styles.deviceDetail}>AET: {device.AET}</p>
                            <p style={styles.deviceDetail}>Modality: {device.Modality}</p>
                        </div>
                    </div>
                ))}
            </div>
            <footer style={styles.footer}>
                <p>© {new Date().getFullYear()} Cihaz Yönetimi</p>
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
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', // Center content vertically
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '1 / 1',
        boxSizing: 'border-box',
        textAlign: 'center', // Center text
    },
    userInfo: {
        textAlign: 'center',
        overflow: 'hidden',
        width: '100%', // Ensure userInfo takes full width for text centering
    },
    userName: {
        fontSize: '1.1em', // Slightly larger name
        color: '#333',
        margin: '0 0 8px 0', // Increased bottom margin
        fontWeight: '600',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%', // Ensure it takes full width for ellipsis
    },
    deviceDetail: { // New style for AET and Modality
        fontSize: '0.9em',
        color: '#555',
        margin: '4px 0',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
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
