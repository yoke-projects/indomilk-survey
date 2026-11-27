// src/utils/tertarikPOColumns.js
// 38 kolom - gabungan survei_data (tertarik) + po_data

export const TERTARIK_PO_COLUMNS = [
    { key: 'timestamp', label: 'Timestamp', type: 'datetime', source: 'survei' },
    { key: 'tanggal', label: 'Tanggal', type: 'date', source: 'survei' },
    { key: 'bulan', label: 'Bulan', type: 'text', source: 'survei' },
    { key: 'tahun', label: 'Tahun', type: 'text', source: 'survei' },
    { key: 'userid', label: 'User ID', type: 'text', source: 'survei' },
    { key: 'namaPersonil', label: 'Nama Personil', type: 'text', source: 'survei' },
    { key: 'role', label: 'Role', type: 'text', source: 'survei' },
    { key: 'area', label: 'Area', type: 'text', source: 'survei' },
    { key: 'namaSekolah', label: 'Nama Sekolah', type: 'text', source: 'survei' },
    { key: 'kantinName', label: 'Kantin Name', type: 'text', source: 'survei' },
    { key: 'alamatLengkap', label: 'Alamat Lengkap Sekolah', type: 'text', source: 'survei' },
    { key: 'kecamatan', label: 'Kecamatan', type: 'text', source: 'survei' },
    { key: 'kelurahan', label: 'Kelurahan', type: 'text', source: 'survei' },
    { key: 'bertemuDengan', label: 'Bertemu Dengan', type: 'text', source: 'survei' },
    { key: 'sebagai', label: 'Sebagai', type: 'text', source: 'survei' },
    { key: 'noTlp', label: 'No TLP / WA', type: 'text', source: 'survei' },
    { key: 'pemilikTinggal', label: 'Pemilik Tinggal di Sekitar Sekolah?', type: 'text', source: 'survei' },
    { key: 'tagLokasi', label: 'Tag Lokasi', type: 'text', source: 'survei' },
    { key: 'linkAbsenSurvey', label: 'Absen Survey', type: 'url', source: 'survei' },
    { key: 'linkFotoKantin', label: 'Foto Kantin', type: 'url', source: 'survei' },
    { key: 'tertarik', label: 'Tertarik Program?', type: 'text', source: 'survei' },
    { key: 'gradeSekolah', label: 'Grade Sekolah', type: 'grade', source: 'survei' },
    { key: 'bisaStikerChiller', label: 'Stiker Chiller', type: 'text', source: 'survei' },
    { key: 'bisaBanner', label: 'Banner Kantin', type: 'text', source: 'survei' },
    { key: 'bisaTaplak', label: 'Taplak Meja', type: 'text', source: 'survei' },
    { key: 'bisaFloorMat', label: 'Floor Mat', type: 'text', source: 'survei' },
    { key: 'jumlahItemBranding', label: 'Jumlah Item Branding', type: 'number', source: 'computed' },
    { key: 'tglPODatangBatch1', label: 'Tgl PO Datang Batch 1', type: 'date', source: 'po' },
    { key: 'endTglPODatangBatch1', label: 'End Tgl PO Datang Batch 1', type: 'date', source: 'computed' },
    { key: 'sisaHariBatch1', label: 'Sisa Hari Batch 1', type: 'number', source: 'computed' },
    { key: 'totalUHT', label: 'Total PO Indomilk Kids UHT', type: 'number', source: 'po' },
    { key: 'totalBotolCair', label: 'Total PO Indomilk Kids Botol Cair', type: 'number', source: 'po' },
    { key: 'totalYogurt', label: 'Total PO Indomilk Kids Yogurt', type: 'number', source: 'po' },
    { key: 'totalQty', label: 'Total PO QTY', type: 'number', source: 'po' },
    { key: 'kartonUHT', label: 'Total PO Indomilk Kids UHT (Karton)', type: 'number', source: 'computed' },
    { key: 'kartonBotolCair', label: 'Total PO Indomilk Kids Botol Cair (Karton)', type: 'number', source: 'computed' },
    { key: 'kartonYogurt', label: 'Total PO Indomilk Kids Yogurt (Karton)', type: 'number', source: 'computed' },
    { key: 'totalKarton', label: 'Total PO Karton', type: 'number', source: 'computed' },
];

// Helper: Cek apakah kantin tertarik
export const isTertarik = (value) => {
    if (!value) return false;
    const v = String(value).toLowerCase().trim();
    return ['ya', 'tertarik', 'iya', 'yes', 'y', 'setuju', 'mau'].includes(v);
};

// Helper: Cek apakah "BISA"
export const isBisa = (value) => {
    if (!value) return false;
    const v = String(value).toLowerCase().trim();
    return ['bisa', 'ya', 'yes', 'y', 'oke', 'ok'].includes(v);
};

// Helper: Hitung jumlah item branding (kolom 23-26)
export const countItemBranding = (data) => {
    let count = 0;
    if (isBisa(data.bisaStikerChiller)) count++;
    if (isBisa(data.bisaBanner)) count++;
    if (isBisa(data.bisaTaplak)) count++;
    if (isBisa(data.bisaFloorMat)) count++;
    return count;
};

// Helper: Hitung sisa hari dari tanggal
export const hitungSisaHari = (endDateStr) => {
    if (!endDateStr) return '-';
    const end = parseTanggal(endDateStr);
    if (!end) return '-';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff;
};

// Helper: Tambah 30 hari dari tanggal
export const tambahHari = (dateStr, hari) => {
    const d = parseTanggal(dateStr);
    if (!d) return '';
    d.setDate(d.getDate() + hari);
    return formatTanggal(d);
};

// Helper: Format tanggal dd/mm/yyyy
export const formatTanggal = (date) => {
    if (!date || isNaN(date)) return '';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
};

// Helper: Parse tanggal dari berbagai format
export const parseTanggal = (str) => {
    if (!str) return null;
    if (str instanceof Date) return isNaN(str) ? null : str;
    const isSerial = (typeof str === 'number') ||
        (typeof str === 'string' && /^\d{5}(\.\d+)?$/.test(str.trim()));
    if (isSerial) {
        const serial = Number(str);
        if (!isNaN(serial) && serial >= 30000 && serial < 60000) {
            const ms = Math.round((serial - 25569) * 86400 * 1000);
            const d = new Date(ms);
            return isNaN(d) ? null : d;
        }
    }
    if (typeof str !== 'string') return null;
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const y = parseInt(parts[2], 10);
            if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return new Date(y, m, d);
        }
    }
    if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
        }
    }
    const dt = new Date(str);
    return isNaN(dt) ? null : dt;
};

// Helper: Normalize string untuk matching
export const normalizeString = (str) => {
    if (!str) return '';
    return String(str).toLowerCase().trim().replace(/\s+/g, ' ');
};

// Helper: Buat key matching untuk relasi survei <-> PO
export const makeMatchKey = (namaSekolah, namaKantin) => {
    return `${normalizeString(namaSekolah)}|${normalizeString(namaKantin)}`;
};

// Helper: Format currency
export const formatCurrency = (value) => {
    const num = Number(value);
    if (isNaN(num) || num === 0) return '-';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Helper: Hitung karton
export const hitungKarton = (qty, perKarton) => {
    const num = Number(qty) || 0;
    if (perKarton <= 0) return 0;
    return Math.ceil(num / perKarton);
};