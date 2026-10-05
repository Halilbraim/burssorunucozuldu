/**
 * BURSRADAR - AKILLI BURS EŞLEŞTİRME, ÇAKIŞMA TESPİT & PLANLAMA MOTORU
 * Türkiye'nin en kapsamlı 110 üniversite bursu motoru
 * Özellikler:
 * - 🧙‍♂️ 30 Saniyelik Profil & Şehir Sihirbazı
 * - ⚡ Kırmızı Çizgi & Çakışma Dedektörü
 * - 📅 Akıllı Başvuru Takvimi, Kalan Gün Sayacı & Google Takvim / iCal Entegrasyonu
 * - 💰 Burs Gelir Simülatörü & Çakışmasız Bütçe Kombinasyon Hesaplayıcı
 * - 📋 e-Devlet Destekli Öğrenci Başvuru Evrak Çantası Kontrol Listesi
 * - ⚖️ Yan Yana Karşılaştırma & ⭐ Favoriler Çekmecesi
 */

// Uygulama Durumu (State)
const appState = {
  userProfile: {
    department: 'all',
    uniType: 'state',
    city: 'all',
    classLevel: '1',
    gpa: 3.00,
    hasKYK: false,
    hasOtherPrivate: false,
    onlyNonRepayable: true
  },
  activeCategory: 'all',
  searchQuery: '',
  sortBy: 'match_score',
  favorites: JSON.parse(localStorage.getItem('bursradar_favorites') || '[]'),
  compareList: [],
  simulatedBursIds: JSON.parse(localStorage.getItem('bursradar_simulated') || '["tev-lisans", "gsb-kyk-burs"]'),
  docsChecklist: JSON.parse(localStorage.getItem('bursradar_docs') || '{}'),
  calendarFilter: 'all'
};

// Standart Başvuru Belgeleri Listesi (e-Devlet Entegreli)
const DOCS_LIST = [
  {
    id: 'doc-ogrenci-belgesi',
    category: 'Öğrenci Belgeleri',
    name: 'e-Devlet Barkodlu Öğrenci Belgesi',
    desc: 'YÖK sistemi üzerinden alınan güncel tarihli ve karekodlu öğrenci belgesi.',
    edevletUrl: 'https://www.turkiye.gov.tr/yok-ogrenci-belgesi-sorgulama'
  },
  {
    id: 'doc-transkript',
    category: 'Öğrenci Belgeleri',
    name: 'Transkript veya YKS Yerleştirme Belgesi',
    desc: 'Ara sınıflar için e-Devlet/OBS transkripti; 1. sınıflar için ÖSYM Yerleştirme Sonuç Belgesi.',
    edevletUrl: 'https://www.turkiye.gov.tr/yok-transkript-belgesi-sorgulama'
  },
  {
    id: 'doc-kimlik',
    category: 'Kimlik & Aile',
    name: 'T.C. Kimlik Kartı Sureti / Fotokopisi',
    desc: 'Öğrenciye ait T.C. kimlik kartının ön ve arka yüzünün net taranmış kopyası.',
    edevletUrl: null
  },
  {
    id: 'doc-vukuatli-nufus',
    category: 'Kimlik & Aile',
    name: 'Vukuatlı Nüfus Kayıt Örneği (Aile Dökümü)',
    desc: 'Tüm aile fertlerini (anne, baba, kardeşler) gösteren vukuatlı nüfus kayıt belgesi.',
    edevletUrl: 'https://www.turkiye.gov.tr/nvi-nufus-kayit-ornegi-belgesi-sorgulama'
  },
  {
    id: 'doc-ikametgah',
    category: 'Kimlik & Aile',
    name: 'Tarihçeli Yerleşim Yeri (İkametgah) Belgesi',
    desc: 'Ailenin ve öğrencinin ikamet ettiği adresi teyit eden resmi belge.',
    edevletUrl: 'https://www.turkiye.gov.tr/nvi-yerlesim-yeri-ve-diger-adres-belgesi-sorgulama'
  },
  {
    id: 'doc-gelir-belgesi',
    category: 'Maddi Durum & Gelir',
    name: 'Anne & Baba Maaş Bordrosu / Gelir Belgesi',
    desc: 'Çalışan ebeveynler için son ay bordrosu, emekliler için maaş dökümü veya SGK tescil kaydı.',
    edevletUrl: 'https://www.turkiye.gov.tr/sosyal-guvenlik-kayit-belgesi-sorgulama'
  },
  {
    id: 'doc-tapu-arac',
    category: 'Maddi Durum & Gelir',
    name: 'Aile Adına Kayıtlı Taşınmaz & Araç Dökümü',
    desc: 'e-Devlet üzerinden alınan Tapu Bilgileri ve Adıma Tescilli Araç Sorgulama sonuçları.',
    edevletUrl: 'https://www.turkiye.gov.tr/tapu-bilgileri-sorgulama'
  },
  {
    id: 'doc-adli-sicil',
    category: 'Resmi Belgeler',
    name: 'Adli Sicil Kaydı Belgesi (Sabıka Kaydı)',
    desc: 'Resmi kurum veya burs başvuru seçeneği işaretlenerek alınan adli sicil dökümü.',
    edevletUrl: 'https://www.turkiye.gov.tr/adli-sicil-kaydi'
  },
  {
    id: 'doc-iban',
    category: 'Finansal',
    name: 'Öğrenci Adına Vadesiz TL Hesap IBAN Cüzdanı',
    desc: 'Burs ödemelerinin yapılacağı, öğrencinin şahsına ait banka IBAN teyit dekontu.',
    edevletUrl: null
  },
  {
    id: 'doc-motivasyon',
    category: 'Başvuru Yazısı',
    name: 'Burs Niyet & Motivasyon Mektubu / CV',
    desc: 'Öğrencinin hedeflerini, ailevi/maddi durumunu ve neden bu bursa layık olduğunu anlatan yazı.',
    edevletUrl: null
  }
];

// Gelir Simülatörü Hızlı Paketleri
const SIMULATOR_PRESETS = [
  {
    id: 'highest-safe',
    name: '🌟 Maksimum Çakışmasız Paket (KYK + TÜBİTAK 2205 + TOG)',
    ids: ['gsb-kyk-burs', 'tubitak-2205', 'tog-burs'],
    desc: 'TÜBİTAK ve TOG çift bursa izin verir; KYK ile birlikte sorunsuz alınabilir.'
  },
  {
    id: 'tech-aselsan',
    name: '🚀 Teknoloji & Savunma Paketi (KYK + T3 Vakfı + ASELSAN)',
    ids: ['gsb-kyk-burs', 't3-teknofest', 'aselsan-burs'],
    desc: 'Mühendislik öğrencileri için prestijli ve çakışmasız teknoloji bursları.'
  },
  {
    id: 'tev-kyk',
    name: '🎓 Klasik TEV + KYK Paketi',
    ids: ['tev-lisans', 'gsb-kyk-burs'],
    desc: 'Türkiye’nin en köklü burs vakfı TEV ve devlet KYK bursu kombinasyonu.'
  }
];

// DOM Yüklendiğinde Başlat
document.addEventListener('DOMContentLoaded', () => {
  initProfileWizard();
  initSearchAndFilter();
  initModalsAndDrawers();
  initScrollToTop();
  updateNavBadges();
  updateAndRender();
});

/* ==========================================================
   YARDIMCI: TÜRKÇE KARAKTER NORMALİZASYONU
   ========================================================== */
