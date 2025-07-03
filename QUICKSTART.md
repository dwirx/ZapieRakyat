# Quick Start Guide - ZapieRakyat (FREE Beta)

## ✨ Cara Tercepat Menjalankan ZapieRakyat

### 1. Setup (Hanya Sekali)
```bash
./setup.sh
```

### 2. Jalankan Aplikasi
```bash
./start.sh
```

Atau manual:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

### 3. Buka Browser
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

## 🚨 Troubleshooting

### "nodemon: not found"
**Solusi:**
```bash
cd backend
npm install
```

### "Docker permission denied"
**Solusi:**
```bash
sudo usermod -aG docker $USER
# Logout dan login kembali
```

### Port sudah digunakan
**Backend (port 5000):**
```bash
lsof -ti:5000 | xargs kill -9
```

**Frontend (port 3000):**
```bash
lsof -ti:3000 | xargs kill -9
```

### VS Code Tasks
1. Tekan `Ctrl+Shift+P`
2. Ketik "Tasks: Run Task"
3. Pilih:
   - "Setup All" (untuk install dependencies)
   - "Start Backend" 
   - "Start Frontend"
   - "Start All Services" (keduanya sekaligus)

## 📁 Struktur Project
```
ZapieRakyat/
├── backend/           # Node.js + Express + Docker
├── frontend/          # React + Vite + Tailwind
├── setup.sh          # Setup dependencies
├── start.sh          # Start both services
└── QUICKSTART.md     # File ini
```

## 🎯 Cara Menggunakan

1. Buka `http://localhost:3000`
2. Klik "n8n" (satu-satunya yang aktif)
3. Masukkan nama service (contoh: "my-automation")
4. Pilih paket:
   - **Basic**: Rp 15.000/bulan (0.5 CPU, 512MB RAM)
   - **Plus**: Rp 30.000/bulan (1 CPU, 1GB RAM) 
   - **Pro**: Rp 60.000/bulan (2 CPU, 2GB RAM)
5. Klik "Deploy Service"
6. Tunggu sampai selesai
7. Akses n8n di URL yang diberikan

## 🐳 Docker Requirements

**Pastikan Docker sudah running:**
```bash
docker --version
docker info
```

**Jika Docker belum install (Ubuntu/Debian):**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

## 🔧 Development

**Install dependencies:**
```bash
# Backend
cd backend && npm install

# Frontend  
cd frontend && npm install
```

**Build untuk production:**
```bash
# Frontend
cd frontend && npm run build

# Backend sudah siap production
cd backend && npm start
```
