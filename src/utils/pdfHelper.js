import html2pdf from "html2pdf.js";

const DEFAULT_DAYS_OF_WEEK = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const DEFAULT_LESSON_HOURS = [
  "09:00 - 10:30",
  "10:30 - 12:00",
  "12:00 - 13:30",
  "13:30 - 15:00",
  "15:00 - 16:30",
  "16:30 - 18:00",
  "18:00 - 19:30"
];

// ─── Yardımcı Fonksiyon: Off-screen IFrame ile Titreşimsiz PDF Çıktısı ────────
const printToPdfViaIframe = (htmlContent, opt) => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.width = "1024px";
  iframe.style.height = "768px";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Okutan Akademi PDF</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #fff;
            color: #2d3436;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `);
  doc.close();

  return new Promise((resolve, reject) => {
    iframe.onload = () => {
      html2pdf()
        .set(opt)
        .from(doc.body)
        .save()
        .then(() => {
          document.body.removeChild(iframe);
          resolve();
        })
        .catch((err) => {
          console.error("PDF Generation Error:", err);
          document.body.removeChild(iframe);
          reject(err);
        });
    };
    
    setTimeout(() => {
      if (iframe.parentNode) {
        html2pdf()
          .set(opt)
          .from(doc.body)
          .save()
          .then(() => {
            if (iframe.parentNode) document.body.removeChild(iframe);
            resolve();
          })
          .catch((err) => {
            if (iframe.parentNode) document.body.removeChild(iframe);
            reject(err);
          });
      }
    }, 250);
  });
};