function normalizeTR(str) {
  return (str || '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ş/g, 'ş')
    .replace(/Ö/g, 'ö')
    .toLowerCase();
}

/* ==========================================================
   YARDIMCI: ŞEHİR & BÖLGE EŞLEŞTİRME MANTIĞI
   ========================================================== */
function checkCityMatch(targetCity, selectedCity) {
  if (!selectedCity || selectedCity === 'all') {
    return { isMatch: true, isSpecialBonus: false };
  }
  const t = normalizeTR(targetCity || '');
  const isGeneral = t.includes('tüm türkiye') && !t.includes('öncelikli');

  let regionalMatch = false;
  if (selectedCity === 'istanbul') {
    regionalMatch = t.includes('istanbul');
  } else if (selectedCity === 'ankara') {
    regionalMatch = t.includes('ankara');
  } else if (selectedCity === 'izmir_ege') {
    regionalMatch = t.includes('izmir') || t.includes('ege') || t.includes('manisa');
  } else if (selectedCity === 'deprem') {
    regionalMatch = t.includes('deprem') || t.includes('malatya') || t.includes('hatay') || t.includes('kahramanmaraş') || t.includes('gaziantep') || t.includes('adıyaman');
  } else if (selectedCity === 'dogu_guneydogu') {
    regionalMatch = t.includes('doğu') || t.includes('güneydoğu') || t.includes('diyarbakır') || t.includes('elazığ') || t.includes('erzurum') || t.includes('kars') || t.includes('ardahan') || t.includes('iğdır') || t.includes('sivas');
  } else if (selectedCity === 'karadeniz') {
    regionalMatch = t.includes('karadeniz') || t.includes('trabzon') || t.includes('rize');
  } else if (selectedCity === 'ic_akdeniz') {
    regionalMatch = t.includes('kayseri') || t.includes('konya') || t.includes('bursa') || t.includes('antalya') || t.includes('adana') || t.includes('mersin') || t.includes('niğde') || t.includes('kocaeli');
  }

  if (regionalMatch) {
    return { isMatch: true, isSpecialBonus: true };
  }
  if (isGeneral) {
    return { isMatch: true, isSpecialBonus: false };
  }
  return { isMatch: false, isSpecialBonus: false };
}

/* ==========================================================
   YARDIMCI: BAŞVURU TARİHİ & KALAN GÜN SAYACI
   ========================================================== */
function getDeadlineStatus(deadlineStr) {
  if (!deadlineStr) {
    return { daysLeft: 999, label: 'Tarih Belirtilmemiş', chipClass: 'active', isUrgent: false, isExpired: false };
  }

  // 2026 yılı burs takvimi referansı (veya güncel sistem tarihi)
  const refDate = new Date('2026-10-05T00:00:00');
  const dParts = deadlineStr.split('-');
  const targetDate = new Date(`${dParts[0]}-${dParts[1]}-${dParts[2]}T23:59:59`);

  const diffMs = targetDate - refDate;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { daysLeft, label: 'Süresi Doldu', chipClass: 'expired', isUrgent: false, isExpired: true };
  } else if (daysLeft === 0) {
    return { daysLeft, label: '🔴 Bugün Son Gün!', chipClass: 'urgent', isUrgent: true, isExpired: false };
  } else if (daysLeft <= 3) {
    return { daysLeft, label: `⏳ Son ${daysLeft} Gün!`, chipClass: 'urgent', isUrgent: true, isExpired: false };
  } else if (daysLeft <= 7) {
    return { daysLeft, label: `⚡ Bu Hafta (${daysLeft} gün)`, chipClass: 'soon', isUrgent: false, isExpired: false };
  } else {
    return { daysLeft, label: `🟢 ${daysLeft} Gün Kaldı`, chipClass: 'active', isUrgent: false, isExpired: false };
  }
}

