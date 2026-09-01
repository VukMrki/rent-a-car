const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');

const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


// =====================================================
// SWAGGER
// =====================================================

let swaggerDocument = {};

try {
    const swaggerFile = fs.readFileSync(
        path.join(__dirname, 'swagger.json'),
        'utf8'
    );

    swaggerDocument = JSON.parse(swaggerFile);

} catch (err) {
    console.error(
        'Greška pri učitavanju swagger.json:',
        err
    );
}

app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);


// =====================================================
// FRONTEND
// =====================================================

app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);


// =====================================================
// TEST BAZE
// =====================================================

app.get('/api/health', async (req, res) => {

    try {

        await pool.query('SELECT 1');

        res.json({
            database: 'PostgreSQL radi',
            time: new Date().toISOString()
        });

    } catch (error) {

        console.error(
            'Greška baze:',
            error
        );

        res.status(500).json({
            database: 'PostgreSQL ne radi'
        });
    }
});


// =====================================================
// REGISTRACIJA
// =====================================================

app.post('/api/auth/register', async (req, res) => {

    try {

        const {
            email,
            password,
            name
        } = req.body;

        if (!email || !password || !name) {

            return res.status(400).json({
                error:
                    'Specifikujte e-mail, lozinku i ime.'
            });
        }

        const existingUser =
            await pool.query(
                `SELECT id
                 FROM users
                 WHERE LOWER(email) = LOWER($1)`,
                [email]
            );

        if (existingUser.rows.length > 0) {

            return res.status(400).json({
                error:
                    'Korisnik sa ovim e-mailom već postoji.'
            });
        }

        const result =
            await pool.query(
                `INSERT INTO users
                    (email, password, name)
                 VALUES
                    ($1, $2, $3)
                 RETURNING id, email, name`,
                [
                    email.toLowerCase(),
                    password,
                    name
                ]
            );

        res.status(201).json({

            message:
                'Registracija uspešna!',

            user:
                result.rows[0]
        });

    } catch (error) {

        console.error(
            'Greška pri registraciji:',
            error
        );

        res.status(500).json({
            error:
                'Greška servera pri registraciji.'
        });
    }
});


// =====================================================
// PRIJAVA
// =====================================================

app.post('/api/auth/login', async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                error:
                    'Specifikujte e-mail i lozinku.'
            });
        }

        const result =
            await pool.query(
                `SELECT
                    id,
                    email,
                    password,
                    name
                 FROM users
                 WHERE LOWER(email) = LOWER($1)`,
                [email]
            );

        if (result.rows.length === 0) {

            return res.status(401).json({
                error:
                    'Pogrešan e-mail ili lozinka.'
            });
        }

        const user =
            result.rows[0];

        if (user.password !== password) {

            return res.status(401).json({
                error:
                    'Pogrešan e-mail ili lozinka.'
            });
        }

        res.json({

            message:
                'Prijava uspešna!',

            token:
                'mock-token-' +
                Date.now(),

            user: {

                id:
                    user.id,

                email:
                    user.email,

                name:
                    user.name
            }
        });

    } catch (error) {

        console.error(
            'Greška pri prijavi:',
            error
        );

        res.status(500).json({
            error:
                'Greška servera pri prijavi.'
        });
    }
});


// =====================================================
// VOZILA
// =====================================================

app.get('/api/cars', async (req, res) => {

    try {

        const result =
            await pool.query(
                `SELECT *
                 FROM cars
                 ORDER BY price`
            );

        const cars =
            result.rows.map(car => ({

                id:
                    car.id,

                name:
                    car.name,

                class:
                    car.class,

                price:
                    Number(car.price),

                monthlyPrice:
                    Number(car.monthly_price),

                type:
                    car.type || 'petrol',

                image:
                    car.image ||
                    '/images/car-placeholder.jpg',

                description:
                    car.description || '',

                power:
                    car.power || '',

                acceleration:
                    car.acceleration || '',

                transmission:
                    car.transmission || 'manual',

                features:
                    Array.isArray(car.features)
                        ? car.features
                        : []
            }));

        res.json(cars);

    } catch (error) {

        console.error(
            'Greška pri učitavanju vozila:',
            error
        );

        res.status(500).json({
            error:
                'Greška pri učitavanju vozila.'
        });
    }
});


// =====================================================
// REZERVACIJE - LISTA
// =====================================================

app.get('/api/bookings', async (req, res) => {

    try {

        const {
            email
        } = req.query;

        if (!email) {

            return res.status(400).json({
                error:
                    'Email je obavezan.'
            });
        }

        const result =
            await pool.query(
                `SELECT
                    b.id,
                    b.car_id,
                    b.user_id,
                    b.start_date,
                    b.end_date,
                    b.total_price,
                    b.discount,
                    c.name AS car_name,
                    u.email AS user_email
                 FROM bookings b
                 JOIN users u
                    ON u.id = b.user_id
                 JOIN cars c
                    ON c.id = b.car_id
                 WHERE LOWER(u.email) = LOWER($1)
                 ORDER BY b.start_date DESC`,
                [email]
            );

        const bookings =
            result.rows.map(booking => ({

                id:
                    booking.id,

                carId:
                    booking.car_id,

                userId:
                    booking.user_id,

                userEmail:
                    booking.user_email,

                carName:
                    booking.car_name,

                startDate:
                    booking.start_date,

                endDate:
                    booking.end_date,

                totalPrice:
                    Number(
                        booking.total_price
                    ),

                discount:
                    Number(
                        booking.discount || 0
                    )
            }));

        res.json(bookings);

    } catch (error) {

        console.error(
            'Greška pri učitavanju rezervacija:',
            error
        );

        res.status(500).json({
            error:
                'Greška servera pri učitavanju rezervacija.'
        });
    }
});


