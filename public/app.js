const apiBase = '';

class App {

    constructor() {

        this.user =
            JSON.parse(
                localStorage.getItem('apex_user')
            ) || null;

        this.cars = [];

        this.selectedCar = null;

        this.activeBookings = [];

        this.selectedStartDate = null;

        this.selectedEndDate = null;

        this.calendarDate = new Date();

        this.navLinks =
            document.querySelectorAll('.nav-link');

        this.sections =
            document.querySelectorAll('.tab-content');

        this.init();
    }


    // =====================================================
    // INIT
    // =====================================================

    init() {

        this.setupEventListeners();

        this.updateAuthUI();

        this.fetchCars();

        this.setupAuthForms();
    }


    // =====================================================
    // NAVIGACIJA
    // =====================================================

    switchTab(tabId) {

        this.sections.forEach(section => {

            section.classList.remove('active');

            if (section.id === tabId) {

                section.classList.add('active');
            }
        });


        this.navLinks.forEach(link => {

            link.classList.remove('active');

            if (
                link.getAttribute('data-target') ===
                tabId
            ) {

                link.classList.add('active');
            }
        });


        if (tabId === 'bookings-section') {

            this.handleBookingsTab();
        }
    }


    setupEventListeners() {

        this.navLinks.forEach(link => {

            link.addEventListener(
                'click',
                e => {

                    if (
                        link.classList.contains(
                            'spec-link'
                        )
                    ) {

                        return;
                    }

                    e.preventDefault();

                    const target =
                        link.getAttribute(
                            'data-target'
                        );

                    this.switchTab(target);
                }
            );
        });


        const loginButton =
            document.getElementById(
                'btn-show-login'
            );

        if (loginButton) {

            loginButton.addEventListener(
                'click',
                () =>
                    this.showAuthModal('login')
            );
        }


        const registerButton =
            document.getElementById(
                'btn-show-register'
            );

        if (registerButton) {

            registerButton.addEventListener(
                'click',
                () =>
                    this.showAuthModal('register')
            );
        }


        document
            .getElementById(
                'close-auth-modal'
            )
            .addEventListener(
                'click',
                () =>
                    this.hideAuthModal()
            );


        document
            .getElementById(
                'link-to-register'
            )
            .addEventListener(
                'click',
                e => {

                    e.preventDefault();

                    this.showAuthModal(
                        'register'
                    );
                }
            );


        document
            .getElementById(
                'link-to-login'
            )
            .addEventListener(
                'click',
                e => {

                    e.preventDefault();

                    this.showAuthModal(
                        'login'
                    );
                }
            );


        document
            .getElementById(
                'close-booking-modal'
            )
            .addEventListener(
                'click',
                () => {

                    document
                        .getElementById(
                            'booking-modal'
                        )
                        .classList.add(
                            'hidden'
                        );
                }
            );


        document
            .getElementById(
                'calendar-prev'
            )
            .addEventListener(
                'click',
                () =>
                    this.changeCalendarMonth(-1)
            );


        document
            .getElementById(
                'calendar-next'
            )
            .addEventListener(
                'click',
                () =>
                    this.changeCalendarMonth(1)
            );


        document
            .getElementById(
                'btn-submit-booking'
            )
            .addEventListener(
                'click',
                () =>
                    this.submitBooking()
            );
    }


    // =====================================================
    // TOAST
    // =====================================================

    showToast(
        message,
        type = 'success'
    ) {

        const toast =
            document.getElementById('toast');

        toast.className =
            `toast toast-${type}`;

        const icon =
            type === 'success'
                ? '<i class="fa-solid fa-circle-check"></i>'
                : '<i class="fa-solid fa-circle-xmark"></i>';

        toast.innerHTML =
            `${icon} <span>${message}</span>`;

        toast.classList.remove('hidden');

        setTimeout(() => {

            toast.classList.add('hidden');

        }, 4000);
    }


    // =====================================================
    // AUTH UI
    // =====================================================

