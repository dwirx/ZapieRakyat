# 🚀 ZapieRakyat - Advanced Service Deployment Platform

**Deploy production-ready services instantly without technical complexity!**

ZapieRakyat adalah platform deployment service canggih yang memungkinkan Anda untuk deploy berbagai macam service seperti PostgreSQL, n8n, WAHA WhatsApp API, dan lainnya hanya dalam hitungan menit - tanpa perlu pengetahuan teknis mendalam!

## Struktur Proyek

```
ZapieRakyat/
├── frontend/          # React frontend dengan Vite
├── backend/           # Node.js backend dengan Express
├── claude.md          # Dokumentasi konsep aplikasi
└── README.md          # File ini
```

## Fitur

- ✅ Deployment n8n dengan berbagai template (Basic, Plus, Pro)
- ✅ Interface yang user-friendly
- ✅ Manajemen container Docker otomatis
- ✅ Port management otomatis
- ✅ Real-time deployment status
- 🔄 PostgreSQL deployment (Coming Soon)
- 🔄 Nginx deployment (Coming Soon)
- 🔄 Discord Bot hosting (Coming Soon)

## Prerequisites

1. **Docker** - Pastikan Docker sudah terinstall dan berjalan
2. **Node.js** - Versi 18 atau lebih baru
3. **npm atau yarn** - Package manager

## 🚀 Quick Start

### Cara Tercepat (Recommended)

```bash
# 1. Setup (sekali saja)
./setup.sh

# 2. Jalankan aplikasi
./start.sh
```

### Cara Manual

```bash
# 1. Setup Backend
cd backend && npm install

# 2. Setup Frontend  
cd frontend && npm install

# 3. Jalankan Backend (Terminal 1)
cd backend && npm run dev

# 4. Jalankan Frontend (Terminal 2)
cd frontend && npm run dev
```

**Hasil:**
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

### Menggunakan VS Code Tasks

1. Tekan `Ctrl+Shift+P`
2. Ketik "Tasks: Run Task"
3. Pilih "Start All Services"

## Penggunaan

1. Buka browser dan akses `http://localhost:3000`
2. Pilih service yang ingin di-deploy (saat ini hanya n8n yang tersedia)
3. Masukkan nama service
4. Pilih template sesuai kebutuhan:
   - **Basic**: 0.5 CPU, 512 MB RAM - Rp 15.000/bulan
   - **Plus**: 1 CPU, 1 GB RAM - Rp 30.000/bulan  
   - **Pro**: 2 CPU, 2 GB RAM - Rp 60.000/bulan
5. Klik "Deploy Service"
6. Tunggu hingga deployment selesai
7. Akses service melalui URL yang diberikan

## API Endpoints

### Deployment
- `POST /api/deploy` - Deploy service baru
- `GET /api/services` - List semua services
- `GET /api/services/:id` - Detail service
- `POST /api/services/:id/stop` - Stop service
- `DELETE /api/services/:id` - Hapus service

### Health Check
- `GET /api/health` - Status backend

## Teknologi

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Lucide React (icons)
- Axios

### Backend
- Node.js
- Express
- Docker API (dockerode)
- CORS
- Helmet

## Development

### Menjalankan dalam Development Mode

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### Build untuk Production

Frontend:
```bash
cd frontend
npm run build
```

Backend sudah siap untuk production dengan:
```bash
cd backend
npm start
```

## Struktur Container Docker

Setiap service yang di-deploy akan memiliki:
- Unique container name dengan format: `zapie-{serviceType}-{sanitizedName}-{uuid}`
- Label khusus untuk identifikasi: `zapie.managed=true`
- Resource limit sesuai template yang dipilih
- Restart policy: `unless-stopped`
- Port binding otomatis mulai dari 8080

## Troubleshooting

### Docker Permission Issues
Jika mendapat error permission untuk Docker socket:
```bash
sudo usermod -aG docker $USER
# Logout dan login kembali
```

### Port Already in Use
Aplikasi secara otomatis mencari port yang tersedia mulai dari 8080.

### Container Tidak Bisa Start
Periksa Docker logs:
```bash
docker logs <container-name>
```

## Kontribusi

1. Fork repository ini
2. Buat feature branch: `git checkout -b feature-nama-fitur`
3. Commit changes: `git commit -am 'Tambah fitur baru'`
4. Push ke branch: `git push origin feature-nama-fitur`
5. Submit Pull Request

## License

MIT License - lihat file LICENSE untuk detail lengkap.
