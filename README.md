# 🚀 ZapieRakyat - Advanced Service Deployment Platform

**Deploy production-ready service6. Akses service melalui URL yang diberikan

## 🌟 Enhanced Features

### 🔧 Bulk Operations Manager
Kelola multiple services secara bersamaan dengan fitur:
- Start/stop/restart multiple services sekaligus
- Bulk backup creation dan deletion
- Service filtering dan selection tools
- Real-time operation progress tracking

### 🚨 Service Health Alerts
Monitoring real-time dengan notifikasi otomatis:
- Automated health checks dengan interval yang dapat dikustomisasi
- Sound notifications untuk critical events
- Service status dashboard dengan real-time updates
- Configurable alert thresholds untuk CPU dan memory usage
- In-app notifications dan alert history

### 📊 Resource Usage Analytics
Comprehensive performance monitoring:
- Real-time CPU, memory, disk, dan network usage charts
- Historical performance data visualization
- Export analytics data untuk reporting
- Customizable time ranges (1h, 6h, 24h, 7d)
- Auto-refresh capabilities dengan berbagai interval

### 🗂️ Service Templates Manager
Custom template creation dan management:
- Buat custom service templates dengan Docker configurations
- Import/export templates untuk easy sharing
- Template categories dan tagging system
- Favorite templates untuk quick access
- Resource requirement specifications

### 🛡️ Advanced Backup Manager
Complete backup solution:
- One-click backup creation dengan custom naming
- Download backups untuk offline storage
- Point-in-time recovery options
- Storage usage monitoring dengan visual indicators
- Backup metadata dan descriptions

### 🎨 Modern UI/UX
- ✨ Beautiful animations dengan smooth transitions
- 🌈 Gradient designs dan modern styling
- 📱 Responsive layout untuk semua device sizes
- 🔔 Smart notifications dengan auto-dismiss
- ⚡ Enhanced loading states dan progress bars

## API Endpointsnstantly without technical complexity!**

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
- ✅ PostgreSQL deployment dengan konfigurasi lengkap
- ✅ WAHA WhatsApp API deployment
- ✅ Interface yang user-friendly dengan design modern
- ✅ Manajemen container Docker otomatis
- ✅ Port management otomatis
- ✅ Real-time deployment status dengan progress tracking
- ✅ **Bulk Operations Manager** - Kelola multiple services sekaligus
- ✅ **Service Health Alerts** - Monitoring real-time dengan notifikasi
- ✅ **Resource Usage Analytics** - Chart dan analitik performance
- ✅ **Advanced Backup Manager** - Backup/restore komprehensif
- ✅ **Service Templates Manager** - Buat dan kelola template custom
- ✅ Modern UI/UX dengan animasi dan responsive design
- ✅ Smart notifications dan loading states
- 🔄 Discord Bot hosting (Coming Soon)
- 🔄 Auto-scaling capabilities (Coming Soon)

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
