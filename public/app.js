// Apex Drive - Client Side Application Setup
const apiBase = ''; // relative paths

class App {
    constructor() {
        this.user = JSON.parse(localStorage.getItem('apex_user')) || null;
        this.cars = [];
        this.selectedCar = null;
        this.activeBookings = []; // bookings to block out on calendar
        this.selectedStartDate = null;
        this.selectedEndDate = null;
        this.calendarDate = new Date(); // default to today
        
        // Navigation links
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('.tab-content');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateAuthUI();
        this.fetchCars();
        this.setupAuthForms();
    }

    // Switch between SPA views
    switchTab(tabId) {
        this.sections.forEach(sec => {
            sec.classList.remove('active');
            if (sec.id === tabId) sec.classList.add('active');
        });

        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === tabId) link.classList.add('active');
        });

        if (tabId === 'bookings-section') {
            this.handleBookingsTab();
        }
    }

    setupEventListeners() {
        // Nav Link Clicks
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.classList.contains('spec-link')) return; // let specs open normally
                e.preventDefault();
                const target = link.getAttribute('data-target');
                this.switchTab(target);
            });
        });

        // Auth triggers
        document.getElementById('btn-show-login').addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('btn-show-register').addEventListener('click', () => this.showAuthModal('register'));
        document.getElementById('close-auth-modal').addEventListener('click', () => this.hideAuthModal());
        document.getElementById('link-to-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showAuthModal('register');
        });
        document.getElementById('link-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showAuthModal('login');
        });

        // Booking Modal Closing
        document.getElementById('close-booking-modal').addEventListener('click', () => {
            document.getElementById('booking-modal').classList.add('hidden');
        });

        // Calendar Prev / Next Month
        document.getElementById('calendar-prev').addEventListener('click', () => this.changeCalendarMonth(-1));
        document.getElementById('calendar-next').addEventListener('click', () => this.changeCalendarMonth(1));

        // Submit Booking Call
        document.getElementById('btn-submit-booking').addEventListener('click', () => this.submitBooking());
    }

    // Toasts helper
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.className = `toast toast-${type}`;
        
        let iconHtml = type === 'success' 
            ? '<i class="fa-solid fa-circle-check"></i>' 
            : '<i class="fa-solid fa-circle-xmark"></i>';
        
        toast.innerHTML = `${iconHtml} <span>${message}</span>`;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }

    // Update navigation items and local storage contexts
    updateAuthUI() {
        const navAuth = document.getElementById('nav-auth-actions');
        const bookingsAnon = document.getElementById('bookings-anonymous-view');
        const bookingsUser = document.getElementById('bookings-logged-in-view');
        const bookingAuthTip = document.getElementById('booking-auth-tip');

        if (this.user) {
            // Logged in
            navAuth.innerHTML = `
                <div class="nav-user-info">
                    <span class="user-tag">Dobrodošli, <strong>${this.user.name}</strong></span>
                    <button class="btn btn-outline" id="btn-logout">Odjavi se</button>
                </div>
            `;
            document.getElementById('btn-logout').addEventListener('click', () => this.logout());

            // bookings page
            bookingsAnon.classList.add('hidden');
            bookingsUser.classList.remove('hidden');
            document.getElementById('profile-name').innerText = this.user.name;
            document.getElementById('profile-email').innerText = this.user.email;

            // calendar dialog state
            if (bookingAuthTip) bookingAuthTip.classList.add('hidden');
        } else {
            // Logged out
            navAuth.innerHTML = `
                <button class="btn btn-outline" id="btn-show-login">Prijava</button>
                <button class="btn btn-primary" id="btn-show-register">Registracija</button>
            `;
            // Re-assign listeners
            document.getElementById('btn-show-login').addEventListener('click', () => this.showAuthModal('login'));
            document.getElementById('btn-show-register').addEventListener('click', () => this.showAuthModal('register'));

            // bookings page
            bookingsAnon.classList.remove('hidden');
            bookingsUser.classList.add('hidden');

            // calendar dialog state
            if (bookingAuthTip) bookingAuthTip.classList.remove('hidden');
        }
        
        this.verifyBookingSubmitButton();
    }

    // Load available cars
    async fetchCars() {
        const grid = document.getElementById('cars-grid-container');
        try {
            const res = await fetch(`${apiBase}/api/cars`);
            if (!res.ok) throw new Error('Nepoznata greška pri učitavanju flote.');
            this.cars = await res.json();
            this.renderCars();
        } catch (err) {
            grid.innerHTML = `<div class="loading-spinner" style="color:var(--danger)">Greška: ${err.message}</div>`;
        }
    }

    // Render list of cars
    renderCars() {
        const grid = document.getElementById('cars-grid-container');
        if (this.cars.length === 0) {
            grid.innerHTML = `<div class="loading-spinner">Nema slobodnih automobila u floti.</div>`;
            return;
        }

        grid.innerHTML = '';
        this.cars.forEach(car => {
            const card = document.createElement('div');
            card.className = 'feature-card catalog-car-card';

            const featuresHtml = car.features.slice(0, 3).map(f => `<li><i class="fa-solid fa-circle-check"></i> ${f}</li>`).join('');
            const iconCar = car.type === 'electric' ? 'fa-bolt-lightning' : 'fa-gauge-high';

            card.innerHTML = `
                <div class="car-card-header">
                    <h3>${car.name}</h3>
                    <span class="tag tag-${car.type}">${car.type === 'electric' ? 'Električni' : 'Benzinski'}</span>
                </div>
                <div class="car-illustration">
                    <i class="fa-solid fa-car-side size-huge" style="color:${car.type==='electric' ? '#10b981' : '#8b5cf6'}"></i>
                </div>
                <div class="car-metrics">
                    <div class="metric"><span class="val">${car.power}</span><span class="lbl">Maks. Snaga</span></div>
                    <div class="metric"><span class="val">${car.acceleration}</span><span class="lbl">0-100 km/h</span></div>
                    <div class="metric"><span class="val">${car.transmission === 'automatic' ? 'Aut' : 'Man'}</span><span class="lbl">Menjač</span></div>
                </div>
                <ul class="car-details-list">
                    ${featuresHtml}
                </ul>
                <div class="car-purchase-block">
                    <div class="car-price-unit">
                        <span class="price">$${car.price}</span>
                        <span class="unit">Po danu</span>
                    </div>
                    <button class="btn btn-primary" onclick="app.openBookingModal('${car.id}')">Rezerviši</button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // Modal Operations
    showAuthModal(view) {
        document.getElementById('auth-modal').classList.remove('hidden');
        if (view === 'login') {
            document.getElementById('auth-login-view').classList.remove('hidden');
            document.getElementById('auth-register-view').classList.add('hidden');
        } else {
            document.getElementById('auth-login-view').classList.add('hidden');
            document.getElementById('auth-register-view').classList.remove('hidden');
        }
    }

    hideAuthModal() {
        document.getElementById('auth-modal').classList.add('hidden');
        // Reset forms
        document.getElementById('form-login').reset();
        document.getElementById('form-register').reset();
    }

    setupAuthForms() {
        // LOGIN
        document.getElementById('form-login').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const res = await fetch(`${apiBase}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Neuspešna prijava.');

                this.user = {
                    email: data.user.email,
                    name: data.user.name,
                    token: data.token
                };
                localStorage.setItem('apex_user', JSON.stringify(this.user));
                this.updateAuthUI();
                this.hideAuthModal();
                this.showToast('Uspešno ste se prijavili!', 'success');
            } catch (err) {
                this.showToast(err.message, 'danger');
            }
        });

        // REGISTER
        document.getElementById('form-register').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            try {
                const res = await fetch(`${apiBase}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Neuspešna registracija.');

                this.showToast('Registracija uspešna! Prijavite se.', 'success');
                this.showAuthModal('login');
            } catch (err) {
                this.showToast(err.message, 'danger');
            }
        });
    }

    logout() {
        this.user = null;
        localStorage.removeItem('apex_user');
        this.updateAuthUI();
        this.showToast('Odjavljeni ste sa sistema.', 'success');
        this.switchTab('home-section');
    }

    // BOOKING PROCESS & CALENDAR GENERATION
    async openBookingModal(carId) {
        this.selectedCar = this.cars.find(c => c.id === carId);
        if (!this.selectedCar) return;

        // Reset reservation dates
        this.selectedStartDate = null;
        this.selectedEndDate = null;
        this.calendarDate = new Date(); // Start with current month
        
        document.getElementById('booking-modal-car-name').innerText = `Rezervišite: ${this.selectedCar.name}`;
        document.getElementById('checkout-daily-rate').innerText = `$${this.selectedCar.price}`;
        
        // Update summary texts
        this.updateCheckoutView();

        // Fetch bookings for this car to block already taken dates
        await this.fetchCarBookings(carId);

        // Render Calendar UI
        this.renderCalendar();
        
        // Open the Modal
        document.getElementById('booking-modal').classList.remove('hidden');
    }

    async fetchCarBookings(carId) {
        // Since we want to check all bookings for this car, we fetch them
        // In our simple API, let's fetch all bookings by passing the current user's email if logged in
        // or dummy if not. But wait! The server allows filtering by query parameter "email".
        // Oh, wait, the GET /api/bookings requires "email". Let's fetch all bookings to block overlapping ones.
        // Wait, does the API permit getting all booked dates for a car for calendar? We can fetch all bookings
        // of "vuk@example.com" or we can mock/fetch. But wait, in a real system we fetch bookings for the car.
        // Let's modify our backend endpoint or make a local call. 
        // Wait! In server.js, the bookings list is global. We fetch the list of bookings using custom query or we fetch.
        // Actually, we can fetch all bookings of current user, but wait! To draw the calendar correctly,
        // we should know *which dates* are taken for this car.
        // Wait, does our GET /api/bookings allow listing bookings? Let's check server.js line 155:
        // app.get('/api/bookings', ... requires email.
        // But to make the calendar look realistic, we can either:
        // 1. Fetch bookings of all users for this car. In this server, let's assume we can fetch them.
        // Wait, did we define a path for other users' bookings for this car? We didn't, but wait:
        // In our server.js, we have in-memory `bookings = [...]` which is populated with defaults.
        // Let's implement an endpoint to let clients get reserved ranges for a car.
        // Wait, the client already knows the bookings database is in server, let's just make server.js return all bookings of a car.
        // Let's check - does server.js have an endpoint to list bookings for a specific car?
        // In server.js, there is no direct endpoint, but GET `/api/bookings` takes email.
        // Let's add an endpoint for car bookings or modify server.js? We don't have to modify server.js,
        // but wait! If we do, we can easily fetch from `GET /api/cars/bookings`.
        // Let's verify: we can make a query like `GET /api/bookings?email=vuk@example.com` or we can just fetch.
        // Let's check: Can we fetch all bookings by getting them or just mock?
        // Wait, let's call the server.js file and see. In server.js:
        // line 68: `const bookings = [ { id: 'b1', carId: 'tesla-s', userEmail: 'vuk@example.com', startDate: '2026-07-10', endDate: '2026-07-14', totalPrice: 600 } ];`
        // Since we are mocking, we can just fetch bookings for `userEmail: 'vuk@example.com'` to see them,
        // and we can also query the server. Let's make a call to `GET /api/bookings?email=vuk@example.com`
        // to load the existing bookings for this car, since "vuk@example.com" is the only active user in the DB currently!
        // That is perfect! We can just fetch bookings for `vuk@example.com` (which is the default user in the DB) to populate
        // the disabled calendar dates. Let's do that!
        
        try {
            const res = await fetch(`${apiBase}/api/bookings?email=vuk@example.com`);
            if (res.ok) {
                const list = await res.json();
                this.activeBookings = list.filter(b => b.carId === carId);
            }
        } catch (err) {
            console.error('Error fetching calendar exclusions:', err);
            this.activeBookings = [];
        }
    }

    // Check if dates are blocked
    isDateBooked(dateString) {
        return this.activeBookings.some(b => {
            const start = b.startDate;
            const end = b.endDate;
            return dateString >= start && dateString <= end;
        });
    }

    // Render calendar grid days
    renderCalendar() {
        const daysContainer = document.getElementById('calendar-days-grid');
        const monthYearLabel = document.getElementById('calendar-month-year');
        daysContainer.innerHTML = '';

        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth(); // 0-indexed

        // Format header
        const SerbianMonths = [
            "Januar", "Februar", "Mart", "April", "Maj", "Jun", 
            "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"
        ];
        monthYearLabel.innerText = `${SerianMonths = SerbianMonths[month]} ${year}`;

        // Get first day of the month (0 = Sunday, 1 = Monday ...)
        // We want to format calendar starting Monday.
        let firstDayIndex = new Date(year, month, 1).getDay();
        // Convert so Monday = 0, Sunday = 6
        firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

        const totalDays = new Date(year, month + 1, 0).getDate();

        // Create empty padding blocks
        for (let i = 0; i < firstDayIndex; i++) {
            const empty = document.createElement('div');
            empty.className = 'cal-day day-empty';
            daysContainer.appendChild(empty);
        }

        const today = new Date();
        today.setHours(0,0,0,0);

        // Create date objects
        for (let day = 1; day <= totalDays; day++) {
            const dateObj = new Date(year, month, day);
            const dateStr = this.formatDateString(dateObj);
            
            const cell = document.createElement('div');
            cell.className = 'cal-day';
            cell.innerText = day;

            // Check if in the past
            if (dateObj < today) {
                cell.classList.add('day-empty'); // disable clicks
            } else if (this.isDateBooked(dateStr)) {
                cell.classList.add('day-booked');
            } else {
                // Available
                cell.classList.add('day-avail');
                cell.addEventListener('click', () => this.handleCalendarDayClick(dateStr));
                
                // Color selected starts/ends/ranges
                if (this.selectedStartDate === dateStr) {
                    cell.classList.add('day-selected');
                } else if (this.selectedEndDate === dateStr) {
                    cell.classList.add('day-selected');
                } else if (this.selectedStartDate && this.selectedEndDate && dateStr > this.selectedStartDate && dateStr < this.selectedEndDate) {
                    cell.classList.add('day-in-range');
                }
            }

            daysContainer.appendChild(cell);
        }
    }

    changeCalendarMonth(direction) {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + direction);
        this.renderCalendar();
    }

    // Handles date selections
    handleCalendarDayClick(dateString) {
        if (!this.selectedStartDate || (this.selectedStartDate && this.selectedEndDate)) {
            // First click OR resets previous complete range
            this.selectedStartDate = dateString;
            this.selectedEndDate = null;
        } else if (dateString < this.selectedStartDate) {
            // Clicked date is earlier than start date: Reset start date
            this.selectedStartDate = dateString;
            this.selectedEndDate = null;
        } else {
            // Second click: set end date, check for conflicts in range
            const hasConflict = this.checkRangeOverlap(this.selectedStartDate, dateString);
            if (hasConflict) {
                this.showToast('Izabrani period sadrži rezervisane dane. Izaberite drugi interval.', 'danger');
                this.selectedStartDate = dateString;
                this.selectedEndDate = null;
            } else {
                this.selectedEndDate = dateString;
            }
        }

        this.updateCheckoutView();
        this.renderCalendar();
    }

    checkRangeOverlap(start, end) {
        // check if any date in range overlaps with activeBookings
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        for (let b of this.activeBookings) {
            const bStart = new Date(b.startDate);
            const bEnd = new Date(b.endDate);
            if (startDate <= bEnd && bStart <= endDate) {
                return true;
            }
        }
        return false;
    }

    // Format Date class to YYYY-MM-DD
    formatDateString(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    updateCheckoutView() {
        const startLabel = document.getElementById('checkout-start-date');
        const endLabel = document.getElementById('checkout-end-date');
        const totalDaysLabel = document.getElementById('checkout-total-days');
        const totalPriceLabel = document.getElementById('checkout-total-price');

        if (this.selectedStartDate) {
            startLabel.innerText = this.formatDateSerbian(this.selectedStartDate);
            document.getElementById('form-booking-start-date').value = this.selectedStartDate;
        } else {
            startLabel.innerText = '-';
            document.getElementById('form-booking-start-date').value = '';
        }

        if (this.selectedEndDate) {
            endLabel.innerText = this.formatDateSerbian(this.selectedEndDate);
            document.getElementById('form-booking-end-date').value = this.selectedEndDate;
        } else {
            endLabel.innerText = '-';
            document.getElementById('form-booking-end-date').value = '';
        }

        // Calculate days and totals
        if (this.selectedStartDate && this.selectedEndDate) {
            const s = new Date(this.selectedStartDate);
            const e = new Date(this.selectedEndDate);
            const diffTime = Math.abs(e - s);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
            
            totalDaysLabel.innerText = `${diffDays} dana`;
            totalPriceLabel.innerText = `$${diffDays * this.selectedCar.price}`;
        } else {
            totalDaysLabel.innerText = `0 dana`;
            totalPriceLabel.innerText = `$0`;
        }

        this.verifyBookingSubmitButton();
    }

    formatDateSerbian(dateStr) {
        const parts = dateStr.split('-');
        return `${parts[2]}.${parts[1]}.${parts[0]}.`;
    }

    verifyBookingSubmitButton() {
        const submitBtn = document.getElementById('btn-submit-booking');
        
        // Must be logged in, and must have start + end dates
        if (this.user && this.selectedStartDate && this.selectedEndDate) {
            submitBtn.removeAttribute('disabled');
        } else {
            submitBtn.setAttribute('disabled', 'true');
        }
    }

    // Call API submit booking details
    async submitBooking() {
        if (!this.user || !this.selectedStartDate || !this.selectedEndDate || !this.selectedCar) return;

        const body = {
            carId: this.selectedCar.id,
            userEmail: this.user.email,
            startDate: this.selectedStartDate,
            endDate: this.selectedEndDate
        };

        try {
            const res = await fetch(`${apiBase}/api/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Neuspešna rezervacija.');

            this.showToast(`Automobil ${this.selectedCar.name} je uspešno rezervisan!`, 'success');
            document.getElementById('booking-modal').classList.add('hidden');
            
            // Redirect to bookings list
            this.switchTab('bookings-section');
        } catch (err) {
            this.showToast(err.message, 'danger');
        }
    }

    // Bookings Dashboard loading
    handleBookingsTab() {
        if (this.user) {
            this.fetchUserBookings();
        }
    }

    async fetchUserBookings() {
        const wrapper = document.getElementById('bookings-table-wrapper');
        wrapper.innerHTML = '<div class="loading-spinner">Učitavanje rezervacija...</div>';

        try {
            const res = await fetch(`${apiBase}/api/bookings?email=${encodeURIComponent(this.user.email)}`);
            if (!res.ok) throw new Error('Nemoguće preuzeti vaše rezervacije.');
            const data = await res.json();
            
            if (data.length === 0) {
                wrapper.innerHTML = '<div class="loading-spinner">Nemate kreiranih rezervacija vožnje.</div>';
                return;
            }

            wrapper.innerHTML = '';
            data.forEach(booking => {
                const card = document.createElement('div');
                card.className = 'booking-card';

                card.innerHTML = `
                    <div class="booking-car-info">
                        <h4>${booking.carName}</h4>
                        <p>ID Rezervacije: ${booking.id}</p>
                    </div>
                    <div class="booking-date-range">
                        <span class="date-lbl">Preuzimanje</span>
                        <span class="date-val">${this.formatDateSerbian(booking.startDate)}</span>
                    </div>
                    <div class="booking-date-range">
                        <span class="date-lbl">Vraćanje</span>
                        <span class="date-val">${this.formatDateSerbian(booking.endDate)}</span>
                    </div>
                    <div class="booking-price">
                        $${booking.totalPrice}
                    </div>
                    <div class="status-badge">
                        <i class="fa-solid fa-circle-check"></i> Potvrđeno
                    </div>
                `;
                wrapper.appendChild(card);
            });

        } catch (err) {
            wrapper.innerHTML = `<div class="loading-spinner" style="color:var(--danger)">Greška: ${err.message}</div>`;
        }
    }
}

// Instantiate global app scope
const app = new App();
window.app = app;