// =====================================================
// REZERVACIJE - KREIRANJE
// =====================================================

app.post('/api/bookings', async (req, res) => {

    try {

        const {
            carId,
            userId,
            userEmail,
            startDate,
            endDate
        } = req.body;


        // -------------------------------------------------
        // PROVERA PODATAKA
        // -------------------------------------------------

        if (
            !carId ||
            !startDate ||
            !endDate ||
            (!userId && !userEmail)
        ) {

            return res.status(400).json({
                error:
                    'Nedostaju podaci za rezervaciju.'
            });
        }


        // -------------------------------------------------
        // PRONALAZAK KORISNIKA
        // -------------------------------------------------

        let userResult;


        // Ako frontend pošalje userId,
        // koristimo ID korisnika.

        if (userId) {

            userResult =
                await pool.query(
                    `SELECT
                        id,
                        email,
                        name
                     FROM users
                     WHERE id = $1`,
                    [userId]
                );

        }

        // Ako nema userId,
        // pokušavamo preko email-a.

        else {

            userResult =
                await pool.query(
                    `SELECT
                        id,
                        email,
                        name
                     FROM users
                     WHERE LOWER(email) = LOWER($1)`,
                    [userEmail]
                );
        }


        if (userResult.rows.length === 0) {

            return res.status(404).json({
                error:
                    'Korisnik nije pronađen.'
            });
        }


        const user =
            userResult.rows[0];


        // -------------------------------------------------
        // PROVERA DATUMA
        // -------------------------------------------------

        const start =
            new Date(startDate);

        const end =
            new Date(endDate);


        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {

            return res.status(400).json({
                error:
                    'Neispravan datum.'
            });
        }


        if (end < start) {

            return res.status(400).json({
                error:
                    'Datum vraćanja mora biti nakon datuma preuzimanja.'
            });
        }


        // -------------------------------------------------
        // PRONALAZAK AUTOMOBILA
        // -------------------------------------------------

        const carResult =
            await pool.query(
                `SELECT *
                 FROM cars
                 WHERE id = $1`,
                [carId]
            );


        if (carResult.rows.length === 0) {

            return res.status(404).json({
                error:
                    'Automobil nije pronađen.'
            });
        }


        const car =
            carResult.rows[0];


        // -------------------------------------------------
        // PROVERA PREKLAPANJA
        // -------------------------------------------------

        const conflictResult =
            await pool.query(
                `SELECT id
                 FROM bookings
                 WHERE car_id = $1
                 AND start_date <= $3
                 AND end_date >= $2
                 LIMIT 1`,
                [
                    carId,
                    startDate,
                    endDate
                ]
            );


        if (conflictResult.rows.length > 0) {

            return res.status(409).json({
                error:
                    'Automobil je već rezervisan u izabranom periodu.'
            });
        }


        // -------------------------------------------------
        // BROJ DANA
        // -------------------------------------------------

        const millisecondsPerDay =
            1000 * 60 * 60 * 24;


        const diffDays =
            Math.floor(
                (
                    end.getTime() -
                    start.getTime()
                ) /
                millisecondsPerDay
            ) + 1;


        if (diffDays <= 0) {

            return res.status(400).json({
                error:
                    'Neispravan period rezervacije.'
            });
        }


        // -------------------------------------------------
        // OBRAČUN CENE
        // -------------------------------------------------

        const regularPrice =
            diffDays *
            Number(car.price);


        let totalPrice =
            regularPrice;


        let discount =
            0;


        // 15% POPUST ZA 5 I VIŠE DANA

        if (diffDays >= 5) {

            discount =
                15;

            totalPrice =
                Math.round(
                    regularPrice * 0.85
                );
        }


        // -------------------------------------------------
        // ID REZERVACIJE
        // -------------------------------------------------

        const bookingId =
            `booking-${Date.now()}-${Math.floor(
                Math.random() * 10000
            )}`;


        // -------------------------------------------------
        // UPIS U BAZU
        // -------------------------------------------------

        const bookingResult =
            await pool.query(
                `INSERT INTO bookings
                    (
                        id,
                        car_id,
                        user_id,
                        start_date,
                        end_date,
                        total_price,
                        discount
                    )
                 VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7
                    )
                 RETURNING *`,
                [
                    bookingId,
                    carId,
                    user.id,
                    startDate,
                    endDate,
                    totalPrice,
                    discount
                ]
            );


        const booking =
            bookingResult.rows[0];


        // -------------------------------------------------
        // ODGOVOR
        // -------------------------------------------------

        res.status(201).json({

            message:
                'Rezervacija uspešno kreirana!',

            booking: {

                id:
                    booking.id,

                carId:
                    booking.car_id,

                userId:
                    booking.user_id,

                userEmail:
                    user.email,

                carName:
                    car.name,

                startDate:
                    booking.start_date,

                endDate:
                    booking.end_date,

                totalPrice:
                    Number(
                        booking.total_price
                    ),

                discount:
                    Number(
                        booking.discount || 0
                    ),

                totalDays:
                    diffDays
            }
        });

    } catch (error) {

        console.error(
            'Greška pri kreiranju rezervacije:',
            error
        );

        res.status(500).json({
            error:
                'Greška servera pri rezervaciji.'
        });
    }
});


// =====================================================
// POKRETANJE SERVERA
// =====================================================

app.listen(
    PORT,
    () => {

        console.log(
            `Server pokrenut na portu http://localhost:${PORT}`
        );

        console.log(
            `Swagger dokumentacija: http://localhost:${PORT}/api-docs`
        );
    }
);