// ─── Öğretmen Ders Programı PDF Dışa Aktarma ────────────────────────────────
export const exportTeacherScheduleToPDF = (
  teacher,
  students,
  lessonHours = DEFAULT_LESSON_HOURS,
  daysOfWeek = DEFAULT_DAYS_OF_WEEK
) => {
  if (!teacher) {
    alert("Lütfen geçerli bir öğretmen seçiniz.");
    return;
  }

  const teacherStudents = students.filter(s => s.teacherId === teacher.id);

  // Öğrenci Liste Satırları
  const studentRowsHtml = teacherStudents.map((student, idx) => {
    const lessonsText = student.lessons && student.lessons.length > 0
      ? student.lessons.map(l => `${l.day.substring(0, 3)} (${l.time.split(" ")[0]})`).join(", ")
      : "Henüz atanmadı";

    return `
      <tr>
        <td style="text-align: center; font-weight: bold; width: 30px; border: 1px solid #dcdde1; padding: 6px;">${idx + 1}</td>
        <td style="font-weight: bold; color: #2d3436; border: 1px solid #dcdde1; padding: 6px;">${student.studentName || ""}</td>
        <td style="text-align: center; border: 1px solid #dcdde1; padding: 6px;">${student.studentAgeGrade || ""}</td>
        <td style="border: 1px solid #dcdde1; padding: 6px;">${student.name || ""}</td>
        <td style="text-align: center; font-family: monospace; font-weight: bold; border: 1px solid #dcdde1; padding: 6px;">${student.phone || ""}</td>
        <td style="color: #6c5ce7; font-weight: 600; border: 1px solid #dcdde1; padding: 6px;">${lessonsText}</td>
      </tr>
    `;
  }).join("");

  // Ders Programı Matrisi Satırları (Gün x Saat)
  const gridRowsHtml = lessonHours.map(hour => {
    const cellsHtml = daysOfWeek.map(day => {
      const studentInSlot = teacherStudents.find(s =>
        s.lessons && s.lessons.some(l => l.day === day && l.time === hour)
      );

      if (studentInSlot) {
        return `
          <td style="background-color: ${teacher.id === "teacher-zehra" ? "#e6f7f4" : "#f0edff"}; border: 1px solid #dcdde1; border-left: 3px solid ${teacher.id === "teacher-zehra" ? "#00b894" : "#6c5ce7"}; padding: 5px; text-align: center; vertical-align: middle;">
            <div style="font-weight: bold; color: ${teacher.id === "teacher-zehra" ? "#00b894" : "#6c5ce7"}; font-size: 8.5pt;">${studentInSlot.studentName}</div>
            <div style="font-size: 7.5pt; color: #2d3436;">${studentInSlot.studentAgeGrade}</div>
            <div style="font-size: 7pt; color: #636e72;">📞 ${studentInSlot.phone}</div>
          </td>
        `;
      }
      return `<td style="color: #b2bec3; background-color: #fafafa; border: 1px solid #dcdde1; padding: 5px; text-align: center;">—</td>`;
    }).join("");

    return `
      <tr>
        <th style="background-color: #f1f2f6; color: #2d3436; width: 90px; font-size: 8pt; border: 1px solid #dcdde1; padding: 5px; text-align: center;">${hour}</th>
        ${cellsHtml}
      </tr>
    `;
  }).join("");

  const themeColor = teacher.id === "teacher-zehra" ? "#00b894" : "#6c5ce7";
  const teacherIcon = teacher.id === "teacher-zehra" ? "👩‍🏫" : "👨‍🏫";

  const htmlContent = `
    <div style="padding: 20px; background: #ffffff; color: #2d3436; font-family: 'Segoe UI', Arial, sans-serif; box-sizing: border-box; width: 100%;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${themeColor}; padding-bottom: 10px; margin-bottom: 15px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div>
            <h1 style="margin: 0; font-size: 18pt; color: ${themeColor}; letter-spacing: 0.5px;">OKUTAN AKADEMİ</h1>
            <p style="margin: 2px 0 0 0; font-size: 9.5pt; color: #636e72; font-weight: 600;">Hızlı Okuma ve Gelişim Merkezi — Öğretmen Ders Programı</p>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 13pt; font-weight: bold; color: #2d3436;">${teacherIcon} ${teacher.name}</div>
          <div style="font-size: 8.5pt; color: #7f8c8d; margin-top: 3px;">Tarih: ${new Date().toLocaleDateString('tr-TR')} | Toplam Öğrenci: ${teacherStudents.length}</div>
        </div>
      </div>

      <div style="font-size: 10.5pt; font-weight: bold; color: ${themeColor}; margin-bottom: 6px; text-transform: uppercase;">📅 Haftalık Ders Programı Çizelgesi</div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 8.5pt;">
        <thead>
          <tr>
            <th style="background-color: ${themeColor}; color: #ffffff; padding: 6px; font-size: 9pt; width: 90px; border: 1px solid #dcdde1;">Saat / Gün</th>
            ${daysOfWeek.map(d => `<th style="background-color: ${themeColor}; color: #ffffff; padding: 6px; font-size: 9pt; border: 1px solid #dcdde1;">${d}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${gridRowsHtml}
        </tbody>
      </table>

      <div style="font-size: 10.5pt; font-weight: bold; color: ${themeColor}; margin-bottom: 6px; text-transform: uppercase; margin-top: 15px;">👨‍🎓 Atanan Öğrenci ve Veli İletişim Rehberi</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
        <thead>
          <tr>
            <th style="background-color: #2d3436; color: #ffffff; padding: 6px; text-align: center; width: 30px; border: 1px solid #2d3436;">#</th>
            <th style="background-color: #2d3436; color: #ffffff; padding: 6px; text-align: left; border: 1px solid #2d3436;">Öğrenci Adı Soyadı</th>
            <th style="background-color: #2d3436; color: #ffffff; padding: 6px; text-align: center; border: 1px solid #2d3436;">Sınıf / Yaş</th>
            <th style="background-color: #2d3436; color: #ffffff; padding: 6px; text-align: left; border: 1px solid #2d3436;">Veli Adı Soyadı</th>
            <th style="background-color: #2d3436; color: #ffffff; padding: 6px; text-align: center; border: 1px solid #2d3436;">Veli Telefon</th>
            <th style="background-color: #2d3436; color: #ffffff; padding: 6px; text-align: left; border: 1px solid #2d3436;">Ders Seansları</th>
          </tr>
        </thead>
        <tbody>
          ${studentRowsHtml.length > 0 ? studentRowsHtml : `<tr><td colspan="6" style="text-align:center; padding: 10px; color: #7f8c8d; border: 1px solid #dcdde1;">Bu öğretmene atanmış kesin kayıtlı öğrenci bulunmamaktadır.</td></tr>`}
        </tbody>
      </table>

      <div style="margin-top: 15px; padding-top: 6px; border-top: 1px solid #e1e8ed; display: flex; justify-content: space-between; font-size: 7.5pt; color: #95a5a6;">
        <span>Okutan Akademi Öğrenci & Takip Otomasyonu</span>
        <span>Suda Dynamics Projesidir</span>
      </div>
    </div>
  `;

  const teacherSlug = teacher.name.toLowerCase().replace(/\s+/g, "_");
  const today = new Date().toISOString().split("T")[0];
  const filename = `okutan_ogretmen_programi_${teacherSlug}_${today}.pdf`;

  const opt = {
    margin: [8, 8, 8, 8],
    filename: filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
  };

  printToPdfViaIframe(htmlContent, opt);
};

// ─── Tahsilat Makbuzu PDF Dışa Aktarma ─────────────────────────────────────
export const exportPaymentReceiptPDF = (student, payment) => {
  if (!student || !payment) {
    alert("Geçersiz öğrenci veya ödeme bilgisi.");
    return;
  }

  const cleanId = String(payment.id || "").replace(/\D/g, "") || Math.floor(Math.random() * 10000);
  const receiptNo = `MAK-${payment.date.replace(/-/g, "")}-${cleanId}`;

  const htmlContent = `
    <div style="padding: 25px; border: 2px solid #6c5ce7; border-radius: 8px; max-width: 680px; margin: auto; background-color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; position: relative; box-sizing: border-box;">
      <div style="position: absolute; top: 55%; left: 50%; transform: translate(-50%, -50%); font-size: 60px; color: rgba(108, 92, 231, 0.04); font-weight: bold; pointer-events: none; text-align: center; width: 100%; white-space: nowrap; z-index: 0;">
        OKUTAN AKADEMİ
      </div>

      <div style="position: relative; z-index: 1;">
        <!-- Header -->
        <table style="width: 100%; border-bottom: 2px solid #6c5ce7; padding-bottom: 12px; margin-bottom: 15px;">
          <tr>
            <td>
              <h1 style="margin: 0; color: #6c5ce7; font-size: 22px; letter-spacing: 0.5px;">OKUTAN AKADEMİ</h1>
              <p style="margin: 3px 0 0 0; font-size: 10px; color: #7f8c8d; font-weight: 600;">Hızlı Okuma ve Gelişim Merkezi</p>
            </td>
            <td style="text-align: right; vertical-align: bottom;">
              <h2 style="margin: 0; color: #2d3436; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">TAHSİLAT MAKBUZU</h2>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #d63031; font-weight: 700;">No: ${receiptNo}</p>
            </td>
          </tr>
        </table>

        <!-- Details Table -->
        <table style="width: 100%; font-size: 12px; color: #2d3436; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #fcfcfc;">
            <td style="padding: 8px 10px; font-weight: bold; width: 30%; border: 1px solid #dfe6e9;">Ödeme Tarihi:</td>
            <td style="padding: 8px 10px; border: 1px solid #dfe6e9;">${payment.date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 10px; font-weight: bold; border: 1px solid #dfe6e9;">Veli Adı Soyadı:</td>
            <td style="padding: 8px 10px; border: 1px solid #dfe6e9; font-weight: 600;">${student.name}</td>
          </tr>
          <tr style="background-color: #fcfcfc;">
            <td style="padding: 8px 10px; font-weight: bold; border: 1px solid #dfe6e9;">Öğrenci Adı Soyadı:</td>
            <td style="padding: 8px 10px; border: 1px solid #dfe6e9; font-weight: 600;">${student.studentName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 10px; font-weight: bold; border: 1px solid #dfe6e9;">Veli Telefon:</td>
            <td style="padding: 8px 10px; border: 1px solid #dfe6e9; font-family: monospace; font-weight: bold;">${student.phone}</td>
          </tr>
          <tr style="background-color: #fcfcfc;">
            <td style="padding: 8px 10px; font-weight: bold; border: 1px solid #dfe6e9;">Ödeme Türü:</td>
            <td style="padding: 8px 10px; border: 1px solid #dfe6e9;"><span style="background-color: #e0edff; color: #0061f2; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">${payment.type}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 10px; font-weight: bold; border: 1px solid #dfe6e9;">Açıklama:</td>
            <td style="padding: 8px 10px; border: 1px solid #dfe6e9; color: #636e72;">${payment.description || 'Taksit Ödemesi'}</td>
          </tr>
          <tr style="background-color: #f0edff; font-size: 14px;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #6c5ce7; color: #6c5ce7;">Ödenen Tutar:</td>
            <td style="padding: 10px; border: 1px solid #6c5ce7; font-weight: bold; color: #00b894;">
              ${Number(payment.amount).toLocaleString('tr-TR')} ₺
            </td>
          </tr>
        </table>

        <!-- Signatures -->
        <table style="width: 100%; margin-top: 30px; font-size: 11px; text-align: center;">
          <tr>
            <td style="width: 50%; padding-bottom: 40px; font-weight: bold; color: #636e72;">
              Ödemeyi Yapan (Veli)<br>
              <span style="font-size: 10px; font-weight: normal; color: #2d3436;">${student.name}</span>
            </td>
            <td style="width: 50%; padding-bottom: 40px; font-weight: bold; color: #636e72;">
              Tahsil Eden (Okutan Akademi)<br>
              <span style="font-size: 10px; font-weight: normal; color: #2d3436;">İmza / Kaşe</span>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px dashed #b2bec3; padding-top: 8px; color: #7f8c8d;">İmza</td>
            <td style="border-top: 1px dashed #b2bec3; padding-top: 8px; color: #7f8c8d;">İmza</td>
          </tr>
        </table>

        <!-- Footer -->
        <div style="margin-top: 25px; text-align: center; font-size: 9px; color: #b2bec3; border-top: 1px solid #f1f2f6; padding-top: 8px;">
          Bu makbuz elektronik ortamda üretilmiştir. Okutan Akademi &copy; 2026 | Suda Dynamics
        </div>
      </div>
    </div>
  `;

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `okutan_tahsilat_makbuzu_${receiptNo}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a5", orientation: "landscape" }
  };

  printToPdfViaIframe(htmlContent, opt);
};

// ─── Mezuniyet Başarı Sertifikası PDF ──────────────────────────────────────
export const exportGraduationCertificatePDF = (student) => {
  if (!student) {
    alert("Geçersiz öğrenci bilgisi.");
    return;
  }

  const initialWpm = student.progressHistory?.[0]?.wpm || 120;
  const initialComp = student.progressHistory?.[0]?.comprehension || 50;
  const finalWpm = student.progressHistory?.[student.progressHistory.length - 1]?.wpm || 300;
  const finalComp = student.progressHistory?.[student.progressHistory.length - 1]?.comprehension || 85;
  const gradDate = student.graduationDate || new Date().toISOString().split("T")[0];

  const htmlContent = `
    <div style="padding: 30px; border: 8px double #6c5ce7; border-radius: 12px; max-width: 800px; margin: auto; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; position: relative; box-sizing: border-box; text-align: center;">
      <div style="font-size: 13pt; font-weight: 800; color: #6c5ce7; letter-spacing: 3px; text-transform: uppercase;">OKUTAN AKADEMİ HIZLI OKUMA MERKEZİ</div>
      <h1 style="font-size: 26pt; color: #2d3436; margin: 15px 0 5px 0; font-family: Georgia, serif;">BAŞARI VE MEZUNİYET SERTİFİKASI</h1>
      <p style="font-size: 10.5pt; color: #7f8c8d; font-style: italic; margin-bottom: 25px;">Bu belge Okutan Akademi Hızlı Okuma ve Odaklanma Eğitimi'ni başarıyla tamamlayan öğrencimize verilmiştir.</p>
      
      <div style="margin: 20px 0; font-size: 22pt; font-weight: bold; color: #00b894; text-decoration: underline;">
        ${student.studentName || student.name}
      </div>

      <p style="font-size: 11pt; color: #2d3436; max-width: 600px; margin: 0 auto 25px auto; line-height: 1.6;">
        Öğrencimiz, <b>${student.studentAgeGrade || 'Eğitim Programı'}</b> dâhilinde gösterdiği yüksek azim ve disiplin ile okuma hızını ve anlama kapasitesini rekor düzeyde artırarak mezun olmaya hak kazanmıştır.
      </p>

      <!-- Gelişim Özeti -->
      <table style="width: 80%; margin: 0 auto 25px auto; border-collapse: collapse; background: #f0edff; border-radius: 8px; border: 1px solid #6c5ce7;">
        <thead>
          <tr style="background: #6c5ce7; color: #fff; font-size: 9.5pt;">
            <th style="padding: 8px;">Ölçüm Kriteri</th>
            <th style="padding: 8px;">Başlangıç Seviyesi</th>
            <th style="padding: 8px;">Mezuniyet Seviyesi</th>
            <th style="padding: 8px;">Gelişim Artışı</th>
          </tr>
        </thead>
        <tbody style="font-size: 10pt; font-weight: bold; color: #2d3436;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #c8d6e5;">Okuma Hızı (WPM)</td>
            <td style="padding: 8px; border-bottom: 1px solid #c8d6e5; color: #e74c3c;">${initialWpm} kelime/dk</td>
            <td style="padding: 8px; border-bottom: 1px solid #c8d6e5; color: #27ae60;">${finalWpm} kelime/dk</td>
            <td style="padding: 8px; border-bottom: 1px solid #c8d6e5; color: #2980b9;">+${Math.round(((finalWpm - initialWpm) / initialWpm) * 100)}%</td>
          </tr>
          <tr>
            <td style="padding: 8px;">Anlama Oranı (%)</td>
            <td style="padding: 8px; color: #e74c3c;">%${initialComp}</td>
            <td style="padding: 8px; color: #27ae60;">%${finalComp}</td>
            <td style="padding: 8px; color: #2980b9;">+${finalComp - initialComp}% puan</td>
          </tr>
        </tbody>
      </table>

      <!-- Alt İmza Alanı -->
      <table style="width: 100%; margin-top: 30px; font-size: 10pt;">
        <tr>
          <td style="width: 50%; text-align: center;">
            <div style="font-weight: bold; color: #2d3436;">Eğitmen</div>
            <div style="color: #636e72; margin-top: 4px;">${student.teacherName || 'Okutan Akademi Eğitmeni'}</div>
            <div style="margin-top: 25px; border-top: 1px dashed #b2bec3; width: 60%; margin-left: auto; margin-right: auto; padding-top: 4px; font-size: 8pt; color: #95a5a6;">İmza</div>
          </td>
          <td style="width: 50%; text-align: center;">
            <div style="font-weight: bold; color: #2d3436;">Kurucu / Yönetici</div>
            <div style="color: #636e72; margin-top: 4px;">Kurum Yönetimi</div>
            <div style="margin-top: 25px; border-top: 1px dashed #b2bec3; width: 60%; margin-left: auto; margin-right: auto; padding-top: 4px; font-size: 8pt; color: #95a5a6;">Mühür / İmza</div>
          </td>

        </tr>
      </table>

      <div style="margin-top: 20px; font-size: 8.5pt; color: #95a5a6;">
        Tarih: ${gradDate} | Sertifika No: OKU-MEZ-${gradDate.replace(/-/g, "")}-${student.id.replace(/\D/g, "") || '101'}
      </div>
    </div>
  `;

  const opt = {
    margin: [8, 8, 8, 8],
    filename: `okutan_mezuniyet_sertifikasi_${student.studentName || 'ogrenci'}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
  };

  printToPdfViaIframe(htmlContent, opt);
};

// ─── Öğretmen Maaş Bordrosu / Ödeme Makbuzu PDF ───────────────────────────
export const exportTeacherSalaryReceiptPDF = (teacher, salary) => {
  if (!teacher || !salary) {
    alert("Geçersiz öğretmen veya maaş verisi.");
    return;
  }

  const receiptNo = `BORDRO-${salary.period || salary.date || new Date().toISOString().split("T")[0]}-${salary.id || '1'}`;
  const sessionRate = salary.sessionRate || 500;
  const bonus = salary.bonus || 0;
  const deduction = salary.deduction || 0;

  const htmlContent = `
    <div style="padding: 25px; border: 2px solid #6c5ce7; border-radius: 8px; max-width: 680px; margin: auto; background-color: #fff; font-family: 'Segoe UI', sans-serif; box-sizing: border-box;">
      <table style="width: 100%; border-bottom: 2px solid #6c5ce7; padding-bottom: 10px; margin-bottom: 15px;">
        <tr>
          <td>
            <h1 style="margin: 0; color: #6c5ce7; font-size: 20px;">OKUTAN AKADEMİ</h1>
            <p style="margin: 2px 0 0 0; font-size: 10px; color: #7f8c8d;">Eğitmen Maaş & Bordro Makbuzu</p>
          </td>
          <td style="text-align: right;">
            <h2 style="margin: 0; color: #2d3436; font-size: 14px;">MAAŞ BORDROSU</h2>
            <p style="margin: 2px 0 0 0; font-size: 10px; color: #e74c3c; font-weight: bold;">Evrak No: ${receiptNo}</p>
          </td>
        </tr>
      </table>

      <table style="width: 100%; font-size: 11px; color: #2d3436; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background: #f8f9fa;">
          <td style="padding: 8px; font-weight: bold; border: 1px solid #dfe6e9;">Eğitmen Adı Soyadı:</td>
          <td style="padding: 8px; border: 1px solid #dfe6e9; font-weight: 600;">${teacher.name || salary.teacherName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border: 1px solid #dfe6e9;">Dönem / Tarih:</td>
          <td style="padding: 8px; border: 1px solid #dfe6e9;">${salary.period || salary.date || new Date().toISOString().split("T")[0]}</td>
        </tr>
        <tr style="background: #f8f9fa;">
          <td style="padding: 8px; font-weight: bold; border: 1px solid #dfe6e9;">Ders Seansı & Birim Ücret:</td>
          <td style="padding: 8px; border: 1px solid #dfe6e9;">${salary.weeks || 1} Hafta x ${salary.weeklySessionCount || 0} Seans @ ${sessionRate.toLocaleString("tr-TR")} ₺/seans</td>
        </tr>
        ${bonus > 0 ? `
        <tr>
          <td style="padding: 8px; font-weight: bold; border: 1px solid #dfe6e9; color: #00b894;">Ek Prim / İkramiye:</td>
          <td style="padding: 8px; border: 1px solid #dfe6e9; font-weight: bold; color: #00b894;">+${bonus.toLocaleString("tr-TR")} ₺</td>
        </tr>
        ` : ''}
        ${deduction > 0 ? `
        <tr>
          <td style="padding: 8px; font-weight: bold; border: 1px solid #dfe6e9; color: #d63031;">Kesinti / Avans:</td>
          <td style="padding: 8px; border: 1px solid #dfe6e9; font-weight: bold; color: #d63031;">-${deduction.toLocaleString("tr-TR")} ₺</td>
        </tr>
        ` : ''}
        ${salary.note ? `
        <tr style="background: #f8f9fa;">
          <td style="padding: 8px; font-weight: bold; border: 1px solid #dfe6e9;">Bordro Notu:</td>
          <td style="padding: 8px; border: 1px solid #dfe6e9; color: #636e72;">${salary.note}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px; font-weight: bold; border: 1px solid #dfe6e9;">Ödeme Durumu:</td>
          <td style="padding: 8px; border: 1px solid #dfe6e9;">
            <span style="background: ${salary.status === 'Ödendi' ? '#e6f7f4' : '#fff3cd'}; color: ${salary.status === 'Ödendi' ? '#00b894' : '#856404'}; padding: 2px 8px; border-radius: 4px; font-weight: bold;">
              ${salary.status || 'Ödendi'}
            </span>
          </td>
        </tr>
        <tr style="background: #f0edff; font-size: 13px;">
          <td style="padding: 10px; font-weight: bold; border: 1px solid #6c5ce7; color: #6c5ce7;">Net Ödenen Maaş:</td>
          <td style="padding: 10px; border: 1px solid #6c5ce7; font-weight: bold; color: #00b894;">
            ${Number(salary.totalSalary || 0).toLocaleString('tr-TR')} ₺
          </td>
        </tr>
      </table>

      <table style="width: 100%; margin-top: 30px; font-size: 11px; text-align: center;">
        <tr>
          <td style="width: 50%; padding-bottom: 30px; font-weight: bold; color: #636e72;">
            Ödemeyi Alan (Eğitmen)<br>
            <span style="font-size: 10px; font-weight: normal; color: #2d3436;">${teacher.name || salary.teacherName}</span>
          </td>
          <td style="width: 50%; padding-bottom: 30px; font-weight: bold; color: #636e72;">
            Ödeyen (Okutan Akademi Kurum Yönetimi)<br>
            <span style="font-size: 10px; font-weight: normal; color: #2d3436;">Kaşe / İmza</span>
          </td>
        </tr>
      </table>
    </div>
  `;

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `okutan_ogretmen_maas_bordrosu_${(teacher.name || salary.teacherName).toLowerCase().replace(/\s+/g, "_")}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a5", orientation: "landscape" }
  };

  printToPdfViaIframe(htmlContent, opt);
};


