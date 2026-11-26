import { exposeFn } from '../core/state.js';

export var BRAND_DB = {
  "ayam geprek sai": {
    nama: "AYAM GEPREK SA'I",
    entitas: "Ayam Geprek Sa'i (Kemitraan Nasional)",
    model: "Jaringan gerai/restoran ayam geprek & fried chicken terjangkau (dine-in & takeaway) untuk pelajar dan keluarga",
    produk: "Ayam Geprek Sambal Bawang, Ayam Crispy, Paket Nasi Ayam Hemat",
    harga: "Rp10.000 - Rp20.000 per paket",
    c1: "#FC0202", c2: "#049935",
    font: "Fredoka",
    tagline: "Kenikmatan dalam Kesederhanaan",
    tagline_asli: true,
    kunci: "Ayam Geprek",
    kompetitor: "Rocket Chicken",
    kompetitor_web: "rocketchicken.co.id",
    kompetitor_ig: "rocketchickenofficial",
    web: "ayamgepreksai.com",
    ig: "ayamgepreksai.official",
    segmen: "BAWAH"
  },
  "geprek sai": {
    nama: "AYAM GEPREK SA'I",
    entitas: "Ayam Geprek Sa'i (Kemitraan Nasional)",
    model: "Jaringan gerai/restoran ayam geprek & fried chicken terjangkau (dine-in & takeaway) untuk pelajar dan keluarga",
    produk: "Ayam Geprek Sambal Bawang, Ayam Crispy, Paket Nasi Ayam Hemat",
    harga: "Rp10.000 - Rp20.000 per paket",
    c1: "#FC0202", c2: "#049935",
    font: "Fredoka",
    tagline: "Kenikmatan dalam Kesederhanaan",
    tagline_asli: true,
    kunci: "Ayam Geprek",
    kompetitor: "Rocket Chicken",
    kompetitor_web: "rocketchicken.co.id",
    kompetitor_ig: "rocketchickenofficial",
    web: "ayamgepreksai.com",
    ig: "ayamgepreksai.official",
    segmen: "BAWAH"
  },
  "mie gacoan": {
    nama: "MIE GACOAN",
    entitas: "PT Pesta Pora Abadi",
    model: "Jaringan restoran mie pedas ber-outlet (dine-in, takeaway, ojol) terbesar di Indonesia — BUKAN mie instan kemasan",
    produk: "Mie Suit, Mie Hompimpa, Mie Gacoan level 1-8, Dimsum Udang Keju, Udang Rambutan, Es Gobak Sodor",
    harga: "Rp10.000 - Rp15.000 per porsi",
    c1: "#E51B78", c2: "#00A896",
    font: "Fredoka",
    tagline: "Mie Pedas No. 1 di Indonesia",
    tagline_asli: true,
    kunci: "Mie Pedas",
    kompetitor: "Wizzmie",
    kompetitor_web: "wizzmie.com",
    kompetitor_ig: "wizzmie",
    web: "miegacoan.co.id",
    ig: "mie.gacoan",
    segmen: "ATAS"
  },
  "mixue": {
    nama: "MIXUE",
    entitas: "Mixue Ice Cream & Tea",
    model: "Jaringan gerai ritel es krim cone & minuman teh segar ber-outlet masif",
    produk: "Fresh Ice Cream Cone, Boba Sundae, Mi-Sundae, Fresh Squeezed Lemonade, Pearl Milk Tea",
    harga: "Rp8.000 - Rp22.000 per item",
    c1: "#E60012", c2: "#212121",
    font: "Fredoka",
    tagline: "Since 1997 · Ice Cream & Tea",
    tagline_asli: true,
    kunci: "Es Krim",
    kompetitor: "Momoyo",
    kompetitor_web: "",
    kompetitor_ig: "momoyoindonesia",
    web: "mixue.co",
    ig: "mixueindonesia",
    segmen: "ATAS"
  },
  "kopi kenangan": {
    nama: "KOPI KENANGAN",
    entitas: "PT Bumi Berkah Boga",
    model: "Jaringan gerai kopi kekinian grab-and-go & aplikasi pemesanan (New Retail F&B)",
    produk: "Kopi Kenangan Mantan, Kopi Susu Gula Aren, Cerita Roti, Chigo",
    harga: "Rp18.000 - Rp35.000 per cup",
    c1: "#231F20", c2: "#C62828",
    font: "Plus Jakarta Sans",
    tagline: "Kopi Berkualitas Tinggi dengan Harga Terjangkau",
    tagline_asli: true,
    kunci: "Kopi Susu",
    kompetitor: "Janji Jiwa",
    kompetitor_web: "jiwagroup.com",
    kompetitor_ig: "kopijanjijiwa",
    web: "kopikenangan.com",
    ig: "kopikenangan.id",
    segmen: "ATAS"
  },
  "janji jiwa": {
    nama: "JANJI JIWA",
    entitas: "Jiwa Group",
    model: "Jaringan gerai kopi & roti panggang (Jiwa Toast) berbasis kemitraan outlet di seluruh Indonesia",
    produk: "Es Kopi Susu, Kopi Soklat, Jiwa Toast Egg & Cheese",
    harga: "Rp18.000 - Rp38.000 per item",
    c1: "#181818", c2: "#6D4C41",
    font: "Montserrat",
    tagline: "Kopi dari Hati",
    tagline_asli: true,
    kunci: "Kopi Toast",
    kompetitor: "Kopi Kenangan",
    kompetitor_web: "kopikenangan.com",
    kompetitor_ig: "kopikenangan.id",
    web: "jiwagroup.com",
    ig: "kopijanjijiwa",
    segmen: "ATAS"
  },
  "buavita": {
    nama: "BUAVITA",
    entitas: "PT Unilever Indonesia Tbk",
    model: "Minuman jus buah kemasan kotak UHT siap minum (RTD) distribusi ritel nasional",
    produk: "Buavita Mango, Guava, Orange, Apple, Lychee kemasan 250ml & 1000ml",
    harga: "Rp7.500 - Rp26.000 di minimarket/supermarket",
    c1: "#2E7D32", c2: "#FF8F00",
    font: "Fredoka",
    tagline: "Kebaikan Buah Asli",
    tagline_asli: true,
    kunci: "Jus Kemasan",
    kompetitor: "Country Choice",
    kompetitor_web: "",
    kompetitor_ig: "countrychoiceid",
    web: "unilever.co.id",
    ig: "buavitaid",
    segmen: "ATAS"
  }
};

