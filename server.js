const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
const PORT = 3000;
const SECRET = 'secret';

let users = [];
let products = [{ id: 1, name: 'Book', price: 10 }];
let carts = {};
let orders = [];


const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));



(async () => {
  const hashed = await bcrypt.hash('1234', 8);
  users.push({ username: 'bhavya', password: hashed });
})();


function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Login required');
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).send('Invalid token');
  }
}


app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) return res.send('User exists');
  const hashed = await bcrypt.hash(password, 8);
  users.push({ username, password: hashed });
  res.send('Registered');
});


app.post('/login', async (req, res) => {
  const user = users.find(u => u.username === req.body.username);
  if (!user || !(await bcrypt.compare(req.body.password, user.password)))
    return res.send('Wrong credentials');
  const token = jwt.sign({ username: user.username }, SECRET);
  res.json({ token });
});


app.get('/products', (req, res) => {
  res.json(products);
});


app.post('/cart', auth, (req, res) => {
  const { productId, qty } = req.body;
  if (!carts[req.user.username]) carts[req.user.username] = [];
  carts[req.user.username].push({ productId, qty });
  res.send('Added to cart');
});


app.get('/cart', auth, (req, res) => {
  res.json(carts[req.user.username] || []);
});


app.post('/order', auth, (req, res) => {
  const cart = carts[req.user.username];
  if (!cart || cart.length === 0) return res.send('Cart is empty');
  orders.push({ user: req.user.username, items: cart });
  carts[req.user.username] = [];
  res.send('Order placed');
});


app.get('/orders', (req, res) => {
  res.json(orders);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
