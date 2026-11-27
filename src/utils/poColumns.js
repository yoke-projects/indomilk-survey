// src/utils/poColumns.js
// Total: 40 kolom - sesuai persis dengan struktur Excel PO

export const PO_COLUMNS = [
    // 1-4: Timestamp & Tanggal
    { key: 'timestamp', excel: 'TIMESTAMP', label: 'Timestamp', type: 'datetime' },
    { key: 'tanggal', excel: 'TANGGAL', label: 'Tanggal', type: 'date' },
    { key: 'bulan', excel: 'BULAN', label: 'Bulan', type: 'text' },
    { key: 'tahun', excel: 'TAHUN', label: 'Tahun', type: 'text' },

    // 5-8: User Info
    { key: 'userid', excel: 'USERID', label: 'User ID', type: 'text' },
    { key: 'namaPersonil', excel: 'NAMA PERSONIL', label: 'Nama Personil', type: 'text' },
    { key: 'role', excel: 'ROLE', label: 'Role', type: 'text' },
    { key: 'area', excel: 'AREA', label: 'Area', type: 'text' },

    // 9-12: PO Info
    { key: 'namaKantin', excel: 'NAMA KANTIN', label: 'Nama Kantin', type: 'text' },
    { key: 'namaSekolah', excel: 'NAMA SEKOLAH', label: 'Nama Sekolah', type: 'text' },
    { key: 'nomorPO', excel: 'NOMOR PO', label: 'Nomor PO', type: 'text' },
    { key: 'tanggalPembuatanPO', excel: 'TANGGAL PEMBUATAN PO', label: 'Tgl Pembuatan PO', type: 'date' },

    // 13-17: Indomilk Kids UHT (angka)
    { key: 'kidsUhtCokelat', excel: 'Indomilk Kids UHT Cokelat', label: 'Kids UHT Cokelat', type: 'number' },
    { key: 'kidsUhtCokelatLessSugar', excel: 'Indomilk Kids UHT Cokelat Less Sugar', label: 'Kids UHT Cokelat Less Sugar', type: 'number' },
    { key: 'kidsUhtStroberi', excel: 'Indomilk Kids UHT Stroberi', label: 'Kids UHT Stroberi', type: 'number' },
    { key: 'kidsUhtVanila', excel: 'Indomilk Kids UHT Vanila', label: 'Kids UHT Vanila', type: 'number' },
    { key: 'kidsUhtFullCream', excel: 'Indomilk Kids UHT Full Cream', label: 'Kids UHT Full Cream', type: 'number' },

    // 18-20: Susu Botol Cair (angka)
    { key: 'kidsBotolStroberi', excel: 'Indomilk Kids Susu Botol Cair Stroberi', label: 'Kids Botol Stroberi', type: 'number' },
    { key: 'kidsBotolCokelat', excel: 'Indomilk Kids Susu Botol Cair Cokelat', label: 'Kids Botol Cokelat', type: 'number' },
    { key: 'kidsBotolMelon', excel: 'Indomilk Kids Susu Botol Cair Melon', label: 'Kids Botol Melon', type: 'number' },

    // 21-23: Yogurt (angka)
    { key: 'kidsYogurtOriginal', excel: 'Indomilk Kids Yogurt Original', label: 'Kids Yogurt Original', type: 'number' },
    { key: 'kidsYogurtBlueberry', excel: 'Indomilk Kids Yogurt Blueberry', label: 'Kids Yogurt Blueberry', type: 'number' },
    { key: 'kidsYogurtStrawberry', excel: 'Indomilk Kids Yogurt Strawberry', label: 'Kids Yogurt Strawberry', type: 'number' },

    // 24-25: Foto & Estimasi
    { key: 'linkFotoSuratPO', excel: 'FOTO SURAT PO', label: 'Link Foto Surat PO', type: 'url' },
    { key: 'estimasiPengiriman', excel: 'ESTIMASI PENGIRIMAN BARANG', label: 'Estimasi Pengiriman', type: 'date' },

    // 26-27: Status PO
    { key: 'tanggalPODatang', excel: 'TANGGAL PO DATANG', label: 'Tgl PO Datang', type: 'date' },
    { key: 'tglFakturTerbit', excel: 'TGL FAKTUR TERBIT', label: 'Tgl Faktur Terbit', type: 'date' },

    // 28-29: Foto Surat Jalan & Invoice
    { key: 'linkFotoSuratJalan', excel: 'FOTO SURAT JALAN', label: 'Link Foto Surat Jalan', type: 'url' },
    { key: 'linkFotoInvoice', excel: 'FOTO INVOICE', label: 'Link Foto Invoice', type: 'url' },

    // 30: Nominal Invoice
    { key: 'nominalInvoice', excel: 'NOMINAL INVOICE', label: 'Nominal Invoice', type: 'currency' },

    // 31-32: Foto Bukti & Barang
    { key: 'linkFotoBuktiPembayaran', excel: 'FOTO BUKTI PEMBAYARAN', label: 'Link Bukti Pembayaran', type: 'url' },
    { key: 'linkFotoBarangPODiantar', excel: 'FOTO BARANG PO DIANTAR', label: 'Link Barang PO Diantar', type: 'url' },

    // 33-36: Auto Total
    { key: 'totalUHT', excel: 'TOTAL Indomilk Kids UHT', label: 'Total UHT', type: 'number' },
    { key: 'totalBotolCair', excel: 'TOTAL Indomilk Kids Botol Cair', label: 'Total Botol Cair', type: 'number' },
    { key: 'totalYogurt', excel: 'TOTAL Indomilk Kids Yogurt', label: 'Total Yogurt', type: 'number' },
    { key: 'totalQty', excel: 'TOTAL QTY', label: 'Total Qty', type: 'number' },

    // 37-40: IMG (auto dari link)
    { key: 'imgFotoSuratPO', excel: 'IMG FOTO SURAT PO', label: 'Img Surat PO', type: 'image' },
    { key: 'imgFotoInvoice', excel: 'IMG FOTO INVOICE', label: 'Img Invoice', type: 'image' },
    { key: 'imgFotoBuktiPembayaran', excel: 'IMG FOTO BUKTI PEMBAYARAN', label: 'Img Bukti Pembayaran', type: 'image' },
    { key: 'imgFotoBarangPODiantar', excel: 'IMG FOTO BARANG PO DIANTAR', label: 'Img Barang Diantar', type: 'image' },
];

