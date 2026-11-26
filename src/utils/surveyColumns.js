// src/utils/surveyColumns.js
// Total: 78 kolom - sesuai persis dengan struktur Excel

export const SURVEY_COLUMNS = [
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

    // 9-13: Sekolah Info
    { key: 'namaSekolah', excel: 'NAMA SEKOLAH', label: 'Nama Sekolah', type: 'text' },
    { key: 'kantinName', excel: 'KANTIN NAME', label: 'Kantin Name', type: 'text' },
    { key: 'alamatLengkap', excel: 'ALAMAT LENGKAP SEKOLAH', label: 'Alamat Lengkap Sekolah', type: 'text' },
    { key: 'kecamatan', excel: 'KECAMATAN', label: 'Kecamatan', type: 'text' },
    { key: 'kelurahan', excel: 'KELURAHAN', label: 'Kelurahan', type: 'text' },

    // 14-18: Kontak & Lokasi
    { key: 'bertemuDengan', excel: 'BERTEMU DENGAN', label: 'Bertemu Dengan', type: 'text' },
    { key: 'sebagai', excel: 'SEBAGAI', label: 'Sebagai', type: 'text' },
    { key: 'noTlp', excel: 'NO TLP / WA', label: 'No TLP / WA', type: 'text' },
    { key: 'pemilikTinggal', excel: 'Apakah Pemilik Kantin Tinggal di Sekitar Sekolah?', label: 'Pemilik Tinggal di Sekitar Sekolah?', type: 'text' },
    { key: 'tagLokasi', excel: 'TAG LOKASI', label: 'Tag Lokasi', type: 'text' },

    // 19-20: Foto Awal (URL image, tampil sebagai link)
    { key: 'absenSurvey', excel: 'ABSEN SURVEY', label: 'Absen Survey', type: 'url' },
    { key: 'fotoKantin', excel: 'FOTO KANTIN', label: 'Foto Kantin', type: 'url' },

    // 21-25: Program & Perizinan
    { key: 'tertarik', excel: 'Apakah kantin tertarik mengikuti program?', label: 'Tertarik Program?', type: 'text' },
    { key: 'alasanTidakTertarik', excel: 'Alasan tidak tertarik', label: 'Alasan Tidak Tertarik', type: 'text' },
    { key: 'surveyProfile', excel: 'SURVEY PROFILE KANTIN DAN PERIZINAN', label: 'Survey Profile Kantin & Perizinan', type: 'text' },
    { key: 'pemberiIzinBranding', excel: 'Untuk pemasangan Branding banner kantin, taplak meja, stiker chiller Indomilk, siapa yang berhak memberikan izin?', label: 'Pemberi Izin Branding', type: 'text' },
    { key: 'skemaKompensasi', excel: 'Berdasarkan info dari kantin, jika ada brand masuk untuk branding, bagaimana skema kompensasi/izin yang biasa berlaku di sini?', label: 'Skema Kompensasi Branding', type: 'text' },

    // 26-28: Rekening
    { key: 'noRekening', excel: 'NO REKENING KANTIN', label: 'No Rekening Kantin', type: 'text' },
    { key: 'namaBank', excel: 'NAMA BANK', label: 'Nama Bank', type: 'text' },
    { key: 'rekeningAtasNama', excel: 'REKENING ATAS NAMA', label: 'Rekening Atas Nama', type: 'text' },

    // 29-38: Penilaian & Insight
    { key: 'jarakHomebase', excel: 'Jarak Homebase ke Sekolah', label: 'Jarak Homebase ke Sekolah', type: 'text' },
    { key: 'dukunganSekolah', excel: 'Dukungan / Kooperasi Pihak Sekolah', label: 'Dukungan / Kooperasi Pihak Sekolah', type: 'text' },
    { key: 'komitmenPedagang', excel: 'Komitmen Pedagang & Target Order Produk', label: 'Komitmen Pedagang & Target Order', type: 'text' },
    { key: 'potensiTraffic', excel: 'Potensi Traffic Siswa', label: 'Potensi Traffic Siswa', type: 'text' },
    { key: 'programMBG', excel: 'Apakah sekolah ini sudah menerima atau menjadi sasaran Program Makan Bergizi Gratis (MBG) dari pemerintah?', label: 'Program MBG', type: 'text' },
    { key: 'potensiDayaBeli', excel: 'Potensi Daya Beli Kantin', label: 'Potensi Daya Beli Kantin', type: 'text' },
    { key: 'kesiapanChiller', excel: 'Kesiapan Chiller', label: 'Kesiapan Chiller', type: 'text' },
    { key: 'riwayatProgram', excel: 'Riwayat Program / Retensi', label: 'Riwayat Program / Retensi', type: 'text' },
    { key: 'kesiapanChillerDetail', excel: 'Kesiapan Chiller * (3 indikator: (a) listrik stabil, (b) tersedia chiller bukan kulkas tertutup, (c) tempat aman untuk display produk )', label: 'Kesiapan Chiller (3 Indikator)', type: 'text' },
    { key: 'insightKhusus', excel: 'Insight Khusus', label: 'Insight Khusus', type: 'text' },

    // 39-41: Stiker Chiller
    { key: 'bisaStikerChiller', excel: 'BISA PASANG STIKER CHILLER?', label: 'Bisa Pasang Stiker Chiller?', type: 'text' },
    { key: 'fotoPosisiStiker', excel: 'FOTO POSISI YANG AKAN DIPASANG STIKER CHILLER', label: 'Foto Posisi Stiker Chiller', type: 'url' },
    { key: 'alasanTidakStiker', excel: 'KENAPA TIDAK BISA PASANG STIKER CHILLER?', label: 'Alasan Tidak Pasang Stiker', type: 'text' },

    // 42-46: Banner Kantin
    { key: 'bisaBanner', excel: 'BISA PASANG BANNER KANTIN?', label: 'Bisa Pasang Banner Kantin?', type: 'text' },
    { key: 'posisiBanner', excel: 'POSISI PASANG BANNER KANTIN DIMANA?', label: 'Posisi Pasang Banner', type: 'text' },
    { key: 'fotoPosisiBanner', excel: 'FOTO POSISI YANG AKAN DIPASANG BANNER KANTIN', label: 'Foto Posisi Banner', type: 'url' },
    { key: 'ukuranBanner', excel: 'UKURAN BANNER KANTIN', label: 'Ukuran Banner Kantin', type: 'text' },
    { key: 'alasanTidakBanner', excel: 'KENAPA TIDAK BISA PASANG BANNER KANTIN?', label: 'Alasan Tidak Pasang Banner', type: 'text' },

    // 47-52: Taplak Meja
    { key: 'ketersediaanMeja', excel: 'KETERSEDIAAN MEJA KANTIN', label: 'Ketersediaan Meja Kantin', type: 'text' },
    { key: 'bisaTaplak', excel: 'BISA PASANG TAPLAK MEJA?', label: 'Bisa Pasang Taplak Meja?', type: 'text' },
    { key: 'jumlahTaplak', excel: 'BERAPA JUMLAH TAPLAK YANG DIPERLUKAN?', label: 'Jumlah Taplak Diperlukan', type: 'text' },
    { key: 'ukuranTaplak', excel: 'UKURAN TAPLAK MEJA', label: 'Ukuran Taplak Meja', type: 'text' },
    { key: 'fotoPosisiTaplak', excel: 'FOTO POSISI YANG AKAN DIPASANG TAPLAK MEJA', label: 'Foto Posisi Taplak Meja', type: 'url' },
    { key: 'alasanTidakTaplak', excel: 'KENAPA TIDAK BISA BISA PASANG TAPLAK MEJA?', label: 'Alasan Tidak Pasang Taplak', type: 'text' },

    // 53-55: Floor Mat
    { key: 'bisaFloorMat', excel: 'BISA PASANG FLOOR MAT?', label: 'Bisa Pasang Floor Mat?', type: 'text' },
    { key: 'fotoPosisiFloorMat', excel: 'FOTO POSISI YANG AKAN DIPASANG FLOOR MAT', label: 'Foto Posisi Floor Mat', type: 'url' },
    { key: 'alasanTidakFloorMat', excel: 'KENAPA TIDAK BISA PASANG FLOOR MAT?', label: 'Alasan Tidak Pasang Floor Mat', type: 'text' },

    // 56-64: Skor Individual
    { key: 'skor', excel: 'SKOR', label: 'Skor', type: 'number' },
    { key: 'skorJarak', excel: 'SKOR Jarak Homebase ke Sekolah', label: 'Skor Jarak Homebase', type: 'number' },
    { key: 'skorDukungan', excel: 'SKOR Dukungan / Kooperasi Pihak Sekolah', label: 'Skor Dukungan Sekolah', type: 'number' },
    { key: 'skorKomitmen', excel: 'SKOR Komitmen Pedagang & Target Order Produk', label: 'Skor Komitmen Pedagang', type: 'number' },
    { key: 'skorTraffic', excel: 'SKOR Potensi Traffic Siswa', label: 'Skor Potensi Traffic', type: 'number' },
    { key: 'skorMBG', excel: 'SKOR Apakah sekolah ini sudah menerima atau menjadi sasaran Program Makan Bergizi Gratis (MBG) dari pemerintah?', label: 'Skor Program MBG', type: 'number' },
    { key: 'skorDayaBeli', excel: 'SKOR Potensi Daya Beli Kantin', label: 'Skor Potensi Daya Beli', type: 'number' },
    { key: 'skorChiller', excel: 'SKOR Kesiapan Chiller', label: 'Skor Kesiapan Chiller', type: 'number' },
    { key: 'skorRiwayat', excel: 'SKOR Riwayat Program / Retensi', label: 'Skor Riwayat Program', type: 'number' },

    // 65-66: Total & Grade
    { key: 'totalSkor', excel: 'TOTAL SKOR', label: 'Total Skor', type: 'number' },
    { key: 'gradeSekolah', excel: 'GRADE SEKOLAH', label: 'Grade Sekolah', type: 'grade' },

    // 67-78: LINK + IMG (6 pasang)
    { key: 'linkAbsenSurvey', excel: 'LINK ABSEN SURVEY', label: 'Link Absen Survey', type: 'url' },
    { key: 'imgAbsenSurvey', excel: 'IMG ABSEN SURVEY', label: 'Img Absen Survey', type: 'image' },
    { key: 'linkFotoKantin', excel: 'LINK FOTO KANTIN', label: 'Link Foto Kantin', type: 'url' },
    { key: 'imgFotoKantin', excel: 'IMG FOTO KANTIN', label: 'Img Foto Kantin', type: 'image' },
    { key: 'linkFotoStiker', excel: 'LINK FOTO POSISI YANG AKAN DIPASANG STIKER CHILLER', label: 'Link Foto Stiker Chiller', type: 'url' },
    { key: 'imgFotoStiker', excel: 'IMG FOTO POSISI YANG AKAN DIPASANG STIKER CHILLER', label: 'Img Foto Stiker Chiller', type: 'image' },
    { key: 'linkFotoBanner', excel: 'LINK FOTO POSISI YANG AKAN DIPASANG BANNER KANTIN', label: 'Link Foto Banner', type: 'url' },
    { key: 'imgFotoBanner', excel: 'IMG FOTO POSISI YANG AKAN DIPASANG BANNER KANTIN', label: 'Img Foto Banner', type: 'image' },
    { key: 'linkFotoTaplak', excel: 'LINK FOTO POSISI YANG AKAN DIPASANG TAPLAK MEJA', label: 'Link Foto Taplak Meja', type: 'url' },
    { key: 'imgFotoTaplak', excel: 'IMG FOTO POSISI YANG AKAN DIPASANG TAPLAK MEJA', label: 'Img Foto Taplak Meja', type: 'image' },
    { key: 'linkFotoFloorMat', excel: 'LINK FOTO POSISI YANG AKAN DIPASANG FLOOR MAT', label: 'Link Foto Floor Mat', type: 'url' },
    { key: 'imgFotoFloorMat', excel: 'IMG FOTO POSISI YANG AKAN DIPASANG FLOOR MAT', label: 'Img Foto Floor Mat', type: 'image' },
];

