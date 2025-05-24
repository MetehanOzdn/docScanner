import { useState, useEffect } from 'react';

export const useDevicesList = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                setLoading(true);
                // Production için doğru API URL'i
                const apiUrl = import.meta.env.PROD
                    ? '/InterPacs.WebDicomUpload/api/Device'
                    : '/api/Device';

                console.log("Fetching devices from:", apiUrl);
                const response = await fetch(apiUrl);
                console.log("Response received:", response);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setDevices(data);
                setError(null);
            } catch (e) {
                console.error("Failed to fetch devices in useDevicesList:", e);
                setError("Cihazlar yüklenemedi: " + e.message);
                setDevices([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDevices();
    }, []);

    return { devices, loading, error };
}; 