// Mapping kolom IMG ? kolom LINK yang sesuai (auto-fill saat upload)
export const PO_IMAGE_TO_LINK_MAPPING = {
    'imgFotoSuratPO': 'linkFotoSuratPO',
    'imgFotoInvoice': 'linkFotoInvoice',
    'imgFotoBuktiPembayaran': 'linkFotoBuktiPembayaran',
    'imgFotoBarangPODiantar': 'linkFotoBarangPODiantar',
};

// Helper: Hitung TOTAL UHT (kolom 13-17)
export const calculateTotalUHT = (data) => {
    const fields = ['kidsUhtCokelat', 'kidsUhtCokelatLessSugar', 'kidsUhtStroberi', 'kidsUhtVanila', 'kidsUhtFullCream'];
    return fields.reduce((sum, f) => sum + (Number(data[f]) || 0), 0);
};

// Helper: Hitung TOTAL Botol Cair (kolom 18-20)
export const calculateTotalBotolCair = (data) => {
    const fields = ['kidsBotolStroberi', 'kidsBotolCokelat', 'kidsBotolMelon'];
    return fields.reduce((sum, f) => sum + (Number(data[f]) || 0), 0);
};

// Helper: Hitung TOTAL Yogurt (kolom 21-23)
export const calculateTotalYogurt = (data) => {
    const fields = ['kidsYogurtOriginal', 'kidsYogurtBlueberry', 'kidsYogurtStrawberry'];
    return fields.reduce((sum, f) => sum + (Number(data[f]) || 0), 0);
};

// Helper: Hitung TOTAL QTY (kolom 33+34+35)
export const calculateTotalQty = (data) => {
    return calculateTotalUHT(data) + calculateTotalBotolCair(data) + calculateTotalYogurt(data);
};

// Helper: Hitung semua total sekaligus
export const calculateAllTotals = (data) => {
    const totalUHT = calculateTotalUHT(data);
    const totalBotolCair = calculateTotalBotolCair(data);
    const totalYogurt = calculateTotalYogurt(data);
    return {
        totalUHT,
        totalBotolCair,
        totalYogurt,
        totalQty: totalUHT + totalBotolCair + totalYogurt,
    };
};

// Helper: Normalisasi header Excel
export const normalizeHeader = (header) => {
    return String(header || '').trim().replace(/\s+/g, ' ').toLowerCase();
};

// Helper: Build mapping header Excel ? field key (case-insensitive)
export const buildPOMapping = () => {
    const mapping = {};
    PO_COLUMNS.forEach(col => {
        mapping[normalizeHeader(col.excel)] = col.key;
    });
    return mapping;
};

// Helper: Format currency #,###,###
export const formatCurrency = (value) => {
    const num = Number(value);
    if (isNaN(num) || num === 0) return '-';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

// Helper: Parse input date yyyy-mm-dd
export const parseInputDate = (str) => {
    if (!str) return null;
    const parts = str.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return new Date(y, m, d);
};

// Helper: Get nama bulan Indonesia
export const getNamaBulan = (date) => {
    const months = ['JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI','JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER'];
    if (!date || isNaN(date)) return '';
    return months[date.getMonth()];
};