/* Google Takvime Ekle Bağlantısı */
function getGoogleCalendarUrl(burs) {
  const cleanDate = burs.deadline.replace(/-/g, '');
  const title = encodeURIComponent(`🎯 ${burs.name} - Son Başvuru Günü`);
  const details = encodeURIComponent(
    `Kurum: ${burs.provider}\n` +
    `Aylık Destek: ${burs.amount_display} (${burs.months_count} Ay)\n` +
    `Resmi Başvuru Linki: ${burs.apply_url}\n` +
    `\nBursRadar Akıllı Hatırlatıcı: Belgelerinizi tamamlayıp başvurunuzu onaylamayı unutmayın!`
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${cleanDate}/${cleanDate}&details=${details}&location=${encodeURIComponent(burs.provider)}`;
}

/* iCal (.ics) İndir */
function downloadIcs(bursId) {
  const burs = BURSLAR_DATA.find(b => b.id === bursId);
  if (!burs) return;
  const cleanDate = burs.deadline.replace(/-/g, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BursRadar//TR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `SUMMARY:🎯 ${burs.name} - Son Başvuru`,
    `DESCRIPTION:${burs.provider} bursu son başvuru tarihi. Başvuru: ${burs.apply_url}`,
    `DTSTART;VALUE=DATE:${cleanDate}`,
    `DTEND;VALUE=DATE:${cleanDate}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${burs.id}-son-basvuru.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  showToast('📅 Takvim hatırlatıcı dosyası (.ics) indirildi');
}

/* ==========================================================
   1. AKILLI EŞLEŞME & ÇAKIŞMA HESAPLAMA MOTORU (CORE ALGORITHM)
   ========================================================== */
function calculateEligibility(burs, profile) {
  let score = 100;
  const issues = [];
  const positiveReasons = [];
  let hasCriticalConflict = false;

  // 1. Kapsamlı Bölüm Kontrolü
  const isDeptAll = burs.target_departments.includes("Tümü");
  let deptMatches = isDeptAll;

  if (!deptMatches && profile.department !== 'all') {
    const userDept = normalizeTR(profile.department);
    deptMatches = burs.target_departments.some(bDept => {
      const targetDept = normalizeTR(bDept);
      return targetDept.includes(userDept) || userDept.includes(targetDept) || targetDept === "tümü";
    });
  }

  if (deptMatches) {
    positiveReasons.push("Bölümünüz bu bursun hedef alanlarına doğrudan uygundur.");
  } else if (!isDeptAll && profile.department !== 'all') {
    score -= 45;
    hasCriticalConflict = true;
    issues.push(`Bölüm Kısıtlaması: Bu burs (${burs.target_departments.join(', ')}) öğrencilerine yöneliktir.`);
  }

  // 2. Üniversite Statüsü Kontrolü
  if (burs.university_restriction_type === 'state_only') {
    if (profile.uniType !== 'state') {
      score -= 50;
      hasCriticalConflict = true;
      issues.push("Sadece Devlet Üniversitelerine Açık: Vakıf üniversitesi öğrencileri başvuramaz.");
    } else {
      positiveReasons.push("Devlet üniversitesi şartını sağlıyorsunuz.");
    }
  } else if (burs.university_restriction_type === 'state_or_full_scholarship') {
    if (profile.uniType === 'private_partial') {
      score -= 45;
      hasCriticalConflict = true;
      issues.push("Vakıf Kısıtlaması: Sadece Devlet veya %100 Tam Burslu vakıf öğrencileri başvurabilir.");
    }
  }

  // 3. Not Ortalaması (GNO) Kontrolü
  const isFreshmanOrPrep = profile.classLevel === '1' || profile.classLevel === 'prep';
  if (isFreshmanOrPrep) {
    positiveReasons.push("Yeni kayıt (1. Sınıf / Hazırlık) olduğunuz için üniversite GNO şartı aranmaz, YKS puanınız esas alınır.");
  } else {
    if (profile.gpa < burs.min_gpa) {
      const diff = (burs.min_gpa - profile.gpa).toFixed(2);
      score -= 30;
      issues.push(`Not Ortalaması Eksik: Ara sınıflar için istenen min GNO ${burs.min_gpa.toFixed(2)}, sizin ortalamanız ${profile.gpa.toFixed(2)} (${diff} eksik).`);
    } else {
      positiveReasons.push(`GNO Şartı Sağlandı: Min ${burs.min_gpa.toFixed(2)} isteniyor, sizinki ${profile.gpa.toFixed(2)}.`);
    }
  }

  // 4. BAŞKA ÖZEL VAKIF BURSU ÇAKIŞMASI
  if (profile.hasOtherPrivate && !burs.conflict_rules.allows_other_private) {
    score -= 55;
    hasCriticalConflict = true;
    issues.push(`ÇAKIŞMA UYARISI (Tek Burs Kuralı): Şu an başka özel bursunuz var! Bu vakıf ikinci bir özel burs almanıza izin vermez.`);
  } else if (profile.hasOtherPrivate && burs.conflict_rules.allows_other_private) {
    positiveReasons.push("Çift Burs Serbest: Mevcut özel bursunuz varken bu bursu da alabilirsiniz!");
  }

  // 5. KYK Çakışma Kontrolü
  if (profile.hasKYK && burs.conflict_rules.allows_kyk) {
    positiveReasons.push("KYK Dostu: KYK bursu/kredisi alırken bu burs kesilmez.");
  } else if (profile.hasKYK && !burs.conflict_rules.allows_kyk) {
    score -= 40;
    hasCriticalConflict = true;
    issues.push("KYK Çakışması: Bu burs KYK bursu alan öğrencilere verilemez.");
  }

  // 6. Şehir / Memleket Eşleşmesi
  if (profile.city && profile.city !== 'all') {
    const cityRes = checkCityMatch(burs.target_city, profile.city);
    if (cityRes.isSpecialBonus) {
      score += 15;
      positiveReasons.push(`Şehir/Memleket Avantajı: Bu burs özellikle sizin bölgeniz (${burs.target_city}) için tahsis edilmiştir.`);
    } else if (!cityRes.isMatch) {
      score -= 25;
      issues.push(`Şehir/Bölge Kısıtlaması: Bu burs "${burs.target_city}" öğrencilerine yöneliktir.`);
    }
  }

  // 7. Geri Ödeme Şartı
  if (profile.onlyNonRepayable && burs.is_repayable) {
    score -= 35;
    issues.push("Geri Ödemeli: Bu burs karşılıksız değildir; mezuniyet sonrası geri ödeme veya taahhüt içerir.");
  }

  // Skor Sınırlandırma
  score = Math.max(10, Math.min(100, score));

  let badgeClass = 'score-perfect';
  let badgeText = `%${score} Tam Uyumlu 🎯`;

  if (hasCriticalConflict || score < 60) {
    badgeClass = 'score-warning';
    badgeText = `%${score} Çakışma Var ⚠️`;
  } else if (score < 90) {
    badgeClass = 'score-good';
    badgeText = `%${score} Kısmen Uyumlu 👍`;
  }

  return {
    score,
    badgeClass,
    badgeText,
    hasCriticalConflict,
    issues,
    positiveReasons
  };
}

/* ==========================================================
   2. PROFİL SİHİRBAZI VE EVENTLERİ
   ========================================================== */
function initProfileWizard() {
  const gpaInput = document.getElementById('profGpa');
  const gpaDisplay = document.getElementById('gpaDisplay');
  const deptSelect = document.getElementById('profDepartment');
  const uniTypeSelect = document.getElementById('profUniType');
  const citySelect = document.getElementById('profCity');
  const classSelect = document.getElementById('profClass');
  const kykCheck = document.getElementById('profHasKYK');
  const otherCheck = document.getElementById('profHasOtherPrivate');
  const nonRepayCheck = document.getElementById('profOnlyNonRepayable');
  const resetBtn = document.getElementById('resetProfileBtn');
  const toggleBtn = document.getElementById('toggleWizardBtn');
  const wizardSection = document.getElementById('wizardSection');
  const applyBtn = document.getElementById('applyWizardBtn');
  const gpaNotice = document.getElementById('gpaNotice');

  function updateGpaFieldState(classVal) {
    if (classVal === '1' || classVal === 'prep') {
      gpaInput.disabled = true;
      gpaDisplay.textContent = 'GNO Aranmaz (1. Sınıf / Hazırlık)';
      if (gpaNotice) {
        gpaNotice.textContent = '✨ 1. sınıf ve hazırlıkta GNO aranmaz; vakıflar YKS başarı sıranızı değerlendirir.';
        gpaNotice.style.color = '#34d399';
      }
    } else {
      gpaInput.disabled = false;
      const val = parseFloat(gpaInput.value).toFixed(2);
      gpaDisplay.textContent = `${val} / 4.00`;
      if (gpaNotice) {
        gpaNotice.textContent = 'Ara sınıflar için genel not ortalamanızı belirleyin.';
        gpaNotice.style.color = 'var(--text-muted)';
      }
    }
  }

  // Başlangıç durumu
  updateGpaFieldState(classSelect.value);

  // GNO Değiştiğinde
  gpaInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value).toFixed(2);
    gpaDisplay.textContent = `${val} / 4.00`;
    appState.userProfile.gpa = parseFloat(val);
    updateAndRender();
  });

  // Seçim Kutuları Değiştiğinde
  deptSelect.addEventListener('change', (e) => {
    appState.userProfile.department = e.target.value;
    updateAndRender();
  });

  uniTypeSelect.addEventListener('change', (e) => {
    appState.userProfile.uniType = e.target.value;
    updateAndRender();
  });

  if (citySelect) {
    citySelect.addEventListener('change', (e) => {
      appState.userProfile.city = e.target.value;
      updateAndRender();
    });
  }

  classSelect.addEventListener('change', (e) => {
    appState.userProfile.classLevel = e.target.value;
    updateGpaFieldState(e.target.value);
    updateAndRender();
  });

  kykCheck.addEventListener('change', (e) => {
    appState.userProfile.hasKYK = e.target.checked;
    updateAndRender();
  });

  otherCheck.addEventListener('change', (e) => {
    appState.userProfile.hasOtherPrivate = e.target.checked;
    updateAndRender();
  });

  nonRepayCheck.addEventListener('change', (e) => {
    appState.userProfile.onlyNonRepayable = e.target.checked;
    updateAndRender();
  });

  // Sihirbazı Sıfırla
  resetBtn.addEventListener('click', () => {
    deptSelect.value = 'all';
    uniTypeSelect.value = 'state';
    if (citySelect) citySelect.value = 'all';
    classSelect.value = '1';
    gpaInput.value = '3.00';
    updateGpaFieldState('1');
    kykCheck.checked = false;
    otherCheck.checked = false;
    nonRepayCheck.checked = true;

    appState.userProfile = {
      department: 'all',
      uniType: 'state',
      city: 'all',
      classLevel: '1',
      gpa: 3.00,
      hasKYK: false,
      hasOtherPrivate: false,
      onlyNonRepayable: true
    };

    showToast('🔄 Profil kriterleri sıfırlandı');
    updateAndRender();
  });

  // Aç/Kapat Butonu
  toggleBtn.addEventListener('click', () => {
    wizardSection.scrollIntoView({ behavior: 'smooth' });
    showToast('🧙‍♂️ Profil kriterlerinizi düzenleyebilirsiniz');
  });

  applyBtn.addEventListener('click', () => {
    document.querySelector('.toolbar-section').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ==========================================================
   3. ARAMA VE SIRALAMA SİSTEMİ
   ========================================================== */
function initSearchAndFilter() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const sortBySelect = document.getElementById('sortBySelect');
  const filterPills = document.querySelectorAll('.filter-pill');
  const resetAllBtn = document.getElementById('resetAllFiltersBtn');

  // Canlı Arama
  searchInput.addEventListener('input', (e) => {
    appState.searchQuery = normalizeTR(e.target.value.trim());
    clearBtn.classList.toggle('hidden', appState.searchQuery.length === 0);
    updateAndRender();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    appState.searchQuery = '';
    clearBtn.classList.add('hidden');
    updateAndRender();
  });

  // Sıralama Değişimi
  sortBySelect.addEventListener('change', (e) => {
    appState.sortBy = e.target.value;
    updateAndRender();
  });

  // Kategori Hap Butonları
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      appState.activeCategory = pill.getAttribute('data-filter');
      updateAndRender();
    });
  });

  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      searchInput.value = '';
      appState.searchQuery = '';
      appState.activeCategory = 'all';
      filterPills.forEach(p => p.classList.remove('active'));
      filterPills[0].classList.add('active');
      updateAndRender();
    });
  }
}

/* ==========================================================
   4. RENDER & FİLTRELEME MANTIĞI
   ========================================================== */
