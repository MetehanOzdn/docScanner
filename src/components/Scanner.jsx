import React from 'react';
import Webcam from 'react-webcam';
import ExampleButton from './ExampleButton'; // This import seems unused, consider removing if not needed.
import useScannerController from '../hooks/useScannerController';

const Scanner = () => {
    const {
        webcamRef,
        imageRef,
        previewCanvasRef,
        mode,
        capturedImage,
        corners,
        activeCornerIndex,
        isProcessing,
        error,
        generatedImages,
        actualCameraDimensions,
        patientId,
        setPatientId,
        accessionNumber,
        setAccessionNumber,
        videoConstraints,
        clearError,
        handleCapture,
        initializeCorners,
        handleCornerClick,
        handleImageAreaClick,
        handleApprovePdf,
        handleDownloadImage,
        resetState,
        deleteImage,
        handleSendDocuments,
        setError,
        setActualCameraDimensions,
        initialUrlCheckComplete,
        sendResult,
        setSendResult
    } = useScannerController();

    const renderCaptureModeContent = () => (
        <div style={styles.captureContainer}>
            <h2 style={styles.title}>Adım 1: Görüntü Yakala</h2>
            <p style={styles.instructions}>Belgenizi kameraya net bir şekilde gösterin ve yakalayın.</p>
            <div style={{
                ...styles.webcamWrapper,
                aspectRatio: actualCameraDimensions.width && actualCameraDimensions.height ?
                    `${actualCameraDimensions.width} / ${actualCameraDimensions.height}` :
                    styles.webcamWrapper.aspectRatio
            }}>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/png"
                    videoConstraints={videoConstraints}
                    onUserMediaError={(err) => setError(`Kamera hatası: ${err.name}. Tarayıcı ayarlarını kontrol edin.`)}
                    onUserMedia={() => {
                        if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.videoWidth && webcamRef.current.video.videoHeight) {
                            const video = webcamRef.current.video;
                            setActualCameraDimensions({ width: video.videoWidth, height: video.videoHeight });
                        }
                    }}
                    style={styles.webcam}
                    mirrored={false}
                />
            </div>
            <button onClick={handleCapture} disabled={isProcessing} style={{ ...styles.button, ...styles.buttonPrimary }}>
                {isProcessing ? "İşleniyor..." : "Görüntü Yakala"}
            </button>
        </div>
    );

    const renderEditModeContent = () => (
        <div style={styles.editContainer}>
            <h2 style={styles.title}>Adım 2: Köşeleri Ayarla</h2>
            <p style={styles.instructions}>Köşeye dokunarak seçin, sonra resim üzerinde istediğiniz yere dokunarak yerleştirin.</p>
            <div
                style={{
                    ...styles.imagePreviewContainer,
                    cursor: activeCornerIndex !== null ? 'crosshair' : 'default'
                }}
                id="imagePreviewContainer"
                onClick={handleImageAreaClick}
            >
                {capturedImage && (
                    <img
                        ref={imageRef}
                        src={capturedImage}
                        alt="Yakalanan Görüntü"
                        style={styles.previewImage}
                        onLoad={() => {
                            if (imageRef.current && capturedImage) {
                                initializeCorners();
                            }
                        }}
                    />
                )}
                <canvas ref={previewCanvasRef} style={styles.previewCanvas}></canvas>
                {corners.map((corner, index) => (
                    <div
                        key={index}
                        style={{
                            ...styles.cornerPoint,
                            left: `${corner.x}px`,
                            top: `${corner.y}px`,
                            backgroundColor: activeCornerIndex === index ? '#ff4500' : '#007bff',
                        }}
                        onClick={(e) => handleCornerClick(index, e)}
                    >
                        {index + 1}
                    </div>
                ))}
            </div>
            <div style={styles.buttonGroup}>
                <button onClick={resetState} style={{ ...styles.button, ...styles.buttonSecondary }}>
                    Tekrar Çek
                </button>
                <button onClick={initializeCorners} style={{ ...styles.button, ...styles.buttonSecondary }} disabled={!imageRef.current || !capturedImage}>
                    Köşeleri Sıfırla
                </button>
                <button onClick={handleApprovePdf} disabled={isProcessing || corners.length !== 4} style={{ ...styles.button, ...styles.buttonPrimary }}>
                    {isProcessing ? "İşleniyor..." : "Görüntüyü Kaydet"}
                </button>
            </div>
        </div>
    );

    const renderImageList = () => {
        return (
            <div style={styles.imageListContainer}>
                <h2 style={styles.title}>Kaydedilmiş Görüntüler</h2>
                {generatedImages.length > 0 ? (
                    <div style={styles.imageGrid}>
                        {generatedImages.map((image) => (
                            <div key={image.timestamp} style={styles.imageCard}>
                                <div style={styles.thumbnailContainer}>
                                    <img src={image.thumbnail} alt="Görüntü Önizleme" style={styles.thumbnail} />
                                </div>
                                <div style={styles.imageInfo}>
                                    <span style={styles.imageName}>{image.name}</span>
                                    <span style={styles.imageDate}>
                                        {new Date(image.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={styles.imageActions}>
                                    <button
                                        onClick={() => handleDownloadImage(image.data, image.name)}
                                        style={styles.actionButton}
                                    >
                                        İndir
                                    </button>
                                    <button
                                        onClick={() => deleteImage(image.timestamp)}
                                        style={{ ...styles.actionButton, ...styles.deleteButton }}
                                    >
                                        Sil
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Henüz kaydedilmiş görüntü yok.</p>
                )}

                {/* Send button section - only show if patient info is available */}
                {(patientId && accessionNumber) && generatedImages.length > 0 && (
                    <button
                        onClick={handleSendDocuments}
                        style={{ ...styles.button, ...styles.buttonPrimary, ...styles.sendButton }}
                        disabled={isProcessing}
                    >
                        {isProcessing ? "Gönderiliyor..." : "Görüntüleri Gönder"}
                    </button>
                )}

                {/* Send Result Display - Show independently of button */}
                {sendResult && (
                    <div style={{
                        ...styles.resultContainer,
                        ...(sendResult.type === 'success' ? styles.resultSuccess :
                            sendResult.type === 'error' ? styles.resultError : styles.resultWarning)
                    }}>
                        <div style={styles.resultHeader}>
                            <span style={styles.resultIcon}>
                                {sendResult.type === 'success' ? '✅' :
                                    sendResult.type === 'error' ? '❌' : '⚠️'}
                            </span>
                            <span style={styles.resultMessage}>{sendResult.message}</span>
                        </div>
                        {sendResult.details && (
                            <div style={styles.resultDetails}>
                                {sendResult.details}
                            </div>
                        )}
                        <div style={styles.resultTimestamp}>
                            {sendResult.timestamp}
                        </div>
                        <button
                            onClick={() => setSendResult(null)}
                            style={styles.closeResultButton}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Warning when no patient info and images exist */}
                {(!patientId || !accessionNumber) && generatedImages.length > 0 && (
                    <div style={styles.warningContainer}>
                        <div style={styles.warningHeader}>
                            <span style={styles.warningIcon}>⚠️</span>
                            <span style={styles.warningMessage}>Hasta Bilgileri Eksik</span>
                        </div>
                        <p style={styles.warningText}>
                            Görüntüleri gönderebilmek için hasta bilgileri gereklidir.
                            Lütfen hasta listesinden bir hasta seçerek tarama işlemini başlatın.
                        </p>
                    </div>
                )}
            </div>
        );
    };


    return (
        <div style={styles.appContainer}>
            {error && (
                <div style={styles.errorBanner}>
                    <span>{error}</span>
                    <button onClick={clearError} style={styles.closeButton}>&times;</button>
                </div>
            )}

            <div style={styles.pageContainer}>
                <h1 style={styles.mainTitle}>Belge Tarayıcı</h1>

                {(patientId || accessionNumber) && (
                    <div style={styles.patientInfoDisplay}>
                        <h3 style={styles.infoSectionTitle}>Aktif Hasta Bilgileri</h3>
                        {patientId && <p style={styles.infoText}><strong>Hasta ID:</strong> {patientId}</p>}
                        {accessionNumber && <p style={styles.infoText}><strong>Erişim Numarası:</strong> {accessionNumber}</p>}
                    </div>
                )}

                {initialUrlCheckComplete && !patientId && !accessionNumber && !error && (
                    <div style={styles.noPatientWarningContainer}>
                        <div style={styles.warningHeader}>
                            <span style={styles.warningIcon}>⚠️</span>
                            <span style={styles.warningMessage}>Hasta Bilgileri Bulunamadı</span>
                        </div>
                        <p style={styles.warningText}>
                            Tarama işlemi için hasta bilgileri gereklidir.
                            Lütfen ana sayfadan bir cihaz seçin ve hasta listesinden uygun hastayı seçerek tarama işlemini başlatın.
                        </p>
                        <p style={styles.warningSubText}>
                            Hasta bilgileri olmadan görüntü gönderimi yapılamaz.
                        </p>
                    </div>
                )}

                {mode === 'capture' ? renderCaptureModeContent() : renderEditModeContent()}
            </div>

            {renderImageList()}
        </div>
    );
};

const styles = {
    appContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        // justifyContent: 'center', // Removed to allow natural top alignment
        padding: '10px',
        backgroundColor: '#eef1f5',
        minHeight: '100vh',
        boxSizing: 'border-box',
    },
    pageContainer: {
        width: '100%',
        maxWidth: '900px', // Max width for the main content area
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 10px', // Horizontal padding for page content
        boxSizing: 'border-box',
        marginBottom: '20px', // Space before image list
    },
    mainTitle: {
        color: '#2c3e50',
        marginBottom: '20px',
        fontSize: '2em',
        textAlign: 'center',
    },
    patientInfoDisplay: {
        width: '100%',
        maxWidth: '450px', // Align with webcam/image preview width
        backgroundColor: '#fff',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginBottom: '20px',
        border: '1px solid #e0e0e0',
    },
    infoSectionTitle: {
        color: '#34495e',
        fontSize: '1.2em',
        marginBottom: '10px',
        borderBottom: '1px solid #eee',
        paddingBottom: '5px',
    },
    infoText: {
        color: '#555',
        fontSize: '1em',
        margin: '5px 0',
    },
    noPatientWarningContainer: {
        width: '100%',
        maxWidth: '450px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #f5c6cb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginBottom: '20px',
        textAlign: 'center',
    },
    title: { // General title for sections like "Adım 1", "Kaydedilmiş Görüntüler"
        color: '#34495e',
        marginBottom: '10px',
        fontSize: '1.5em',
        textAlign: 'center',
    },
    instructions: {
        color: '#555',
        marginBottom: '15px',
        fontSize: '0.9em',
        textAlign: 'center',
        maxWidth: '95%',
        lineHeight: '1.4',
    },
    captureContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.07)',
        width: '100%', // Take full width of pageContainer's content area
        maxWidth: '500px', // Max width for capture area
    },
    webcamWrapper: {
        border: '2px solid #bdc3c7',
        borderRadius: '8px',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '450px', // Max width for webcam itself
        aspectRatio: '9 / 16',
        backgroundColor: '#2c3e50',
        position: 'relative',
    },
    webcam: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    editContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.07)',
        width: '100%', // Take full width of pageContainer's content area
        maxWidth: '500px', // Max width for edit area
    },
    imagePreviewContainer: {
        position: 'relative',
        width: '100%',
        maxWidth: '450px', // Max width for image preview itself
        height: 'auto',
        overflow: 'hidden',
        border: '2px dashed #bdc3c7',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '8px',
    },
    previewImage: {
        display: 'block',
        width: '100%',
        height: 'auto',
        userSelect: 'none',
        objectFit: 'contain',
        maxWidth: '100%',
    },
    previewCanvas: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
    },
    cornerPoint: {
        position: 'absolute',
        width: '28px',
        height: '28px',
        border: '3px solid white',
        borderRadius: '50%',
        cursor: 'pointer',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '11px',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        zIndex: 10,
        transition: 'background-color 0.2s ease, transform 0.1s ease',
    },
    button: {
        padding: '10px 15px',
        fontSize: '0.95em',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
        fontWeight: '500',
        minWidth: '120px',
        textAlign: 'center',
        flexGrow: 1,
        flexBasis: '120px',
    },
    buttonPrimary: {
        backgroundColor: '#007bff',
        color: 'white',
    },
    buttonSecondary: {
        backgroundColor: '#6c757d',
        color: 'white',
    },
    buttonGroup: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginTop: '15px',
        justifyContent: 'center',
        width: '100%',
    },
    errorBanner: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '10px 15px',
        borderRadius: '8px',
        marginBottom: '15px',
        width: '100%',
        maxWidth: '860px', // Consistent with pageContainer max-width for alignment
        textAlign: 'left',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(217, 54, 69, 0.2)',
        border: '1px solid #f5c6cb',
        fontSize: '0.9em',
        boxSizing: 'border-box', // Ensure padding/border are within width
    },
    closeButton: {
        background: 'none',
        border: 'none',
        color: '#721c24',
        fontSize: '18px',
        cursor: 'pointer',
        fontWeight: 'bold',
        padding: '0 5px',
        lineHeight: '1',
    },
    imageListContainer: {
        width: '100%',
        maxWidth: '900px', // Consistent max width
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px', // Added more padding around image list
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.07)',
        marginTop: '20px',
        boxSizing: 'border-box',
    },
    imageGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', // Adjusted minmax for potentially smaller cards
        gap: '15px',
        width: '100%',
        padding: '10px 0',
    },
    imageCard: {
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
    },
    thumbnailContainer: {
        height: '150px', // Fixed height for thumbnail consistency
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        display: 'flex', // Added for centering thumbnail
        alignItems: 'center', // Added for centering thumbnail
        justifyContent: 'center', // Added for centering thumbnail
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        objectFit: 'contain', // Ensure whole image is visible
    },
    imageInfo: {
        padding: '10px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '60px', // Ensure some space for text
    },
    imageName: {
        fontWeight: '500',
        color: '#333',
        marginBottom: '5px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    imageDate: {
        fontSize: '0.8em',
        color: '#777',
    },
    imageActions: {
        display: 'flex',
        padding: '8px 10px', // Slightly reduced padding
        justifyContent: 'space-between',
    },
    actionButton: {
        padding: '6px 10px', // Slightly reduced padding
        fontSize: '0.85em', // Slightly smaller font
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        flexGrow: 1,
        marginRight: '5px',
        textAlign: 'center',
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        marginRight: '0',
    },
    sendButton: { // For the main "Send Images" button
        backgroundColor: '#28a745',
        marginTop: '20px',
        width: 'auto',
        minWidth: '200px',
        fontSize: '1em',
        alignSelf: 'center',
    },
    resultContainer: {
        position: 'relative',
        padding: '15px',
        borderRadius: '6px',
        border: '1px solid',
        marginTop: '15px',
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
    warningContainer: {
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#fff3cd',
        color: '#856404',
        padding: '15px',
        borderRadius: '6px',
        border: '1px solid #ffeaa7',
        marginTop: '20px',
        textAlign: 'center',
    },
    warningHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '10px',
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
        lineHeight: '1.4',
        margin: '0',
    },
    warningSubText: {
        fontSize: '0.85rem',
        lineHeight: '1.3',
        margin: '8px 0 0 0',
        fontStyle: 'italic',
        opacity: '0.8',
    },
};

export default Scanner; 