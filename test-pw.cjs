const fs = require('fs');
const bcrypt = require('bcryptjs');

// Load stored hash
const localUsers = JSON.parse(fs.readFileSync('c:/Musicku/musicku-app/.users-store.json', 'utf8'));
const u = localUsers.find(x => x.email === 'zaraaraya5@gmail.com');
console.log('Hash:', u.password);

// Let's test some passwords
const candidates = ['123456', '1234567', '12345678', 'password', 'rajibzahir', 'rajibzahirp', 'zaraaraya', 'zaraaraya5'];
for (const c of candidates) {
  if (bcrypt.compareSync(c, u.password)) {
    console.log('MATCH FOUND:', c);
  }
}

