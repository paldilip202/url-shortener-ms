# 🚀 URL Shortener Microservices System

A scalable and distributed URL shortener platform built using Node.js and Express.js following modern microservices architecture principles.

This project demonstrates:

* API Gateway Pattern
* Reverse Proxy Routing
* Microservices Communication
* Click Analytics Tracking
* Health Monitoring
* Distributed System Concepts

---

# ✨ Features

## 🔗 URL Service

* Generate short URLs
* Support custom short codes
* URL validation
* Duplicate URL detection
* Fast redirection

## 📊 Analytics Service

* Track total clicks
* Store click history
* Track IP address & User-Agent
* URL statistics dashboard
* Real-time analytics

## 🌐 API Gateway

* Centralized routing
* Reverse proxy middleware
* Aggregated health checks
* Request logging
* Single entry point for clients

---

# 🏗️ System Architecture

```text id="m5vx34"
                 ┌────────────────────┐
                 │       Client       │
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │    API Gateway     │
                 │      Port 3000     │
                 └──────┬─────┬───────┘
                        │     │
            ┌───────────┘     └────────────┐
            ▼                               ▼
┌────────────────────┐          ┌────────────────────┐
│    URL Service     │          │ Analytics Service  │
│      Port 3001     │          │      Port 3002     │
└────────────────────┘          └────────────────────┘
```

---

# 🛠️ Tech Stack

| Technology            | Purpose                     |
| --------------------- | --------------------------- |
| Node.js               | Runtime Environment         |
| Express.js            | Backend Framework           |
| Axios                 | Service Communication       |
| NanoID                | Unique Short Code Generator |
| http-proxy-middleware | Reverse Proxy               |

---

# 📁 Project Structure

```text id="nczgwm"
url-shortener-ms/
│
├── api-gateway/
│   ├── index.js
│   └── package.json
│
├── url-service/
│   ├── index.js
│   └── package.json
│
├── analytics-service/
│   ├── index.js
│   └── package.json
│
├── README.md
└── .gitignore
```

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash id="u91hsr"
git clone <your-repository-url>
cd url-shortener-ms
```

---

# 📦 Install Dependencies

## API Gateway

```bash id="qg20tx"
cd api-gateway
npm install
```

## URL Service

```bash id="1xchiz"
cd ../url-service
npm install
```

## Analytics Service

```bash id="th63yl"
cd ../analytics-service
npm install
```

---

# ▶️ Run Services

Open **3 separate terminals**.

---

## 📊 Start Analytics Service

```bash id="6pg1lx"
cd analytics-service
node index.js
```

Runs on:

```text id="m34s0g"
http://localhost:3002
```

---

## 🔗 Start URL Service

```bash id="yw8oxw"
cd url-service
node index.js
```

Runs on:

```text id="t3kt1m"
http://localhost:3001
```

---

## 🌐 Start API Gateway

```bash id="u59gn6"
cd api-gateway
node index.js
```

Runs on:

```text id="8m7jft"
http://localhost:3000
```

---

# 📡 API Endpoints

| Method | Endpoint       | Description               |
| ------ | -------------- | ------------------------- |
| POST   | `/shorten`     | Create short URL          |
| GET    | `/:code`       | Redirect to original URL  |
| GET    | `/stats`       | Get all analytics         |
| GET    | `/stats/:code` | Get analytics for one URL |
| GET    | `/health`      | System health status      |

---

# 🔥 Create Short URL

## Request

```http id="bjlwmn"
POST /shorten
```

## Example

```bash id="3hrjlwm"
curl -X POST http://localhost:3000/shorten \
-H "Content-Type: application/json" \
-d '{"url":"https://google.com"}'
```

---

# 📈 Analytics Example

```json id="m2dl7y"
{
  "totalUrls": 1,
  "totalClicks": 5,
  "urls": [
    {
      "code": "abc123",
      "originalUrl": "https://google.com",
      "totalClicks": 5
    }
  ]
}
```

---

# 🔄 Request Flow

## URL Shortening Flow

```text id="2s6yd7"
Client
   ↓
API Gateway
   ↓
URL Service
   ↓
Short URL Generated
```

---

## Redirect & Analytics Flow

```text id="0q7q3w"
Browser
   ↓
API Gateway
   ↓
URL Service
   ↓
Analytics Service
   ↓
Redirect User
```

---

# 🧠 Concepts Demonstrated

* Microservices Architecture
* API Gateway Pattern
* Reverse Proxy
* Service-to-Service Communication
* Distributed Systems
* Async Non-blocking Operations
* Middleware
* Health Monitoring
* Logging
* REST APIs

---

# 🚀 Future Improvements

* MongoDB/PostgreSQL integration
* Redis caching
* Docker support
* Kubernetes deployment
* Authentication & Authorization
* Rate limiting
* Swagger/OpenAPI docs
* CI/CD pipelines
* Unit & Integration Testing
* Monitoring dashboards

---

# 📌 Sample Logs

## API Gateway

```text id="g4dnhk"
[Gateway] → POST /shorten
[Gateway] ← POST /shorten 201 (15ms)
```

## URL Service

```text id="9r1yce"
[URL Service] Shortened: https://google.com → abc123
```

## Analytics Service

```text id="ktqvml"
[Analytics] Tracked click for code: abc123 | Total: 1
```

---

# 📄 License

MIT License

---

# 👨‍💻 Author

### Pal Dilip

Built with ❤️ using Node.js & Express.js
