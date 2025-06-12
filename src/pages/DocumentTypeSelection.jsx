import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DocumentTypeSelection = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const patient = location.state?.patient;
    const device = location.state?.device;

    useEffect(() => {
        if (!patient) {
            // If no patient data, redirect to patient list
            navigate('/patients', { state: { device } });
        }
    }, [patient, device, navigate]);

    if (!patient) {
        return null;
    }

    const handlePhotoCapture = () => {
        navigate('/scan', {
            state: {
                patient,
                device,
                fileType: 'image'
            }
        });
    };

    const handlePdfUpload = () => {
        navigate('/pdf-upload', {
            state: {
                patient,
                device,
                fileType: 'pdf'
            }
        });
    };

    const goBackToPatientSelection = () => {
        navigate('/patients', { state: { device } });
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <button onClick={goBackToPatientSelection} style={styles.backButton}>
                    <span style={styles.backIcon}>←</span>
                </button>
                <h1 style={styles.title}>Belge Türü Seçimi</h1>
                <p style={styles.subtitle}>
                    <strong>{patient.name}</strong> için hangi türde belge göndermek istiyorsunuz?
                </p>
            </header>

            <main style={styles.main}>
                <div style={styles.patientInfo}>
                    <div style={styles.patientCard}>
                        <div style={{
                            ...styles.genderAvatar,
                            backgroundColor: patient.sex === 'F' ? '#e91e63' : '#2196f3'
                        }}>
                            {patient.sex || '?'}
                        </div>
                        <div style={styles.patientDetails}>
                            <h2 style={styles.patientName}>{patient.name}</h2>
                            {patient.birthDate && (
                                <p style={styles.patientBirthDate}>Doğum: {patient.birthDate}</p>
                            )}
                            {patient.accessionNumber && (
                                <p style={styles.patientMeta}>
                                    Accession No: {patient.accessionNumber}
                                </p>
                            )}
                            {patient.patientId && (
                                <p style={styles.patientMeta}>
                                    Patient ID: {patient.patientId}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div style={styles.selectionContainer}>
                    <h2 style={styles.selectionTitle}>Belge Türünü Seçin</h2>
                    <p style={styles.selectionDescription}>
                        Aşağıdaki seçeneklerden birini tıklayarak devam edin
                    </p>

                    <div style={styles.optionsContainer}>
                        <button
                            onClick={handlePhotoCapture}
                            style={{ ...styles.optionButton, ...styles.photoOption }}
                        >
                            <div style={styles.optionIconOnly}>📷</div>
                        </button>

                        <button
                            onClick={handlePdfUpload}
                            style={{ ...styles.optionButton, ...styles.pdfOption }}
                        >
                            <div style={styles.optionIconOnly}>📄</div>
                        </button>
                    </div>
                </div>
            </main>

            <footer style={styles.footer}>
                <p>© {new Date().getFullYear()} Dicom Upload</p>
            </footer>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f7fa',
        fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    header: {
        padding: '15px 70px 20px 70px',
        textAlign: 'center',
        backgroundColor: '#1976d2',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: '15px',
        top: '50%',
        transform: 'translateY(-50%)',
        padding: '12px',
        backgroundColor: 'rgba(255,255,255,0.2)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '1.2rem',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '44px',
        height: '44px',
        minWidth: '44px',
        minHeight: '44px',
    },
    title: {
        fontSize: '2rem',
        margin: '0 0 10px 0',
        fontWeight: '600',
    },
    subtitle: {
        fontSize: '1.1rem',
        margin: '0',
        opacity: '0.9',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    main: {
        flex: 1,
        padding: '20px 15px',
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
    },
    patientInfo: {
        marginBottom: '40px',
    },
    patientCard: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        border: '1px solid #e1e5e9',
    },
    genderAvatar: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        marginRight: '20px',
        border: '3px solid #fff',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
    patientDetails: {
        flex: 1,
    },
    patientName: {
        fontSize: '1.4rem',
        color: '#1a202c',
        margin: '0 0 8px 0',
        fontWeight: '600',
    },
    patientBirthDate: {
        fontSize: '1rem',
        color: '#4a5568',
        margin: '4px 0',
    },
    patientMeta: {
        fontSize: '0.9rem',
        color: '#718096',
        margin: '2px 0',
    },
    selectionContainer: {
        backgroundColor: 'white',
        padding: '25px 20px',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        border: '1px solid #e1e5e9',
    },
    selectionTitle: {
        fontSize: '1.6rem',
        color: '#1a202c',
        margin: '0 0 10px 0',
        textAlign: 'center',
        fontWeight: '600',
    },
    selectionDescription: {
        fontSize: '1rem',
        color: '#718096',
        textAlign: 'center',
        margin: '0 0 30px 0',
    },
    optionsContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '20px',
        justifyContent: 'center',
    },
    optionButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        border: '2px solid',
        borderRadius: '16px',
        backgroundColor: '#fff',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        textAlign: 'center',
        fontSize: '1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minHeight: '120px',
        aspectRatio: '1/1',
    },
    photoOption: {
        borderColor: '#3182ce',
        color: '#3182ce',
    },
    pdfOption: {
        borderColor: '#f56500',
        color: '#f56500',
    },
    optionIconOnly: {
        fontSize: '4rem',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: '1.3rem',
        fontWeight: 'bold',
        margin: '0 0 8px 0',
        color: 'inherit',
    },
    optionDescription: {
        fontSize: '1rem',
        margin: '0 0 12px 0',
        opacity: 0.8,
        color: 'inherit',
    },
    optionFeatures: {
        margin: '0',
        paddingLeft: '20px',
        fontSize: '0.9rem',
        opacity: 0.7,
        color: 'inherit',
    },
    arrowIcon: {
        fontSize: '1.5rem',
        marginLeft: '15px',
        fontWeight: 'bold',
        color: 'inherit',
    },
    footer: {
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#e2e8f0',
        borderTop: '1px solid #cbd5e0',
        fontSize: '0.9rem',
        color: '#718096',
    },
    backIcon: {
        fontSize: '1.2rem',
        fontWeight: 'bold',
        color: 'inherit',
        lineHeight: '1',
    },
};

export default DocumentTypeSelection; 