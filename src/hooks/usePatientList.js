import { useState, useEffect } from 'react';
import patientService from '../services/patientService';

const usePatientList = (device) => {
    // State for date range - initialize with current date
    const getCurrentDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    const [startDate, setStartDate] = useState(getCurrentDate());
    const [endDate, setEndDate] = useState(getCurrentDate());
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // API call function to fetch patients using the service
    const fetchPatients = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log(`Fetching patients with dates: ${startDate} to ${endDate}`);

            // Use the patient service to fetch data with the selected date range
            const apiData = await patientService.fetchPatients(device, startDate, endDate);

            // Transform the data using the service
            const patientsData = patientService.transformPatientData(apiData);

            setPatients(patientsData);
        } catch (error) {
            console.error('Error fetching patients:', error);
            setError(error.message);
            setPatients([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch patients on initial component mount or when device changes
    useEffect(() => {
        if (device) {
            fetchPatients();
        }
    }, [device]);

    // Auto-fetch when dates change (optional - you can remove this if you want manual filtering only)
    useEffect(() => {
        if (device && startDate && endDate) {
            const timeoutId = setTimeout(() => {
                fetchPatients();
            }, 500); // Debounce for 500ms

            return () => clearTimeout(timeoutId);
        }
    }, [startDate, endDate, device]);

    const handleFilter = () => {
        if (!startDate || !endDate) {
            setError('Lütfen başlangıç ve bitiş tarihlerini seçin');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setError('Başlangıç tarihi bitiş tarihinden sonra olamaz');
            return;
        }

        fetchPatients();
    };

    const handleStartDateChange = (date) => {
        setStartDate(date);
        setError(null); // Clear any previous errors
    };

    const handleEndDateChange = (date) => {
        setEndDate(date);
        setError(null); // Clear any previous errors
    };

    return {
        // State
        startDate,
        endDate,
        patients,
        loading,
        error,

        // Actions
        handleFilter,
        handleStartDateChange,
        handleEndDateChange,
        fetchPatients
    };
};

export default usePatientList; 