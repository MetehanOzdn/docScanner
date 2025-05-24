import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import usePatientList from '../hooks/usePatientList';

const PatientList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const device = location.state?.device;

    // Use custom hook for all business logic
    const {
        startDate,
        endDate,
        patients,
        loading,
        error,
        handleFilter,
        handleStartDateChange,
        handleEndDateChange
    } = usePatientList(device);

    return (
        <div style={styles.pageContainer}>
            <header style={styles.header}>
                <h1 style={styles.mainTitle}>{device?.Name || 'Hasta Listesi'}</h1>
                {device && (
                    <div style={styles.deviceInfoRow}>
                        <span style={styles.deviceAet}>AET: {device.AET}</span>
                        <span style={styles.deviceModality}>Modality: {device.Modality}</span>
                    </div>
                )}

                {/* Date Filter Inputs */}
                <div style={styles.filterContainer}>
                    <div style={styles.dateGroup}>
                        <label style={styles.dateLabel}>Başlangıç Tarihi:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            style={styles.dateInput}
                            max={endDate} // Prevent selecting date after end date
                        />
                    </div>
                    <div style={styles.dateGroup}>
                        <label style={styles.dateLabel}>Bitiş Tarihi:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => handleEndDateChange(e.target.value)}
                            style={styles.dateInput}
                            min={startDate} // Prevent selecting date before start date
                        />
                    </div>
                    <button onClick={handleFilter} style={styles.filterButton} disabled={loading}>
                        {loading ? 'Aranıyor...' : 'Hasta Ara'}
                    </button>
                </div>

                {error && (
                    <div style={styles.errorMessage}>
                        Hata: {error}
                    </div>
                )}

                <p style={styles.subTitle}>
                    {loading ? 'Hastalar aranıyor...' :
                        `${patients.length} hasta bulundu (${startDate} - ${endDate})`}
                </p>
            </header>

            <div style={styles.listContainer}>
                {loading ? (
                    <div style={styles.loadingSpinner}>
                        <div style={styles.spinner}></div>
                        <span>Hastalar aranıyor...</span>
                    </div>
                ) : patients.length === 0 ? (
                    <div style={styles.noDataMessage}>
                        <p>Seçilen tarih aralığında hasta bulunamadı.</p>
                        <p>Lütfen farklı bir tarih aralığı deneyin.</p>
                    </div>
                ) : (
                    patients.map(patient => (
                        <div
                            key={patient.id}
                            style={styles.patientItem}
                            onClick={() => navigate('/scan', { state: { patient } })}
                        >
                            <div style={{
                                ...styles.genderAvatar,
                                backgroundColor: patient.sex === 'F' ? '#e91e63' : '#2196f3'
                            }}>
                                {patient.sex || '?'}
                            </div>
                            <div style={styles.patientInfo}>
                                <h2 style={styles.patientName}>{patient.name}</h2>
                                {patient.birthDate && <p style={styles.patientBirthDate}>Doğum: {patient.birthDate}</p>}
                                {patient.procedureDescription && (
                                    <p style={styles.patientDescription}>
                                        {patient.procedureDescription}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
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
        margin: '0 0 15px 0',
    },
    deviceInfoRow: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
        margin: '8px 0',
        flexWrap: 'wrap',
    },
    deviceAet: {
        background: '#f44336',
        color: '#fff',
        borderRadius: '16px',
        padding: '4px 12px',
        fontWeight: 'bold',
        fontSize: '0.95em',
    },
    deviceModality: {
        background: '#673ab7',
        color: '#fff',
        borderRadius: '16px',
        padding: '4px 12px',
        fontWeight: 'bold',
        fontSize: '0.95em',
    },
    subTitle: {
        color: '#555',
        fontSize: '0.9em',
        margin: '0',
    },
    filterContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: '15px',
        margin: '15px 0',
        flexWrap: 'wrap',
    },
    dateGroup: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    dateLabel: {
        fontSize: '0.85em',
        color: '#333',
        marginBottom: '4px',
        fontWeight: '500',
    },
    dateInput: {
        padding: '8px 10px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        fontSize: '0.9em',
        minWidth: '140px',
    },
    filterButton: {
        padding: '8px 20px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: '#1976d2',
        color: 'white',
        cursor: 'pointer',
        fontSize: '0.9em',
        fontWeight: '500',
        transition: 'background-color 0.2s',
        height: '40px',
    },
    errorMessage: {
        backgroundColor: '#ffebee',
        color: '#c62828',
        padding: '8px 12px',
        borderRadius: '4px',
        margin: '10px 0',
        fontSize: '0.9em',
        border: '1px solid #ffcdd2',
    },
    loadingSpinner: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        fontSize: '1.1em',
        color: '#666',
        gap: '15px',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #1976d2',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    noDataMessage: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        fontSize: '1em',
        color: '#666',
        textAlign: 'center',
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
    },
    listContainer: {
        width: '100%',
        maxWidth: '900px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '15px',
        padding: '0',
    },
    patientItem: {
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
    genderAvatar: {
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        marginRight: '12px',
        border: '2px solid #eee',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '1.2em',
    },
    patientInfo: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
    },
    patientName: {
        fontSize: '1em',
        color: '#333',
        margin: '0 0 4px 0',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    patientBirthDate: {
        fontSize: '0.8em',
        color: '#666',
        margin: '2px 0',
    },
    patientDescription: {
        fontSize: '0.8em',
        color: '#555',
        margin: '2px 0',
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

// CSS for spinner animation
const spinnerKeyframes = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// Inject the CSS into the document head
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = spinnerKeyframes;
    document.head.appendChild(style);
}

export default PatientList; 