    updateAuthUI() {

        const navAuth =
            document.getElementById(
                'nav-auth-actions'
            );

        const bookingsAnon =
            document.getElementById(
                'bookings-anonymous-view'
            );

        const bookingsUser =
            document.getElementById(
                'bookings-logged-in-view'
            );

        const bookingAuthTip =
            document.getElementById(
                'booking-auth-tip'
            );


        if (this.user) {

            navAuth.innerHTML = `

                <div class="nav-user-info">

                    <span class="user-tag">

                        Dobrodošli,

                        <strong>
                            ${this.user.name}
                        </strong>

                    </span>


                    <button
                        class="btn btn-outline"
                        id="btn-logout">

                        Odjavi se

                    </button>

                </div>
            `;


            document
                .getElementById(
                    'btn-logout'
                )
                .addEventListener(
                    'click',
                    () =>
                        this.logout()
                );


            bookingsAnon.classList.add(
                'hidden'
            );

            bookingsUser.classList.remove(
                'hidden'
            );


            document
                .getElementById(
                    'profile-name'
                )
                .innerText =
                this.user.name;


            document
                .getElementById(
                    'profile-email'
                )
                .innerText =
                this.user.email;


            if (bookingAuthTip) {

                bookingAuthTip.classList.add(
                    'hidden'
                );
            }

        } else {

            navAuth.innerHTML = `

                <button
                    class="btn btn-outline"
                    id="btn-show-login">

                    Prijava

                </button>


                <button
                    class="btn btn-primary"
                    id="btn-show-register">

                    Registracija

                </button>
            `;


            document
                .getElementById(
                    'btn-show-login'
                )
                .addEventListener(
                    'click',
                    () =>
                        this.showAuthModal(
                            'login'
                        )
                );


            document
                .getElementById(
                    'btn-show-register'
                )
                .addEventListener(
                    'click',
                    () =>
                        this.showAuthModal(
                            'register'
                        )
                );


            bookingsAnon.classList.remove(
                'hidden'
            );

            bookingsUser.classList.add(
                'hidden'
            );


            if (bookingAuthTip) {

                bookingAuthTip.classList.remove(
                    'hidden'
                );
            }
        }


        this.verifyBookingSubmitButton();
    }


    // =====================================================
    // UČITAVANJE VOZILA
    // =====================================================

    async fetchCars() {

        const grid =
            document.getElementById(
                'cars-grid-container'
            );

        try {

            const res =
                await fetch(
                    `${apiBase}/api/cars`
                );


            if (!res.ok) {

                throw new Error(
                    'Greška pri učitavanju vozila.'
                );
            }


            this.cars =
                await res.json();


            this.renderCars();

        } catch (err) {

            grid.innerHTML = `

                <div
                    class="loading-spinner"
                    style="color:var(--danger)"
                >

                    Greška:
                    ${err.message}

                </div>
            `;
        }
    }


    // =====================================================
    // PRIKAZ VOZILA
    // =====================================================

    renderCars() {

        const grid =
            document.getElementById(
                'cars-grid-container'
            );


        if (!this.cars.length) {

            grid.innerHTML = `

                <div class="loading-spinner">

                    Nema vozila u voznom parku.

                </div>
            `;

            return;
        }


        const standardCars =
            this.cars.filter(
                car =>
                    car.class === 'standard'
            );


        const premiumCars =
            this.cars.filter(
                car =>
                    car.class === 'premium'
            );


        grid.innerHTML = '';


        // STANDARD

        const standardTitle =
            document.createElement(
                'div'
            );

        standardTitle.className =
            'fleet-category standard-category';

        standardTitle.innerHTML = `

            <div class="fleet-category-header">

                <div>

                    <span class="category-label">

                        DOSTUPNA KLASA

                    </span>

                    <h3>
                        Standard
                    </h3>

                    <p>

                        Pouzdani i udobni automobili
                        za svakodnevnu vožnju.

                    </p>

                </div>


                <div class="category-icon">

                    <i class="fa-solid fa-car"></i>

                </div>

            </div>
        `;


        grid.appendChild(
            standardTitle
        );


        standardCars.forEach(
            car => {

                grid.appendChild(
                    this.createCarCard(car)
                );
            }
        );


        // PREMIUM

        const premiumTitle =
            document.createElement(
                'div'
            );

        premiumTitle.className =
            'fleet-category premium-category';

        premiumTitle.innerHTML = `

            <div class="fleet-category-header">

                <div>

                    <span class="category-label">

                        VIŠA KLASA

                    </span>

                    <h3>
                        Premium
                    </h3>

                    <p>

                        Luksuz, performanse i
                        vrhunska udobnost.

                    </p>

                </div>


                <div class="category-icon">

                    <i class="fa-solid fa-crown"></i>

                </div>

            </div>
        `;


        grid.appendChild(
            premiumTitle
        );


        premiumCars.forEach(
            car => {

                grid.appendChild(
                    this.createCarCard(car)
                );
            }
        );
    }


