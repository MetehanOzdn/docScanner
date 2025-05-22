import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserList = () => {
    const navigate = useNavigate();
    // Generate 100 mock users
    const users = Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        name: `Hasta ${index + 1}`,
        email: `hasta${index + 1}@example.com`,
        avatar: `https://i.pravatar.cc/40?u=hasta${index + 1}` // Simple placeholder avatar
    }));

    return (
        <div style={styles.pageContainer}>
            <header style={styles.header}>
                <h1 style={styles.mainTitle}>Hasta Listesi</h1>
                <p style={styles.subTitle}>{users.length} hasta bulundu.</p>
            </header>
            <div style={styles.listContainer}>
                {users.map(user => (
                    <div key={user.id} style={styles.userItem} onClick={() => navigate('/scan')}>
                        <img src={user.avatar} alt={`${user.name} avatar`} style={styles.avatar} />
                        <div style={styles.userInfo}>
                            <h2 style={styles.userName}>{user.name}</h2>
                            <p style={styles.userEmail}>{user.email}</p>
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
        color: '#1976d2', // Primary color from DocScanner
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '15px',
        padding: '0',
    },
    userItem: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
        transition: 'transform 0.2s ease-in-out, boxShadow 0.2s ease-in-out',
        overflow: 'hidden',
        cursor: 'pointer',
    },
    avatar: {
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        marginRight: '12px',
        border: '2px solid #eee',
        flexShrink: 0,
    },
    userInfo: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
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

export default UserList; 