// Mapping kolom IMG ? kolom LINK yang sesuai (untuk auto-fill saat upload)
export const IMAGE_TO_LINK_MAPPING = {
    'imgAbsenSurvey': 'linkAbsenSurvey',
    'imgFotoKantin': 'linkFotoKantin',
    'imgFotoStiker': 'linkFotoStiker',
    'imgFotoBanner': 'linkFotoBanner',
    'imgFotoTaplak': 'linkFotoTaplak',
    'imgFotoFloorMat': 'linkFotoFloorMat',
};

// Helper: Hitung Grade berdasarkan Total Skor
export const calculateGrade = (totalSkor) => {
    const score = Number(totalSkor);
    if (isNaN(score)) return '-';
    if (score >= 25) return 'A';
    if (score >= 17) return 'B';
    return 'C';
};

// Helper: Hitung Total Skor dari 8 kolom skor individual (kolom 57-64)
export const calculateTotalSkor = (data) => {
    const skorFields = [
        'skorJarak', 'skorDukungan', 'skorKomitmen', 'skorTraffic',
        'skorMBG', 'skorDayaBeli', 'skorChiller', 'skorRiwayat'
    ];
    return skorFields.reduce((sum, field) => {
        const val = Number(data[field]);
        return sum + (isNaN(val) ? 0 : val);
    }, 0);
};

// Helper: Normalisasi header Excel
export const normalizeHeader = (header) => {
    return String(header || '').trim().replace(/\s+/g, ' ');
};

// Helper: Build mapping header Excel ? field key
export const buildExcelMapping = () => {
    const mapping = {};
    SURVEY_COLUMNS.forEach(col => {
        mapping[normalizeHeader(col.excel)] = col.key;
    });
    return mapping;
};

// Kolom foto untuk drawer detail
export const PHOTO_FIELDS = [
    { key: 'linkAbsenSurvey', label: 'Absen Survey' },
    { key: 'linkFotoKantin', label: 'Foto Kantin' },
    { key: 'linkFotoStiker', label: 'Posisi Stiker Chiller' },
    { key: 'linkFotoBanner', label: 'Posisi Banner' },
    { key: 'linkFotoTaplak', label: 'Posisi Taplak Meja' },
    { key: 'linkFotoFloorMat', label: 'Posisi Floor Mat' },
];