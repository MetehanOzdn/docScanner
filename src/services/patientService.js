// Patient API Service
const getApiBaseUrl = () => {
    return import.meta.env.PROD
        ? '/InterPacs.WebDicomUpload/api/MwlScu'
        : 'api/MwlScu';
};

// Helper function to format birth date from YYYYMMDD to readable format
const formatBirthDate = (dateString) => {
    if (!dateString || dateString.length !== 8) return '';

    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);

    return `${day}.${month}.${year}`;
};

export const patientService = {
    // Fetch patients from MwlScu endpoint
    async fetchPatients(device, startDate, endDate) {
        try {
            console.log(`Fetching patients for device: ${device?.AET} between ${startDate} and ${endDate}`);

            const baseUrl = getApiBaseUrl();

            // Prepare data for POST request
            const requestData = {
                deviceAET: device?.AET || 'SFAE1',
                modality: device?.Modality || 'SFT',
                patname: '',
                scheduledDate: startDate || '2025-05-22',
                scheduledEndDate: endDate || '2025-05-22',
                test: true
            };

            console.log('Requesting URL:', baseUrl);
            console.log('Request Data:', requestData);

            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                // If POST fails, try GET as fallback
                console.log('POST failed, trying GET...');
                const params = new URLSearchParams();
                params.append('deviceAET', device?.AET || 'SFAE1');
                params.append('modality', device?.Modality || 'SFT');
                params.append('patname', '');
                params.append('scheduledDate', startDate || '2025-05-22');
                params.append('scheduledEndDate', endDate || '2025-05-22');
                params.append('test', 'true');

                const getUrl = `${baseUrl}?${params.toString()}`;
                console.log('Fallback GET URL:', getUrl);

                const getResponse = await fetch(getUrl);

                if (!getResponse.ok) {
                    throw new Error(`HTTP error! status: ${getResponse.status} - ${getResponse.statusText}`);
                }

                const data = await getResponse.json();
                console.log('API Response (GET):', data);
                return data;
            }

            const data = await response.json();
            console.log('API Response (POST):', data);

            return data;
        } catch (error) {
            console.error('Error fetching patients:', error);
            throw error;
        }
    },

    // Transform API response to patient format
    transformPatientData(apiData) {
        return apiData.map((item, index) => ({
            id: item.PatientId || `patient-${index}`,
            name: item.PatientsName || `Hasta ${index + 1}`,
            patientId: item.PatientId,
            birthDate: formatBirthDate(item.PatientsBirthDate),
            sex: item.PatientsSex,
            accessionNumber: item.AccessionNumber,
            procedureDescription: item.RequestedProcedureDescription,
            requestingService: item.RequestingService,
            studyInstanceUid: item.StudyInstanceUid,
            admissionId: item.AdmissionId
        }));
    }
};

export default patientService; 