function updateAndRender() {
  const grid = document.getElementById('scholarshipsGrid');
  const noResults = document.getElementById('noResultsState');
  const statVisibleCount = document.getElementById('statVisibleCount');
  const statPerfectMatches = document.getElementById('statPerfectMatches');
  const matchCountText = document.getElementById('matchCountText');
  const matchSubText = document.getElementById('matchSubText');

  // 1. Her bursa uygunluk skorunu hesapla
  const processedList = BURSLAR_DATA.map(burs => {
    const analysis = calculateEligibility(burs, appState.userProfile);
    const deadlineStatus = getDeadlineStatus(burs.deadline);
    return {
      ...burs,
      analysis,
      deadlineStatus
    };
  });

  // 2. Filtreleri Uygula
  let filtered = processedList.filter(item => {
    // Özel Kategori Filtreleri
    if (appState.activeCategory === 'urgent-deadline') {
      if (item.deadlineStatus.daysLeft > 7 || item.deadlineStatus.isExpired) return false;
    }
    if (appState.activeCategory === 'city-local') {
      const t = normalizeTR(item.target_city);
      if (t.includes('tüm türkiye') && !t.includes('öncelikli')) return false;
    }
    if (appState.activeCategory === 'kyk-friendly' && !item.conflict_rules.allows_kyk) return false;
    if (appState.activeCategory === 'double-burs' && !item.conflict_rules.allows_other_private) return false;
    if (appState.activeCategory === 'muhendislik') {
      const isM = item.target_departments.some(d => {
        const nd = normalizeTR(d);
        return nd.includes('mühendis') || nd.includes('mekatronik') || nd.includes('biyomedikal') || nd === 'tümü';
      });
      if (!isM) return false;
    }
    if (appState.activeCategory === 'tip') {
      const isT = item.target_departments.some(d => {
        const nd = normalizeTR(d);
        return nd.includes('tıp') || nd.includes('hemşire') || nd.includes('eczacı') || nd.includes('diş') || nd.includes('fizyoterapi') || nd.includes('sağlık') || nd.includes('veteriner') || nd === 'tümü';
      });
      if (!isT) return false;
    }
    if (appState.activeCategory === 'temel-bilimler') {
      const isTB = item.target_departments.some(d => {
        const nd = normalizeTR(d);
        return nd.includes('fizik') || nd.includes('kimya') || nd.includes('biyoloji') || nd.includes('matematik') || nd.includes('moleküler') || nd.includes('temel bilim') || nd === 'tümü';
      });
      if (!isTB) return false;
    }
    if (appState.activeCategory === 'high-amount' && item.amount_monthly < 5000) return false;

    // Arama Kelimesi Filtresi
    if (appState.searchQuery) {
      const q = appState.searchQuery;
      const matchName = normalizeTR(item.name).includes(q);
      const matchProvider = normalizeTR(item.provider).includes(q);
      const matchDept = item.target_departments.some(d => normalizeTR(d).includes(q));
      const matchTags = item.tags.some(t => normalizeTR(t).includes(q));
      const matchCity = normalizeTR(item.target_city).includes(q);

      if (!matchName && !matchProvider && !matchDept && !matchTags && !matchCity) return false;
    }

    return true;
  });

  // 3. Sıralama
  filtered.sort((a, b) => {
    if (appState.sortBy === 'match_score') {
      return b.analysis.score - a.analysis.score;
    }
    if (appState.sortBy === 'amount_desc') {
      return b.amount_monthly - a.amount_monthly;
    }
    if (appState.sortBy === 'deadline_asc') {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (appState.sortBy === 'min_gpa_asc') {
      return a.min_gpa - b.min_gpa;
    }
    return 0;
  });

  // İstatistikleri Güncelle
  const perfectMatchCount = filtered.filter(i => i.analysis.score >= 95).length;
  if (statVisibleCount) statVisibleCount.textContent = filtered.length;
  if (statPerfectMatches) statPerfectMatches.textContent = `${perfectMatchCount} Burs`;

  const statMaxAmount = document.getElementById('statMaxAmount');
  if (statMaxAmount && filtered.length > 0) {
    const maxAmount = Math.max(...filtered.map(i => i.amount_monthly));
    statMaxAmount.textContent = `${maxAmount.toLocaleString('tr-TR')} ₺`;
  } else if (statMaxAmount) {
    statMaxAmount.textContent = '-- ₺';
  }

  document.querySelectorAll('.total-count-val').forEach(el => el.textContent = BURSLAR_DATA.length);

  if (matchCountText && matchSubText) {
    matchCountText.textContent = `${perfectMatchCount} Burs Profilinize %100 Tam Uyumlu!`;
    matchSubText.textContent = appState.userProfile.hasOtherPrivate 
      ? '⚠️ Mevcut bir özel bursunuz olduğu için tek burs kuralı olan vakıflar kırmızı çizgiyle işaretlendi.'
      : 'Tüm şartları sağladığınız ve çakışma olmayan burslar en üstte gösteriliyor.';
  }

  // Boş Durum Kontrolü
  if (filtered.length === 0) {
    grid.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }
  noResults.classList.add('hidden');

  // Kartları Render Et
  grid.innerHTML = filtered.map(item => renderBursCard(item)).join('');

  // Kart Buton Eventlerini Bağla
  attachCardEvents();
  updateNavBadges();
}

/* ==========================================================
   5. TEK BİR BURS KARTININ HTML ŞABLONU
   ========================================================== */
function renderBursCard(item) {
  const isFav = appState.favorites.includes(item.id);
  const isCompared = appState.compareList.includes(item.id);
  const isSimulated = appState.simulatedBursIds.includes(item.id);
  const dlStatus = item.deadlineStatus || getDeadlineStatus(item.deadline);

  // Çakışma Rozetleri
  const kykPill = item.conflict_rules.allows_kyk
    ? `<span class="conflict-pill pill-kyk-ok">🟢 KYK ile Birlikte Alınabilir</span>`
    : `<span class="conflict-pill pill-single-burs">🔴 KYK ile Alınamaz!</span>`;

  const privatePill = item.conflict_rules.allows_other_private
    ? `<span class="conflict-pill pill-double-burs">✨ Çift Burs Serbest</span>`
    : `<span class="conflict-pill pill-single-burs">⚠️ Tek Özel Burs Kuralı</span>`;

  return `
    <article class="burs-card" data-id="${item.id}">
      <div>
        <!-- Başlık & Skor -->
        <div class="burs-card-header">
          <div class="provider-info">
            <div class="provider-avatar" style="background: ${item.badge_color};">
              ${item.logo_initials}
            </div>
            <div class="provider-meta">
              <span class="provider-name">${item.provider}</span>
              <span class="deadline-chip ${dlStatus.chipClass}">
                ${dlStatus.label} (${formatDate(item.deadline)})
              </span>
            </div>
          </div>
          <span class="match-score-badge ${item.analysis.badgeClass}">
            ${item.analysis.badgeText}
          </span>
        </div>

        <!-- Burs Başlığı -->
        <h3 class="burs-card-title" style="margin-top: 0.9rem;">${item.name}</h3>

        <!-- Tutar Şeridi -->
        <div class="burs-card-amount-row" style="margin: 0.85rem 0;">
          <div>
            <span class="amount-val">${item.amount_display}</span>
          </div>
          <span class="duration-val">Yılda ${item.months_count} Ay Ödenir</span>
        </div>

        <!-- Çakışma & Şart Matrisi Rozetleri -->
        <div class="conflict-pills-row">
          ${kykPill}
          ${privatePill}
        </div>
      </div>

      <div>
        <!-- Mini Etiketler (Hedef Bölüm, Min GNO, Şehir) -->
        <div class="burs-card-tags" style="margin-bottom: 0.85rem;">
          <span class="mini-tag highlight">🎯 Min GNO: ${item.min_gpa.toFixed(2)}</span>
          <span class="mini-tag">🏛️ ${item.department_category}</span>
          <span class="mini-tag">📍 ${item.target_city}</span>
        </div>

        <!-- Aksiyon Butonları -->
        <div class="burs-card-actions">
          <button class="btn-detail" data-id="${item.id}">
            Şartları &amp; Detayı Gör
          </button>
          <a href="${getGoogleCalendarUrl(item)}" target="_blank" rel="noopener noreferrer" class="btn-cal-sync" title="Google Takvime Hatırlatıcı Ekle" onclick="event.stopPropagation();">
            📅 Takvim
          </a>
          <button class="btn-icon-action btn-sim ${isSimulated ? 'active-compare' : ''}" data-id="${item.id}" title="${isSimulated ? 'Simülatörden Çıkar' : 'Gelir Simülatörüne Ekle (+₺)'}">
            💰
          </button>
          <button class="btn-icon-action btn-compare ${isCompared ? 'active-compare' : ''}" data-id="${item.id}" title="Karşılaştırmaya Ekle">
            ⚖️
          </button>
          <button class="btn-icon-action btn-fav ${isFav ? 'active-fav' : ''}" data-id="${item.id}" title="Favorilere Ekle">
            ⭐
          </button>
        </div>
      </div>
    </article>
  `;
}

/* ==========================================================
   6. KART ETKİLEŞİMLERİ (DETAY, FAVORİ, KARŞILAŞTIRMA, SİMÜLATÖR)
   ========================================================== */
function attachCardEvents() {
  document.querySelectorAll('.burs-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-icon-action') || e.target.closest('.btn-detail') || e.target.closest('.btn-cal-sync')) return;
      const id = card.getAttribute('data-id');
      openDetailModal(id);
    });
  });

  document.querySelectorAll('.btn-detail').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openDetailModal(id);
    });
  });

  document.querySelectorAll('.btn-fav').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      toggleFavorite(id);
    });
  });

  document.querySelectorAll('.btn-compare').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      toggleCompare(id);
    });
  });

  document.querySelectorAll('.btn-sim').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      toggleSimulator(id);
    });
  });
}

