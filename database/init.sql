-- =====================================================
-- APEX DRIVE - POSTGRESQL DATABASE
-- =====================================================

-- =====================================================
-- TABELA KORISNICI
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- TABELA AUTOMOBILI
-- =====================================================

CREATE TABLE IF NOT EXISTS cars (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    class VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    transmission VARCHAR(50) NOT NULL,
    power VARCHAR(50),
    acceleration VARCHAR(50),
    price INTEGER NOT NULL,
    monthly_price INTEGER NOT NULL,
    image VARCHAR(500),
    description TEXT,
    features TEXT[]
);


-- =====================================================
-- TABELA REZERVACIJE
-- =====================================================

CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(100) PRIMARY KEY,

    car_id VARCHAR(100) NOT NULL,

    user_id INTEGER NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    total_price INTEGER NOT NULL,

    discount INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_booking_car
        FOREIGN KEY (car_id)
        REFERENCES cars(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_booking_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT valid_booking_dates
        CHECK (end_date >= start_date)
);


-- =====================================================
-- POČETNI KORISNIK
-- =====================================================

INSERT INTO users (
    email,
    password,
    name
)
VALUES (
    'vuk@example.com',
    'password123',
    'Vuk Ivanovic'
)
ON CONFLICT (email) DO NOTHING;


-- =====================================================
-- AUTOMOBILI
-- =====================================================

INSERT INTO cars (
    id,
    name,
    class,
    type,
    transmission,
    power,
    acceleration,
    price,
    monthly_price,
    image,
    description,
    features
)
VALUES

(
    'toyota-corolla',
    'Toyota Corolla',
    'standard',
    'gasoline',
    'automatic',
    '140 KS',
    '9.1s 0-100 km/h',
    3200,
    32000,
    '/images/toyota-corolla.jpg',
    'Pouzdan, ekonomičan i udoban automobil idealan za svakodnevnu vožnju po gradu i duža putovanja.',
    ARRAY[
        '1.8L benzinski motor',
        'Automatski menjač',
        'Kamera za rikverc',
        'Adaptivni tempomat',
        'Apple CarPlay'
    ]
),

(
    'skoda-octavia',
    'Škoda Octavia',
    'standard',
    'gasoline',
    'automatic',
    '150 KS',
    '8.5s 0-100 km/h',
    3500,
    35000,
    '/images/skoda-octavia.jpg',
    'Prostran i praktičan automobil sa odličnim odnosom udobnosti, potrošnje i prostora.',
    ARRAY[
        '1.5 TSI motor',
        'Automatski menjač',
        'Veliki prtljažnik',
        'Digitalna instrument tabla',
        'Parking senzori'
    ]
),

(
    'vw-golf-8',
    'Volkswagen Golf 8',
    'standard',
    'gasoline',
    'automatic',
    '150 KS',
    '8.5s 0-100 km/h',
    3800,
    38000,
    '/images/golf-8.jpg',
    'Moderan i udoban automobil koji predstavlja odličan izbor za gradsku i međugradsku vožnju.',
    ARRAY[
        '1.5 TSI motor',
        'DSG automatski menjač',
        'Digital Cockpit',
        'LED svetla',
        'Apple CarPlay'
    ]
),

(
    'bmw-3',
    'BMW Serija 3',
    'standard',
    'gasoline',
    'automatic',
    '184 KS',
    '7.1s 0-100 km/h',
    4100,
    42000,
    '/images/bmw-3.jpg',
    'Sportska limuzina koja kombinuje odlične vozne karakteristike, udobnost i moderan dizajn.',
    ARRAY[
        '2.0 Turbo motor',
        'Automatski menjač',
        'Sportski režim vožnje',
        'LED svetla',
        'Multimedijalni sistem'
    ]
),

(
    'audi-a4',
    'Audi A4',
    'standard',
    'gasoline',
    'automatic',
    '190 KS',
    '7.3s 0-100 km/h',
    4500,
    45000,
    '/images/audi-a4.jpg',
    'Elegantna i udobna limuzina namenjena korisnicima koji žele više komfora i prestiža.',
    ARRAY[
        '2.0 TFSI motor',
        'Automatski menjač',
        'LED svetla',
        'Digitalna instrument tabla',
        'Parking senzori'
    ]
),

(
    'mercedes-e',
    'Mercedes-Benz E-Class',
    'premium',
    'gasoline',
    'automatic',
    '258 KS',
    '6.3s 0-100 km/h',
    5500,
    55000,
    '/images/mercedes-e.jpg',
    'Premium poslovna limuzina koja pruža visok nivo luksuza, udobnosti i tehnologije.',
    ARRAY[
        '2.0 Turbo motor',
        'Automatski menjač',
        'Kožna sedišta',
        'Ambient osvetljenje',
        'Napredni sistemi asistencije'
    ]
),

(
    'bmw-5',
    'BMW Serija 5',
    'premium',
    'gasoline',
    'automatic',
    '258 KS',
    '6.0s 0-100 km/h',
    6500,
    65000,
    '/images/bmw-5.jpg',
    'Luksuzna poslovna limuzina sa snažnim motorom, vrhunskim enterijerom i odličnom tehnologijom.',
    ARRAY[
        '2.0 Turbo motor',
        'Automatski menjač',
        'Kožna sedišta',
        'Harman Kardon audio',
        'Adaptivno ogibljenje'
    ]
),

(
    'audi-a6',
    'Audi A6',
    'premium',
    'gasoline',
    'automatic',
    '265 KS',
    '5.9s 0-100 km/h',
    7500,
    72000,
    '/images/audi-a6.jpg',
    'Komforna premium limuzina sa naprednom tehnologijom i izuzetno kvalitetnim enterijerom.',
    ARRAY[
        '2.0 TFSI motor',
        'Quattro pogon',
        'Automatski menjač',
        'Matrix LED svetla',
        'Virtual Cockpit'
    ]
),

(
    'mercedes-s',
    'Mercedes-Benz S-Class',
    'premium',
    'gasoline',
    'automatic',
    '435 KS',
    '5.0s 0-100 km/h',
    8500,
    85000,
    '/images/mercedes-s.jpg',
    'Vrhunska luksuzna limuzina koja predstavlja sam vrh Mercedes-Benz ponude.',
    ARRAY[
        '3.0 Turbo motor',
        '4MATIC pogon',
        'Nappa koža',
        'Burmester audio',
        'Masažna sedišta'
    ]
),

(
    'porsche-panamera',
    'Porsche Panamera',
    'premium',
    'gasoline',
    'automatic',
    '353 KS',
    '5.3s 0-100 km/h',
    9700,
    97000,
    '/images/porsche-panamera.jpg',
    'Sportska luksuzna limuzina koja kombinuje performanse sportskog automobila sa udobnošću luksuznog vozila.',
    ARRAY[
        '2.9 Turbo motor',
        'PDK automatski menjač',
        'Sportski režim vožnje',
        'Porsche Active Suspension',
        'Premium sportska sedišta'
    ]
)

ON CONFLICT (id) DO NOTHING;


-- =====================================================
-- POČETNA REZERVACIJA
-- =====================================================

INSERT INTO bookings (
    id,
    car_id,
    user_id,
    start_date,
    end_date,
    total_price,
    discount
)
SELECT
    'b1',
    'toyota-corolla',
    id,
    '2026-07-10',
    '2026-07-14',
    13600,
    15
FROM users
WHERE email = 'vuk@example.com'
ON CONFLICT (id) DO NOTHING;