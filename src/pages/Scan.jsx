import React, { useState, useEffect } from "react";
import Scanner from "../components/Scanner";
import { useLocation } from "react-router-dom";

export default function ScanPage() {
    const [scannedFiles, setScannedFiles] = useState([]);
    const [patientId, setPatientId] = useState("");
    const [accessionNumber, setAccessionNumber] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ completed: 0, failed: 0, total: 0 });
    const [uploadResult, setUploadResult] = useState(null);
    const location = useLocation();

    useEffect(() => {
        // Initialize patientId and accessionNumber from location state or URL params

        window.addEventListener('DOMContentLoaded', () => {
            const wsUrl = `wss://${location.host}/InterPacs.WebDicomUpload/WS.ashx`;
            console.log(wsUrl);
        });

        const params = new URLSearchParams(location.search);
        const pIdFromUrl = params.get('patientId');
        const accNoFromUrl = params.get('accessionNumber');
        const patientFromState = location.state?.patient;

        let initialPatientId = '';
        if (patientFromState && patientFromState.PatientId) {
            initialPatientId = patientFromState.PatientId;
        } else if (pIdFromUrl) {
            initialPatientId = pIdFromUrl;
        }
        setPatientId(initialPatientId);

        let initialAccessionNumber = '';
        if (patientFromState && patientFromState.AccessionNumber) {
            initialAccessionNumber = patientFromState.AccessionNumber;
        } else if (accNoFromUrl) {
            initialAccessionNumber = accNoFromUrl;
        }
        setAccessionNumber(initialAccessionNumber);



        console.log("ScanPage: Initial Patient ID set to:", initialPatientId);
        console.log("ScanPage: Initial Accession Number set to:", accNoFromUrl || (patientFromState?.accessionNumber || ''));
        console.log("ScanPage: Initial Accession Number set to:", initialAccessionNumber);
    }, [location.search, location.state]);






    const handleScanComplete = (newFile) => {
        setScannedFiles(prevFiles => [...prevFiles, newFile]);
        console.log("Scanned file added. Total scanned files:", scannedFiles.length + 1);
    };

    function dataURLtoFile(dataurl, filename) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[arr.length - 1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

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
                            FileName: fileObject.name
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
        console.log("handleUploadAllFiles triggered.");
        console.log("Current patientId:", patientId);
        console.log("Current accessionNumber:", accessionNumber);
        console.log("Number of scannedFiles:", scannedFiles.length);

        // Clear previous results
        setUploadResult(null);

        if (!patientId || !accessionNumber) {
            setUploadResult({
                type: 'error',
                message: 'Lütfen Hasta ID ve Erişim Numarası girin.',
                timestamp: new Date().toLocaleString('tr-TR')
            });
            console.log("Exiting: Patient ID or Accession Number is missing.");
            return;
        }
        if (scannedFiles.length === 0) {
            setUploadResult({
                type: 'error',
                message: 'Yüklenecek taranmış dosya yok.',
                timestamp: new Date().toLocaleString('tr-TR')
            });
            console.log("Exiting: No scanned files to upload.");
            return;
        }

        console.log("Proceeding with upload...");
        setUploading(true);
        setUploadProgress({ completed: 0, failed: 0, total: scannedFiles.length });

        let completedCount = 0;
        let failedCount = 0;
        const failedFiles = [];

        for (let i = 0; i < scannedFiles.length; i++) {
            const fileDataUrl = scannedFiles[i];
            const fileName = `scan_${Date.now()}_${i + 1}.png`;
            const fileObject = dataURLtoFile(fileDataUrl, fileName);

            try {
                await websocketUpload(fileObject);
                completedCount++;
                console.log(`Successfully sent: ${fileName}`);
            } catch (error) {
                console.error(`Failed to send: ${fileName}`, error);
                failedCount++;
                failedFiles.push({ fileName, error: error.message });
            }
            setUploadProgress({ completed: completedCount, failed: failedCount, total: scannedFiles.length });
        }

        setUploading(false);

        // Set detailed upload result
        const totalFiles = scannedFiles.length;
        if (failedCount === 0) {
            setUploadResult({
                type: 'success',
                message: `Tüm dosyalar başarıyla gönderildi! (${completedCount}/${totalFiles})`,
                details: `${completedCount} dosya başarıyla yüklendi.`,
                timestamp: new Date().toLocaleString('tr-TR')
            });
        } else if (completedCount === 0) {
            setUploadResult({
                type: 'error',
                message: `Hiçbir dosya gönderilemedi! (${failedCount}/${totalFiles} hata)`,
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


    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>DocScanner</h1>
                <p style={styles.subtitle}>Belgelerinizi kolayca tarayın ve kaydedin</p>
            </header>

            <main style={styles.main}>
                <Scanner onScanComplete={handleScanComplete} />

                {/* Upload Controls */}
                {scannedFiles.length > 0 && (
                    <div style={styles.uploadControls}>
                        <h3 style={styles.uploadTitle}>Dosya Gönderimi</h3>
                        <div style={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="Hasta ID"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                style={styles.inputField}
                                disabled={uploading}
                            />
                            <input
                                type="text"
                                placeholder="Erişim Numarası"
                                value={accessionNumber}
                                onChange={(e) => setAccessionNumber(e.target.value)}
                                style={styles.inputField}
                                disabled={uploading}
                            />
                        </div>
                        <button
                            onClick={handleUploadAllFiles}
                            style={{
                                ...styles.uploadButton,
                                ...(uploading || !patientId || !accessionNumber ? styles.uploadButton_disabled : {})
                            }}
                            disabled={uploading || !patientId || !accessionNumber}
                        >
                            {uploading ? 'Gönderiliyor...' : 'Dosyaları Gönder'}
                        </button>

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
                            </div>
                        )}
                    </div>
                )}

                {scannedFiles.length > 0 && (
                    <div style={styles.scannedFilesContainer}>
                        <h2 style={styles.scannedFilesTitle}>Taranan Belgeler ({scannedFiles.length})</h2>
                        <ul style={styles.scannedFilesList}>
                            {scannedFiles.map((file, index) => (
                                <li key={index} style={styles.scannedFileItem}>
                                    {typeof file === 'string' && file.startsWith('data:image') ? (
                                        <img src={file} alt={`Taranan Belge ${index + 1} `} style={styles.scannedImagePreview} />
                                    ) : (
                                        typeof file === 'string' ? file : `Belge ${index + 1} `
                                    )}
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
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
    },
    scannedFileItem: {
        padding: '8px',
        border: '1px solid #eee',
        fontSize: '0.9rem',
        color: '#444',
        borderRadius: '4px',
        backgroundColor: '#fafafa',
        width: '150px',
        height: '200px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
    },
    scannedImagePreview: {
        maxWidth: '100%',
        maxHeight: '150px',
        borderRadius: '4px',
        marginBottom: '5px',
        objectFit: 'contain',
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
    },
    uploadTitle: {
        fontSize: '1.2rem',
        margin: '0',
        color: '#333',
        borderBottom: '2px solid #1976d2',
        paddingBottom: '5px',
    },
    inputGroup: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
    },
    inputField: {
        padding: '10px',
        fontSize: '1rem',
        border: '1px solid #ccc',
        borderRadius: '4px',
        flex: '1',
        minWidth: '200px',
    },
    uploadButton: {
        padding: '12px 20px',
        fontSize: '1rem',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        fontWeight: '500',
    },
    uploadButton_disabled: {
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
        backgroundColor: '#1976d2',
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
    }
};