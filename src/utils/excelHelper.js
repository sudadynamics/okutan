// Okutan Akademi - Excel (XLS) Dışa Aktarma Yardımcısı

/**
 * Kesin Kayıtlı Öğrenci Listesini Excel'e Aktarır
 */
export const exportStudentsToExcel = (students) => {
  if (!students || students.length === 0) {
    alert("Dışa aktarılacak öğrenci kaydı bulunamadı.");
    return;
  }

  // Genel Toplamları Hesapla
  const totalOriginal = students.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
  const totalDiscount = students.reduce((sum, s) => sum + (s.discount || 0), 0);
  const totalNet = students.reduce((sum, s) => sum + ((s.totalPrice || 0) - (s.discount || 0)), 0);
  const totalPaid = students.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalRemaining = totalNet - totalPaid;

  // Öğrenci Satırlarını HTML Olarak Oluştur
  const rowsHtml = students.map(student => {
    const finalPrice = (student.totalPrice || 0) - (student.discount || 0);
    const remaining = finalPrice - (student.paidAmount || 0);

    let paymentStatusText = "Ödenmedi";
    let paymentStatusBg = "#ffeaea";
    let paymentStatusColor = "#ff7675";

    if (student.paymentStatus === "paid") {
      paymentStatusText = "Tamamı Ödendi";
      paymentStatusBg = "#e6f7f4";
      paymentStatusColor = "#00b894";
    } else if (student.paymentStatus === "partial") {
      paymentStatusText = "Kısmi Ödendi";
      paymentStatusBg = "#fef9e7";
      paymentStatusColor = "#e67e22";
    }

    const teacherName = student.teacherName || "—";
    const lessonsText = student.lessons && student.lessons.length > 0
      ? student.lessons.map(l => `${l.day} (${l.time})`).join(", ")
      : "—";

    return `
      <tr>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif;">${student.name || ""}</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; mso-number-format:'\\@';">${student.phone || ""}</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: bold;">${student.studentName || ""}</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; text-align: center;">${student.studentAgeGrade || ""}</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; text-align: center;">${student.registrationDate || ""}</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: bold; color: #6c5ce7;">${teacherName}</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt;">${lessonsText}</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; text-align: right; mso-number-format:'#\\,##0\\ \\₺';">${student.totalPrice || 0} ₺</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; text-align: right; mso-number-format:'#\\,##0\\ \\₺';">${student.discount || 0} ₺</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; text-align: right; font-weight: bold; mso-number-format:'#\\,##0\\ \\₺';">${finalPrice} ₺</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; text-align: right; font-weight: bold; color: #00b894; mso-number-format:'#\\,##0\\ \\₺';">${student.paidAmount || 0} ₺</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; text-align: right; font-weight: bold; color: #ff7675; mso-number-format:'#\\,##0\\ \\₺';">${remaining} ₺</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; text-align: center; font-weight: bold; background-color: ${paymentStatusBg}; color: ${paymentStatusColor};">${paymentStatusText}</td>
      </tr>
    `;
  }).join("");

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Kesin Kayıtlar</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; }
        th { background-color: #6c5ce7; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; font-weight: bold; border: 1px solid #c2c9d6; padding: 10px; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="13" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 18pt; font-weight: bold; color: #6c5ce7; padding: 5px 0;">OKUTAN AKADEMİ</td>
        </tr>
        <tr>
          <td colspan="13" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; font-weight: bold; color: #2d3436;">HIZLI OKUMA KURSU KESİN KAYIT LİSTESİ VE DERS PROGRAMLARI</td>
        </tr>
        <tr>
          <td colspan="13" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; color: #7f8c8d; padding-bottom: 15px;">Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}</td>
        </tr>
        <tr><td colspan="13" style="height: 10px;"></td></tr>
        
        <thead>
          <tr>
            <th style="background-color: #6c5ce7; color: #ffffff;">Veli Adı Soyadı</th>
            <th style="background-color: #6c5ce7; color: #ffffff;">Telefon</th>
            <th style="background-color: #6c5ce7; color: #ffffff;">Öğrenci Adı</th>
            <th style="background-color: #6c5ce7; color: #ffffff;">Sınıf / Yaş</th>
            <th style="background-color: #6c5ce7; color: #ffffff;">Kayıt Tarihi</th>
            <th style="background-color: #6c5ce7; color: #ffffff;">Ders Öğretmeni</th>
            <th style="background-color: #6c5ce7; color: #ffffff;">Haftalık Ders Programı</th>
            <th style="background-color: #6c5ce7; color: #ffffff; text-align: right;">Kurs Ücreti</th>
            <th style="background-color: #6c5ce7; color: #ffffff; text-align: right;">İndirim</th>
            <th style="background-color: #6c5ce7; color: #ffffff; text-align: right;">Net Ücret</th>
            <th style="background-color: #6c5ce7; color: #ffffff; text-align: right;">Ödenen Tutar</th>
            <th style="background-color: #6c5ce7; color: #ffffff; text-align: right;">Kalan Alacak</th>
            <th style="background-color: #6c5ce7; color: #ffffff; text-align: center;">Ödeme Durumu</th>
          </tr>
        </thead>
        
        <tbody>
          ${rowsHtml}
          
          <tr style="font-weight: bold; background-color: #f0edff;">
            <td colspan="7" style="border: 1px solid #d2d2d2; padding: 10px; font-family: 'Segoe UI', Arial, sans-serif; text-align: right; color: #6c5ce7;">GENEL TOPLAM:</td>
            <td style="border: 1px solid #d2d2d2; padding: 10px; font-family: 'Segoe UI', Arial, sans-serif; text-align: right; color: #2d3436; mso-number-format:'#\\,##0\\ \\₺';">${totalOriginal} ₺</td>
            <td style="border: 1px solid #d2d2d2; padding: 10px; font-family: 'Segoe UI', Arial, sans-serif; text-align: right; color: #2d3436; mso-number-format:'#\\,##0\\ \\₺';">${totalDiscount} ₺</td>
            <td style="border: 1px solid #d2d2d2; padding: 10px; font-family: 'Segoe UI', Arial, sans-serif; text-align: right; color: #6c5ce7; mso-number-format:'#\\,##0\\ \\₺';">${totalNet} ₺</td>
            <td style="border: 1px solid #d2d2d2; padding: 10px; font-family: 'Segoe UI', Arial, sans-serif; text-align: right; color: #00b894; mso-number-format:'#\\,##0\\ \\₺';">${totalPaid} ₺</td>
            <td style="border: 1px solid #d2d2d2; padding: 10px; font-family: 'Segoe UI', Arial, sans-serif; text-align: right; color: #ff7675; mso-number-format:'#\\,##0\\ \\₺';">${totalRemaining} ₺</td>
            <td style="border: 1px solid #d2d2d2; padding: 10px; font-family: 'Segoe UI', Arial, sans-serif;"></td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;

  downloadBlob(excelHtml, `okutan_kesin_kayitlar_${todayDate()}.xls`);
};

