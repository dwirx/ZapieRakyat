# 🚀 ZapieRakyat - Advanced Features Guide

Panduan lengkap untuk menggunakan fitur-fitur canggih ZapieRakyat yang telah ditingkatkan.

## 🎯 Fitur Utama yang Ditambahkan

### 1. 🔧 Bulk Operations Manager

**Deskripsi**: Kelola multiple services secara bersamaan dengan satu interface yang powerful.

**Cara Menggunakan**:
1. Buka halaman Services
2. Klik tombol **"Bulk Ops"** di header
3. Pilih services yang ingin dikelola dengan checkbox
4. Gunakan filter untuk mempermudah pencarian:
   - Filter berdasarkan status (running/stopped)
   - Filter berdasarkan type service
   - Search by name atau type
5. Pilih operasi yang ingin dilakukan:
   - **Start**: Jalankan services yang dipilih
   - **Stop**: Hentikan services yang dipilih  
   - **Restart**: Restart services yang dipilih
   - **Backup**: Buat backup untuk services yang dipilih
   - **Delete**: Hapus services yang dipilih (hati-hati!)

**Keunggulan**:
- Menghemat waktu untuk operasi multiple services
- Progress tracking real-time untuk setiap service
- Konfirmasi sebelum operasi berbahaya
- Laporan hasil operasi yang detail

---

### 2. 🚨 Service Health Alerts

**Deskripsi**: Sistem monitoring real-time dengan notifikasi otomatis untuk service health.

**Cara Menggunakan**:
1. Klik tombol **"Alerts"** di halaman Services
2. Aktifkan monitoring dengan toggle "Enable Monitoring"
3. Konfigurasi settings:
   - **Check Interval**: Seberapa sering check dilakukan (10-300 detik)
   - **Notification Types**: Pilih jenis notifikasi yang diinginkan
   - **Thresholds**: Set threshold untuk memory dan CPU alert

**Jenis Alert**:
- **Service Down**: Ketika service berhenti berjalan
- **Service Restored**: Ketika service kembali online
- **High Memory Usage**: Ketika penggunaan memory melebihi threshold
- **High CPU Usage**: Ketika penggunaan CPU melebihi threshold
- **Service Unreachable**: Ketika service tidak dapat dijangkau

**Features**:
- Sound notifications (dapat dimatikan)
- Alert history dengan timestamp
- Mark as read/unread
- Service status overview dengan real-time metrics
- Configurable alert settings yang disimpan

---

### 3. 📊 Resource Usage Analytics

**Deskripsi**: Comprehensive performance monitoring dengan charts dan analytics.

**Cara Menggunakan**:
1. Klik tombol **"Analytics"** di halaman Services
2. Pilih services yang ingin dimonitor
3. Set time range (1h, 6h, 24h, 7d)
4. Pilih chart type (line, area, bar)
5. Enable auto-refresh jika diinginkan

**Metrics yang Dimonitor**:
- **CPU Usage**: Persentase penggunaan CPU
- **Memory Usage**: Persentage penggunaan memory
- **Disk I/O**: Rate read/write disk dalam MB/s
- **Network I/O**: Rate traffic network dalam MB/s

**Features**:
- Real-time metrics dengan historical data
- Export data untuk reporting
- Multiple services comparison
- Customizable refresh intervals
- Visual alerts untuk resource tinggi

---

### 4. 🗂️ Service Templates Manager

**Deskripsi**: Buat dan kelola custom service templates untuk deployment yang lebih mudah.

**Cara Menggunakan**:
1. Klik tombol **"Templates"** di halaman Services
2. Klik **"New Template"** untuk membuat template baru
3. Isi informasi template:
   - **Basic Info**: Name, description, category
   - **Docker Config**: Image, ports, environment variables
   - **Resources**: Memory, CPU, disk requirements
   - **Settings**: Public template, favorite

**Template Categories**:
- **Database**: PostgreSQL, MySQL, MongoDB, dll
- **Web Server**: Nginx, Apache, Express, dll
- **API Service**: REST APIs, GraphQL, dll
- **Monitoring**: Grafana, Prometheus, dll
- **Automation**: n8n, Zapier alternatives, dll
- **Other**: Custom applications

**Features**:
- Import/export templates (JSON format)
- Template duplication
- Favorite system untuk quick access
- Tags dan search functionality
- Resource requirement validation

---

### 5. 🛡️ Advanced Backup Manager

**Deskripsi**: Sistem backup dan restore yang comprehensive untuk semua services.

**Cara Menggunakan**:
1. Di halaman Services, klik tombol **"Backup"** pada service card
2. Untuk membuat backup:
   - Masukkan backup name (required)
   - Tambahkan description (optional)
   - Klik "Create Backup"
3. Untuk restore:
   - Pilih backup dari list
   - Klik "Restore"
   - Konfirmasi operasi

**Features**:
- **Storage Usage Monitoring**: Visual bar untuk melihat usage
- **Backup Metadata**: Name, description, size, creation date
- **Download Backups**: Export untuk offline storage
- **One-click Restore**: Point-in-time recovery
- **Bulk Backup**: Via Bulk Operations Manager

**File Format**: Backup disimpan dalam format .tar.gz dengan metadata JSON.

---

## 🎨 UI/UX Improvements

### Modern Design Elements
- **Gradient Backgrounds**: Beautiful color transitions
- **Smooth Animations**: Loading states dan transitions
- **Responsive Layout**: Optimal di semua device sizes
- **Dark Mode Ready**: Siap untuk implementasi dark theme

### Smart Notifications
- **Toast Notifications**: Auto-dismiss dengan berbagai types
- **Progress Indicators**: Visual feedback untuk long operations
- **Loading States**: Enhanced spinners dan skeletons
- **Error Handling**: User-friendly error messages

### Interactive Components
- **Collapsible Widgets**: Minimize/maximize untuk space efficiency
- **Real-time Updates**: Live data tanpa manual refresh
- **Contextual Actions**: Actions yang relevan untuk setiap state
- **Quick Access**: Shortcut untuk common operations

---

## 🚀 Getting Started dengan Enhanced Features

### Setup
1. Pastikan backend dan frontend sudah running
2. Akses `http://localhost:3000`
3. Navigate ke halaman Services

### Quick Demo Flow
1. **Deploy Sample Service**: Deploy PostgreSQL atau n8n
2. **Try Bulk Operations**: Restart multiple services
3. **Setup Health Alerts**: Enable monitoring untuk service
4. **View Analytics**: Check resource usage charts
5. **Create Template**: Buat template dari existing service
6. **Test Backup**: Create dan restore backup

### Best Practices
- **Regular Backups**: Setup periodic backups untuk critical services
- **Monitor Resources**: Set appropriate thresholds untuk alerts
- **Template Organization**: Use tags dan categories untuk templates
- **Bulk Operations**: Use filters untuk avoid accidental operations
- **Analytics Export**: Regular export untuk performance analysis

---

Dokumentasi ini akan terus diperbarui seiring dengan penambahan fitur baru. Untuk pertanyaan atau saran, silakan buat issue di repository GitHub.