function toggleFavorite(id) {
  const index = appState.favorites.indexOf(id);
  if (index > -1) {
    appState.favorites.splice(index, 1);
    showToast('⭐ Burs favorilerden çıkarıldı');
  } else {
    appState.favorites.push(id);
    showToast('⭐ Burs favorilere eklendi!');
  }
  localStorage.setItem('bursradar_favorites', JSON.stringify(appState.favorites));
  updateAndRender();
}

function toggleCompare(id) {
  const index = appState.compareList.indexOf(id);
  if (index > -1) {
    appState.compareList.splice(index, 1);
    showToast('⚖️ Karşılaştırma listesinden çıkarıldı');
  } else {
    if (appState.compareList.length >= 3) {
      showToast('⚠️ En fazla 3 bursu aynı anda karşılaştırabilirsiniz!');
      return;
    }
    appState.compareList.push(id);
    showToast('⚖️ Karşılaştırma listesine eklendi (+1)');
  }
  updateAndRender();
}

function toggleSimulator(id) {
  const index = appState.simulatedBursIds.indexOf(id);
  if (index > -1) {
    appState.simulatedBursIds.splice(index, 1);
    showToast('💰 Burs bütçe simülatöründen çıkarıldı');
  } else {
    appState.simulatedBursIds.push(id);
    showToast('💰 Burs bütçe simülatörüne eklendi! Toplam gelir hesaplandı.');
  }
  localStorage.setItem('bursradar_simulated', JSON.stringify(appState.simulatedBursIds));
  updateNavBadges();
  updateAndRender();
}

function updateNavBadges() {
  const compareBadge = document.getElementById('compareBadge');
  const favBadge = document.getElementById('favoritesBadge');
  const simBadge = document.getElementById('simulatorBadge');
  const docsBadge = document.getElementById('docsBadge');

  if (compareBadge) compareBadge.textContent = appState.compareList.length;
  if (favBadge) favBadge.textContent = appState.favorites.length;
  if (simBadge) simBadge.textContent = appState.simulatedBursIds.length;

  if (docsBadge) {
    const totalDocs = DOCS_LIST.length;
    const completedDocs = Object.values(appState.docsChecklist).filter(Boolean).length;
    docsBadge.textContent = `${completedDocs}/${totalDocs}`;
  }
}

/* ==========================================================
   7. MODAL VE ÇEKMECELER (DETAILS, COMPARE, FAVORITES, CALENDAR, SIMULATOR, DOCS)
   ========================================================== */
function initModalsAndDrawers() {
  const detailModal = document.getElementById('detailModal');
  const closeDetailBtn = document.getElementById('closeDetailModalBtn');
  closeDetailBtn.addEventListener('click', () => closeModal(detailModal));

  // Karşılaştırma Modalı
  const compareModal = document.getElementById('compareModal');
  const openCompareBtn = document.getElementById('openCompareBtn');
  const closeCompareBtn = document.getElementById('closeCompareModalBtn');

  openCompareBtn.addEventListener('click', () => {
    if (appState.compareList.length === 0) {
      showToast('ℹ️ Lütfen önce en az bir bursun yanındaki (⚖️) butonuna tıklayın!');
      return;
    }
    renderCompareModal();
    openModal(compareModal);
  });
  closeCompareBtn.addEventListener('click', () => closeModal(compareModal));

  // Favoriler Çekmecesi
  const favDrawer = document.getElementById('favoritesDrawer');
  const openFavBtn = document.getElementById('openFavoritesBtn');
  const closeFavBtn = document.getElementById('closeFavoritesDrawerBtn');

  openFavBtn.addEventListener('click', () => {
    renderFavoritesDrawer();
    openModal(favDrawer);
  });
  closeFavBtn.addEventListener('click', () => closeModal(favDrawer));

  // Başvuru Takvimi Modalı
  const calendarModal = document.getElementById('calendarModal');
  const openCalendarBtn = document.getElementById('openCalendarBtn');
  const closeCalendarBtn = document.getElementById('closeCalendarModalBtn');

  if (openCalendarBtn && calendarModal) {
    openCalendarBtn.addEventListener('click', () => {
      renderCalendarTimeline(appState.calendarFilter);
      openModal(calendarModal);
    });
    closeCalendarBtn.addEventListener('click', () => closeModal(calendarModal));
  }

  // Takvim İçi Filtre Butonları
  document.querySelectorAll('.cal-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cal-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.calendarFilter = btn.getAttribute('data-cal-filter');
      renderCalendarTimeline(appState.calendarFilter);
    });
  });

  // Burs Gelir Simülatörü Modalı
  const simulatorModal = document.getElementById('simulatorModal');
  const openSimulatorBtn = document.getElementById('openSimulatorBtn');
  const closeSimulatorBtn = document.getElementById('closeSimulatorModalBtn');

  if (openSimulatorBtn && simulatorModal) {
    openSimulatorBtn.addEventListener('click', () => {
      renderSimulatorModal();
      openModal(simulatorModal);
    });
    closeSimulatorBtn.addEventListener('click', () => closeModal(simulatorModal));
  }

  // Öğrenci Başvuru Evrak Çantası Çekmecesi
  const docsDrawer = document.getElementById('docsDrawer');
  const openDocsBtn = document.getElementById('openDocsBtn');
  const closeDocsBtn = document.getElementById('closeDocsDrawerBtn');
  const resetDocsBtn = document.getElementById('resetDocsBtn');
  const printDocsBtn = document.getElementById('printDocsBtn');

  if (openDocsBtn && docsDrawer) {
    openDocsBtn.addEventListener('click', () => {
      renderDocsDrawer();
      openModal(docsDrawer);
    });
    closeDocsBtn.addEventListener('click', () => closeModal(docsDrawer));
  }

  if (resetDocsBtn) {
    resetDocsBtn.addEventListener('click', () => {
      appState.docsChecklist = {};
      localStorage.setItem('bursradar_docs', '{}');
      showToast('🔄 Evrak listesi sıfırlandı');
      renderDocsDrawer();
      updateNavBadges();
    });
  }

  if (printDocsBtn) {
    printDocsBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Backdrop Tıklamalarında Kapat
  const allPopups = [detailModal, compareModal, favDrawer, calendarModal, simulatorModal, docsDrawer].filter(Boolean);
  allPopups.forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) closeModal(el);
    });
  });

  // ESC tuşuyla kapat
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      allPopups.forEach(el => {
        if (!el.classList.contains('hidden')) {
          closeModal(el);
        }
      });
    }
  });
}

