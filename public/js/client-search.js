document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const clientSearch = document.getElementById('clientSearch');
    const searchResults = document.getElementById('searchResults');
    const clientForm = document.getElementById('clientForm');
    const clientName = document.getElementById('clientName');
    const phone = document.getElementById('phone');
    const selectedClientId = document.getElementById('selectedClientId');
    let searchTimeout;

    // Get CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    // Validate required elements
    if (!clientSearch || !searchResults || !clientName || !phone) {
        console.error('Required DOM elements not found');
        return;
    }

    // Client search functionality
    clientSearch.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value.trim();

        if (searchTerm.length < 2) {
            searchResults.innerHTML = '';
            return;
        }

        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`/clients/search?term=${encodeURIComponent(searchTerm)}`, {
                    headers: {
                        'CSRF-Token': csrfToken
                    }
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const clients = await response.json();

                if (clients.length === 0) {
                    searchResults.innerHTML = `
                        <div class="list-group-item">
                            Cliente não encontrado. 
                            <button type="button" class="btn btn-primary btn-sm ml-2" data-bs-toggle="modal" data-bs-target="#clientRegistrationModal">
                                Cadastrar Novo Cliente
                            </button>
                        </div>`;
                    return;
                }

                searchResults.innerHTML = clients.map(client => `
                    <a href="#" class="list-group-item list-group-item-action" 
                       data-client-id="${client.id}"
                       data-client-name="${client.firstName} ${client.lastName}"
                       data-client-phone="${client.phone}">
                        ${client.firstName} ${client.lastName} - ${client.phone}
                    </a>
                `).join('');

                // Add click event listeners to search results
                document.querySelectorAll('#searchResults a').forEach(item => {
                    item.addEventListener('click', function(e) {
                        e.preventDefault();
                        const clientId = this.dataset.clientId;
                        const clientFullName = this.dataset.clientName;
                        const clientPhone = this.dataset.clientPhone;

                        // Update form fields
                        clientName.value = clientFullName;
                        phone.value = clientPhone;
                        if (selectedClientId) {
                            selectedClientId.value = clientId;
                        }

                        // Clear search
                        clientSearch.value = '';
                        searchResults.innerHTML = '';
                    });
                });
            } catch (error) {
                console.error('Error searching clients:', error);
                searchResults.innerHTML = '<div class="list-group-item text-danger">Error searching clients</div>';
            }
        }, 300);
    });

    // Client registration form submission
    if (clientForm) {
        clientForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/clients', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                // Handle successful client registration
                const modal = bootstrap.Modal.getInstance(document.getElementById('clientRegistrationModal'));
                modal.hide();
                
                // Update the appointment form with the new client's information
                clientName.value = `${result.firstName} ${result.lastName}`;
                phone.value = result.phone;
                if (selectedClientId) {
                    selectedClientId.value = result.id;
                }

                // Clear the registration form
                clientForm.reset();
            } catch (error) {
                console.error('Error registering client:', error);
                alert('Error registering client. Please try again.');
            }
        });
    }
});