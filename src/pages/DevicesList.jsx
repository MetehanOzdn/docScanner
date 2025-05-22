import React from 'react';
import { useNavigate } from 'react-router-dom';

const DevicesList = () => {
    const navigate = useNavigate();
    const devices = Array.from({ length: 20 }, (_, index) => ({
        id: index + 1,
        name: `device ${index + 1}`,
        email: `device${index + 1}@example.com`,
        avatar: `https://i.pravatar.cc/100?u=hasta${index + 1}` // daha büyük avatar
    }));

    return (
        <div style={styles.pageContainer}>
            <header style={styles.header}>
                <h1 style={styles.mainTitle}>Device List</h1>
                <p style={styles.subTitle}>{devices.length} Device bulundu.</p>
            </header>
            <div style={styles.listContainer}>
                {devices.map(device => (
                    <div key={device.id} style={styles.deviceItem} onClick={() => navigate('/users')}>
                        <img src={device.avatar} alt={`${device.name} avatar`} style={styles.avatar} />
                        <div style={styles.userInfo}>
                            <h2 style={styles.userName}>{device.name}</h2>
                            <p style={styles.userEmail}>{device.email}</p>
                        </div>
                    </div>
                ))}
            </div>
            <footer style={styles.footer}>
                <p>© {new Date().getFullYear()} Hasta Yönetimi</p>
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '15px',
        padding: '0',
    },
    deviceItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '1 / 1', // kare görünüm
        boxSizing: 'border-box',
    },
    avatar: {
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        border: '2px solid #eee',
        marginBottom: '10px',
    },
    userInfo: {
        textAlign: 'center',
        overflow: 'hidden',
    },
    userName: {
        fontSize: '1em',
        color: '#333',
        margin: '0 0 4px 0',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    userEmail: {
        fontSize: '0.85em',
        color: '#666',
        margin: '0',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
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
};

export default DevicesList;