/* Detay Modalı Render */
function openDetailModal(id) {
  const burs = BURSLAR_DATA.find(b => b.id === id);
  if (!burs) return;

  const analysis = calculateEligibility(burs, appState.userProfile);
  const dlStatus = getDeadlineStatus(burs.deadline);
  const isSimulated = appState.simulatedBursIds.includes(burs.id);
  const content = document.getElementById('detailModalContent');

  let alertBlock = '';
  if (analysis.issues.length > 0) {
    alertBlock = `
      <div class="modal-alert-box">
        <div class="modal-alert-title">⚠️ Profilinize Göre Dikkat Edilmesi Gereken Kırmızı Çizgiler:</div>
        <ul class="requirements-ul" style="margin-top: 0.4rem;">
          ${analysis.issues.map(iss => `<li style="color: #fb7185;">${iss}</li>`).join('')}
        </ul>
      </div>
    `;
  } else {
    alertBlock = `
      <div class="modal-alert-box success">
        <div class="modal-alert-title" style="color: #34d399;">🎯 %100 Mükemmel Uyum!</div>
        <p style="font-size: 0.86rem; color: #a7f3d0;">Girdiğiniz üniversite, bölüm, GNO ve mevcut burs durumunuz bu vakfın tüm şartlarına uymaktadır.</p>
      </div>
    `;
  }

  content.innerHTML = `
    <div class="modal-header-section">
      <div class="modal-provider-avatar" style="background: ${burs.badge_color};">
        ${burs.logo_initials}
      </div>
      <div>
        <span class="provider-name">${burs.provider}</span>
        <h2 class="modal-burs-title">${burs.name}</h2>
        <div style="margin-top: 0.35rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <span class="deadline-chip ${dlStatus.chipClass}">
            ${dlStatus.label} &bull; Son Gün: ${formatDate(burs.deadline)}
          </span>
          <span class="mini-tag">📍 ${burs.target_city}</span>
        </div>
      </div>
    </div>

    ${alertBlock}

    <div class="modal-section">
      <h4 class="modal-section-title">💰 Burs Tutarı &amp; Süresi</h4>
      <p style="font-size: 0.9rem; color: var(--text-secondary);">
        <strong>${burs.amount_display}</strong> &bull; Yılda <strong>${burs.months_count} ay</strong> boyunca ödenir. (Yıllık: ${(burs.amount_monthly * burs.months_count).toLocaleString('tr-TR')} ₺)
      </p>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
        Geri Ödeme Durumu: <strong style="color: #34d399;">${burs.repayment_type}</strong> - ${burs.repayment_details}
      </p>
    </div>

    <div class="modal-section">
      <h4 class="modal-section-title">⚡ Çakışma Kuralları (Başka Burs Alabilir miyim?)</h4>
      <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); padding: 0.85rem 1rem; border-radius: var(--radius-md);">
        <p style="font-size: 0.88rem; color: var(--text-main); font-weight: 600;">
          ${burs.conflict_rules.rule_description}
        </p>
      </div>
    </div>

    <div class="modal-section">
      <h4 class="modal-section-title">📋 Başvuru Şartları &amp; Kriterler</h4>
      <ul class="requirements-ul">
        ${burs.requirements_list.map(req => `<li>${req}</li>`).join('')}
      </ul>
    </div>

    <div class="modal-section">
      <h4 class="modal-section-title">🎯 Hedef Bölümler &amp; Üniversiteler</h4>
      <p style="font-size: 0.88rem; color: var(--text-secondary);">
        <strong>Bölümler:</strong> ${burs.target_departments.join(', ')}
      </p>
      <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 0.3rem;">
        <strong>Üniversiteler:</strong> ${burs.target_universities.join(', ')}
      </p>
    </div>

    <div class="modal-footer-actions" style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
      <a href="${burs.apply_url}" target="_blank" rel="noopener noreferrer" class="apply-external-btn" style="flex: 1; min-width: 200px;">
        <span>Resmi Başvuru Sitesine Git</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 17px; height: 17px;">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>

      <a href="${getGoogleCalendarUrl(burs)}" target="_blank" rel="noopener noreferrer" class="ghost-btn" style="display: flex; align-items: center; gap: 0.4rem;" title="Google Takvim'e Hatırlatıcı Ekle">
        📅 Google Takvime Ekle
      </a>

      <button class="ghost-btn" onclick="downloadIcs('${burs.id}')" title="Telefon / Outlook için .ics takvim dosyası indir">
        📥 iCal İndir
      </button>

      <button class="ghost-btn" onclick="toggleSimulator('${burs.id}'); openDetailModal('${burs.id}');" style="color: ${isSimulated ? '#fb7185' : 'var(--accent-primary-light)'};">
        ${isSimulated ? '🗑️ Simülatörden Çıkar' : '💰 Simülatöre Ekle'}
      </button>
    </div>
  `;

  openModal(document.getElementById('detailModal'));
}

