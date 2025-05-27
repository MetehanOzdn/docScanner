import { useRef, useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useLocation } from 'react-router-dom';

const useScannerController = () => {
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
    const [generatedImages, setGeneratedImages] = useState([]);
    const [actualCameraDimensions, setActualCameraDimensions] = useState({ width: 0, height: 0 });
    const [patientId, setPatientId] = useState('');
    const [accessionNumber, setAccessionNumber] = useState('');
    const [initialUrlCheckComplete, setInitialUrlCheckComplete] = useState(false);
    const [currentPatientDetails, setCurrentPatientDetails] = useState(null);
    const [deviceModality, setDeviceModality] = useState('SFT'); // Default modality
    const [sendResult, setSendResult] = useState(null); // New state for send results

    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const pIdFromUrl = params.get('patientId');
        const accNoFromUrl = params.get('accessionNumber');
        const patientFromState = location.state?.patient;
        const deviceFromState = location.state?.device;

        let finalPatientId = '';
        if (patientFromState && patientFromState.PatientId) {
            finalPatientId = patientFromState.PatientId;
        } else if (pIdFromUrl) {
            finalPatientId = pIdFromUrl;
        }
        setPatientId(finalPatientId);

        let finalAccessionNumber = '';
        if (patientFromState && patientFromState.AccessionNumber) {
            finalAccessionNumber = patientFromState.AccessionNumber;
        } else if (accNoFromUrl) {
            finalAccessionNumber = accNoFromUrl;
        }
        setAccessionNumber(finalAccessionNumber);

        if (patientFromState) {
            setCurrentPatientDetails(patientFromState);
            console.log('Patient details set:', patientFromState);
        }

        if (deviceFromState && deviceFromState.Modality) {
            setDeviceModality(deviceFromState.Modality);
            console.log('Device modality set:', deviceFromState.Modality);
        }

        console.log('Final Patient ID:', finalPatientId);
        console.log('Final Accession Number:', finalAccessionNumber);

        setInitialUrlCheckComplete(true); // Indicate that the URL/state check is done
    }, [location.search, location.state]); // Runs when location.search or location.state changes

    const videoConstraints = {
        facingMode: "environment",
        // Remove all constraints to let camera use its optimal native settings
        // frameRate: { ideal: 30, max: 60 },
        // width: { min: 1280, ideal: 1920, max: 4096 },
        // height: { min: 720, ideal: 1080, max: 2160 },
        // aspectRatio: 9 / 16,  // Commented out to allow native camera ratio
        // screenshotQuality: 1.0,  // This parameter is not supported by react-webcam
    };

    const clearError = () => setError(null);

    const handleCapture = useCallback(() => {
        if (!webcamRef.current) {
            setError("Kamera bulunamadı.");
            return;
        }

        // Use actual camera dimensions if available, otherwise let webcam decide
        const { width: streamWidth, height: streamHeight } = actualCameraDimensions;
        let imageSrc;

        if (streamWidth > 0 && streamHeight > 0) {
            // Use the camera's actual native resolution
            imageSrc = webcamRef.current.getScreenshot({
                width: streamWidth,
                height: streamHeight
            });
            console.log(`Capturing at native resolution: ${streamWidth}x${streamHeight}`);
        } else {
            // Fallback to default capture
            imageSrc = webcamRef.current.getScreenshot();
            console.log('Capturing at default resolution');
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

            const targetWidth = imgWidth;
            const targetHeight = Math.round(imgWidth * 1.414);

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

            // Reduce contrast adjustment for better quality (was 1.15, now 1.05)
            const contrastValue = 1.05;
            const brightnessValue = 5; // Slight brightness increase

            for (let i = 0; i < data.length; i += 4) {
                // Apply contrast
                data[i] = contrastValue * (data[i] - 128) + 128;
                data[i + 1] = contrastValue * (data[i + 1] - 128) + 128;
                data[i + 2] = contrastValue * (data[i + 2] - 128) + 128;

                // Apply brightness
                data[i] += brightnessValue;
                data[i + 1] += brightnessValue;
                data[i + 2] += brightnessValue;

                // Clamp values
                data[i] = Math.max(0, Math.min(255, data[i]));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
            }
            ctx.putImageData(finalImageData, 0, 0);

            // Try PNG first for maximum quality, fallback to JPEG if size is too large
            let finalImageOutput;
            const pngImageData = outputCanvas.toDataURL('image/png');

            // If PNG is too large (>5MB), use high-quality JPEG
            if (pngImageData.length > 5 * 1024 * 1024) {
                finalImageOutput = outputCanvas.toDataURL('image/jpeg', 0.95);
                console.log('Using JPEG format due to size constraints');
            } else {
                finalImageOutput = pngImageData;
                console.log('Using PNG format for maximum quality');
            }

            const timestamp = Date.now();
            const imageName = `${accessionNumber || 'NO_ACCESSION'}-${timestamp}`;

            const newImageObject = {
                name: imageName,
                data: finalImageOutput,
                timestamp: timestamp,
                thumbnail: finalImageOutput
            };

            setGeneratedImages(prevImages => [...prevImages, newImageObject]);

            /*
            // Commented out: Code to trigger download for ALL generated images.
            // This includes the image that was just processed and added to the state.
            // Note: `setGeneratedImages` is asynchronous. To get the most up-to-date list
            // for download in this exact spot, you would combine the `generatedImages` state
            // (which holds images from *before* the current one was added) with `newImageObject`.

            const allCurrentlyGeneratedImages = [...generatedImages, newImageObject];

            allCurrentlyGeneratedImages.forEach(img => {
                if (img && img.data && img.name) {
                    const link = document.createElement('a');
                    link.href = img.data; // img.data is the base64 string
                    link.download = `${img.name}.jpeg`; // Uses the generated name and adds .jpeg extension
                    document.body.appendChild(link); // Required for Firefox and some other browsers
                    link.click();
                    document.body.removeChild(link); // Clean up the DOM by removing the link
                } else {
                    console.warn("Skipping download for an invalid image object:", img);
                }
            });
            */

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

    const handleDownloadImage = (imageData, imageName) => {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `${imageName}.jpeg`;
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

    const deleteImage = (timestamp) => {
        setGeneratedImages(prev => prev.filter(img => img.timestamp !== timestamp));
    };

    const dataURLtoBlob = async (dataurl) => {
        const res = await fetch(dataurl);
        const blob = await res.blob();
        return blob;
    };

    const handleSendDocuments = async () => {

        setSendResult(null);

        if (generatedImages.length === 0) {
            flushSync(() => {
                setSendResult({
                    type: 'error',
                    message: 'Gönderilecek görüntü yok.',
                    timestamp: new Date().toLocaleString('tr-TR')
                });
            });
            return;
        }
        if (!patientId.trim() || !accessionNumber.trim()) {
            flushSync(() => {
                setSendResult({
                    type: 'error',
                    message: 'Lütfen Hasta ID ve Erişim Numarası girin.',
                    timestamp: new Date().toLocaleString('tr-TR')
                });
            });
            return;
        }

        setIsProcessing(true);
        clearError();

        let successfulUploads = 0;
        let failedUploads = 0;
        const uploadPromises = [];
        let firstErrorMessage = null;
        const failedFiles = [];

        for (const image of generatedImages) {
            const uploadPromise = new Promise((resolve, reject) => {




                const wsUrl = `wss://${window.location.hostname}/InterPacs.WebDicomUpload/WS.ashx`;
                console.log(`Uploading ${image.name}.jpeg via WebSocket to: ${wsUrl}`);
                const ws = new WebSocket(wsUrl);
                let timeoutId;

                const connectionTimeout = 180000;

                timeoutId = setTimeout(() => {
                    const timeoutMsg = `WebSocket gönderim zaman aşımına uğradı: ${image.name}.jpeg`;
                    console.error(timeoutMsg);
                    if (ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
                        ws.close(1001, "Upload Timeout");
                    }
                    reject(new Error(timeoutMsg));
                }, connectionTimeout);

                ws.onopen = () => {
                    console.log(`WebSocket connection opened for ${image.name}.jpeg.`);
                    try {
                        const base64DataParts = image.data.split(',');
                        if (base64DataParts.length < 2 || !base64DataParts[1]) {
                            throw new Error("Görüntü verisi bozuk (base64 formatında değil veya boş).");
                        }
                        const base64Data = base64DataParts[1];

                        const payload = {
                            type: "fileUpload",
                            metadata: {
                                PatientId: patientId,
                                AccessioNumber: accessionNumber,
                                FileName: `${image.name}.jpeg`
                            },
                            file: base64Data
                        };

                        ws.send(JSON.stringify(payload));
                        console.log(`Payload sent for ${image.name}.jpeg.`);
                    } catch (error) {
                        const prepErrorMsg = `Yükleme için veri hazırlanırken hata (${image.name}.jpeg): ${error.message}`;
                        console.error(prepErrorMsg, error);
                        clearTimeout(timeoutId);
                        if (ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
                            ws.close(1001, "Payload Preparation Error");
                        }
                        reject(new Error(prepErrorMsg));
                    }
                };

                ws.onmessage = (event) => {
                    clearTimeout(timeoutId);
                    console.log(`WebSocket message received for ${image.name}.jpeg:`, event.data);
                    if (typeof event.data === 'string' && event.data.startsWith("ERROR:")) {
                        const serverErrorMsg = `Sunucu hatası (${image.name}.jpeg): ${event.data}`;
                        console.error(serverErrorMsg);
                        ws.close(1000, "Server Error Received");
                        reject(new Error(serverErrorMsg));
                    } else {
                        console.log(`Successfully uploaded ${image.name}.jpeg. Server response: ${event.data}`);
                        ws.close(1000, "Upload Complete");
                        resolve(image.name);
                    }
                };

                ws.onerror = (event) => {
                    clearTimeout(timeoutId);
                    const errorMsg = `WebSocket bağlantı hatası (${image.name}.jpeg). Detaylar için tarayıcı konsolunu kontrol edin.`;
                    console.error(errorMsg, 'Raw WebSocket error event:', event);
                    if (ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
                        ws.close(1001, "WebSocket onerror");
                    }
                    reject(new Error(errorMsg));
                };

                ws.onclose = (event) => {
                    clearTimeout(timeoutId);
                    console.log(`WebSocket connection closed for ${image.name}.jpeg. Code: ${event.code}, Reason: "${event.reason}", Clean: ${event.wasClean}`);
                };
            });
            uploadPromises.push(uploadPromise);
        }

        try {
            const results = await Promise.allSettled(uploadPromises);
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successfulUploads++;
                } else {
                    failedUploads++;
                    const imageName = generatedImages[index]?.name || `Image ${index + 1}`;
                    const errorMessage = result.reason?.message || 'Bilinmeyen hata';
                    failedFiles.push({ fileName: imageName, error: errorMessage });
                    console.error(`Failed to upload:`, errorMessage);
                    if (!firstErrorMessage) {
                        firstErrorMessage = errorMessage;
                    }
                }
            });

            if (failedUploads > 0 && successfulUploads === 0) {
                // All failed
                flushSync(() => {
                    setSendResult({
                        type: 'error',
                        message: `Hiçbir görüntü gönderilemedi! (${failedUploads}/${generatedImages.length} hata)`,
                        details: failedFiles.map(f => `${f.fileName}: ${f.error}`).join('\n'),
                        timestamp: new Date().toLocaleString('tr-TR')
                    });
                });
            } else if (failedUploads > 0) {
                // Partial success
                flushSync(() => {
                    setSendResult({
                        type: 'warning',
                        message: `Kısmi başarı: ${successfulUploads} başarılı, ${failedUploads} hatalı (${generatedImages.length} toplam)`,
                        details: failedFiles.length > 0 ? `Hatalı dosyalar:\n${failedFiles.map(f => `${f.fileName}: ${f.error}`).join('\n')}` : '',
                        timestamp: new Date().toLocaleString('tr-TR')
                    });
                });
            } else if (successfulUploads > 0) {
                // All WebSocket uploads successful, now make the POST request
                try {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = (today.getMonth() + 1).toString().padStart(2, '0');
                    const day = today.getDate().toString().padStart(2, '0');
                    const formattedStudyDate = `${year}${month}${day}`;

                    const dicomSendData = {
                        PatientId: currentPatientDetails?.PatientId || patientId || "",
                        PatientsName: currentPatientDetails?.PatientsName || "",
                        AccessionNumber: currentPatientDetails?.AccessionNumber || accessionNumber || "",
                        RequestedProcedureId: currentPatientDetails?.RequestedProcedureId || "",
                        RequestedProcedureDescription: currentPatientDetails?.RequestedProcedureDescription || "",
                        PatientsBirthDate: currentPatientDetails?.PatientsBirthDate || "",
                        PatientsSex: currentPatientDetails?.PatientsSex || "",
                        AdditionalPatientHistory: currentPatientDetails?.AdditionalPatientHistory || "",
                        PatientComments: currentPatientDetails?.PatientComments || "",
                        RequestingService: currentPatientDetails?.RequestingService || "",
                        MedicalAlerts: currentPatientDetails?.MedicalAlerts || "",
                        Allergies: currentPatientDetails?.Allergies || "",
                        StudyInstanceUid: currentPatientDetails?.StudyInstanceUid || Date.now().toString(),
                        AdmissionId: currentPatientDetails?.AdmissionId || "",
                        OtherPatientIds: currentPatientDetails?.OtherPatientIds || "",
                        Modality: deviceModality,
                        StudyDate: formattedStudyDate
                    };

                    console.log("Current patient details for DICOM send:", currentPatientDetails);
                    console.log("Sending DICOM metadata POST request with body:", dicomSendData);

                    const apiUrl = `https://${window.location.hostname}/InterPacs.WebDicomUpload/api/DicomSend`;
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(dicomSendData),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`DicomSend API Hata: ${response.status} - ${errorText}`);
                    }

                    const responseData = await response.json();
                    console.log("DicomSend API Yanıtı:", responseData);

                    // Check if the response contains ResultCode
                    const isSuccess = responseData?.ResultCode === true;

                    if (isSuccess) {
                        flushSync(() => {
                            setSendResult({
                                type: 'success',
                                message: `Tüm ${successfulUploads} görüntü başarıyla gönderildi ve DICOM bilgisi kaydedildi!`,
                                details: ``,
                                timestamp: new Date().toLocaleString('tr-TR')
                            });
                        });
                        setGeneratedImages([]);
                        // Optionally clear patientId and accessionNumber if the workflow implies a fresh start
                        // setPatientId('');
                        // setAccessionNumber(''); 
                        // setCurrentPatientDetails(null);
                    } else {
                        flushSync(() => {
                            setSendResult({
                                type: 'error',
                                message: `Görüntüler gönderildi ancak DICOM metadata kaydedilemedi: ${responseData?.Message || 'Bilinmeyen hata'}`,
                                details: responseData?.Message || '',
                                timestamp: new Date().toLocaleString('tr-TR')
                            });
                        });
                    }

                } catch (postError) {
                    console.error("DICOM metadata gönderme hatası:", postError);
                    flushSync(() => {
                        setSendResult({
                            type: 'warning',
                            message: `Görüntüler gönderildi (${successfulUploads}), ancak DICOM metadata gönderilemedi`,
                            details: `Hata: ${postError.message}`,
                            timestamp: new Date().toLocaleString('tr-TR')
                        });
                    });
                }

            } else {
                flushSync(() => {
                    setSendResult({
                        type: 'error',
                        message: 'Gönderilecek görüntü bulunamadı veya bir sorun oluştu.',
                        timestamp: new Date().toLocaleString('tr-TR')
                    });
                });
            }

        } catch (overallError) {
            console.error("Görüntü gönderme işlemlerini yönetirken beklenmedik hata:", overallError);
            flushSync(() => {
                setSendResult({
                    type: 'error',
                    message: 'Görüntüleri gönderirken genel bir hata oluştu.',
                    details: overallError.message,
                    timestamp: new Date().toLocaleString('tr-TR')
                });
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        webcamRef,
        imageRef,
        previewCanvasRef,
        mode,
        setMode,
        capturedImage,
        setCapturedImage,
        corners,
        setCorners,
        activeCornerIndex,
        setActiveCornerIndex,
        isProcessing,
        setIsProcessing,
        error,
        setError,
        imageDimensions,
        setImageDimensions,
        generatedImages,
        setGeneratedImages,
        actualCameraDimensions,
        setActualCameraDimensions,
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
        drawPreview,
        handleApprovePdf,
        handleDownloadImage,
        resetState,
        deleteImage,
        handleSendDocuments,
        initialUrlCheckComplete,
        currentPatientDetails,
        setCurrentPatientDetails,
        deviceModality,
        setDeviceModality,
        sendResult,
        setSendResult
    };
};

export default useScannerController; 