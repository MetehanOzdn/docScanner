import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import ExampleButton from './ExampleButton';

const Scanner = () => {
    const webcamRef = useRef(null);
    const imageRef = useRef(null);
    const previewCanvasRef = useRef(null);

    const [mode, setMode] = useState('capture'); // 'capture', 'edit'
    const [capturedImage, setCapturedImage] = useState(null);
    const [corners, setCorners] = useState([]); // [{x, y}, {x, y}, {x, y}, {x, y}]
    const [activeCornerIndex, setActiveCornerIndex] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, displayWidth: 0, displayHeight: 0 });
    const [generatedImages, setGeneratedImages] = useState([]); // Renamed from generatedPdfs: [{name, data, timestamp, thumbnail}]
    const [actualCameraDimensions, setActualCameraDimensions] = useState({ width: 0, height: 0 });

    const videoConstraints = {
        width: { ideal: 720 },
        height: { ideal: 1280 },
        aspectRatio: 9 / 16,
        facingMode: "environment",
        screenshotQuality: 1.0,
    };

    const clearError = () => setError(null);

    const handleCapture = useCallback(() => {
        if (!webcamRef.current) {
            setError("Kamera bulunamadı.");
            return;
        }

        const { width: streamWidth, height: streamHeight } = actualCameraDimensions;
        let imageSrc;

        if (streamWidth > 0 && streamHeight > 0) {
            imageSrc = webcamRef.current.getScreenshot({ width: streamWidth, height: streamHeight });
        } else {
            // Fallback if actualCameraDimensions are not yet reliably set
            imageSrc = webcamRef.current.getScreenshot();
        }

        if (!imageSrc) {
            setError("Görüntü yakalanamadı.");
            return;
        }
        setCapturedImage(imageSrc);
        setMode('edit');
        setCorners([]);
        setActiveCornerIndex(null);
        clearError();
    }, [webcamRef, actualCameraDimensions]);

    const initializeCorners = useCallback(() => {
        if (!imageRef.current || !capturedImage) return;

        const imageElement = imageRef.current;
        const { offsetWidth: displayWidth, offsetHeight: displayHeight } = imageElement;

        if (displayWidth === 0 || displayHeight === 0) {
            setError("Görüntü ekran boyutları okunamadı. Lütfen tekrar deneyin veya farklı bir görüntü seçin.");
            return;
        }

        const img = new Image();
        img.onload = () => {
            setImageDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight,
                displayWidth,
                displayHeight,
            });

            const padding = Math.min(displayWidth, displayHeight) * 0.15;
            setCorners([
                { x: padding, y: padding },
                { x: displayWidth - padding, y: padding },
                { x: displayWidth - padding, y: displayHeight - padding },
                { x: padding, y: displayHeight - padding },
            ]);
            setActiveCornerIndex(null);
        };
        img.onerror = () => {
            setError("Görüntü doğal boyutları yüklenirken bir sorun oluştu.");
        };
        img.src = capturedImage;
    }, [capturedImage]);

    const handleCornerClick = (index, e) => {
        e.stopPropagation();
        if (activeCornerIndex === index) {
            setActiveCornerIndex(null);
        } else {
            setActiveCornerIndex(index);
        }
    };

    const handleImageAreaClick = useCallback((e) => {
        if (activeCornerIndex === null || !imageRef.current) {
            return;
        }

        const imageElement = imageRef.current;
        const rect = imageElement.getBoundingClientRect();

        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        x = Math.max(0, Math.min(x, imageElement.offsetWidth));
        y = Math.max(0, Math.min(y, imageElement.offsetHeight));

        setCorners(prevCorners =>
            prevCorners.map((corner, i) =>
                i === activeCornerIndex ? { x, y } : corner
            )
        );
        setActiveCornerIndex(null);
    }, [activeCornerIndex, imageRef, setCorners, setActiveCornerIndex]);

    const drawPreview = useCallback(() => {
        if (!previewCanvasRef.current || !imageRef.current || corners.length !== 4 || mode !== 'edit') {
            if (previewCanvasRef.current) {
                const canvas = previewCanvasRef.current;
                const ctx = canvas.getContext('2d');
                if (canvas.width > 0 && canvas.height > 0) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
            return;
        }

        const canvas = previewCanvasRef.current;
        const imageElement = imageRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = imageElement.offsetWidth;
        canvas.height = imageElement.offsetHeight;

        if (canvas.width === 0 || canvas.height === 0) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < corners.length; i++) {
            ctx.lineTo(corners[i].x, corners[i].y);
        }
        ctx.closePath();

        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }, [corners, mode]);

    useEffect(() => {
        drawPreview();
    }, [drawPreview]);

    const adj = (m) => {
        return [
            m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
            m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
            m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]
        ];
    };

    const getPerspectiveTransform = (src, dst) => {
        const p = [];
        for (let i = 0; i < 4; i++) {
            p.push([src[i].x, src[i].y, 1, 0, 0, 0, -src[i].x * dst[i].x, -src[i].y * dst[i].x, dst[i].x]);
            p.push([0, 0, 0, src[i].x, src[i].y, 1, -src[i].x * dst[i].y, -src[i].y * dst[i].y, dst[i].y]);
        }

        const M = new Array(8).fill(0).map(() => new Array(9).fill(0));
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 9; j++) {
                M[i][j] = p[i][j];
            }
        }

        for (let i = 0; i < 8; i++) {
            let maxRow = i;
            for (let k = i + 1; k < 8; k++) {
                if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
                    maxRow = k;
                }
            }
            [M[i], M[maxRow]] = [M[maxRow], M[i]];

            if (Math.abs(M[i][i]) < 1e-9) {
                console.warn("Matrix is singular or nearly singular at step", i);
                continue;
            }

            for (let k = i + 1; k < 8; k++) {
                const factor = M[k][i] / M[i][i];
                if (!isFinite(factor)) continue;
                for (let j = i; j < 9; j++) {
                    if (isFinite(M[i][j])) M[k][j] -= factor * M[i][j];
                }
            }
        }

        const h = new Array(9).fill(0);
        for (let i = 7; i >= 0; i--) {
            h[i] = M[i][8];
            for (let j = i + 1; j < 8; j++) {
                h[i] -= M[i][j] * h[j];
            }
            if (Math.abs(M[i][i]) > 1e-9) {
                h[i] /= M[i][i];
            } else {
                h[i] = 0;
            }
        }
        h[8] = 1;
        return h;
    };

    const handleApprovePdf = async () => {
        if (corners.length !== 4 || !capturedImage || !imageRef.current) {
            setError("Görüntü kaydetmek için lütfen 4 köşe seçin.");
            return;
        }
        if (!imageDimensions.width || !imageDimensions.height || !imageDimensions.displayWidth || !imageDimensions.displayHeight) {
            setError("Görüntü boyutları tam olarak yüklenemedi. Lütfen köşeleri sıfırlayıp tekrar deneyin veya yeni bir görüntü yakalayın.");
            setIsProcessing(false);
            return;
        }

        setIsProcessing(true);
        clearError();

        try {
            const { width: imgWidth, height: imgHeight, displayWidth, displayHeight } = imageDimensions;

            if (!imgWidth || !imgHeight) {
                setError("Görüntü boyutları alınamadı. Lütfen tekrar deneyin.");
                setIsProcessing(false);
                return;
            }

            const scaleX = imgWidth / displayWidth;
            const scaleY = imgHeight / displayHeight;

            const sourcePoints = corners.map(c => ({ x: c.x * scaleX, y: c.y * scaleY }));

            // Set target dimensions to A4 paper aspect ratio (1:1.414)
            // Use the original image width as base and calculate height accordingly
            const targetWidth = imgWidth;
            const targetHeight = Math.round(imgWidth * 1.414); // A4 aspect ratio: height = width * 1.414

            const destPoints = [
                { x: 0, y: 0 },
                { x: targetWidth, y: 0 },
                { x: targetWidth, y: targetHeight },
                { x: 0, y: targetHeight },
            ];

            const transformMatrix = getPerspectiveTransform(sourcePoints, destPoints);

            if (!transformMatrix || transformMatrix.some(val => isNaN(val) || !isFinite(val))) {
                setError("Perspektif dönüşüm matrisi hesaplanamadı. Köşelerin geçerli bir dışbükey dörtgen oluşturduğundan emin olun (çizgiler kesişmemeli ve noktalar sıralı olmalı).");
                setIsProcessing(false);
                return;
            }

            let det = transformMatrix[0] * (transformMatrix[4] * transformMatrix[8] - transformMatrix[5] * transformMatrix[7]) -
                transformMatrix[1] * (transformMatrix[3] * transformMatrix[8] - transformMatrix[5] * transformMatrix[6]) +
                transformMatrix[2] * (transformMatrix[3] * transformMatrix[7] - transformMatrix[4] * transformMatrix[6]);

            if (Math.abs(det) < 1e-9) {
                setError("Dönüşüm matrisi geçersiz (determinant sıfıra yakın). Köşeler düzgün bir dörtgen oluşturmuyor olabilir.");
                setIsProcessing(false);
                return;
            }

            const invTransformMatrix = adj(transformMatrix).map(val => val / det);
            if (invTransformMatrix.some(val => isNaN(val) || !isFinite(val))) {
                setError("Ters dönüşüm matrisi hesaplanırken hata oluştu.");
                setIsProcessing(false);
                return;
            }

            const outputCanvas = document.createElement('canvas');
            outputCanvas.width = targetWidth;
            outputCanvas.height = targetHeight;
            const ctx = outputCanvas.getContext('2d', { willReadFrequently: true });

            const originalImageElement = new Image();
            originalImageElement.src = capturedImage;
            await new Promise((resolve, reject) => {
                originalImageElement.onload = resolve;
                originalImageElement.onerror = () => reject(new Error("Orijinal görüntü işlenmek üzere yüklenemedi"));
            });

            const sourceCanvas = document.createElement('canvas');
            sourceCanvas.width = imgWidth;
            sourceCanvas.height = imgHeight;
            const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
            sourceCtx.drawImage(originalImageElement, 0, 0);
            const sourceImageData = sourceCtx.getImageData(0, 0, imgWidth, imgHeight);
            const sourceData = sourceImageData.data;

            const outputImageData = ctx.createImageData(targetWidth, targetHeight);
            const outputData = outputImageData.data;

            for (let y = 0; y < targetHeight; y++) {
                for (let x = 0; x < targetWidth; x++) {
                    const H = invTransformMatrix;
                    const srcXW = H[0] * x + H[1] * y + H[2];
                    const srcYW = H[3] * x + H[4] * y + H[5];
                    const srcW = H[6] * x + H[7] * y + H[8];

                    const srcX = srcXW / srcW;
                    const srcY = srcYW / srcW;

                    const outputIndex = (y * targetWidth + x) * 4;

                    if (srcX >= 0 && srcX < imgWidth - 1 && srcY >= 0 && srcY < imgHeight - 1) {
                        const x0 = Math.floor(srcX);
                        const y0 = Math.floor(srcY);
                        const x1 = x0 + 1;
                        const y1 = y0 + 1;

                        const dx = srcX - x0;
                        const dy = srcY - y0;

                        for (let c = 0; c < 3; c++) {
                            const c00 = sourceData[(y0 * imgWidth + x0) * 4 + c];
                            const c10 = sourceData[(y0 * imgWidth + x1) * 4 + c];
                            const c01 = sourceData[(y1 * imgWidth + x0) * 4 + c];
                            const c11 = sourceData[(y1 * imgWidth + x1) * 4 + c];

                            const val =
                                (c00 * (1 - dx) + c10 * dx) * (1 - dy) +
                                (c01 * (1 - dx) + c11 * dx) * dy;
                            outputData[outputIndex + c] = val;
                        }
                        outputData[outputIndex + 3] = 255;
                    } else {
                        outputData[outputIndex] = 255;
                        outputData[outputIndex + 1] = 255;
                        outputData[outputIndex + 2] = 255;
                        outputData[outputIndex + 3] = 255;
                    }
                }
            }
            ctx.putImageData(outputImageData, 0, 0);

            const finalImageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const data = finalImageData.data;
            const contrastValue = 1.15;
            const brightnessValue = 0;

            for (let i = 0; i < data.length; i += 4) {
                data[i] = contrastValue * (data[i] - 128) + 128;
                data[i + 1] = contrastValue * (data[i + 1] - 128) + 128;
                data[i + 2] = contrastValue * (data[i + 2] - 128) + 128;

                data[i] += brightnessValue;
                data[i + 1] += brightnessValue;
                data[i + 2] += brightnessValue;

                data[i] = Math.max(0, Math.min(255, data[i]));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
            }
            ctx.putImageData(finalImageData, 0, 0);

            // Generate JPEG instead of PDF
            const jpegImageData = outputCanvas.toDataURL('image/jpeg', 0.9); // Using 0.9 for quality

            const timestamp = Date.now();
            const imageName = `goruntu-${timestamp}`;

            setGeneratedImages(prev => [...prev, {
                name: imageName,
                data: jpegImageData,
                timestamp: timestamp,
                thumbnail: jpegImageData // Using the full image as thumbnail for simplicity
            }]);

            setMode('capture');
            setCapturedImage(null);
            setCorners([]);

        } catch (err) {
            console.error("Görüntü Kaydetme Hatası:", err);
            setError(`Görüntü kaydedilemedi: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadImage = (imageData, imageName) => { // Renamed from handleDownloadPdf
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `${imageName}.jpeg`; // Changed extension to .jpeg
        link.click();
    };

    const resetState = () => {
        setMode('capture');
        setCapturedImage(null);
        setCorners([]);
        setActiveCornerIndex(null);
        clearError();
        setIsProcessing(false);
        setImageDimensions({ width: 0, height: 0, displayWidth: 0, displayHeight: 0 });
        if (previewCanvasRef.current) {
            const canvas = previewCanvasRef.current;
            const ctx = canvas.getContext('2d');
            if (canvas.width > 0 && canvas.height > 0) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const deleteImage = (timestamp) => { // Renamed from deletePdf
        setGeneratedImages(prev => prev.filter(img => img.timestamp !== timestamp)); // Updated to setGeneratedImages
    };

    const renderCaptureMode = () => (
        <div style={styles.pageContainer}>
            <h1 style={styles.mainTitle}>Belge Tarayıcı</h1>
            <div style={styles.captureContainer}>
                <h2 style={styles.title}>Adım 1: Görüntü Yakala</h2>
                <p style={styles.instructions}>Belgenizi kameraya net bir şekilde gösterin ve yakalayın.</p>
                <div style={{
                    ...styles.webcamWrapper,
                    aspectRatio: actualCameraDimensions.width && actualCameraDimensions.height ?
                        `${actualCameraDimensions.width} / ${actualCameraDimensions.height}` :
                        styles.webcamWrapper.aspectRatio // Fallback to default
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
        </div>
    );

    const renderEditMode = () => (
        <div style={styles.pageContainer}>
            <h1 style={styles.mainTitle}>Belge Tarayıcı</h1>
            <div
                style={styles.editContainer}
            >
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
        </div>
    );

    const renderImageList = () => {
        if (generatedImages.length === 0) return null;

        return (
            <div style={styles.imageListContainer}>
                <h2 style={styles.title}>Kaydedilmiş Görüntüler</h2>
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
                {generatedImages.length > 0 && (
                    <button
                        onClick={handleSendDocuments}
                        style={{ ...styles.button, ...styles.buttonPrimary, ...styles.sendButton }}
                    >
                        Görüntüleri Gönder
                    </button>
                )}
            </div>
        );
    };

    const handleSendDocuments = () => {
        console.log("Gönderilecek görüntüler:");
        generatedImages.forEach(image => {
            console.log(image.name);
        });
    };

    return (
        <div style={styles.appContainer}>
            {error && (
                <div style={styles.errorBanner}>
                    <span>{error}</span>
                    <button onClick={clearError} style={styles.closeButton}>&times;</button>
                </div>
            )}
            {mode === 'capture' ? renderCaptureMode() : renderEditMode()}
            {renderImageList()}
        </div>
    );
};

const styles = {
    appContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: '10px',
        backgroundColor: '#eef1f5',
        minHeight: '100vh',
        boxSizing: 'border-box',
    },
    pageContainer: {
        width: '100%',
        maxWidth: '900px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 10px',
    },
    mainTitle: {
        color: '#2c3e50',
        marginBottom: '20px',
        fontSize: '2em',
        textAlign: 'center',
    },
    title: {
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
        width: '100%',
    },
    webcamWrapper: {
        border: '2px solid #bdc3c7',
        borderRadius: '8px',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '450px',
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
        width: '100%',
    },
    imagePreviewContainer: {
        position: 'relative',
        width: '100%',
        maxWidth: '450px',
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
        maxWidth: '860px',
        textAlign: 'left',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(217, 54, 69, 0.2)',
        border: '1px solid #f5c6cb',
        fontSize: '0.9em',
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
        maxWidth: '900px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 10px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.07)',
        marginTop: '20px',
    },
    imageGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
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
        height: '150px',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        objectFit: 'contain',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    imageInfo: {
        padding: '10px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
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
        padding: '10px',
        justifyContent: 'space-between',
    },
    actionButton: {
        padding: '8px',
        fontSize: '0.9em',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        flexGrow: 1,
        marginRight: '5px',
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        marginRight: '0',
    },
    sendButton: {
        backgroundColor: '#28a745',
        marginTop: '20px',
        width: '200px',
        fontSize: '1em',
    },
};

export default Scanner; 