export function lookupBrandDB(name){
  var q = String(name || "").toLowerCase().trim().replace(/['’`]/g, "").replace(/[^a-z0-9\s!]/g, "");
  if(!q) return null;
  if(BRAND_DB[q]) return BRAND_DB[q];
  var keys = Object.keys(BRAND_DB);
  for(var i = 0; i < keys.length; i++){
    var k = keys[i];
    if(q.indexOf(k) > -1 || k.indexOf(q) > -1) return BRAND_DB[k];
  }
  return null;
}

export var MKT = 'GAYA BAHASA MARKETING: ringkas, tegas, dan mudah diingat seluruh karyawan dalam satu tarikan napas (maksimal 9 kata), tanpa tanda koma, tanpa menyebut target audiens atau nama brand. Rumus: JENIS PRODUK + 1 sampai 3 keunggulan berimbuhan "Ter-" (hubungkan dengan "&") + penegas "No.1" atau "Pertama" atau "Terbaik" + "di" TERITORI. Contoh bagus: "Mie Terpedas No.1 di Indonesia" dan "Jus RTD Terpagi & Tersehat Pertama di Indonesia". Hindari frasa deskriptif panjang.';

export var RUB = 'RUBRIK SEGMEN. Pasar dibagi dua kutub: BAWAH = UMKM/informal atau gerai/kemitraan ekonomis harga rakyat (mis. gerobak/booth pinggir jalan, warung/gerai ayam geprek ekonomis Rp10-15 ribuan); ATAS = produk/jaringan bermerek besar, berizin lengkap, dan terstandar pabrik/corporate/modern, termasuk "affordable luxury". Nilai tiap indikator 1-5: 1 = setara UMKM/warung ekonomis, 3 = merek berizin skala massal/corporate/outlet modern, 5 = premium/butik. Indikator: harga (rasio harga per porsi/volume), higienitas (higienitas, izin BPOM/PIRT/halal, standar dapur/pabrik), kemasan (material, desain, kesan modern), iklan (kanal & skala komunikasi), tempat (kanal jual: pasar/warung/kios sampai outlet modern/minimarket/mall), angle (positioning & persepsi), dayabeli (kemampuan bayar target pelanggan). Alasan tiap indikator wajib berisi fakta nyata dalam Bahasa Indonesia.';

export var BX = [
  {k:"kompetitor",n:1,t:"Kompetitor",r:"Brand yang ingin kamu congkel (benchmark/pesaing).",f:[["kompetitor","nama brand pesaing utama, kapital"]]},
  {k:"pain",n:2,t:"Pain",r:"Rasa khawatir, takut, kecewa KONSUMEN KOMPETITOR yang sudah dikunci (dari sisi produk, layanan, kegiatan sosial perusahaan, dan persepsi brand terhadap konsumen).",f:[1,2,3,4,5].map(function(i){return["pain"+i,"kekhawatiran/kekecewaan konsumen kompetitor #"+i+", maks 9 kata"]})},
  {k:"gain",n:3,t:"Gain",r:"Mirror/lawan dari Pain: harapan konsumen kompetitor yang belum terpenuhi, sekaligus value unggul yang akan dieksekusi brand pengguna untuk mencongkel kompetitor.",f:[1,2,3,4,5].map(function(i){return["gain"+i,"mirror pain #"+i+" sebagai value unggul brand pengguna, maks 9 kata"]})},
  {k:"segmen",n:4,t:"Segmen",r:"Wajib setara (apple-to-apple) dengan segmen kompetitor yang sudah dikunci: ATAS atau BAWAH.",f:[["segmen","WAJIB sama dengan segmen kompetitor: ATAS atau BAWAH"]]},
  {k:"user",n:5,t:"User Spesifik",r:"Rumus Bahasa Indonesia: Gender + Pekerjaan/Profil + Gaya Hidup/Kebiasaan + Harapan & Impian untuk kebiasaan itu + Performa Terbaik di aktivitas/pekerjaan. Contoh: Wanita Karir, Diet & Hidup Sehat, Sarapan Jus Tanpa Drama, Gak Telat Absen Kantor.",f:[["usertitle","gender + pekerjaan/profil dalam Bahasa Indonesia, kapital, mis. WANITA KARIR"],["usersub","tiga bagian berurutan dalam Bahasa Indonesia dipisah koma: gaya hidup/kebiasaan, harapan & impian untuk kebiasaan itu, performa terbaik di aktivitas/pekerjaan, mis. Diet & Hidup Sehat, Sarapan Jus Tanpa Drama, Gak Telat Absen Kantor"],["usia","mis. USIA 24 - 40 TAHUN"]]},
  {k:"meja",n:6,t:"7 Meja Perdebatan",r:"Tempat dan kondisi nyata di mana user spesifik berkumpul dan memperdebatkan beli di mana, selaras dengan Segmen, User Spesifik, dan jam berjualan.",f:[1,2,3,4,5,6,7].map(function(i){return["meja"+i,"tempat/komunitas berkumpul #"+i+", singkat"]})},
  {k:"positioning",n:7,t:"Positioning",r:"Jenis produk + 1-3 keunggulan + teritori. Keunggulan waktu dari jam berjualan, keunggulan manfaat dari Gain terbaik yang diperkuat User Spesifik, format atau kemasan dari kesimpulan ritual User, disesuaikan dengan Segmen.",f:[["positioning","satu frasa singkat: jenis produk + 1-3 keunggulan terkuat dari Gain untuk mencongkel kompetitor + teritori yang dikuasai, bahasa marketing ringkas mudah diingat, mis. Mie Terpedas No.1 di Indonesia atau Jus RTD Terpagi & Tersehat Pertama di Indonesia"]]},
  {k:"tagline",n:8,t:"Tagline",r:"Maksimal 4 kata, sangat simpel, mudah diingat alam bawah sadar dan mudah diucapkan customer introvert, sehingga memengaruhi persepsi forum (meja perdebatan) untuk memilih brand ini. Mengubah KK menjadi NC lewat para RC.",f:[["tagline","tagline hashtag camelCase maksimal 4 kata, diawali # dan diakhiri !, mis. #JusGulaTropicana!"]]},
  {k:"nama",n:9,t:"Nama Brand",r:"Muncul di batin, nyanggong hati pelanggan: nama yang sudah terucap di batin saat butuh (Level 1), atau jenis produk + vokal/imbuhan (Level 2).",f:[["nama","nama brand pendek, mudah diingat"]]},
  {k:"warna",n:"10a",t:"Corporate Color",r:"Dua warna korporat (hex) beserta filosofi warna: makna kedua warna bagi brand dan persepsi pelanggan.",f:[["c1","hex warna utama, mis. #e61d4c"],["c2","hex warna kedua, mis. #28623c"],["filw","filosofi warna: makna kedua warna dalam 1 kalimat maksimal 20 kata"]]},
  {k:"font",n:"10b",t:"Font Type",r:"Font brand dari Google Fonts yang cocok dengan karakter brand dan user spesifik. Pengguna juga bisa upload font sendiri.",f:[["font","nama font dari Google Fonts saja tanpa keterangan, mis. Plus Jakarta Sans"],["filf","filosofi font: alasan memilih font dalam 1 kalimat maksimal 20 kata"]]},
  {k:"logobg",n:"10c",t:"Logo in Background Color",r:"Logo (nama brand + tagline sebagai satu kesatuan) berhuruf putih di atas latar warna korporat.",f:[["bg1","hex latar logo 1, turunan warna korporat"],["bg2","hex latar logo 2, turunan warna korporat"],["bg3","hex latar logo 3, turunan warna korporat"]]},
  {k:"kunci",n:11,t:"Kata Kunci",r:"Persepsi yang ingin dibentuk di benak pelanggan: HANYA SATU kata kunci, TEPAT 2 kata (mis. Jus Sehat), karena hanya ada satu slot untuk satu nama brand di benak user spesifik (Aqua = air mineral, Sanyo = pompa air, Nike = sepatu sport).",f:[["kunci","SATU kata kunci TEPAT 2 kata, intisari Tagline dan Positioning, mis. Jus Sehat"]]},
  {k:"web",n:12,t:"Nama Website",r:"www. + kata kunci + .id",f:[["web","format www.katakunci.id huruf kecil, dari kata kunci tanpa spasi"]]}
];

export var RK = ["harga","higienitas","kemasan","iklan","tempat","angle","dayabeli"];

export var RL = {
  harga: "Harga per volume/porsi",
  higienitas: "Higienitas & kepercayaan merek",
  kemasan: "Kemasan & penyajian",
  iklan: "Iklan & viralitas",
  tempat: "Tempat jual / jaringan outlet",
  angle: "Angle & daya tarik",
  dayabeli: "Daya beli target"
};

export var COL = [
  ["Merah","#E53935","berani, semangat & menggugah selera"],
  ["Oranye","#FB8C00","hangat, ramah & energik"],
  ["Kuning","#FDD835","ceria & optimis"],
  ["Hijau","#43A047","sehat, segar & alami"],
  ["Hijau Tua","#1B5E20","tumbuh, stabil & premium alami"],
  ["Tosca","#00897B","tenang, bersih & modern"],
  ["Biru Muda","#29B6F6","segar, bersih & ringan"],
  ["Biru","#1E3A8A","tepercaya & profesional"],
  ["Ungu","#7B1FA2","kreatif & premium"],
  ["Pink","#EC407A","manis, ramah & feminin"],
  ["Coklat","#6D4C41","hangat, natural & tradisional"],
  ["Krem","#F5E6C8","lembut, bersih & nyaman"],
  ["Hitam","#212121","elegan & kuat"],
  ["Abu","#757575","netral & modern"],
  ["Putih","#FFFFFF","bersih, murni & sederhana"]
];

exposeFn({
  BRAND_DB: {get:()=>BRAND_DB, set:v=>{BRAND_DB=v}},
  lookupBrandDB: {get:()=>lookupBrandDB, set:v=>{lookupBrandDB=v}},
  MKT: {get:()=>MKT, set:v=>{MKT=v}},
  RUB: {get:()=>RUB, set:v=>{RUB=v}},
  BX: {get:()=>BX, set:v=>{BX=v}},
  RK: {get:()=>RK, set:v=>{RK=v}},
  RL: {get:()=>RL, set:v=>{RL=v}},
  COL: {get:()=>COL, set:v=>{COL=v}}
});