    // =====================================================
    // KARTICA AUTOMOBILA
    // =====================================================

    createCarCard(car) {

        const card =
            document.createElement(
                'div'
            );


        card.className =
            `car-card-new ${car.class}-car`;


        const features =
            Array.isArray(car.features)
                ? car.features
                : [];


        const featuresHtml =
            features
                .slice(0, 4)
                .map(
                    feature => `

                        <li>

                            <i
                                class="fa-solid fa-check">
                            </i>

                            ${feature}

                        </li>
                    `
                )
                .join('');


        const className =
            car.class === 'premium'
                ? 'PREMIUM'
                : 'STANDARD';


        const classIcon =
            car.class === 'premium'
                ? 'fa-crown'
                : 'fa-car';


        card.innerHTML = `

            <div class="car-image-wrapper">

                <img
                    src="${car.image}"
                    alt="${car.name}"
                    class="car-image"
                    onerror="
                        this.src='/images/car-placeholder.jpg'
                    "
                >


                <div class="car-class-badge">

                    <i
                        class="fa-solid ${classIcon}">
                    </i>

                    ${className}

                </div>

            </div>


            <div class="car-card-content">

                <div class="car-title-row">

                    <div>

                        <h3>
                            ${car.name}
                        </h3>


                        <span class="car-type">

                            ${
                                car.type ===
                                'electric'

                                    ? 'Električni'

                                    : 'Benzin'
                            }

                        </span>

                    </div>

                </div>


                <p class="car-description">

                    ${car.description}

                </p>


                <div class="car-specs">

                    <div class="car-spec">

                        <i
                            class="fa-solid fa-gauge-high">
                        </i>

                        <span>

                            <strong>
                                ${car.power}
                            </strong>

                            Snaga

                        </span>

                    </div>


                    <div class="car-spec">

                        <i
                            class="fa-solid fa-bolt">
                        </i>

                        <span>

                            <strong>
                                ${car.acceleration}
                            </strong>

                            0-100 km/h

                        </span>

                    </div>


                    <div class="car-spec">

                        <i
                            class="fa-solid fa-gears">
                        </i>

                        <span>

                            <strong>

                                ${
                                    car.transmission ===
                                    'automatic'

                                        ? 'Automatski'

                                        : 'Manuelni'
                                }

                            </strong>

                            Menjač

                        </span>

                    </div>

                </div>


                <ul class="car-features">

                    ${featuresHtml}

                </ul>


                <div class="car-bottom">

                    <div class="car-price">

                        <span class="price-label">
                            Od
                        </span>

                        <strong>

                            ${this.formatPrice(
                                car.price
                            )}

                        </strong>

                        <span class="price-unit">

                            RSD / dan

                        </span>

                    </div>


                    <button
                        class="btn btn-primary reserve-btn"
                        onclick="
                            app.openBookingModal(
                                '${car.id}'
                            )
                        "
                    >

                        Rezerviši

                        <i
                            class="fa-solid fa-arrow-right">
                        </i>

                    </button>

                </div>


                <div class="monthly-price">

                    <i
                        class="fa-solid fa-calendar-days">
                    </i>

                    Mesečni najam:

                    <strong>

                        ${this.formatPrice(
                            car.monthlyPrice
                        )}

                        RSD

                    </strong>

                </div>

            </div>
        `;


        return card;
    }


