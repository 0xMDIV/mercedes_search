// Mercedes Helper Frontend JavaScript

class MercedesHelper {
    constructor() {
        this.currentUser = null;
        this.currentTab = 'home';
        this.vehicles = [];
        this.favorites = [];
        this.preferences = [];
        this.filters = {
            search: '',
            sortBy: 'price_asc',
            fuelType: '',
            transmission: '',
            maxPrice: 200000
        };
        
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
        this.loadVehicles();
        this.loadPreferences();
        this.loadFavorites();
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('homeTab').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchTab('home');
        });

        document.getElementById('favoritesTab').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchTab('favorites');
        });

        // Auth forms
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });

        // Vehicle management
        document.getElementById('addVehicleBtn').addEventListener('click', (e) => {
            e.preventDefault();
            const modal = new bootstrap.Modal(document.getElementById('addVehicleModal'));
            modal.show();
        });

        document.getElementById('addVehicleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddVehicle();
        });

        // Preferences
        document.getElementById('editPreferencesBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPreferencesModal();
        });

        document.getElementById('managePreferencesBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPreferencesModal();
        });

        document.getElementById('preferencesForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSavePreferences();
        });

        // Filters and search
        document.getElementById('searchInput').addEventListener('input', 
            this.debounce((e) => {
                this.filters.search = e.target.value;
                this.loadVehicles();
            }, 500)
        );

        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.filters.sortBy = e.target.value;
            this.loadVehicles();
        });

        document.getElementById('fuelTypeFilter').addEventListener('change', (e) => {
            this.filters.fuelType = e.target.value;
            this.loadVehicles();
        });

        document.getElementById('transmissionFilter').addEventListener('change', (e) => {
            this.filters.transmission = e.target.value;
            this.loadVehicles();
        });

        document.getElementById('priceRange').addEventListener('input', (e) => {
            this.filters.maxPrice = parseInt(e.target.value);
            document.getElementById('priceRangeValue').textContent = 
                new Intl.NumberFormat('de-DE').format(this.filters.maxPrice) + '€';
        });

        document.getElementById('priceRange').addEventListener('change', (e) => {
            this.filters.maxPrice = parseInt(e.target.value);
            this.loadVehicles();
        });
    }

    // Authentication methods
    async checkAuthStatus() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data.user;
                    this.updateAuthUI();
                } else {
                    localStorage.removeItem('token');
                    this.currentUser = null;
                    this.updateAuthUI();
                }
            } catch (error) {
                console.error('Auth check error:', error);
                localStorage.removeItem('token');
                this.currentUser = null;
                this.updateAuthUI();
            }
        } else {
            this.updateAuthUI();
        }
    }

    updateAuthUI() {
        const loginNav = document.getElementById('loginNav');
        const userNav = document.getElementById('userNav');
        const editPreferencesBtn = document.getElementById('editPreferencesBtn');

        if (this.currentUser) {
            loginNav.style.display = 'none';
            userNav.style.display = 'block';
            editPreferencesBtn.style.display = 'inline-block';
            document.getElementById('username').textContent = this.currentUser.username;
        } else {
            loginNav.style.display = 'block';
            userNav.style.display = 'none';
            editPreferencesBtn.style.display = 'none';
        }
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                this.currentUser = data.user;
                this.updateAuthUI();
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                modal.hide();
                
                this.showAlert('Erfolgreich angemeldet!', 'success');
                this.loadPreferences();
                this.loadVehicles();
            } else {
                this.showAlert(data.error || 'Login fehlgeschlagen', 'danger');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('Ein Fehler ist aufgetreten', 'danger');
        }
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                this.currentUser = data.user;
                this.updateAuthUI();
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                modal.hide();
                
                this.showAlert('Erfolgreich registriert!', 'success');
                this.loadPreferences();
                this.loadVehicles();
            } else {
                this.showAlert(data.error || 'Registrierung fehlgeschlagen', 'danger');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showAlert('Ein Fehler ist aufgetreten', 'danger');
        }
    }

    handleLogout() {
        localStorage.removeItem('token');
        this.currentUser = null;
        this.updateAuthUI();
        this.showAlert('Erfolgreich abgemeldet!', 'info');
        this.loadVehicles();
        this.loadPreferences();
    }

    // Vehicle management
    async loadVehicles() {
        try {
            const params = new URLSearchParams();
            Object.keys(this.filters).forEach(key => {
                if (this.filters[key] !== '' && this.filters[key] !== null) {
                    params.append(key, this.filters[key]);
                }
            });

            const headers = {};
            const token = localStorage.getItem('token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`/api/vehicles?${params}`, { headers });
            const data = await response.json();

            if (response.ok) {
                this.vehicles = data.vehicles;
                this.renderVehicles();
            } else {
                this.showAlert('Fehler beim Laden der Fahrzeuge', 'danger');
            }
        } catch (error) {
            console.error('Load vehicles error:', error);
            this.showAlert('Ein Fehler ist aufgetreten', 'danger');
        }
    }

    async loadFavorites() {
        try {
            const headers = {};
            const token = localStorage.getItem('token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/favorites', { headers });
            const data = await response.json();

            if (response.ok) {
                this.favorites = data;
                this.updateFavoritesCount();
            }
        } catch (error) {
            console.error('Load favorites error:', error);
        }
    }

    async toggleFavorite(vehicleId) {
        if (!this.currentUser) {
            this.showAlert('Bitte melden Sie sich an, um Favoriten zu verwalten', 'warning');
            return;
        }

        try {
            const response = await fetch(`/api/favorites/${vehicleId}/toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert(data.message, 'success');
                this.loadVehicles();
                this.loadFavorites();
            } else {
                this.showAlert(data.error || 'Fehler beim Verwalten der Favoriten', 'danger');
            }
        } catch (error) {
            console.error('Toggle favorite error:', error);
            this.showAlert('Ein Fehler ist aufgetreten', 'danger');
        }
    }

    async handleAddVehicle() {
        const url = document.getElementById('vehicleUrl').value;
        const crawlBtn = document.getElementById('crawlBtn');
        const spinner = crawlBtn.querySelector('.spinner-border');
        const statusDiv = document.getElementById('crawlStatus');

        if (!this.currentUser) {
            this.showAlert('Bitte melden Sie sich an, um Fahrzeuge hinzuzufügen', 'warning');
            return;
        }

        crawlBtn.disabled = true;
        spinner.classList.remove('d-none');
        statusDiv.innerHTML = '<div class="alert alert-info">Crawling Mercedes-Benz Seite...</div>';

        try {
            const response = await fetch('/api/crawler/crawl', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (response.ok) {
                statusDiv.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
                document.getElementById('vehicleUrl').value = '';
                
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addVehicleModal'));
                    modal.hide();
                    this.loadVehicles();
                }, 2000);
            } else {
                statusDiv.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
            }
        } catch (error) {
            console.error('Add vehicle error:', error);
            statusDiv.innerHTML = '<div class="alert alert-danger">Ein Fehler ist aufgetreten</div>';
        } finally {
            crawlBtn.disabled = false;
            spinner.classList.add('d-none');
        }
    }

    // Preferences management
    async loadPreferences() {
        try {
            const headers = {};
            const token = localStorage.getItem('token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/preferences', { headers });
            const data = await response.json();

            if (response.ok) {
                this.preferences = data.preferences;
                this.renderPreferences();
            }
        } catch (error) {
            console.error('Load preferences error:', error);
        }
    }

    renderPreferences() {
        const preferencesDisplay = document.getElementById('preferencesDisplay');
        
        if (!this.currentUser) {
            preferencesDisplay.innerHTML = '<p class="text-muted">Melden Sie sich an, um Ihre Präferenzen zu verwalten.</p>';
            return;
        }

        if (this.preferences.length === 0) {
            preferencesDisplay.innerHTML = '<p class="text-muted">Noch keine Präferenzen definiert. Klicken Sie auf "Bearbeiten" um welche hinzuzufügen.</p>';
            return;
        }

        const preferencesHtml = this.preferences.map(pref => 
            `<li>${this.escapeHtml(pref)}</li>`
        ).join('');

        preferencesDisplay.innerHTML = `<ul class="preferences-list">${preferencesHtml}</ul>`;
    }

    showPreferencesModal() {
        if (!this.currentUser) {
            this.showAlert('Bitte melden Sie sich an, um Präferenzen zu verwalten', 'warning');
            return;
        }

        const textarea = document.getElementById('preferencesTextarea');
        textarea.value = this.preferences.join('\n');
        
        const modal = new bootstrap.Modal(document.getElementById('preferencesModal'));
        modal.show();
    }

    async handleSavePreferences() {
        const textarea = document.getElementById('preferencesTextarea');
        const preferences = textarea.value.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        try {
            const response = await fetch('/api/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ preferences })
            });

            const data = await response.json();

            if (response.ok) {
                this.preferences = preferences;
                this.renderPreferences();
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('preferencesModal'));
                modal.hide();
                
                this.showAlert('Präferenzen erfolgreich gespeichert!', 'success');
            } else {
                this.showAlert(data.error || 'Fehler beim Speichern der Präferenzen', 'danger');
            }
        } catch (error) {
            console.error('Save preferences error:', error);
            this.showAlert('Ein Fehler ist aufgetreten', 'danger');
        }
    }

    // Vehicle rendering
    renderVehicles() {
        const vehicleList = document.getElementById('vehicleList');
        
        if (this.currentTab === 'favorites') {
            this.renderFavorites();
            return;
        }

        if (this.vehicles.length === 0) {
            vehicleList.innerHTML = `
                <div class="text-center p-5">
                    <i class="bi bi-car-front" style="font-size: 3rem; color: #ccc;"></i>
                    <h4 class="mt-3 text-muted">Keine Fahrzeuge gefunden</h4>
                    <p class="text-muted">Versuchen Sie andere Suchkriterien oder fügen Sie neue Fahrzeuge hinzu.</p>
                </div>
            `;
            return;
        }

        const vehiclesHtml = this.vehicles.map(vehicle => this.renderVehicleCard(vehicle)).join('');
        vehicleList.innerHTML = vehiclesHtml;

        // Setup collapse listeners and favorite buttons
        this.setupVehicleInteractions();
    }

    renderFavorites() {
        const vehicleList = document.getElementById('vehicleList');
        
        if (this.favorites.length === 0) {
            vehicleList.innerHTML = `
                <div class="text-center p-5">
                    <i class="bi bi-star" style="font-size: 3rem; color: #ccc;"></i>
                    <h4 class="mt-3 text-muted">Keine Favoriten</h4>
                    <p class="text-muted">Markieren Sie bis zu 3 Fahrzeuge als Favoriten, um sie hier zu sehen.</p>
                </div>
            `;
            return;
        }

        const favoritesHtml = this.favorites.map(vehicle => this.renderVehicleCard(vehicle)).join('');
        vehicleList.innerHTML = favoritesHtml;
        
        this.setupVehicleInteractions();
    }

    renderVehicleCard(vehicle) {
        const isFavorite = vehicle.isFavorite;
        const mainImage = vehicle.mainImage || '/uploads/placeholder-car.jpg';
        
        return `
            <div class="card vehicle-card ${isFavorite ? 'favorite' : ''}" data-vehicle-id="${vehicle.id}">
                <div class="vehicle-header" data-bs-toggle="collapse" data-bs-target="#collapse-${vehicle.id}">
                    <div class="row align-items-center">
                        <div class="col-auto">
                            <img src="${mainImage}" alt="${vehicle.model}" class="vehicle-image" 
                                 onerror="this.src='/uploads/placeholder-car.jpg'">
                        </div>
                        <div class="col">
                            <h5 class="mb-1">${this.escapeHtml(vehicle.model)}</h5>
                            <div class="row">
                                <div class="col-md-6">
                                    <small class="text-muted">
                                        <i class="bi bi-calendar"></i> ${vehicle.modelYear} |
                                        <i class="bi bi-speedometer2"></i> ${this.formatNumber(vehicle.mileage)} km
                                    </small>
                                </div>
                                <div class="col-md-6">
                                    <small class="text-muted">
                                        <i class="bi bi-geo-alt"></i> ${this.escapeHtml(vehicle.dealerLocation)}
                                        ${vehicle.distanceFromHildesheim ? 
                                            `<br><i class="bi bi-signpost"></i> ${vehicle.distanceFromHildesheim} km von Hildesheim` +
                                            (vehicle.travelTimeFromHildesheim ? ` (${vehicle.travelTimeFromHildesheim})` : '')
                                            : ''
                                        }
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div class="col-auto">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-primary price-badge me-2">
                                    ${this.formatPrice(vehicle.price)}
                                </span>
                                <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                                        onclick="app.toggleFavorite('${vehicle.id}')" 
                                        title="${isFavorite ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen'}">
                                    <i class="bi bi-star${isFavorite ? '-fill' : ''}"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="collapse" id="collapse-${vehicle.id}">
                    <div class="vehicle-details">
                        ${this.renderVehicleDetails(vehicle)}
                    </div>
                </div>
            </div>
        `;
    }

    renderVehicleDetails(vehicle) {
        const imageGallery = vehicle.imageGallery && vehicle.imageGallery.length > 0 ? 
            vehicle.imageGallery.map(img => 
                `<img src="${img}" alt="Fahrzeugbild" class="gallery-image" onclick="app.showImageModal('${img}')">`
            ).join('') : '';

        return `
            <div class="row">
                <div class="col-md-8">
                    <!-- Bildergalerie -->
                    ${imageGallery ? `
                        <div class="mb-3">
                            <h6><i class="bi bi-images"></i> Bildergalerie</h6>
                            <div class="image-gallery">
                                ${imageGallery}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Fahrzeugdaten -->
                    <div class="row">
                        <div class="col-md-6">
                            <h6><i class="bi bi-info-circle"></i> Fahrzeugdaten</h6>
                            <div class="spec-item">
                                <span class="spec-label">Fahrzeugnummer:</span>
                                <span class="spec-value">${this.escapeHtml(vehicle.vehicleNumber)}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Fahrzeugart:</span>
                                <span class="spec-value">${this.escapeHtml(vehicle.vehicleType)}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Erstzulassung:</span>
                                <span class="spec-value">${this.escapeHtml(vehicle.firstRegistration)}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Leistung:</span>
                                <span class="spec-value">${this.escapeHtml(vehicle.power)}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Kraftstoffart:</span>
                                <span class="spec-value">${this.escapeHtml(vehicle.fuelType)}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Getriebe:</span>
                                <span class="spec-value">${this.escapeHtml(vehicle.transmission)}</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6><i class="bi bi-palette"></i> Farben & Ausstattung</h6>
                            <div class="spec-item">
                                <span class="spec-label">Außenfarbe:</span>
                                <span class="spec-value">${this.escapeHtml(vehicle.exteriorColor)}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Innenfarbe:</span>
                                <span class="spec-value">${this.escapeHtml(vehicle.interiorColor)}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Polster:</span>
                                <span class="spec-value">${this.escapeHtml(vehicle.upholstery)}</span>
                            </div>
                            ${vehicle.acceleration ? `
                                <div class="spec-item">
                                    <span class="spec-label">Beschleunigung:</span>
                                    <span class="spec-value">${this.escapeHtml(vehicle.acceleration)}</span>
                                </div>
                            ` : ''}
                            ${vehicle.warranty ? `
                                <div class="spec-item">
                                    <span class="spec-label">Garantie:</span>
                                    <span class="spec-value">${this.escapeHtml(vehicle.warranty)}</span>
                                </div>
                            ` : ''}
                            ${vehicle.electricRange ? `
                                <div class="spec-item">
                                    <span class="spec-label">Elektrische Reichweite:</span>
                                    <span class="spec-value">${this.escapeHtml(vehicle.electricRange)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Detaillierte Ausstattung -->
                    ${this.renderFeatureSections(vehicle)}
                </div>
                
                <div class="col-md-4">
                    <!-- Händler & Entfernung -->
                    <div class="distance-info">
                        <h6><i class="bi bi-geo-alt"></i> Standort</h6>
                        <p class="mb-1"><strong>${this.escapeHtml(vehicle.dealerLocation)}</strong></p>
                        ${vehicle.distanceFromHildesheim ? `
                            <p class="mb-1">
                                <i class="bi bi-signpost"></i> ${vehicle.distanceFromHildesheim} km von Hildesheim
                            </p>
                            ${vehicle.travelTimeFromHildesheim ? `
                                <p class="mb-0">
                                    <i class="bi bi-clock"></i> Fahrtzeit: ${vehicle.travelTimeFromHildesheim}
                                </p>
                            ` : ''}
                        ` : `
                            <button class="btn btn-sm btn-outline-primary" onclick="app.calculateDistance('${vehicle.id}')">
                                <i class="bi bi-calculator"></i> Entfernung berechnen
                            </button>
                        `}
                    </div>
                    
                    <!-- Map placeholder -->
                    <div class="map-container mt-3" id="map-${vehicle.id}"></div>
                    
                    <!-- Links -->
                    <div class="mt-3">
                        <a href="${vehicle.mercedesUrl}" target="_blank" class="btn btn-outline-primary btn-sm w-100">
                            <i class="bi bi-box-arrow-up-right"></i> Mercedes-Benz Seite öffnen
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    renderFeatureSections(vehicle) {
        const sections = [
            { key: 'interior', title: 'Interieur', icon: 'bi-house' },
            { key: 'exterior', title: 'Exterieur', icon: 'bi-car-front' },
            { key: 'infotainment', title: 'Infotainment', icon: 'bi-display' },
            { key: 'safetyTech', title: 'Sicherheit & Technik', icon: 'bi-shield-check' },
            { key: 'packages', title: 'Pakete', icon: 'bi-box' }
        ];

        return sections.map(section => {
            const features = vehicle[section.key];
            if (!features || features.length === 0) return '';

            return `
                <div class="accordion mt-3" id="accordion-${section.key}-${vehicle.id}">
                    <div class="accordion-item">
                        <h2 class="accordion-header">
                            <button class="accordion-button collapsed" type="button" 
                                    data-bs-toggle="collapse" 
                                    data-bs-target="#collapse-${section.key}-${vehicle.id}">
                                <i class="${section.icon} me-2"></i> ${section.title}
                            </button>
                        </h2>
                        <div id="collapse-${section.key}-${vehicle.id}" class="accordion-collapse collapse">
                            <div class="accordion-body">
                                <ul class="feature-list">
                                    ${features.map(feature => `<li>${this.escapeHtml(feature)}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    setupVehicleInteractions() {
        // Setup distance calculation and maps for visible vehicles
        this.vehicles.concat(this.favorites).forEach(vehicle => {
            if (vehicle.distanceFromHildesheim && document.getElementById(`map-${vehicle.id}`)) {
                this.initMap(vehicle);
            }
        });
    }

    async calculateDistance(vehicleId) {
        try {
            const response = await fetch(`/api/distance/calculate/${vehicleId}`, {
                method: 'POST'
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert(`Entfernung berechnet: ${data.distance} km (${data.travelTime})`, 'success');
                this.loadVehicles();
            } else {
                this.showAlert(data.error || 'Fehler bei der Entfernungsberechnung', 'danger');
            }
        } catch (error) {
            console.error('Distance calculation error:', error);
            this.showAlert('Ein Fehler ist aufgetreten', 'danger');
        }
    }

    initMap(vehicle) {
        const mapContainer = document.getElementById(`map-${vehicle.id}`);
        if (!mapContainer || !vehicle.distanceFromHildesheim) return;

        // Simple placeholder for now - you can integrate with Leaflet here
        mapContainer.innerHTML = `
            <div class="d-flex align-items-center justify-content-center h-100 bg-light border rounded">
                <div class="text-center">
                    <i class="bi bi-map" style="font-size: 2rem; color: #ccc;"></i>
                    <br>
                    <small class="text-muted">Karte: ${vehicle.distanceFromHildesheim} km</small>
                </div>
            </div>
        `;
    }

    // Tab switching
    switchTab(tab) {
        this.currentTab = tab;
        
        // Update active tab
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        if (tab === 'home') {
            document.getElementById('homeTab').classList.add('active');
        } else if (tab === 'favorites') {
            document.getElementById('favoritesTab').classList.add('active');
        }
        
        this.renderVehicles();
    }

    updateFavoritesCount() {
        const count = this.favorites.length;
        document.getElementById('favoritesCount').textContent = count;
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    formatNumber(number) {
        return new Intl.NumberFormat('de-DE').format(number);
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.createElement('div');
        alertContainer.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertContainer.style.cssText = 'top: 90px; right: 20px; z-index: 1050; max-width: 400px;';
        alertContainer.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertContainer);
        
        setTimeout(() => {
            if (alertContainer.parentNode) {
                alertContainer.remove();
            }
        }, 5000);
    }

    showImageModal(imageSrc) {
        // Create a simple image modal
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Fahrzeugbild</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img src="${imageSrc}" class="img-fluid" alt="Fahrzeugbild">
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MercedesHelper();
});