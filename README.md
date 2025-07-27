# 💥 Crypto Crash Game – Backend

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?logo=mongodb)
![Socket.IO](https://img.shields.io/badge/WebSockets-Socket.IO-purple?logo=socket.io)
![License](https://img.shields.io/badge/license-MIT-blue)

> Real‑time multiplayer crash‑game backend powered by WebSockets, live BTC/ETH prices, and a provably‑fair crash algorithm.

---

## ⚙️ Features

|                          |                                           |
| ------------------------ | ----------------------------------------- |
| 🎮 **Game Loop**         | 10 s betting → live multiplier → crash    |
| 💱 **Live Pricing**      | BTC & ETH quotes from CoinGecko           |
| 🔐 **Provably Fair**     | HMAC‑SHA256 seed‑hash method              |
| 💰 **Atomic Wallets**    | MongoDB transactions = no race‑conditions |
| 🌐 **REST + WebSockets** | Simple HTTP + Socket.IO API               |

---

## 🛠 Tech Stack

- **Backend**  Node.js 18 + Express
- **Database** MongoDB + Mongoose
- **Realtime** Socket.IO 4
- **Pricing API** CoinGecko (no API‑key required)

---

## 🚀 Quick‑Start (Local)

### 1 · Prerequisites

```text
Node.js ≥ 18     MongoDB local OR Atlas cluster
```

### 2 · Clone + Install

```bash
git clone https://github.com/harpalll/crashGameCryptoWS
cd crashGameCryptoWS
npm install
```

### 3 · Environment File

```bash
# .env
MONGO_URI=mongodb://localhost:27017/cryptocrash
PORT=3000                   # Render injects this automatically in prod
COINGECKO_URL=https://api.coingecko.com/api/v3/simple/price
```

> **Why no API key?**  CoinGecko’s public endpoint is free (≈ 50 req/min).  
> For higher rate‑limits, proxy it & add a cache layer.

### 4 · (Dev) Seed Example Players

```bash
npm run seed     # or: node src/seed.js
```

### 5 · Run

```bash
npm start
```

Local: `http://localhost:3000`  
Render: `https://crashgamecryptows.onrender.com`

---

## 🛰 Deployment on Render

1. Connect repo ➜ “**New Web Service**”
2. **Environment:** Node
3. **Start command:** `npm start`
4. Add `MONGO_URI` env‑var (Atlas / Render Mongo instance)
5. Done! HTTP + WS share the same origin:

```js
// Client
const socket = io(); // auto‑connects to the same Render host
```

---

## 📡 REST API

| Method  | Route                       | Description                     |
| ------- | --------------------------- | ------------------------------- |
| **GET** | `/api/game-state/:playerId` | Current round + player’s wallet |
| **GET** | `/api/players`              | All seeded players              |

### Example cURL

```bash
# replace :id with a real ObjectId
curl https://crashgamecryptows.onrender.com/api/game-state/64f02acde2f3f0c8c0f13b91
```

---

## 🔌 WebSocket Messages

### Client → Server

| Event            | Payload                   |
| ---------------- | ------------------------- |
| `player:bet`     | `{ usdAmount, currency }` |
| `player:cashout` | –                         |

### Server → Client

| Event                       | Purpose                   |
| --------------------------- | ------------------------- |
| `game:state`                | phase + timer             |
| `multiplier:update`         | live multiplier           |
| `game:crash`                | crash point + seed        |
| `player:bet_success`        | confirm bet (private)     |
| `player:cashed_out_success` | confirm cashout (private) |
| `error:*`                   | any error                 |

---

## 🎲 Provably‑Fair Crash

1. **ServerSeed** generated pre‑round
2. `publicHash = SHA256(serverSeed)` broadcast
3. Crash‑point:
   ```js
   roundHash = HMAC_SHA256(serverSeed, roundId);
   int = parseInt(roundHash.slice(0, 8), 16);
   crashPoint = Math.floor(100 * (2 ** 32 / (int + 1))) / 100;
   ```
4. Seed revealed post‑round → anyone can verify ✅

---

## 🧪 Postman / cURL Collection

All endpoints are plain JSON; quick examples:

```bash
# List players
curl https://crashgamecryptows.onrender.com/api/players

# Sample bet via Socket.IO (node repl)
> const io = require("socket.io-client");
> const sock = io("https://crashgamecryptows.onrender.com",{query:{playerId:"<ObjectId>"}})
> sock.emit("player:bet",{usdAmount:10,currency:"BTC"});
```

If you prefer Postman, import this one‑liner request:

```json
{
  "info": { "name": "CrashGame API" },
  "item": [
    {
      "name": "Get Game State",
      "request": {
        "url": "https://crashgamecryptows.onrender.com/api/game-state/<playerId>",
        "method": "GET"
      }
    }
  ]
}
```

---

## 📝 License

MIT © Harpalsinh Sindhav