    // =====================================================
    // FORMAT CENE
    // =====================================================

    formatPrice(price) {

        return new Intl.NumberFormat(
            'sr-RS'
        ).format(
            Number(price) || 0
        );
    }


    // =====================================================
    // AUTH MODAL
    // =====================================================

    showAuthModal(view) {

        document
            .getElementById(
                'auth-modal'
            )
            .classList.remove(
                'hidden'
            );


        if (view === 'login') {

            document
                .getElementById(
                    'auth-login-view'
                )
                .classList.remove(
                    'hidden'
                );

            document
                .getElementById(
                    'auth-register-view'
                )
                .classList.add(
                    'hidden'
                );

        } else {

            document
                .getElementById(
                    'auth-login-view'
                )
                .classList.add(
                    'hidden'
                );

            document
                .getElementById(
                    'auth-register-view'
                )
                .classList.remove(
                    'hidden'
                );
        }
    }


    hideAuthModal() {

        document
            .getElementById(
                'auth-modal'
            )
            .classList.add(
                'hidden'
            );


        document
            .getElementById(
                'form-login'
            )
            .reset();


        document
            .getElementById(
                'form-register'
            )
            .reset();
    }


    // =====================================================
    // LOGIN / REGISTER
    // =====================================================

    setupAuthForms() {

        // LOGIN

        document
            .getElementById(
                'form-login'
            )
            .addEventListener(
                'submit',
                async e => {

                    e.preventDefault();


                    const email =
                        document
                            .getElementById(
                                'login-email'
                            )
                            .value
                            .trim();


                    const password =
                        document
                            .getElementById(
                                'login-password'
                            )
                            .value;


                    try {

                        const res =
                            await fetch(
                                `${apiBase}/api/auth/login`,
                                {
                                    method:
                                        'POST',

                                    headers: {
                                        'Content-Type':
                                            'application/json'
                                    },

                                    body:
                                        JSON.stringify({
                                            email,
                                            password
                                        })
                                }
                            );


                        const data =
                            await res.json();


                        if (!res.ok) {

                            throw new Error(
                                data.error ||
                                'Neuspešna prijava.'
                            );
                        }


                        this.user = {

                            id:
                                data.user.id,

                            email:
                                data.user.email,

                            name:
                                data.user.name,

                            token:
                                data.token
                        };


                        localStorage.setItem(
                            'apex_user',
                            JSON.stringify(
                                this.user
                            )
                        );


                        this.updateAuthUI();

                        this.hideAuthModal();


                        this.showToast(
                            'Uspešno ste se prijavili!'
                        );

                    } catch (err) {

                        this.showToast(
                            err.message,
                            'danger'
                        );
                    }
                }
            );


        // REGISTER

        document
            .getElementById(
                'form-register'
            )
            .addEventListener(
                'submit',
                async e => {

                    e.preventDefault();


                    const name =
                        document
                            .getElementById(
                                'register-name'
                            )
                            .value
                            .trim();


                    const email =
                        document
                            .getElementById(
                                'register-email'
                            )
                            .value
                            .trim();


                    const password =
                        document
                            .getElementById(
                                'register-password'
                            )
                            .value;


                    try {

                        const res =
                            await fetch(
                                `${apiBase}/api/auth/register`,
                                {
                                    method:
                                        'POST',

                                    headers: {
                                        'Content-Type':
                                            'application/json'
                                    },

                                    body:
                                        JSON.stringify({
                                            name,
                                            email,
                                            password
                                        })
                                }
                            );


                        const data =
                            await res.json();


                        if (!res.ok) {

                            throw new Error(
                                data.error ||
                                'Neuspešna registracija.'
                            );
                        }


                        this.showToast(
                            'Registracija uspešna! Prijavite se.'
                        );


                        this.showAuthModal(
                            'login'
                        );

                    } catch (err) {

                        this.showToast(
                            err.message,
                            'danger'
                        );
                    }
                }
            );
    }


