// @ts-check

document.addEventListener('DOMContentLoaded', () => {
    const serviceCards = document.querySelectorAll('.service-card');

    serviceCards.forEach(card => {
        const button = card.querySelector('.btn-select');

        button?.addEventListener('click', () => {
            const serviceId = card.getAttribute('data-service-id');
            const serviceName = card.getAttribute('data-service-name');

            if (!serviceId || !serviceName) {
                alert('Error: Invalid service');
                return;
            }

            // Store selected service in sessionStorage
            try {
                sessionStorage.setItem('selectedService', JSON.stringify({
                    id: serviceId,
                    name: serviceName
                }));

                // Navigate to form page with URL parameters preserved
                const urlWithParams = buildUrlWithParams('form.html');
                window.location.href = urlWithParams;
            } catch (error) {
                console.error('Error storing service selection:', error);
                alert('Error selecting the service. Please try again.');
            }
        });
    });
});