/* Karşılaştırma Tablosu Render */
function renderCompareModal() {
  const container = document.getElementById('compareBody');
  const list = BURSLAR_DATA.filter(b => appState.compareList.includes(b.id));

  if (list.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Karşılaştırılacak burs seçilmedi.</p>`;
    return;
  }

  const clearCompareHTML = `
    <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
      <button id="clearCompareListBtn" class="ghost-btn" style="color: #fb7185; border-color: rgba(244, 63, 94, 0.3);">
        🗑️ Listeyi Temizle
      </button>
    </div>
  `;

  container.innerHTML = clearCompareHTML + `
    <div class="compare-table-wrapper">
      <table class="compare-table">
        <thead>
          <tr>
            <th class="criteria-col">Karşılaştırma Kriteri</th>
            ${list.map(b => `
              <th>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                  <span>${b.name}</span>
                  <button class="ghost-btn" onclick="toggleCompare('${b.id}'); renderCompareModal();" style="padding: 0.15rem 0.4rem; font-size: 0.72rem; color: #fb7185;">✕</button>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal; margin-top: 0.2rem;">${b.provider}</div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="criteria-col">Aylık Burs Tutarı</td>
            ${list.map(b => `<td class="amount-cell">${b.amount_display}</td>`).join('')}
          </tr>
          <tr>
            <td class="criteria-col">Yıllık Ödeme Süresi</td>
            ${list.map(b => `<td><strong>${b.months_count} Ay</strong> / Yıl</td>`).join('')}
          </tr>
          <tr>
            <td class="criteria-col">Yıllık Toplam Destek</td>
            ${list.map(b => `<td style="color: #34d399; font-weight: 700;">${(b.amount_monthly * b.months_count).toLocaleString('tr-TR')} ₺</td>`).join('')}
          </tr>
          <tr>
            <td class="criteria-col">Son Başvuru Tarihi</td>
            ${list.map(b => {
              const dl = getDeadlineStatus(b.deadline);
              return `<td><span class="deadline-chip ${dl.chipClass}">${dl.label}</span><br><small style="color: var(--text-muted);">${formatDate(b.deadline)}</small></td>`;
            }).join('')}
          </tr>
          <tr>
            <td class="criteria-col">KYK Çakışma Durumu</td>
            ${list.map(b => b.conflict_rules.allows_kyk 
              ? `<td class="success-cell">🟢 KYK ile Alınabilir</td>` 
              : `<td class="danger-cell">🔴 KYK ile Alınamaz</td>`
            ).join('')}
          </tr>
          <tr>
            <td class="criteria-col">Başka Özel Burs Serbest mi?</td>
            ${list.map(b => b.conflict_rules.allows_other_private 
              ? `<td class="success-cell">✨ Çift Burs Serbest</td>` 
              : `<td class="danger-cell">⚠️ Tek Burs Kuralı (Başka Özel Yasak)</td>`
            ).join('')}
          </tr>
          <tr>
            <td class="criteria-col">Min GNO Şartı</td>
            ${list.map(b => `<td>${b.min_gpa.toFixed(2)} / 4.00 <br><small style="color: var(--text-muted);">(1. sınıflarda YKS puanı)</small></td>`).join('')}
          </tr>
          <tr>
            <td class="criteria-col">Geri Ödeme Durumu</td>
            ${list.map(b => `<td>${b.repayment_type}</td>`).join('')}
          </tr>
          <tr>
            <td class="criteria-col">Hedef Şehir / İl</td>
            ${list.map(b => `<td>${b.target_city}</td>`).join('')}
          </tr>
          <tr>
            <td class="criteria-col">Hedef Bölümler</td>
            ${list.map(b => `<td style="font-size: 0.8rem;">${b.target_departments.slice(0, 3).join(', ')}...</td>`).join('')}
          </tr>
          <tr>
            <td class="criteria-col">Resmi Başvuru</td>
            ${list.map(b => `
              <td>
                <a href="${b.apply_url}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary-light); text-decoration: underline; font-weight: 600;">
                  Siteye Git &rarr;
                </a>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;

  const clearBtn = document.getElementById('clearCompareListBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      appState.compareList = [];
      closeModal(document.getElementById('compareModal'));
      showToast('🗑️ Karşılaştırma listesi temizlendi');
      updateAndRender();
    });
  }
}

/* Favoriler Çekmecesi Render */
function renderFavoritesDrawer() {
  const container = document.getElementById('favoritesList');
  const countEl = document.getElementById('drawerCount');
  const list = BURSLAR_DATA.filter(b => appState.favorites.includes(b.id));

  countEl.textContent = list.length;

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p style="font-size: 2rem; margin-bottom: 0.5rem;">⭐</p>
        <p>Henüz favori bir burs eklemediniz.</p>
        <p style="font-size: 0.8rem; margin-top: 0.4rem;">Kartlardaki yıldız ikonuna tıklayarak ilgilendiğiniz bursları buraya kaydedebilirsiniz.</p>
      </div>
    `;
    return;
  }

  const clearAllBtn = `
    <div style="margin-bottom: 0.75rem; display: flex; justify-content: flex-end;">
      <button id="clearAllFavoritesBtn" class="ghost-btn" style="color: #fb7185; border-color: rgba(244, 63, 94, 0.3); font-size: 0.78rem;">
        🗑️ Tüm Favorileri Temizle
      </button>
    </div>
  `;

  container.innerHTML = clearAllBtn + list.map(b => `
    <div class="drawer-item">
      <div>
        <div class="drawer-item-title">${b.name}</div>
        <div class="drawer-item-amount">${b.amount_display} (${b.months_count} Ay)</div>
        <span style="font-size: 0.72rem; color: var(--text-muted);">${b.provider} &bull; Son: ${formatDate(b.deadline)}</span>
      </div>
      <div style="display: flex; gap: 0.4rem; align-items: center;">
        <button class="ghost-btn" onclick="openDetailModal('${b.id}')" style="padding: 0.35rem 0.65rem;">Gör</button>
        <button class="ghost-btn" onclick="toggleFavorite('${b.id}')" style="padding: 0.35rem 0.65rem; color: #fb7185;">✕</button>
      </div>
    </div>
  `).join('');

  const clearAllFavBtn = document.getElementById('clearAllFavoritesBtn');
  if (clearAllFavBtn) {
    clearAllFavBtn.addEventListener('click', () => {
      appState.favorites = [];
      localStorage.setItem('bursradar_favorites', '[]');
      showToast('🗑️ Tüm favoriler temizlendi');
      renderFavoritesDrawer();
      updateAndRender();
    });
  }
}

/* ==========================================================
   8. YENİ ÖZELLİK: BAŞVURU TAKVİMİ & ZAMAN ÇİZELGESİ MODALI
   ========================================================== */
function renderCalendarTimeline(filter = 'all') {
  const container = document.getElementById('calendarTimelineBody');
  if (!container) return;

  // Tüm bursları son başvuru tarihine göre artan sırala
  const sorted = [...BURSLAR_DATA].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  // Filtreleme
  const filtered = sorted.filter(b => {
    const status = getDeadlineStatus(b.deadline);
    if (filter === 'urgent') return status.daysLeft <= 3 && !status.isExpired;
    if (filter === 'this-week') return status.daysLeft <= 7 && !status.isExpired;
    if (filter === 'this-month') return status.daysLeft <= 30 && !status.isExpired;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p style="font-size: 2rem; margin-bottom: 0.5rem;">📅</p>
        <p>Seçilen kriterde yaklaşan burs bulunamadı.</p>
      </div>
    `;
    return;
  }

  // Tarihe göre grupla
  const grouped = {};
  filtered.forEach(b => {
    if (!grouped[b.deadline]) grouped[b.deadline] = [];
    grouped[b.deadline].push(b);
  });

  let html = '';
  Object.keys(grouped).forEach(dateStr => {
    const burses = grouped[dateStr];
    const dlStatus = getDeadlineStatus(dateStr);

    html += `
      <div class="timeline-group">
        <div class="timeline-date-header">
          <span>📅 ${formatDate(dateStr)}</span>
          <span class="deadline-chip ${dlStatus.chipClass}">${dlStatus.label}</span>
        </div>
        ${burses.map(b => `
          <div class="timeline-card">
            <div class="timeline-card-info">
              <span class="timeline-card-title">${b.name}</span>
              <span class="timeline-card-sub">${b.provider} &bull; ${b.amount_display} (${b.months_count} Ay) &bull; ${b.target_city}</span>
            </div>
            <div class="timeline-card-actions">
              <a href="${getGoogleCalendarUrl(b)}" target="_blank" rel="noopener noreferrer" class="btn-cal-sync" title="Google Takvim'e Ekle">
                📅 Takvime Ekle
              </a>
              <button class="ghost-btn" onclick="downloadIcs('${b.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.72rem;" title="iCal (.ics) indir">
                📥 .ics
              </button>
              <button class="ghost-btn" onclick="closeModal(document.getElementById('calendarModal')); openDetailModal('${b.id}');" style="padding: 0.25rem 0.5rem; font-size: 0.72rem;">
                Detay &rarr;
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  });

  container.innerHTML = html;
}

/* ==========================================================
   9. YENİ ÖZELLİK: BURS GELİR SİMÜLATÖRÜ & KOMBİNASYON HESAPLAYICI
   ========================================================== */
