## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed on your system
- Git installed

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone git@github.com:Ajor-Saha/api-setup-template.git
   cd api-setup-template
   ```

2. **Run with Docker**
   ```bash
   docker compose up -d --build
   ```

3. **Access the API**
   - The server will be running at: `http://localhost:8000`
   - Health check: `curl http://localhost:8000`

## ⚡ Alternative Quick Start Guide (Local Development)

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Git installed

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone git@github.com:Ajor-Saha/api-setup-template.git
   cd api-setup-template
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Generate database schema**
   ```bash
   npm run db:generate
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the API**
   - The server will be running at: `http://localhost:8000`
   - Health check: `curl http://localhost:8000`

## 🧪 Quick Test

```bash
# Get all voters
curl -X GET "http://localhost:8000/api/voters"

# Get a specific voter
curl -X GET "http://localhost:8000/api/voters/1"

# Create a new voter
curl -X POST "http://localhost:8000/api/voters" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "phone": "1234567890"}'

# Update a voter
curl -X PUT "http://localhost:8000/api/voters/1" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com"}'
```

## 🛠️ Tech Stack
- **Backend**: Node.js, TypeScript, Express.js
- **Database**: SQLite with Drizzle ORM
- **Containerization**: Docker & Docker Compose
- **Features**: Voter management, authentication, file uploads, email notifications

---

🔗 **Repository**: git@github.com:Ajor-Saha/api-setup-template.git

