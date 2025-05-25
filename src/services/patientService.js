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
    async fetchPatients(device, startDate, endDate, isTestMode = false) {
        try {
            console.log(`Fetching patients for device: ${device?.AET} between ${startDate} and ${endDate}`);
            console.log(`Test mode: ${isTestMode}`);
            console.log(`Environment: ${import.meta.env.MODE} (PROD: ${import.meta.env.PROD})`);

            const baseUrl = getApiBaseUrl();
            console.log(`Using API base URL: ${baseUrl}`);

            // Try GET first (same as Postman)
            console.log('Trying GET request first (same as Postman)...');
            const params = new URLSearchParams();
            params.append('deviceAET', device?.AET || 'SFAE1');
            params.append('modality', device?.Modality || 'SFT');
            params.append('patname', '');
            params.append('scheduledDate', startDate || '2025-05-22');
            params.append('scheduledEndDate', endDate || '2025-05-22');
            params.append('test', isTestMode.toString()); // Convert boolean to string

            const getUrl = `${baseUrl}?${params.toString()}`;
            console.log('GET URL:', getUrl);
            console.log('URL Parameters breakdown:', {
                deviceAET: device?.AET || 'SFAE1',
                modality: device?.Modality || 'SFT',
                patname: '',
                scheduledDate: startDate || '2025-05-22',
                scheduledEndDate: endDate || '2025-05-22',
                test: isTestMode.toString()
            });
            console.log('Compare this URL with your Postman URL:');
            console.log('Expected Postman URL: http://localhost/InterPacs.WebDicomUpload/api/MwlScu?deviceAET=SFAE1&modality=SFT&patname=&scheduledDate=2025-05-24&scheduledEndDate=2025-05-26&test=false');

            const getResponse = await fetch(getUrl, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            if (getResponse.ok) {
                const data = await getResponse.json();
                console.log('API Response (GET):', data);
                console.log('Response contains test data:', this.isTestData(data));
                console.log('Total patients received:', data?.length || 0);

                // Log first few patient names to help identify test data
                if (Array.isArray(data) && data.length > 0) {
                    console.log('First 3 patient names:', data.slice(0, 3).map(p => p.PatientsName || 'No name'));
                }

                return data;
            }

            // If GET fails, try POST as fallback
            console.log('GET failed, trying POST as fallback...');

            // Prepare data for POST request
            const requestData = {
                deviceAET: device?.AET || 'SFAE1',
                modality: device?.Modality || 'SFT',
                patname: '',
                scheduledDate: startDate || '2025-05-22',
                scheduledEndDate: endDate || '2025-05-22',
                test: isTestMode // Explicitly use the parameter
            };

            // Try different test parameter formats if the API expects specific format
            if (!isTestMode) {
                // Try multiple ways to ensure we get real data
                requestData.test = false;
                requestData.Test = false;
                requestData.TEST = false;
                requestData.isTest = false;
                requestData.testMode = false;
            }

            console.log('Requesting URL:', baseUrl);
            console.log('Request Data:', JSON.stringify(requestData, null, 2));

            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API Response (POST):', data);
            console.log('Response contains test data:', this.isTestData(data));
            console.log('Total patients received:', data?.length || 0);

            // Log first few patient names to help identify test data
            if (Array.isArray(data) && data.length > 0) {
                console.log('First 3 patient names:', data.slice(0, 3).map(p => p.PatientsName || 'No name'));
            }

            return data;
        } catch (error) {
            console.error('Error fetching patients:', error);
            throw error;
        }
    },

    // Helper function to detect if data contains test patients
    isTestData(data) {
        if (!Array.isArray(data) || data.length === 0) return false;

        // Check for common test data indicators
        const testIndicators = [
            'test', 'TEST', 'Test',
            'demo', 'DEMO', 'Demo',
            'sample', 'SAMPLE', 'Sample',
            'örnek', 'ÖRNEK', 'Örnek',
            'deneme', 'DENEME', 'Deneme',
            'fake', 'FAKE', 'Fake',
            'dummy', 'DUMMY', 'Dummy',
            'mock', 'MOCK', 'Mock',
            'sahte', 'SAHTE', 'Sahte'
        ];

        // Check for test patterns in patient data
        const hasTestData = data.some(patient => {
            const name = patient.PatientsName || '';
            const id = patient.PatientId || '';
            const description = patient.RequestedProcedureDescription || '';
            const accession = patient.AccessionNumber || '';

            return testIndicators.some(indicator =>
                name.includes(indicator) ||
                id.includes(indicator) ||
                description.includes(indicator) ||
                accession.includes(indicator)
            );
        });

        // Also check for sequential/pattern-based test data
        const hasSequentialIds = data.length > 1 && data.every((patient, index) => {
            const id = patient.PatientId || '';
            return id.includes(String(index + 1)) || id.includes(`00${index + 1}`);
        });

        console.log('Test data analysis:', {
            hasTestIndicators: hasTestData,
            hasSequentialIds: hasSequentialIds,
            sampleNames: data.slice(0, 3).map(p => p.PatientsName || 'No name'),
            sampleIds: data.slice(0, 3).map(p => p.PatientId || 'No ID')
        });

        return hasTestData || hasSequentialIds;
    },

    // Transform API response to patient format
    transformPatientData(apiData) {
        return apiData.map((item, index) => ({
            // Basic identifiers
            id: item.PatientId || `patient-${index}`,
            name: item.PatientsName || `Hasta ${index + 1}`,

            // Patient information (keeping original API field names for DICOM sending)
            PatientId: item.PatientId,
            PatientsName: item.PatientsName,
            PatientsBirthDate: item.PatientsBirthDate, // YYYYMMDD format
            PatientsSex: item.PatientsSex,

            // Study and procedure information
            AccessionNumber: item.AccessionNumber,
            RequestedProcedureId: item.RequestedProcedureId,
            RequestedProcedureDescription: item.RequestedProcedureDescription,
            RequestingService: item.RequestingService,
            StudyInstanceUid: item.StudyInstanceUid,
            AdmissionId: item.AdmissionId,
            OtherPatientIds: item.OtherPatientIds,

            // Additional patient information
            AdditionalPatientHistory: item.AdditionalPatientHistory,
            PatientComments: item.PatientComments,
            MedicalAlerts: item.MedicalAlerts,
            Allergies: item.Allergies,

            // Display fields (formatted for UI)
            patientId: item.PatientId,
            birthDate: formatBirthDate(item.PatientsBirthDate),
            sex: item.PatientsSex,
            accessionNumber: item.AccessionNumber,
            procedureDescription: item.RequestedProcedureDescription,
            requestingService: item.RequestingService,
            studyInstanceUid: item.StudyInstanceUid,
            admissionId: item.AdmissionId
        }));
    },

    // Test function to force GET request only (same as Postman)
    async fetchPatientsGETOnly(device, startDate, endDate, isTestMode = false) {
        try {
            console.log('=== FORCE GET ONLY (POSTMAN STYLE) ===');
            console.log(`Fetching patients for device: ${device?.AET} between ${startDate} and ${endDate}`);
            console.log(`Test mode: ${isTestMode}`);

            const baseUrl = getApiBaseUrl();
            console.log(`Using API base URL: ${baseUrl}`);

            const params = new URLSearchParams();
            params.append('deviceAET', device?.AET || 'SFAE1');
            params.append('modality', device?.Modality || 'SFT');
            params.append('patname', '');
            params.append('scheduledDate', startDate || '2025-05-22');
            params.append('scheduledEndDate', endDate || '2025-05-22');
            params.append('test', isTestMode.toString());

            const getUrl = `${baseUrl}?${params.toString()}`;
            console.log('GET URL:', getUrl);

            const response = await fetch(getUrl, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API Response (GET ONLY):', data);
            console.log('Response contains test data:', this.isTestData(data));
            console.log('Total patients received:', data?.length || 0);

            if (Array.isArray(data) && data.length > 0) {
                console.log('First 3 patient names:', data.slice(0, 3).map(p => p.PatientsName || 'No name'));
            }

            return data;
        } catch (error) {
            console.error('Error fetching patients (GET ONLY):', error);
            throw error;
        }
    }
};

export default patientService; 