function renderSimulatorModal() {
  const container = document.getElementById('simulatorBody');
  if (!container) return;

  const selectedList = BURSLAR_DATA.filter(b => appState.simulatedBursIds.includes(b.id));

  // Gelir Hesaplamaları
  const totalMonthly = selectedList.reduce((sum, b) => sum + b.amount_monthly, 0);
  const totalAnnual = selectedList.reduce((sum, b) => sum + (b.amount_monthly * b.months_count), 0);

  // Çakışma Güvenlik Kontrolü
  const conflictWarnings = [];
  const privateOnlyInstitutions = selectedList.filter(b => !b.conflict_rules.allows_other_private);
  
  if (privateOnlyInstitutions.length > 1) {
    const names = privateOnlyInstitutions.map(b => b.provider).join(' ve ');
    conflictWarnings.push(`⚠️ ÇAKIŞMA TESPİT EDİLDİ: ${names} kurumlarının her ikisi de "Tek Özel Burs Kuralı" uygular. Birini kazandığınızda diğer bursunuz kesilir veya kabul edilmez!`);
  }

  const kykIncluded = selectedList.some(b => b.id === 'gsb-kyk-burs');
  const forbidsKykInstitutions = selectedList.filter(b => !b.conflict_rules.allows_kyk);
  if (kykIncluded && forbidsKykInstitutions.length > 0) {
    const names = forbidsKykInstitutions.map(b => b.provider).join(', ');
    conflictWarnings.push(`⚠️ KYK ÇAKIŞMASI: ${names} bursu KYK alan öğrencilere verilemez!`);
  }

  let alertHTML = '';
  if (selectedList.length === 0) {
    alertHTML = `
      <div class="simulator-alert safe">
        <span>💡 Bütçenizi hesaplamak için aşağıdaki hazır paketlerden birini seçebilir veya burs kartlarındaki (💰) simgesine tıklayabilirsiniz.</span>
      </div>
    `;
  } else if (conflictWarnings.length > 0) {
    alertHTML = `
      <div class="simulator-alert warning">
        <div>
          ${conflictWarnings.map(w => `<p style="margin-bottom: 0.35rem;">${w}</p>`).join('')}
          <small style="opacity: 0.85;">Tavsiye: Çift bursa izin veren vakıfları (TÜBİTAK, T3, TOG vb.) tercih edin.</small>
        </div>
      </div>
    `;
  } else {
    alertHTML = `
      <div class="simulator-alert safe">
        <span>✅ <strong>Mükemmel &amp; Çakışmasız Paket!</strong> Seçtiğiniz bursların kuralları birbiriyle ve KYK ile uyumludur. Tümünü aynı anda kesilme riski olmadan alabilirsiniz.</span>
      </div>
    `;
  }

  container.innerHTML = `
    <!-- KPI Kartları -->
    <div class="simulator-kpi-grid">
      <div class="simulator-kpi-card">
        <span class="kpi-title">Aylık Toplam Burs Geliri</span>
        <span class="kpi-val">${totalMonthly.toLocaleString('tr-TR')} ₺ <small style="font-size: 0.9rem; font-weight: normal; color: var(--text-muted);">/ ay</small></span>
        <span class="kpi-sub">Her ay hesabınıza yatacak net tutar</span>
      </div>

      <div class="simulator-kpi-card">
        <span class="kpi-title">Akademik Yıllık Toplam Bütçe</span>
        <span class="kpi-val" style="color: #34d399;">${totalAnnual.toLocaleString('tr-TR')} ₺ <small style="font-size: 0.9rem; font-weight: normal; color: var(--text-muted);">/ yıl</small></span>
        <span class="kpi-sub">Bursların geçerli olduğu ayların toplamı</span>
      </div>

      <div class="simulator-kpi-card">
        <span class="kpi-title">Kombinasyondaki Burslar</span>
        <span class="kpi-val" style="color: #38bdf8;">${selectedList.length} <small style="font-size: 0.9rem; font-weight: normal; color: var(--text-muted);">Adet</small></span>
        <span class="kpi-sub">${conflictWarnings.length === 0 ? '🟢 Çakışma yok' : '🔴 Çakışma mevcut'}</span>
      </div>
    </div>

    <!-- Güvenlik / Çakışma Bildirimi -->
    ${alertHTML}

    <!-- Hızlı Hazır Paketler -->
    <div class="simulator-presets-bar">
      <span class="presets-label">⚡ Tavsiye Edilen Hazır Burs Kombinasyonları</span>
      <div class="preset-chips-wrap">
        ${SIMULATOR_PRESETS.map(p => `
          <button class="preset-chip" onclick="loadSimulatorPreset('${p.id}')" title="${p.desc}">
            ${p.name}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Seçili Bursların Listesi -->
    <div class="sim-table-wrap">
      <table class="sim-table">
        <thead>
          <tr>
            <th>Burs / Kurum</th>
            <th>Aylık Tutar</th>
            <th>Süre</th>
            <th>Yıllık Toplam</th>
            <th>Çakışma Kuralı</th>
            <th style="text-align: right;">İşlem</th>
          </tr>
        </thead>
        <tbody>
          ${selectedList.length === 0 ? `
            <tr>
              <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                Henüz simülatöre burs eklemediniz. Yukarıdaki hazır paketleri deneyebilir veya burs kartlarındaki (💰) simgesine basabilirsiniz.
              </td>
            </tr>
          ` : selectedList.map(b => `
            <tr>
              <td>
                <strong>${b.name}</strong>
                <div style="font-size: 0.74rem; color: var(--text-muted);">${b.provider}</div>
              </td>
              <td style="font-weight: 700; color: var(--accent-primary-light);">${b.amount_display}</td>
              <td>${b.months_count} Ay</td>
              <td style="font-weight: 700; color: #34d399;">${(b.amount_monthly * b.months_count).toLocaleString('tr-TR')} ₺</td>
              <td style="font-size: 0.78rem;">
                ${b.conflict_rules.allows_other_private 
                  ? '<span style="color: #34d399;">✨ Çift Burs Serbest</span>' 
                  : '<span style="color: #fb7185;">⚠️ Tek Burs Kuralı</span>'}
              </td>
              <td style="text-align: right;">
                <button class="ghost-btn" onclick="toggleSimulator('${b.id}'); renderSimulatorModal();" style="color: #fb7185; padding: 0.2rem 0.5rem; font-size: 0.76rem;">
                  ✕ Kaldır
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Alt Butonlar -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
      <button class="ghost-btn" onclick="appState.simulatedBursIds = []; localStorage.setItem('bursradar_simulated', '[]'); renderSimulatorModal(); updateNavBadges(); updateAndRender();" style="color: #fb7185; font-size: 0.8rem;">
        🗑️ Simülatörü Temizle
      </button>

      <button class="primary-btn" onclick="window.print()" style="font-size: 0.8rem; padding: 0.5rem 1rem;">
        🖨️ Burs Bütçe Raporunu Yazdır / PDF
      </button>
    </div>
  `;
}

function loadSimulatorPreset(presetId) {
  const preset = SIMULATOR_PRESETS.find(p => p.id === presetId);
  if (!preset) return;
  appState.simulatedBursIds = [...preset.ids];
  localStorage.setItem('bursradar_simulated', JSON.stringify(appState.simulatedBursIds));
  showToast(`⚡ ${preset.name} yüklendi!`);
  renderSimulatorModal();
  updateNavBadges();
  updateAndRender();
}

/* ==========================================================
   10. YENİ ÖZELLİK: ÖĞRENCİ BAŞVURU EVRAK ÇANTASI (CHECKLIST)
   ========================================================== */
function renderDocsDrawer() {
  const listContainer = document.getElementById('docsList');
  const progressText = document.getElementById('docsProgressText');
  const progressBadge = document.getElementById('docsProgressBadge');
  const progressBar = document.getElementById('docsProgressBar');

  if (!listContainer) return;

  const total = DOCS_LIST.length;
  const completed = DOCS_LIST.filter(d => !!appState.docsChecklist[d.id]).length;
  const percent = Math.round((completed / total) * 100);

  if (progressText) progressText.textContent = `${completed} / ${total} Belge Hazır (%${percent})`;
  if (progressBar) progressBar.style.width = `${percent}%`;

  if (progressBadge) {
    if (percent === 100) {
      progressBadge.textContent = '🎉 Tüm Belgeler Hazır!';
      progressBadge.className = 'val-tag text-success';
    } else if (percent > 0) {
      progressBadge.textContent = 'Devam Ediyor';
      progressBadge.className = 'val-tag';
    } else {
      progressBadge.textContent = 'Başlanmadı';
      progressBadge.className = 'val-tag';
    }
  }

  // Kategorilere göre grupla
  const grouped = {};
  DOCS_LIST.forEach(doc => {
    if (!grouped[doc.category]) grouped[doc.category] = [];
    grouped[doc.category].push(doc);
  });

  let html = '';
  Object.keys(grouped).forEach(cat => {
    html += `
      <div style="margin-top: 0.5rem; margin-bottom: 0.25rem;">
        <span style="font-size: 0.74rem; font-weight: 700; color: var(--accent-primary-light); text-transform: uppercase; letter-spacing: 0.05em;">
          ${cat}
        </span>
      </div>
    `;

    grouped[cat].forEach(doc => {
      const isChecked = !!appState.docsChecklist[doc.id];
      html += `
        <div class="doc-item ${isChecked ? 'completed' : ''}">
          <input type="checkbox" class="doc-checkbox" id="${doc.id}" ${isChecked ? 'checked' : ''} onchange="toggleDocItem('${doc.id}')">
          <div class="doc-content">
            <label for="${doc.id}" class="doc-item-name" style="cursor: pointer;">${doc.name}</label>
            <span class="doc-item-desc">${doc.desc}</span>
            <div class="doc-item-actions">
              ${doc.edevletUrl ? `
                <a href="${doc.edevletUrl}" target="_blank" rel="noopener noreferrer" class="edevlet-link-btn" title="e-Devlet üzerinden doğrudan al">
                  🏛️ e-Devlet'ten Al &rarr;
                </a>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });
  });

  listContainer.innerHTML = html;
}

function toggleDocItem(docId) {
  appState.docsChecklist[docId] = !appState.docsChecklist[docId];
  localStorage.setItem('bursradar_docs', JSON.stringify(appState.docsChecklist));
  renderDocsDrawer();
  updateNavBadges();
  showToast(appState.docsChecklist[docId] ? '✅ Belge hazır olarak işaretlendi' : 'Belge işareti kaldırıldı');
}

/* ==========================================================
   11. YARDIMCI FONKSİYONLAR (TOAST, TARİH FORMATI, MODAL, SCROLL)
   ========================================================== */
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

/* Modal Aç/Kapat (body scroll lock dahil) */
function openModal(el) {
  if (!el) return;
  el.classList.remove('hidden');
  document.body.classList.add('body-scroll-lock');
}

function closeModal(el) {
  if (!el) return;
  el.classList.add('hidden');
  const anyOpen = document.querySelectorAll('.modal-backdrop:not(.hidden), .drawer-backdrop:not(.hidden)');
  if (anyOpen.length === 0) {
    document.body.classList.remove('body-scroll-lock');
  }
}

/* Scroll-to-Top Butonu */
function initScrollToTop() {
  const btn = document.getElementById('scrollToTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
