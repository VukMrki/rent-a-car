const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory Database
const users = [
  { email: 'vuk@example.com', password: 'password123', name: 'Vuk Ivanovic' }
];

const cars = [
  {
    id: 'tesla-s',
    name: 'Tesla Model S Plaid',
    type: 'electric',
    transmission: 'automatic',
    power: '1020 HP',
    acceleration: '2.1s 0-100 km/h',
    price: 150,
    description: 'The quickest accelerating car in production. Model S Plaid features a tri-motor configuration delivering instantaneous torque and unmatched power while maintaining a clean, zero-emission profile.',
    features: ['Autopilot', 'Trill-Motor AWD', 'Panoramic Glass Roof', '17-inch Cinematic Display', 'Premium Audio']
  },
  {
    id: 'porsche-911',
    name: 'Porsche 911 GT3',
    type: 'gasoline',
    transmission: 'automatic',
    power: '502 HP',
    acceleration: '3.4s 0-100 km/h',
    price: 250,
    description: 'Automotive racetrack engineering built for the open road. The 911 GT3 pairs an atmospheric 4.0-liter flat-six engine with a razor-sharp PDK transmission, providing an unmatched analog driving connection.',
    features: ['4.0L Naturally Aspirated R6', 'Active Aerodynamics', 'Rear-Axle Steering', 'Carbon Fiber Seats', 'Sport Chrono Package']
  },
  {
    id: 'bmw-m4',
    name: 'BMW M4 Competition',
    type: 'gasoline',
    transmission: 'automatic',
    power: '503 HP',
    acceleration: '3.5s 0-100 km/h',
    price: 120,
    description: 'A benchmark in high-performance sports coupes. Featuring an inline-six M TwinPower Turbo engine and xDrive all-wheel control. Sporty exterior and a highly customizable interior.',
    features: ['TwinPower Turbo Inline-6', 'M xDrive AWD', 'Adaptive M Suspension', 'Harman Kardon Sound', 'Carbon Fiber Trim']
  },
  {
    id: 'audi-etron',
    name: 'Audi RS e-tron GT',
    type: 'electric',
    transmission: 'automatic',
    power: '637 HP',
    acceleration: '3.1s 0-100 km/h',
    price: 160,
    description: 'Electric grand touring redefined. The RS e-tron GT delivers striking aesthetics combined with dual-motor electric performance, rapid charging capabilities, and high-quality premium comfort.',
    features: ['Quattro AWD', 'Matrix LED Headlights', 'Adaptive Air Suspension', '800V Fast Charging', 'Head-up Display']
  },
  {
    id: 'merc-g63',
    name: 'Mercedes-Benz G63 AMG',
    type: 'gasoline',
    transmission: 'automatic',
    power: '577 HP',
    acceleration: '4.5s 0-100 km/h',
    price: 200,
    description: 'An iconic powerhouse of luxury and offroad capability. The Mercedes-AMG G63 is equipped with a handcrafted 4.0L V8 twin-turbo engine, presenting exceptional performance combined with outstanding presence.',
    features: ['4.0L BiTurbo V8', '3 Locking Differentials', 'Burmester Surround Sound', 'Nappa Leather Interior', 'AMG Ride Control']
  }
];

const bookings = [
  {
    id: 'b1',
    carId: 'tesla-s',
    userEmail: 'vuk@example.com',
    startDate: '2026-07-10',
    endDate: '2026-07-14',
    totalPrice: 600
  }
];

// Helper to check if database ranges overlap
function isOverlapping(start1, end1, start2, end2) {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  return s1 <= e2 && s2 <= e1;
}

// Swagger UI mount
// Load swagger specification from swagger.json file
let swaggerDocument = {};
try {
  const swaggerFile = fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf8');
  swaggerDocument = JSON.parse(swaggerFile);
} catch (err) {
  console.error("Error loading swagger.json:", err);
}
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serve Frontend static assets
app.use(express.static(path.join(__dirname, 'public')));

// AUTHENTICATION ROUTES
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Specifikujte e-mail, lozinku i ime.' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Korisnik sa ovim e-mailom već postoji.' });
  }

  const newUser = { email: email.toLowerCase(), password, name };
  users.push(newUser);

  res.status(201).json({
    message: 'Registracija uspešna!',
    user: { email: newUser.email, name: newUser.name }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Specifikujte e-mail i lozinku.' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Pogrešan e-mail ili lozinka.' });
  }

  res.json({
    message: 'Prijava uspešna!',
    token: `mock-token-${Date.now()}`,
    user: { email: user.email, name: user.name }
  });
});

// CARS INVENTORY
app.get('/api/cars', (req, res) => {
  res.json(cars);
});

// BOOKINGS
app.get('/api/bookings', (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email parametar je obavezan za pregled rezervacija.' });
  }

  const userBookings = bookings
    .filter(b => b.userEmail.toLowerCase() === email.toLowerCase())
    .map(b => {
      const car = cars.find(c => c.id === b.carId);
      return {
        ...b,
        carName: car ? car.name : 'Unknown Car'
      };
    });

  res.json(userBookings);
});

app.post('/api/bookings', (req, res) => {
  const { carId, userEmail, startDate, endDate } = req.body;

  if (!carId || !userEmail || !startDate || !endDate) {
    return res.status(400).json({ error: 'Nedostaju obavezni parametri za rezervaciju.' });
  }

  const car = cars.find(c => c.id === carId);
  if (!car) {
    return res.status(404).json({ error: 'Automobil nije pronađen.' });
  }

  // Basic date validation
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Neispravan format datuma.' });
  }
  
  if (start > end) {
    return res.status(400).json({ error: 'Datum početka mora biti pre datuma završetka.' });
  }

  const today = new Date();
  today.setHours(0,0,0,0);
  if (start < today) {
    return res.status(400).json({ error: 'Ne možete rezervisati prošle datume.' });
  }

  // Overlap verification
  const conflict = bookings.find(b => 
    b.carId === carId && 
    isOverlapping(b.startDate, b.endDate, startDate, endDate)
  );

  if (conflict) {
    return res.status(400).json({ error: 'Automobil je već rezervisan za izabrani period.' });
  }

  // Calculate rental cost
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
  const price = diffDays * car.price;

  const newBooking = {
    id: `b-${Date.now()}`,
    carId,
    userEmail: userEmail.toLowerCase(),
    startDate,
    endDate,
    totalPrice: price
  };

  bookings.push(newBooking);

  res.status(201).json({
    message: 'Rezervacija uspešno kreirana!',
    booking: {
      ...newBooking,
      carName: car.name
    }
  });
});

// Fallback to serving main html for client-side routing, if any
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server pokrenut na portu http://localhost:${PORT}`);
  console.log(`Swagger dokumentacija dostupna na http://localhost:${PORT}/api-docs`);
});
