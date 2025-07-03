# CORS & Network Access Fix

## 🔧 Masalah CORS Terperbaiki

### ❌ Error yang Diperbaiki:
```
Access to XMLHttpRequest at 'http://localhost:5000/api/deploy' from origin 'http://192.168.22.18:3000' has been blocked by CORS policy
```

### ✅ Solusi yang Diterapkan:

#### 1. **Backend CORS Configuration**
- **Multiple Origins**: Mendukung localhost, 127.0.0.1, dan semua IP private network
- **Regex Patterns**: Otomatis mendeteksi IP range 192.168.x.x, 10.x.x.x, 172.x.x.x
- **Credentials**: Enable untuk session/cookie support
- **Methods**: Support semua HTTP methods yang dibutuhkan

#### 2. **Frontend API Configuration**
- **Environment Variables**: Menggunakan VITE_API_URL
- **Dynamic Detection**: Otomatis deteksi server IP
- **Centralized Config**: Semua API calls menggunakan config terpusat

#### 3. **Network Auto-Configuration**
- **Script Otomatis**: `configure-network.sh` untuk setup network
- **IP Detection**: Otomatis deteksi local IP address
- **Vite Host Binding**: Frontend bisa diakses dari IP manapun

## 🚀 Cara Menggunakan:

### Setup (Sudah Include Network Config):
```bash
./setup.sh
```

### Manual Network Configuration:
```bash
./configure-network.sh
```

### Hasil Network Setup:
```
Frontend: http://192.168.22.18:3000  # Accessible from any device
Backend:  http://192.168.22.18:5000  # API endpoint
Local:    http://localhost:3000      # Local access
```

## 🌐 Network Access Features:

### ✅ **Multi-Device Access**
- **Smartphone**: Bisa akses dari HP di WiFi yang sama
- **Tablet**: Akses dari tablet/laptop lain
- **Team Access**: Tim bisa akses dari device masing-masing

### ✅ **Auto IP Detection**
- **Dynamic**: Tidak perlu hardcode IP address
- **Flexible**: Otomatis adjust saat IP berubah
- **Cross-Platform**: Works di Linux, macOS, Windows

### ✅ **CORS Security**
- **Private Networks Only**: Hanya allow IP private (192.168.x.x, 10.x.x.x, 172.x.x.x)
- **Development Mode**: CORS relaxed untuk development
- **Production Ready**: Bisa easily switch ke production CORS policy

## 🔧 Manual Configuration:

### Frontend (.env):
```bash
VITE_API_URL=http://192.168.22.18:5000
```

### Backend CORS Origins:
```javascript
origin: [
  'http://localhost:3000',
  'http://127.0.0.1:3000', 
  /^http:\/\/192\.168\.\d+\.\d+:3000$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
  /^http:\/\/172\.\d+\.\d+\.\d+:3000$/
]
```

### Vite Config:
```javascript
server: {
  port: 3000,
  host: '0.0.0.0'  // Accept from any IP
}
```

## 🚨 Troubleshooting:

### Still Getting CORS Error?
1. **Restart Backend**: `cd backend && npm run dev`
2. **Check IP**: `hostname -I` to verify IP
3. **Firewall**: Make sure ports 3000 & 5000 are open
4. **Network**: Ensure devices are on same WiFi/network

### Can't Access from Other Devices?
1. **Check Firewall**: `sudo ufw allow 3000` dan `sudo ufw allow 5000`
2. **Check Network**: Ping test between devices
3. **Check Vite Config**: Ensure `host: '0.0.0.0'`

### API Not Working?
1. **Check Backend Status**: Visit `http://{IP}:5000/api/health`
2. **Check Network Config**: Run `./configure-network.sh` again
3. **Check Environment**: Verify `.env` file has correct IP
