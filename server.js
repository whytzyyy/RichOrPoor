// server.js const express = require('express'); const mongoose = require('mongoose'); const cors = require('cors'); const app = express();

const PORT = process.env.PORT || 3000; const MONGO_URI = 'mongodb://localhost:27017/richorpoor'; // ganti sesuai server kamu

app.use(cors()); app.use(express.json());

// DB Connection mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, });

const walletSchema = new mongoose.Schema({ address: { type: String, required: true, unique: true }, token: { type: Number, default: 0 }, lastClaim: { type: Date, default: null }, tasks: { task1: Boolean, task2: Boolean, task3: Boolean }, referrals: { type: Number, default: 0 }, });

const Wallet = mongoose.model('Wallet', walletSchema);

// Login / Register Wallet app.post('/api/login', async (req, res) => { const { address, ref } = req.body; if (!address) return res.status(400).json({ error: 'Address is required' });

let wallet = await Wallet.findOne({ address }); if (!wallet) { wallet = new Wallet({ address, token: 0, tasks: {} }); await wallet.save();

// Tambah token untuk referral
if (ref && ref !== address) {
  const refWallet = await Wallet.findOne({ address: ref });
  if (refWallet) {
    refWallet.token += 50;
    refWallet.referrals += 1;
    await refWallet.save();
  }
}

}

res.json(wallet); });

// Claim Token app.post('/api/claim', async (req, res) => { const { address } = req.body; if (!address) return res.status(400).json({ error: 'Address is required' });

const wallet = await Wallet.findOne({ address }); if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

const now = new Date(); const last = wallet.lastClaim || new Date(0); const diff = now - new Date(last);

if (diff < 86400000) { const remaining = 86400000 - diff; return res.status(403).json({ error: 'Wait until next claim', remaining }); }

wallet.token += 50; wallet.lastClaim = now; await wallet.save();

res.json({ token: wallet.token, lastClaim: wallet.lastClaim }); });

// Submit Task app.post('/api/task/:taskId', async (req, res) => { const { address } = req.body; const { taskId } = req.params; if (!address) return res.status(400).json({ error: 'Address is required' }); if (!['task1', 'task2', 'task3'].includes(taskId)) return res.status(400).json({ error: 'Invalid task' });

const wallet = await Wallet.findOne({ address }); if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

if (!wallet.tasks[taskId]) { wallet.tasks[taskId] = true; wallet.token += 50; await wallet.save(); }

res.json({ token: wallet.token, tasks: wallet.tasks }); });

// Get Wallet Info app.get('/api/wallet/:address', async (req, res) => { const wallet = await Wallet.findOne({ address: req.params.address }); if (!wallet) return res.status(404).json({ error: 'Wallet not found' }); res.json(wallet); });

app.listen(PORT, () => { console.log(Server running on port ${PORT}); });