    // =====================================================
    // LOGOUT
    // =====================================================

    logout() {

        this.user = null;

        localStorage.removeItem(
            'apex_user'
        );

        this.updateAuthUI();

        this.showToast(
            'Odjavljeni ste sa sistema.'
        );

        this.switchTab(
            'home-section'
        );
    }


    // =====================================================
    // BOOKING MODAL
    // =====================================================

    async openBookingModal(carId) {

        this.selectedCar =
            this.cars.find(
                car =>
                    car.id === carId
            );


        if (!this.selectedCar) {

            this.showToast(
                'Automobil nije pronađen.',
                'danger'
            );

            return;
        }


        this.selectedStartDate = null;

        this.selectedEndDate = null;

        this.calendarDate =
            new Date();


        document
            .getElementById(
                'booking-modal-car-name'
            )
            .innerText =
            `Rezervišite: ${this.selectedCar.name}`;


        document
            .getElementById(
                'checkout-daily-rate'
            )
            .innerText =
            `${this.formatPrice(
                this.selectedCar.price
            )} RSD`;


        this.updateCheckoutView();


        await this.fetchCarBookings(
            carId
        );


        this.renderCalendar();


        document
            .getElementById(
                'booking-modal'
            )
            .classList.remove(
                'hidden'
            );
    }


    // =====================================================
    // UČITAVANJE REZERVACIJA ZA AUTOMOBIL
    // =====================================================

    async fetchCarBookings(carId) {

        this.activeBookings = [];


        if (!this.user) {

            return;
        }


        try {

            const res =
                await fetch(
                    `${apiBase}/api/bookings?email=${encodeURIComponent(
                        this.user.email
                    )}`
                );


            if (!res.ok) {

                throw new Error(
                    'Greška pri učitavanju rezervacija.'
                );
            }


            const list =
                await res.json();


            this.activeBookings =
                list.filter(
                    booking =>
                        booking.carId ===
                        carId
                );

        } catch (err) {

            console.error(
                'Greška pri učitavanju rezervacija:',
                err
            );

            this.activeBookings = [];
        }
    }


    // =====================================================
    // NORMALIZACIJA DATUMA
    // =====================================================

    normalizeDate(dateValue) {

        if (!dateValue) {

            return '';
        }


        // PostgreSQL može vratiti:
        // 2026-08-31T22:00:00.000Z
        //
        // Nama treba:
        // 2026-09-01

        if (
            typeof dateValue === 'string' &&
            dateValue.includes('T')
        ) {

            const date =
                new Date(dateValue);


            if (!Number.isNaN(
                date.getTime()
            )) {

                return this.formatDateString(
                    date
                );
            }
        }


        return String(
            dateValue
        ).substring(
            0,
            10
        );
    }


    // =====================================================
    // PROVERA DA LI JE DAN REZERVISAN
    // =====================================================

    isDateBooked(dateString) {

        return this.activeBookings.some(
            booking => {

                const bookingStart =
                    this.normalizeDate(
                        booking.startDate
                    );


                const bookingEnd =
                    this.normalizeDate(
                        booking.endDate
                    );


                return (
                    dateString >=
                        bookingStart &&

                    dateString <=
                        bookingEnd
                );
            }
        );
    }


    // =====================================================
    // KALENDAR
    // =====================================================

    renderCalendar() {

        const daysContainer =
            document.getElementById(
                'calendar-days-grid'
            );


        const monthYearLabel =
            document.getElementById(
                'calendar-month-year'
            );


        if (
            !daysContainer ||
            !monthYearLabel
        ) {

            return;
        }


        daysContainer.innerHTML = '';


        const year =
            this.calendarDate.getFullYear();


        const month =
            this.calendarDate.getMonth();


        const months = [

            'Januar',
            'Februar',
            'Mart',
            'April',
            'Maj',
            'Jun',
            'Jul',
            'Avgust',
            'Septembar',
            'Oktobar',
            'Novembar',
            'Decembar'

        ];


        monthYearLabel.innerText =
            `${months[month]} ${year}`;


        let firstDayIndex =
            new Date(
                year,
                month,
                1
            ).getDay();


        firstDayIndex =
            firstDayIndex === 0
                ? 6
                : firstDayIndex - 1;


        const totalDays =
            new Date(
                year,
                month + 1,
                0
            ).getDate();


        for (
            let i = 0;
            i < firstDayIndex;
            i++
        ) {

            const empty =
                document.createElement(
                    'div'
                );

            empty.className =
                'cal-day day-empty';

            daysContainer.appendChild(
                empty
            );
        }


        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );


