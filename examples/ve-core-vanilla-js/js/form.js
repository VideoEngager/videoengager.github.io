// @ts-check

document.addEventListener('DOMContentLoaded', () => {
    // Retrieve selected service from sessionStorage
    let selectedService;
    try {
        const storedService = sessionStorage.getItem('selectedService');
        if (!storedService) {
            alert('No service has been selected');
            const urlWithParams = buildUrlWithParams('index.html');
            window.location.href = urlWithParams;
            return;
        }
        selectedService = JSON.parse(storedService);
    } catch (error) {
        console.error('Error retrieving service:', error);
        alert('Error loading the selected service');
        const urlWithParams = buildUrlWithParams('index.html');
        window.location.href = urlWithParams;
        return;
    }

    // Display selected service
    const serviceName = document.getElementById('serviceName');
    if (serviceName) {
        serviceName.textContent = selectedService.name;
    }

    // Handle back button
    const btnBack = document.getElementById('btnBack');
    btnBack?.addEventListener('click', () => {
        const urlWithParams = buildUrlWithParams('index.html');
        window.location.href = urlWithParams;
    });

    // Handle form submission
    const form = document.getElementById('beneficiaryForm');
    form?.addEventListener('submit', (event) => {
        event.preventDefault();

        // Get form data
        const formData = new FormData(form);
        const beneficiaryData = {
            name: formData.get('name'),
            email: formData.get('email')
        };

        // Validate form data
        if (!beneficiaryData.name || !beneficiaryData.email) {
            alert('Please complete all required fields');
            return;
        }

        // Store beneficiary data
        try {
            sessionStorage.setItem('beneficiaryData', JSON.stringify(beneficiaryData));

            // Navigate to interaction page with URL parameters preserved
            const urlWithParams = buildUrlWithParams('interaction.html');
            window.location.href = urlWithParams;
        } catch (error) {
            console.error('Error storing beneficiary data:', error);
            alert('Error saving data. Please try again.');
        }
    });
});
