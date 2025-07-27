# 💥 Crypto Crash Game – Backend

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?logo=mongodb)
![Socket.IO](https://img.shields.io/badge/WebSockets-Socket.IO-purple?logo=socket.io)
![License](https://img.shields.io/badge/license-MIT-blue)

> Real-time multiplayer crash game backend powered by WebSockets, crypto price feeds, and provably fair randomness.

---

## ⚙️ Features

- 🎮 **Real-Time Game Loop**: Betting → In-Progress → Crash
- 💱 **Live BTC/ETH Conversion** via CoinGecko API
- 🔐 **Provably Fair Rounds** using HMAC-SHA256
- 💰 **Atomic Wallet Transactions** with MongoDB Sessions
- 🌐 **REST + WebSocket** APIs

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express
- **DB**: MongoDB + Mongoose
- **Real-Time**: Socket.IO
- **Crypto API**: CoinGecko (via Axios)

---

## 🚀 Quickstart

### ✅ Prerequisites

- Node.js `v18+`
- MongoDB running locally or via Atlas

### 📥 Install & Setup

```bash
git clone https://github.com/harpalll/crashGameCryptoWS
npm install
```

### 🔐 Environment Variables

Create a `.env` file in root:

```env
MONGO_URI=mongodb://localhost:27017/cryptocrash
PORT=3000
```

### 🧪 Seed Sample Players

```bash
npm run seed
# OR
node src/seed.js
```

> Seeds a few players with wallets preloaded for testing.

### ▶️ Start Server

```bash
npm start
```

Server: `https://crashgamecryptows.onrender.com/`  
WebSocket endpoint: `ws://crashgamecryptows.onrender.com/`

---

## 📡 API Overview

### `GET /api/game-state/:playerId`

Returns game state + wallet balance.

```bash
curl https://crashgamecryptows.onrender.com/api/game-state/<playerId>
```

---

## 🔌 WebSocket Events

### ▶️ Client → Server

| Event            | Description                | Payload                   |
| ---------------- | -------------------------- | ------------------------- |
| `player:bet`     | Place a bet (BETTING only) | `{ usdAmount, currency }` |
| `player:cashout` | Cash out during round      | _none_                    |

### 📡 Server → Client

| Event                       | Payload                              |
| --------------------------- | ------------------------------------ |
| `game:state`                | `{ state, duration? }`               |
| `multiplier:update`         | `{ multiplier: "2.54" }`             |
| `game:crash`                | `{ crashPoint, serverSeed }`         |
| `player:bet_success`        | `{ message }` _(to player only)_     |
| `player:cashed_out_success` | `{ cashOutMultiplier, winningsUsd }` |
| `error:*`                   | `{ message }`                        |

---

## 🎲 Provably Fair Crash Logic

1. Server generates `serverSeed` → hashes it → shows `publicHash`.
2. At round end, `serverSeed` is revealed.
3. HMAC-SHA256(serverSeed, roundId) → first 8 hex chars → integer.
4. Apply:

   ```js
   crashPoint = Math.floor(100 * (2 ** 32 / (int + 1))) / 100;
   ```

5. Result must match `crashPoint` shown.

> ✅ Verifiable. ❌ Unpredictable. 🎯 Tamper-proof.

---

## 🧾 License

MIT © Harpalsinh Sindhav

---
