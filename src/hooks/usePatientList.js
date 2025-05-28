import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import patientService from '../services/patientService';

const usePatientList = (device) => {
    const location = useLocation();

    // State for date range - initialize with URL params or current date
    const getCurrentDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    // Get dates from URL parameters, localStorage, or current date (in order of priority)
    const getInitialDate = (paramName) => {
        const params = new URLSearchParams(location.search);
        const urlDate = params.get(paramName);
        const storageKey = paramName === 'startDate' ? 'patientListStartDate' : 'patientListEndDate';
        const savedDate = localStorage.getItem(storageKey);

        return urlDate || savedDate || getCurrentDate();
    };

    const [startDate, setStartDate] = useState(getInitialDate('startDate'));
    const [endDate, setEndDate] = useState(getInitialDate('endDate'));
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // API call function to fetch patients using the service
    const fetchPatients = async (customStartDate = null, customEndDate = null) => {
        try {
            setLoading(true);
            setError(null);

            const effectiveStartDate = customStartDate || startDate;
            const effectiveEndDate = customEndDate || endDate;

            console.log(`Fetching patients with dates: ${effectiveStartDate} to ${effectiveEndDate}`);

            // Use the patient service to fetch data with the selected date range
            const apiData = await patientService.fetchPatients(device, effectiveStartDate, effectiveEndDate);

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

    // Update dates when URL changes and trigger search
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlStartDate = params.get('startDate');
        const urlEndDate = params.get('endDate');

        let datesChanged = false;

        if (urlStartDate && urlStartDate !== startDate) {
            setStartDate(urlStartDate);
            localStorage.setItem('patientListStartDate', urlStartDate);
            datesChanged = true;
        }
        if (urlEndDate && urlEndDate !== endDate) {
            setEndDate(urlEndDate);
            localStorage.setItem('patientListEndDate', urlEndDate);
            datesChanged = true;
        }

        // If dates changed from URL and device is available, fetch patients immediately
        if (datesChanged && device) {
            // Use the URL dates directly for immediate search
            fetchPatients(urlStartDate, urlEndDate);
        }
    }, [location.search, device]);

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
        // Save to localStorage to preserve selection
        localStorage.setItem('patientListStartDate', date);
    };

    const handleEndDateChange = (date) => {
        setEndDate(date);
        setError(null); // Clear any previous errors
        // Save to localStorage to preserve selection
        localStorage.setItem('patientListEndDate', date);
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