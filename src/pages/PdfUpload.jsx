import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function PdfUploadPage() {
    const [uploadedPdfs, setUploadedPdfs] = useState([]);
    const [patientId, setPatientId] = useState("");
    const [accessionNumber, setAccessionNumber] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ completed: 0, failed: 0, total: 0 });
    const [uploadResult, setUploadResult] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    const patient = location.state?.patient;
    const device = location.state?.device;
    const fileType = location.state?.fileType || 'pdf';

    useEffect(() => {
        if (!patient) {
            navigate('/patients', { state: { device } });
            return;
        }

        // Initialize patientId and accessionNumber from patient data
        if (patient.PatientId) {
            setPatientId(patient.PatientId);
        }
        if (patient.AccessionNumber) {
            setAccessionNumber(patient.AccessionNumber);
        }

        console.log("PdfUploadPage: Patient data:", patient);
    }, [patient, device, navigate]);

    const handlePdfUpload = (event) => {
        const files = Array.from(event.target.files);
        const pdfFiles = files.filter(file => file.type === 'application/pdf');

        if (pdfFiles.length === 0) {
            setUploadResult({
                type: 'error',
                message: 'Lütfen sadece PDF dosyaları seçin.',
                timestamp: new Date().toLocaleString('tr-TR')
            });
            return;
        }

        pdfFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const pdfData = {
                    name: file.name,
                    size: file.size,
                    data: e.target.result,
                    file: file,
                    timestamp: Date.now()
                };
                setUploadedPdfs(prev => [...prev, pdfData]);
            };
            reader.readAsDataURL(file);
        });

        // Clear the input
        event.target.value = '';
    };

    const removePdf = (timestamp) => {
        setUploadedPdfs(prev => prev.filter(pdf => pdf.timestamp !== timestamp));
    };

    const websocketUpload = (fileObject) => {
        console.log("Uploading file:", fileObject.name);
        return new Promise((resolve, reject) => {
            const ws = new WebSocket('https://localhost/InterPacs.WebDicomUpload/WS.ashx');

            const timeout = setTimeout(() => {
                console.error('WebSocket Timeout for file:', fileObject.name, '- Upload considered failed.');
                ws.close();
                reject(new Error('WebSocket Timeout'));
            }, 180000);

            ws.onopen = function () {
                console.log('WebSocket connection opened for file:', fileObject.name);
                const reader = new FileReader();

                reader.onload = function () {
                    const fileData = reader.result;
                    const base64Data = btoa(
                        new Uint8Array(fileData)
                            .reduce((data, byte) => data + String.fromCharCode(byte), "")
                    );

                    const payload = {
                        type: "fileUpload",
                        metadata: {
                            PatientId: patientId,
                            AccessioNumber: accessionNumber,
                            FileName: fileObject.name,
                            //FileType: fileType
                        },
                        file: base64Data
                    };

                    ws.send(JSON.stringify(payload));
                    console.log('File and metadata sent for:', fileObject.name);
                };

                reader.onerror = function (error) {
                    console.error('FileReader Error for file:', fileObject.name, error);
                    clearTimeout(timeout);
                    ws.close();
                    reject(error);
                };

                reader.readAsArrayBuffer(fileObject);
            };

            ws.onmessage = function (event) {
                clearTimeout(timeout);
                console.log('WebSocket message received for file:', fileObject.name, event.data);
                if (event.data.startsWith("ERROR:")) {
                    console.error('WebSocket server error for file:', fileObject.name, event.data, '- Upload failed.');
                    ws.close();
                    reject(new Error(event.data));
                } else {
                    console.log('File upload successful via WebSocket for:', fileObject.name, event.data);
                    ws.close();
                    resolve(event.data);
                }
            };

            ws.onerror = function (error) {
                console.error('WebSocket connection/protocol Error for file:', fileObject.name, error, '- Upload failed.');
                clearTimeout(timeout);
                ws.close();
                reject(error);
            };

            ws.onclose = function (event) {
                console.log('WebSocket connection closed for file:', fileObject.name, 'Code:', event.code, 'Reason:', event.reason);
                clearTimeout(timeout);
            };
        });
    };

    const handleUploadAllFiles = async () => {
        console.log("handleUploadAllFiles triggered for PDF upload.");
        console.log("Current patientId:", patientId);
        console.log("Current accessionNumber:", accessionNumber);
        console.log("Number of PDF files:", uploadedPdfs.length);

        // Clear previous results
        setUploadResult(null);

        if (!patientId || !accessionNumber) {
            setUploadResult({
                type: 'error',
                message: 'Lütfen Hasta ID ve Erişim Numarası girin.',
                timestamp: new Date().toLocaleString('tr-TR')
            });
            return;
        }

        if (uploadedPdfs.length === 0) {
            setUploadResult({
                type: 'error',
                message: 'Yüklenecek PDF dosyası yok.',
                timestamp: new Date().toLocaleString('tr-TR')
            });
            return;
        }

        console.log("Proceeding with PDF upload...");
        setUploading(true);
        setUploadProgress({ completed: 0, failed: 0, total: uploadedPdfs.length });

        let completedCount = 0;
        let failedCount = 0;
        const failedFiles = [];

        for (let i = 0; i < uploadedPdfs.length; i++) {
            const pdfData = uploadedPdfs[i];
            const fileObject = pdfData.file;

            try {
                await websocketUpload(fileObject);
                completedCount++;
                console.log(`Successfully sent: ${fileObject.name}`);
            } catch (error) {
                console.error(`Failed to send: ${fileObject.name}`, error);
                failedCount++;
                failedFiles.push({ fileName: fileObject.name, error: error.message });
            }
            setUploadProgress({ completed: completedCount, failed: failedCount, total: uploadedPdfs.length });
        }

        setUploading(false);

        // Set detailed upload result
        const totalFiles = uploadedPdfs.length;
        if (failedCount === 0) {
            setUploadResult({
                type: 'success',
                message: `Tüm PDF dosyalar başarıyla gönderildi! (${completedCount}/${totalFiles})`,
                details: `${completedCount} PDF dosyası başarıyla yüklendi.`,
                timestamp: new Date().toLocaleString('tr-TR')
            });
        } else if (completedCount === 0) {
            setUploadResult({
                type: 'error',
                message: `Hiçbir PDF dosyası gönderilemedi! (${failedCount}/${totalFiles} hata)`,
                details: failedFiles.map(f => `${f.fileName}: ${f.error}`).join('\n'),
                timestamp: new Date().toLocaleString('tr-TR')
            });
        } else {
            setUploadResult({
                type: 'warning',
                message: `Kısmi başarı: ${completedCount} başarılı, ${failedCount} hatalı (${totalFiles} toplam)`,
                details: failedFiles.length > 0 ? `Hatalı dosyalar:\n${failedFiles.map(f => `${f.fileName}: ${f.error}`).join('\n')}` : '',
                timestamp: new Date().toLocaleString('tr-TR')
            });
        }
    };

    const goBackToDocumentTypeSelection = () => {
        navigate('/document-type', { state: { patient, device } });
    };

    if (!patient) {
        return null; // Will redirect in useEffect
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <button onClick={goBackToDocumentTypeSelection} style={styles.backButton}>
                    <span style={styles.backIcon}>←</span>
                </button>
                <h1 style={styles.title}>PDF Yükleme</h1>
                <p style={styles.subtitle}>
                    {patient.name} için PDF dosyası yükleyin
                </p>
            </header>

            <main style={styles.main}>
                {/* Patient Info Display */}
                {(patientId || accessionNumber) && (
                    <div style={styles.patientInfoDisplay}>
                        <h3 style={styles.infoSectionTitle}>Aktif Hasta Bilgileri</h3>
                        {patientId && <p style={styles.infoText}><strong>Hasta ID:</strong> {patientId}</p>}
                        {accessionNumber && <p style={styles.infoText}><strong>Erişim Numarası:</strong> {accessionNumber}</p>}
                    </div>
                )}

                <div style={styles.pdfUploadContainer}>
                    <h2 style={styles.sectionTitle}>PDF Dosyası Seçin</h2>
                    <p style={styles.instructions}>
                        Yüklemek istediğiniz PDF dosyalarını seçin. Birden fazla dosya seçebilirsiniz.
                    </p>

                    <div style={styles.uploadArea}>
                        <input
                            type="file"
                            accept=".pdf,application/pdf"
                            multiple
                            onChange={handlePdfUpload}
                            style={styles.fileInput}
                            id="pdf-upload"
                        />
                        <label htmlFor="pdf-upload" style={styles.uploadLabel}>
                            <div style={styles.uploadIcon}>📄</div>
                            <div style={styles.uploadText}>
                                <div style={styles.pdfUploadTitle}>PDF Dosyası Seç</div>
                                <div style={styles.uploadSubtitle}>
                                    Tıklayın veya dosyalarınızı sürükleyip bırakın
                                </div>
                            </div>
                        </label>
                    </div>

                    {uploadedPdfs.length > 0 && (
                        <div style={styles.pdfListContainer}>
                            <h2 style={styles.sectionTitle}>Seçilen PDF Dosyaları</h2>
                            <div style={styles.pdfGrid}>
                                {uploadedPdfs.map((pdf) => (
                                    <div key={pdf.timestamp} style={styles.pdfCard}>
                                        <div style={styles.pdfThumbnailContainer}>
                                            <div style={styles.pdfThumbnail}>
                                                <span style={styles.pdfThumbnailIcon}>📄</span>
                                            </div>
                                        </div>
                                        <div style={styles.pdfInfo}>
                                            <span style={styles.pdfName}>{pdf.name}</span>
                                            <span style={styles.pdfDate}>
                                                {new Date(pdf.timestamp).toLocaleDateString('tr-TR')}
                                            </span>
                                            <span style={styles.pdfSize}>
                                                {(pdf.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>
                                        <div style={styles.pdfActions}>
                                            <button
                                                onClick={() => removePdf(pdf.timestamp)}
                                                style={styles.actionButton}
                                            >
                                                Sil
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Upload Controls */}
                {uploadedPdfs.length > 0 && (
                    <div style={styles.uploadControls}>
                        {/* Send button section - only show if patient info is available */}
                        {(patientId && accessionNumber) && (
                            <button
                                onClick={handleUploadAllFiles}
                                style={{
                                    ...styles.sendButton,
                                    ...(uploading ? styles.sendButtonDisabled : {})
                                }}
                                disabled={uploading}
                            >
                                {uploading ? "Gönderiliyor..." : "PDF Dosyalarını Gönder"}
                            </button>
                        )}

                        {/* Upload Progress */}
                        {uploading && (
                            <div style={styles.progressContainer}>
                                <div style={styles.progressBarContainer}>
                                    <div
                                        style={{
                                            ...styles.progressBar,
                                            width: `${(uploadProgress.completed + uploadProgress.failed) / uploadProgress.total * 100}%`
                                        }}
                                    />
                                </div>
                                <div style={styles.uploadStatus}>
                                    {uploadProgress.completed + uploadProgress.failed} / {uploadProgress.total} dosya işlendi
                                    {uploadProgress.failed > 0 && ` (${uploadProgress.failed} hata)`}
                                </div>
                            </div>
                        )}

                        {/* Upload Result */}
                        {uploadResult && (
                            <div style={{
                                ...styles.resultContainer,
                                ...(uploadResult.type === 'success' ? styles.resultSuccess :
                                    uploadResult.type === 'error' ? styles.resultError : styles.resultWarning)
                            }}>
                                <div style={styles.resultHeader}>
                                    <span style={styles.resultIcon}>
                                        {uploadResult.type === 'success' ? '✅' :
                                            uploadResult.type === 'error' ? '❌' : '⚠️'}
                                    </span>
                                    <span style={styles.resultMessage}>{uploadResult.message}</span>
                                </div>
                                {uploadResult.details && (
                                    <div style={styles.resultDetails}>
                                        {uploadResult.details}
                                    </div>
                                )}
                                <div style={styles.resultTimestamp}>
                                    {uploadResult.timestamp}
                                </div>
                                <button
                                    onClick={() => setUploadResult(null)}
                                    style={styles.closeResultButton}
                                >
                                    ×
                                </button>

                                {/* Navigation buttons */}
                                <div style={styles.navigationButtonsContainer}>
                                    <button
                                        onClick={goBackToDocumentTypeSelection}
                                        style={styles.navigateButton}
                                    >
                                        Belge Türü Seçimine Dön
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Warning when no patient info and PDFs exist */}
                        {(!patientId || !accessionNumber) && uploadedPdfs.length > 0 && (
                            <div style={styles.warningContainer}>
                                <div style={styles.warningHeader}>
                                    <span style={styles.warningIcon}>⚠️</span>
                                    <span style={styles.warningMessage}>Hasta Bilgileri Eksik</span>
                                </div>
                                <p style={styles.warningText}>
                                    PDF dosyalarını gönderebilmek için hasta bilgileri gereklidir.
                                    Lütfen hasta listesinden bir hasta seçerek PDF yükleme işlemini başlatın.
                                </p>
                            </div>
                        )}
                    </div>
                )}
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
        backgroundColor: '#eef1f5',
        boxSizing: 'border-box',
    },
    header: {
        padding: '15px 10px',
        textAlign: 'center',
        backgroundColor: '#f56500',
        color: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    pdfUploadContainer: {
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        width: '100%',
        maxWidth: '450px',
    },
    sectionTitle: {
        fontSize: '1.5rem',
        color: '#333',
        margin: '0 0 10px 0',
        textAlign: 'center',
    },
    instructions: {
        fontSize: '1rem',
        color: '#666',
        textAlign: 'center',
        marginBottom: '20px',
    },
    uploadArea: {
        border: '2px dashed #f56500',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#fef7f0',
        transition: 'border-color 0.2s ease',
        cursor: 'pointer',
    },
    fileInput: {
        display: 'none',
    },
    uploadLabel: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
    },
    uploadIcon: {
        fontSize: '4rem',
        marginBottom: '15px',
        color: '#f56500',
    },
    uploadText: {
        textAlign: 'center',
    },
    pdfUploadTitle: {
        fontSize: '1.3rem',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '8px',
    },
    uploadSubtitle: {
        fontSize: '1rem',
        color: '#666',
    },
    pdfListContainer: {
        marginTop: '25px',
        width: '100%',
        maxWidth: '900px',
    },
    pdfGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
    },
    pdfCard: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    pdfThumbnailContainer: {
        width: '100%',
        height: '150px',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '15px',
    },
    pdfThumbnail: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pdfThumbnailIcon: {
        fontSize: '4rem',
        color: '#f56500',
    },
    pdfInfo: {
        textAlign: 'center',
    },
    pdfName: {
        fontSize: '1rem',
        fontWeight: '500',
        color: '#333',
        marginBottom: '4px',
    },
    pdfDate: {
        fontSize: '0.9rem',
        color: '#666',
    },
    pdfSize: {
        fontSize: '0.9rem',
        color: '#666',
    },
    pdfActions: {
        marginTop: '15px',
    },
    actionButton: {
        padding: '10px 20px',
        backgroundColor: '#f56500',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        fontWeight: '500',
    },
    uploadControls: {
        margin: '20px 0',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        width: '100%',
        maxWidth: '900px',
    },
    sendButton: {
        padding: '12px 20px',
        fontSize: '1rem',
        backgroundColor: '#f56500',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        fontWeight: '500',
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
        cursor: 'not-allowed',
    },
    progressContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    progressBarContainer: {
        width: '100%',
        backgroundColor: '#e0e0e0',
        borderRadius: '4px',
        height: '12px',
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#f56500',
        borderRadius: '4px',
        transition: 'width 0.3s ease-in-out',
    },
    uploadStatus: {
        fontSize: '0.9rem',
        color: '#333',
        textAlign: 'center',
    },
    resultContainer: {
        position: 'relative',
        padding: '15px',
        borderRadius: '6px',
        border: '1px solid',
        marginTop: '10px',
    },
    resultSuccess: {
        backgroundColor: '#d4edda',
        borderColor: '#c3e6cb',
        color: '#155724',
    },
    resultError: {
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
        color: '#721c24',
    },
    resultWarning: {
        backgroundColor: '#fff3cd',
        borderColor: '#ffeaa7',
        color: '#856404',
    },
    resultHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
    },
    resultIcon: {
        fontSize: '1.2rem',
    },
    resultMessage: {
        fontWeight: '500',
        fontSize: '1rem',
    },
    resultDetails: {
        fontSize: '0.9rem',
        marginTop: '8px',
        padding: '8px',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: '4px',
        whiteSpace: 'pre-line',
        fontFamily: 'monospace',
    },
    resultTimestamp: {
        fontSize: '0.8rem',
        marginTop: '8px',
        opacity: '0.7',
        textAlign: 'right',
    },
    closeResultButton: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
        color: 'inherit',
        opacity: '0.7',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'opacity 0.2s',
    },
    footer: {
        padding: '15px 10px',
        textAlign: 'center',
        backgroundColor: '#e0e0e0',
        borderTop: '1px solid #cccccc',
        fontSize: '0.8rem',
        color: '#555',
    },
    backIcon: {
        fontSize: '1.2rem',
        fontWeight: 'bold',
        color: 'inherit',
        lineHeight: '1',
    },
    navigationButtonsContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '10px',
    },
    navigateButton: {
        padding: '10px 20px',
        backgroundColor: '#f56500',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        fontWeight: '500',
    },
    warningContainer: {
        padding: '15px',
        backgroundColor: '#fff3cd',
        borderRadius: '6px',
        border: '1px solid #ffeaa7',
        marginTop: '10px',
    },
    warningHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
    },
    warningIcon: {
        fontSize: '1.2rem',
    },
    warningMessage: {
        fontWeight: '500',
        fontSize: '1rem',
    },
    warningText: {
        fontSize: '0.9rem',
        color: '#666',
    },
    patientInfoDisplay: {
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        width: '100%',
        maxWidth: '450px',
    },
    infoSectionTitle: {
        fontSize: '1.5rem',
        color: '#333',
        margin: '0 0 10px 0',
        textAlign: 'center',
    },
    infoText: {
        fontSize: '1rem',
        color: '#666',
        margin: '0',
    },
}; 