        for (
            let day = 1;
            day <= totalDays;
            day++
        ) {

            const dateObj =
                new Date(
                    year,
                    month,
                    day
                );


            const dateStr =
                this.formatDateString(
                    dateObj
                );


            const cell =
                document.createElement(
                    'div'
                );


            cell.className =
                'cal-day';


            cell.innerText =
                day;


            if (dateObj < today) {

                cell.classList.add(
                    'day-empty'
                );

            } else if (
                this.isDateBooked(
                    dateStr
                )
            ) {

                cell.classList.add(
                    'day-booked'
                );

            } else {

                cell.classList.add(
                    'day-avail'
                );


                cell.addEventListener(
                    'click',
                    () =>
                        this.handleCalendarDayClick(
                            dateStr
                        )
                );


                if (
                    this.selectedStartDate ===
                    dateStr ||

                    this.selectedEndDate ===
                    dateStr
                ) {

                    cell.classList.add(
                        'day-selected'
                    );

                } else if (
                    this.selectedStartDate &&
                    this.selectedEndDate &&

                    dateStr >
                        this.selectedStartDate &&

                    dateStr <
                        this.selectedEndDate
                ) {

                    cell.classList.add(
                        'day-in-range'
                    );
                }
            }


            daysContainer.appendChild(
                cell
            );
        }
    }


    // =====================================================
    // PROMENA MESECA
    // =====================================================

    changeCalendarMonth(direction) {

        this.calendarDate.setMonth(
            this.calendarDate.getMonth() +
            direction
        );


        this.renderCalendar();
    }


    // =====================================================
    // KLIK NA DAN
    // =====================================================

    handleCalendarDayClick(
        dateString
    ) {

        if (
            !this.selectedStartDate ||

            (
                this.selectedStartDate &&
                this.selectedEndDate
            )
        ) {

            this.selectedStartDate =
                dateString;

            this.selectedEndDate =
                null;

        } else if (
            dateString <
            this.selectedStartDate
        ) {

            this.selectedStartDate =
                dateString;

            this.selectedEndDate =
                null;

        } else {

            const conflict =
                this.checkRangeOverlap(
                    this.selectedStartDate,
                    dateString
                );


            if (conflict) {

                this.showToast(
                    'Izabrani period sadrži rezervisane dane.',
                    'danger'
                );


                this.selectedStartDate =
                    dateString;

                this.selectedEndDate =
                    null;

            } else {

                this.selectedEndDate =
                    dateString;
            }
        }


        this.updateCheckoutView();

        this.renderCalendar();
    }


    // =====================================================
    // PROVERA PREKLAPANJA
    // =====================================================

    checkRangeOverlap(
        start,
        end
    ) {

        const startDate =
            new Date(
                `${start}T00:00:00`
            );


        const endDate =
            new Date(
                `${end}T00:00:00`
            );


        for (
            const booking
            of this.activeBookings
        ) {

            const bookingStartString =
                this.normalizeDate(
                    booking.startDate
                );


            const bookingEndString =
                this.normalizeDate(
                    booking.endDate
                );


            const bookingStart =
                new Date(
                    `${bookingStartString}T00:00:00`
                );


            const bookingEnd =
                new Date(
                    `${bookingEndString}T00:00:00`
                );


            if (
                startDate <= bookingEnd &&
                bookingStart <= endDate
            ) {

                return true;
            }
        }


        return false;
    }


    // =====================================================
    // FORMAT DATUMA
    // =====================================================

    formatDateString(date) {

        const y =
            date.getFullYear();


        const m =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                '0'
            );


        const d =
            String(
                date.getDate()
            ).padStart(
                2,
                '0'
            );


        return `${y}-${m}-${d}`;
    }


    formatDateSerbian(dateStr) {

        const normalized =
            this.normalizeDate(
                dateStr
            );


        const parts =
            normalized.split('-');


        if (parts.length !== 3) {

            return dateStr;
        }


        return `${parts[2]}.${parts[1]}.${parts[0]}.`;
    }


    // =====================================================
    // OBRAČUN CENE
    // =====================================================

    updateCheckoutView() {

        const startLabel =
            document.getElementById(
                'checkout-start-date'
            );


        const endLabel =
            document.getElementById(
                'checkout-end-date'
            );


        const totalDaysLabel =
            document.getElementById(
                'checkout-total-days'
            );


        const totalPriceLabel =
            document.getElementById(
                'checkout-total-price'
            );


        if (this.selectedStartDate) {

            startLabel.innerText =
                this.formatDateSerbian(
                    this.selectedStartDate
                );


            document
                .getElementById(
                    'form-booking-start-date'
                )
                .value =
                this.selectedStartDate;

        } else {

            startLabel.innerText =
                '-';


            document
                .getElementById(
                    'form-booking-start-date'
                )
                .value =
                '';
        }


        if (this.selectedEndDate) {

            endLabel.innerText =
                this.formatDateSerbian(
                    this.selectedEndDate
                );


            document
                .getElementById(
                    'form-booking-end-date'
                )
                .value =
                this.selectedEndDate;

        } else {

            endLabel.innerText =
                '-';


            document
                .getElementById(
                    'form-booking-end-date'
                )
                .value =
                '';
        }


        if (
            this.selectedStartDate &&
            this.selectedEndDate &&
            this.selectedCar
        ) {

            const start =
                new Date(
                    `${this.selectedStartDate}T00:00:00`
                );


            const end =
                new Date(
                    `${this.selectedEndDate}T00:00:00`
                );


            const diffTime =
                end.getTime() -
                start.getTime();


            const days =
                Math.floor(
                    diffTime /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
                ) + 1;


            let total =
                days *
                Number(
                    this.selectedCar.price
                );


            let discount = 0;


            // 15% POPUST ZA 5 I VIŠE DANA

            if (days >= 5) {

                discount =
                    Math.round(
                        total * 0.15
                    );

                total =
                    total - discount;
            }


            totalDaysLabel.innerHTML =
                `${days} dana`;


            if (discount > 0) {

                totalPriceLabel.innerHTML = `

                    <span class="old-price">

                        ${this.formatPrice(
                            days *
                            this.selectedCar.price
                        )}

                        RSD

                    </span>


                    <strong>

                        ${this.formatPrice(
                            total
                        )}

                        RSD

                    </strong>


                    <small>

                        -15% popusta

                    </small>
                `;

            } else {

                totalPriceLabel.innerText =
                    `${this.formatPrice(
                        total
                    )} RSD`;
            }

        } else {

            totalDaysLabel.innerText =
                '0 dana';


            totalPriceLabel.innerText =
                '0 RSD';
        }


        this.verifyBookingSubmitButton();
    }


    // =====================================================
    // DUGME ZA REZERVACIJU
    // =====================================================

    verifyBookingSubmitButton() {

        const button =
            document.getElementById(
                'btn-submit-booking'
            );


        if (!button) {

            return;
        }


        if (
            this.user &&
            this.selectedStartDate &&
            this.selectedEndDate
        ) {

            button.removeAttribute(
                'disabled'
            );

        } else {

            button.setAttribute(
                'disabled',
                'true'
            );
        }
    }


    // =====================================================
    // SLANJE REZERVACIJE
    // =====================================================

    async submitBooking() {

        if (
            !this.user ||
            !this.selectedStartDate ||
            !this.selectedEndDate ||
            !this.selectedCar
        ) {

            return;
        }


        const body = {

            carId:
                this.selectedCar.id,

            userEmail:
                this.user.email,

            startDate:
                this.selectedStartDate,

            endDate:
                this.selectedEndDate
        };


        try {

            const res =
                await fetch(
                    `${apiBase}/api/bookings`,
                    {
                        method:
                            'POST',

                        headers: {

                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify(
                                body
                            )
                    }
                );


            const data =
                await res.json();


            if (!res.ok) {

                throw new Error(
                    data.error ||
                    'Neuspešna rezervacija.'
                );
            }


            this.showToast(
                `Automobil ${this.selectedCar.name} je uspešno rezervisan!`
            );


            document
                .getElementById(
                    'booking-modal'
                )
                .classList.add(
                    'hidden'
                );


            // Ponovo učitavamo rezervacije

            await this.fetchUserBookings();


            this.switchTab(
                'bookings-section'
            );

        } catch (err) {

            console.error(
                'Greška pri rezervaciji:',
                err
            );


            this.showToast(
                err.message,
                'danger'
            );
        }
    }


    // =====================================================
    // REZERVACIJE KORISNIKA
    // =====================================================

    handleBookingsTab() {

        if (this.user) {

            this.fetchUserBookings();
        }
    }


    async fetchUserBookings() {

        const wrapper =
            document.getElementById(
                'bookings-table-wrapper'
            );


        if (!wrapper) {

            return;
        }


        wrapper.innerHTML = `

            <div class="loading-spinner">

                Učitavanje rezervacija...

            </div>
        `;


        if (!this.user) {

            wrapper.innerHTML = `

                <div class="loading-spinner">

                    Morate biti prijavljeni.

                </div>
            `;

            return;
        }


        try {

            const res =
                await fetch(
                    `${apiBase}/api/bookings?email=${encodeURIComponent(
                        this.user.email
                    )}`
                );


            if (!res.ok) {

                throw new Error(
                    'Nemoguće preuzeti rezervacije.'
                );
            }


            const data =
                await res.json();


            if (!data.length) {

                wrapper.innerHTML = `

                    <div class="loading-spinner">

                        Nemate kreiranih rezervacija.

                    </div>
                `;

                return;
            }


            wrapper.innerHTML = '';


            data.forEach(
                booking => {

                    const card =
                        document.createElement(
                            'div'
                        );


                    card.className =
                        'booking-card';


                    const discountHtml =
                        Number(
                            booking.discount
                        ) > 0

                            ? `

                                <div
                                    class="booking-discount">

                                    -${booking.discount}%

                                </div>
                            `

                            : '';


                    card.innerHTML = `

                        <div class="booking-car-info">

                            <h4>

                                ${booking.carName}

                            </h4>


                            <p>

                                ID rezervacije:

                                ${booking.id}

                            </p>

                        </div>


                        <div class="booking-date-range">

                            <span class="date-lbl">

                                Preuzimanje

                            </span>


                            <span class="date-val">

                                ${this.formatDateSerbian(
                                    booking.startDate
                                )}

                            </span>

                        </div>


                        <div class="booking-date-range">

                            <span class="date-lbl">

                                Vraćanje

                            </span>


                            <span class="date-val">

                                ${this.formatDateSerbian(
                                    booking.endDate
                                )}

                            </span>

                        </div>


                        <div class="booking-price">

                            ${this.formatPrice(
                                booking.totalPrice
                            )}

                            RSD

                            ${discountHtml}

                        </div>


                        <div class="status-badge">

                            <i
                                class="fa-solid fa-circle-check">
                            </i>

                            Potvrđeno

                        </div>
                    `;


                    wrapper.appendChild(
                        card
                    );
                }
            );

        } catch (err) {

            console.error(
                'Greška pri učitavanju rezervacija:',
                err
            );


            wrapper.innerHTML = `

                <div
                    class="loading-spinner"
                    style="color:var(--danger)"
                >

                    Greška:

                    ${err.message}

                </div>
            `;
        }
    }
}


// =====================================================
// POKRETANJE APLIKACIJE
// =====================================================

const app =
    new App();


window.app =
    app;