/**
 * Öğretmen Haftalık Ders Programını Excel'e Aktarır
 */
export const exportTeacherScheduleToExcel = (teacher, students, lessonHours, daysOfWeek) => {
  if (!teacher) {
    alert("Öğretmen seçilmedi.");
    return;
  }

  const teacherStudents = students.filter(s => s.teacherId === teacher.id);
  const headerBg = teacher.id === "teacher-zehra" ? "#00b894" : "#6c5ce7";

  // Matrix Satırları
  const matrixRowsHtml = lessonHours.map(hour => {
    const cells = daysOfWeek.map(day => {
      const studentInSlot = teacherStudents.find(s =>
        s.lessons && s.lessons.some(l => l.day === day && l.time === hour)
      );

      if (studentInSlot) {
        return `
          <td style="border: 1px solid #d2d2d2; padding: 8px; background-color: ${teacher.id === "teacher-zehra" ? "#e6f7f4" : "#f0edff"}; font-family: 'Segoe UI', Arial, sans-serif; text-align: center;">
            <strong style="color: ${headerBg};">${studentInSlot.studentName}</strong><br/>
            <span style="font-size: 8pt; color: #636e72;">${studentInSlot.studentAgeGrade}</span>
          </td>
        `;
      }
      return `<td style="border: 1px solid #e1e8ed; padding: 8px; text-align: center; color: #b2bec3; font-family: 'Segoe UI', Arial, sans-serif;">—</td>`;
    }).join("");

    return `
      <tr>
        <td style="border: 1px solid #d2d2d2; padding: 8px; background-color: #f1f2f6; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; text-align: center;">${hour}</td>
        ${cells}
      </tr>
    `;
  }).join("");

  // Öğrenci Liste Satırları
  const studentListRowsHtml = teacherStudents.map((s, idx) => `
    <tr>
      <td style="border: 1px solid #d2d2d2; padding: 6px; text-align: center; font-family: 'Segoe UI', Arial, sans-serif;">${idx + 1}</td>
      <td style="border: 1px solid #d2d2d2; padding: 6px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif;">${s.studentName}</td>
      <td style="border: 1px solid #d2d2d2; padding: 6px; text-align: center; font-family: 'Segoe UI', Arial, sans-serif;">${s.studentAgeGrade}</td>
      <td style="border: 1px solid #d2d2d2; padding: 6px; font-family: 'Segoe UI', Arial, sans-serif;">${s.name}</td>
      <td style="border: 1px solid #d2d2d2; padding: 6px; text-align: center; font-family: 'Segoe UI', Arial, sans-serif; mso-number-format:'\\@';">${s.phone}</td>
      <td style="border: 1px solid #d2d2d2; padding: 6px; font-family: 'Segoe UI', Arial, sans-serif; color: ${headerBg};">${(s.lessons || []).map(l => `${l.day} (${l.time})`).join(", ")}</td>
    </tr>
  `).join("");

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${teacher.name} Ders Programı</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body>
      <table>
        <tr>
          <td colspan="8" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16pt; font-weight: bold; color: ${headerBg};">OKUTAN AKADEMİ — HAFTALIK ÖĞRETMEN DERS PROGRAMI</td>
        </tr>
        <tr>
          <td colspan="8" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12pt; font-weight: bold;">Öğretmen: ${teacher.name} | Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}</td>
        </tr>
        <tr><td colspan="8" style="height: 10px;"></td></tr>

        <!-- Program Matrisi -->
        <thead>
          <tr>
            <th style="background-color: ${headerBg}; color: #ffffff; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif;">Saat / Gün</th>
            ${daysOfWeek.map(d => `<th style="background-color: ${headerBg}; color: #ffffff; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif;">${d}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${matrixRowsHtml}
        </tbody>
      </table>

      <br/>
      <table>
        <tr>
          <td colspan="6" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12pt; font-weight: bold; color: ${headerBg};">ATANMIŞ ÖĞRENCİ LİSTESİ (${teacherStudents.length} Öğrenci)</td>
        </tr>
        <thead>
          <tr>
            <th style="background-color: #2d3436; color: #ffffff; padding: 6px;">#</th>
            <th style="background-color: #2d3436; color: #ffffff; padding: 6px;">Öğrenci Adı</th>
            <th style="background-color: #2d3436; color: #ffffff; padding: 6px;">Sınıf / Yaş</th>
            <th style="background-color: #2d3436; color: #ffffff; padding: 6px;">Veli Adı</th>
            <th style="background-color: #2d3436; color: #ffffff; padding: 6px;">Veli Telefon</th>
            <th style="background-color: #2d3436; color: #ffffff; padding: 6px;">Ders Seansları</th>
          </tr>
        </thead>
        <tbody>
          ${studentListRowsHtml.length > 0 ? studentListRowsHtml : `<tr><td colspan="6" style="padding: 10px; text-align: center;">Öğrenci kaydı yok.</td></tr>`}
        </tbody>
      </table>
    </body>
    </html>
  `;

  downloadBlob(excelHtml, `ogretmen_programi_${teacher.name.toLowerCase().replace(/\s+/g, "_")}_${todayDate()}.xls`);
};

/**
 * Potansiyel Müşteri Görüşme Listesini Excel'e Aktarır
 */
export const exportLeadsToExcel = (leads) => {
  if (!leads || leads.length === 0) {
    alert("Dışa aktarılacak görüşme kaydı bulunamadı.");
    return;
  }

  const rowsHtml = leads.map(l => {
    let statusText = "Yeni";
    let statusBg = "#e3f2fd";
    let statusColor = "#0288d1";

    if (l.status === "contacted") { statusText = "Görüşüldü"; statusBg = "#fff8e1"; statusColor = "#f57c00"; }
    else if (l.status === "waiting") { statusText = "Karar Bekliyor"; statusBg = "#f3e5f5"; statusColor = "#7b1fa2"; }
    else if (l.status === "lost") { statusText = "Olumsuz"; statusBg = "#ffebee"; statusColor = "#c62828"; }
    else if (l.status === "confirmed") { statusText = "Kayıt Yapıldı"; statusBg = "#e8f5e9"; statusColor = "#2e7d32"; }

    return `
      <tr>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: bold;">${l.name || ""}</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; mso-number-format:'\\@';">${l.phone || ""}</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; text-align: center;">${l.date || ""}</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; text-align: center;">${l.source || ""}</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; text-align: center; font-weight: bold; background-color: ${statusBg}; color: ${statusColor};">${statusText}</td>
        <td style="border: 1px solid #d2d2d2; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif;">${l.notes || ""}</td>
      </tr>
    `;
  }).join("");

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Görüşülen Müşteriler</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body>
      <table>
        <tr>
          <td colspan="6" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16pt; font-weight: bold; color: #6c5ce7;">OKUTAN AKADEMİ — GÖRÜŞÜLEN MÜŞTERİ KAYIT LİSTESİ</td>
        </tr>
        <tr>
          <td colspan="6" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; color: #7f8c8d;">Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')} | Toplam Kayıt: ${leads.length}</td>
        </tr>
        <tr><td colspan="6" style="height: 10px;"></td></tr>

        <thead>
          <tr>
            <th style="background-color: #6c5ce7; color: #ffffff; padding: 8px;">Veli Adı Soyadı</th>
            <th style="background-color: #6c5ce7; color: #ffffff; padding: 8px;">Telefon</th>
            <th style="background-color: #6c5ce7; color: #ffffff; padding: 8px;">Görüşme Tarihi</th>
            <th style="background-color: #6c5ce7; color: #ffffff; padding: 8px;">Kanal</th>
            <th style="background-color: #6c5ce7; color: #ffffff; padding: 8px;">Durum</th>
            <th style="background-color: #6c5ce7; color: #ffffff; padding: 8px;">Görüşme Notları</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  downloadBlob(excelHtml, `okutan_gorusulen_musteriler_${todayDate()}.xls`);
};

// Yardımcı İndirme Fonksiyonları
const downloadBlob = (content, filename) => {
  const bom = "\uFEFF";
  const blob = new Blob([bom + content], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const todayDate = () => new Date().toISOString().split("T")[0];
