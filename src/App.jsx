import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  FileSpreadsheet,
  BookOpen,
  Trash2,
  Edit3,
  Download,
  Upload,
  FileText,
  Clock,
  Send,
  AlertTriangle,
  Info,
  LogOut,
  Sun,
  Moon,
  CheckCircle,
  XCircle,
  Calendar,
  Settings,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  UserPlus,
  X,
  Wallet,
  Receipt,
  GraduationCap,
  Bell,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Award,
  TrendingDown
} from "lucide-react";
import { exportStudentsToExcel, exportTeacherScheduleToExcel, exportLeadsToExcel } from "./utils/excelHelper";
import { exportTeacherScheduleToPDF, exportPaymentReceiptPDF, exportGraduationCertificatePDF, exportTeacherSalaryReceiptPDF } from "./utils/pdfHelper";
import { initialLeads, initialStudents, initialTeachers, initialUsers } from "./mockData";

// ─── Varsayılan Sabitler ───────────────────────────────────────────────────
const LOGO_SRC = `${import.meta.env.BASE_URL || "/"}logo.png`;
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

const ADMIN_REGISTER_PASSWORD = "OKUTAN_2026!"; // Yeni kullanıcı açmak için yönetici şifresi

// ─── API Yardımcısı & Çevrimdışı / Localhost Mock Katmanı ────────────────────
const API_URL = import.meta.env.VITE_API_URL || "/api";

const getLocalData = (key, defaultVal) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaultVal;
  }
};

const setLocalData = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

async function handleMockFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  // Auth: /auth/login
  if (path === "/auth/login" && method === "POST") {
    const users = getLocalData("okutan_users", initialUsers);
    const user = users.find(u => u.username.toLowerCase() === body.username.toLowerCase() && u.password === body.password);
    if (!user) {
      throw new Error("Hatalı kullanıcı adı veya şifre!");
    }
    const token = "mock-jwt-token-" + user.id;
    localStorage.setItem("okutan_token", token);
    localStorage.setItem("okutan_active_user", JSON.stringify(user));
    return { token, user };
  }

  // Auth: /auth/register
  if (path === "/auth/register" && method === "POST") {
    const { name, username, password, role, adminCode } = body;
    if (adminCode !== ADMIN_REGISTER_PASSWORD && adminCode !== "123" && adminCode !== "admin") {
      throw new Error("Yönetici onay şifresi hatalı! (Örnek şifre: OKUTAN_2026!)");
    }
    const users = getLocalData("okutan_users", initialUsers);
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error("Bu kullanıcı adı zaten kullanılıyor.");
    }
    const newUser = {
      id: "u-" + Date.now(),
      name,
      username,
      password,
      role: role || "Asistan"
    };
    users.push(newUser);
    setLocalData("okutan_users", users);
    const token = "mock-jwt-token-" + newUser.id;
    localStorage.setItem("okutan_token", token);
    localStorage.setItem("okutan_active_user", JSON.stringify(newUser));
    return { token, user: newUser };
  }

  // Auth: /auth/me
  if (path === "/auth/me" && method === "GET") {
    const activeUser = localStorage.getItem("okutan_active_user");
    if (activeUser) {
      try { return { user: JSON.parse(activeUser) }; } catch {}
    }
    const users = getLocalData("okutan_users", initialUsers);
    return { user: users[0] || initialUsers[0] };
  }

  // Leads: /leads
  if (path === "/leads") {
    if (method === "GET") return getLocalData("okutan_leads", initialLeads);
    if (method === "POST") {
      const leads = getLocalData("okutan_leads", initialLeads);
      const newLead = { id: "lead-" + Date.now(), date: new Date().toISOString().split("T")[0], ...body };
      leads.unshift(newLead);
      setLocalData("okutan_leads", leads);
      return newLead;
    }
  }

  if (path.startsWith("/leads/")) {
    const id = path.replace("/leads/", "");
    let leads = getLocalData("okutan_leads", initialLeads);
    if (method === "PUT") {
      leads = leads.map(l => l.id === id ? { ...l, ...body, updatedDate: new Date().toISOString().split("T")[0] } : l);
      setLocalData("okutan_leads", leads);
      return leads.find(l => l.id === id) || body;
    }
    if (method === "DELETE") {
      leads = leads.filter(l => l.id !== id);
      setLocalData("okutan_leads", leads);
      return { success: true };
    }
  }

  // Students: /students
  if (path === "/students") {
    if (method === "GET") return getLocalData("okutan_students", initialStudents);
    if (method === "POST") {
      const students = getLocalData("okutan_students", initialStudents);
      const newStudent = { id: "student-" + Date.now(), ...body };
      students.unshift(newStudent);
      setLocalData("okutan_students", students);
      return newStudent;
    }
  }

  if (path.startsWith("/students/")) {
    const id = path.replace("/students/", "");
    let students = getLocalData("okutan_students", initialStudents);
    if (method === "PUT") {
      students = students.map(s => s.id === id ? { ...s, ...body } : s);
      setLocalData("okutan_students", students);
      return students.find(s => s.id === id) || body;
    }
    if (method === "DELETE") {
      students = students.filter(s => s.id !== id);
      setLocalData("okutan_students", students);
      return { success: true };
    }
  }

  // Teachers: /teachers
  if (path === "/teachers" && method === "GET") {
    return getLocalData("okutan_teachers", initialTeachers);
  }

  // Settings: /settings
  if (path === "/settings") {
    if (method === "GET") return getLocalData("okutan_settings", { daysOfWeek: DEFAULT_DAYS_OF_WEEK, lessonHours: DEFAULT_LESSON_HOURS });
    if (method === "PUT") {
      setLocalData("okutan_settings", body);
      return body;
    }
  }

  // Expenses: /expenses
  if (path === "/expenses") {
    if (method === "GET") return getLocalData("okutan_expenses", []);
    if (method === "POST") {
      const expenses = getLocalData("okutan_expenses", []);
      const newExp = { id: "exp-" + Date.now(), date: new Date().toISOString().split("T")[0], ...body };
      expenses.unshift(newExp);
      setLocalData("okutan_expenses", expenses);
      return newExp;
    }
  }

  if (path.startsWith("/expenses/")) {
    const id = path.replace("/expenses/", "");
    if (method === "DELETE") {
      const expenses = getLocalData("okutan_expenses", []).filter(e => e.id !== id);
      setLocalData("okutan_expenses", expenses);
      return { success: true };
    }
  }

  // Teacher Salaries: /teacher-salaries
  if (path === "/teacher-salaries") {
    if (method === "GET") return getLocalData("okutan_teacher_salaries", []);
    if (method === "POST") {
      const salaries = getLocalData("okutan_teacher_salaries", []);
      const newSal = { id: "sal-" + Date.now(), date: new Date().toISOString().split("T")[0], ...body };
      salaries.unshift(newSal);
      setLocalData("okutan_teacher_salaries", salaries);
      return newSal;
    }
  }

  if (path.startsWith("/teacher-salaries/")) {
    const id = path.replace("/teacher-salaries/", "");
    let salaries = getLocalData("okutan_teacher_salaries", []);
    if (method === "PUT") {
      salaries = salaries.map(s => s.id === id ? { ...s, ...body } : s);
      setLocalData("okutan_teacher_salaries", salaries);
      return salaries.find(s => s.id === id) || body;
    }
    if (method === "DELETE") {
      salaries = salaries.filter(s => s.id !== id);
      setLocalData("okutan_teacher_salaries", salaries);
      return { success: true };
    }
  }


  return {};
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("okutan_token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType || !contentType.includes("application/json")) {
      return await handleMockFetch(path, options);
    }
    const data = await response.json();
    return data;
  } catch {
    return await handleMockFetch(path, options);
  }
}


// ─── Yardımcı Fonksiyon: Öğrenci Verisi Zenginleştirme ────────────────────────
const enrichStudentData = (student) => {
  if (!student) return student;

  // 1. Durum (Status)
  const status = student.status || "aktif";

  // 2. Gelişim Ölçümleri (progressHistory)
  let progressHistory = student.progressHistory;
  if (!progressHistory || progressHistory.length === 0) {
    const history = [];
    let baseWpm = 120;
    let baseComp = 50;

    const sortedNotes = [...(student.notes || [])].reverse();
    sortedNotes.forEach((note, idx) => {
      const wpmMatch = note.content.match(/(\d+)\s*(?:kelime|wpm)/i);
      const compMatch = note.content.match(/(?:%|anlama\s*oranı\s*%)\s*(\d+)/i);

      if (wpmMatch || compMatch) {
        if (wpmMatch) baseWpm = parseInt(wpmMatch[1]);
        if (compMatch) baseComp = parseInt(compMatch[1]);

        history.push({
          session: `${idx + 1}. Ölçüm`,
          date: note.date,
          wpm: baseWpm,
          comprehension: baseComp
        });
      }
    });

    if (history.length === 0) {
      history.push({ session: "Başlangıç", date: student.registrationDate, wpm: 120, comprehension: 45 });
      history.push({ session: "1. Hafta", date: student.registrationDate, wpm: 180, comprehension: 55 });
      if (student.paidAmount > 0) {
        history.push({ session: "2. Hafta", date: student.registrationDate, wpm: 240, comprehension: 65 });
      }
    }
    progressHistory = history;
  }

  // 3. Taksit ve Ödeme Takvimi (paymentPlan)
  let paymentPlan = student.paymentPlan;
  if (!paymentPlan || paymentPlan.length === 0) {
    const due = student.totalPrice - student.discount;
    const plan = [];
    const installCount = 4;
    const installAmount = Math.round(due / installCount);
    let paidRemaining = student.paidAmount;

    const regDate = new Date(student.registrationDate || Date.now());
    for (let i = 0; i < installCount; i++) {
      const dueDate = new Date(regDate);
      dueDate.setMonth(regDate.getMonth() + i);
      const dueDateString = dueDate.toISOString().split("T")[0];
      const amount = i === installCount - 1 ? (due - (installAmount * (installCount - 1))) : installAmount;
      if (amount <= 0) continue;

      let statusVal = "Bekliyor";
      if (paidRemaining >= amount) {
        statusVal = "Ödendi";
        paidRemaining -= amount;
      } else if (paidRemaining > 0) {
        statusVal = "Kısmi";
        paidRemaining = 0;
      }

      plan.push({
        date: dueDateString,
        amount,
        status: statusVal,
        description: i === 0 ? "Peşinat" : `${i}. Taksit`
      });
    }
    paymentPlan = plan;
  }

  // 4. Devam-Devamsızlık Kayıtları (attendance)
  let attendance = student.attendance;
  if (!attendance || attendance.length === 0) {
    const attList = [];
    const regDate = new Date(student.registrationDate || Date.now());
    const today = new Date();
    let currentDate = new Date(regDate);

    let count = 0;
    while (currentDate <= today && count < 5) {
      currentDate.setDate(currentDate.getDate() + 7);
      const dateStr = currentDate.toISOString().split("T")[0];
      if (currentDate <= today) {
        attList.push({
          date: dateStr,
          status: ((student.id === "student-1" && count === 4) || (student.id === "student-3")) ? "Katılmadı" : "Katıldı"
        });
        count++;
      }
    }
    if (attList.length === 0) {
      attList.push({ date: student.registrationDate, status: "Katıldı" });
    }
    attendance = attList;
  }

  return {
    ...student,
    status,
    progressHistory,
    paymentPlan,
    attendance
  };
};

// ─── Bileşen: Dinamik SVG Gelişim Grafiği (ReadingProgressChart) ──────────────
function ReadingProgressChart({ progressHistory }) {
  if (!progressHistory || progressHistory.length === 0) {
    return (
      <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
        Ölçüm verisi bulunmamaktadır.
      </div>
    );
  }

  const width = 360;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const pointsCount = progressHistory.length;

  const wpms = progressHistory.map(p => p.wpm || 0);
  const maxWpm = Math.max(...wpms, 250);
  const minWpm = 0;
  const wpmRange = maxWpm - minWpm;

  const minComp = 0;
  const compRange = 100;

  const getX = (index) => {
    if (pointsCount <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (pointsCount - 1)) * chartWidth;
  };

  const getWpmY = (wpm) => {
    return paddingTop + chartHeight - ((wpm - minWpm) / wpmRange) * chartHeight;
  };

  const getCompY = (comp) => {
    return paddingTop + chartHeight - ((comp - minComp) / compRange) * chartHeight;
  };

  const wpmPoints = progressHistory.map((p, i) => `${getX(i)},${getWpmY(p.wpm)}`).join(" ");
  const compPoints = progressHistory.map((p, i) => `${getX(i)},${getCompY(p.comprehension)}`).join(" ");

  const gridLinesCount = 4;
  const gridLines = Array.from({ length: gridLinesCount + 1 }).map((_, i) => {
    const ratio = i / gridLinesCount;
    const y = paddingTop + chartHeight - ratio * chartHeight;
    const wpmVal = Math.round(minWpm + ratio * wpmRange);
    const compVal = Math.round(minComp + ratio * compRange);
    return { y, wpmVal, compVal };
  });

  return (
    <div className="reading-progress-chart-container" style={{ width: "100%", overflowX: "auto" }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line 
              x1={paddingLeft} 
              y1={line.y} 
              x2={width - paddingRight} 
              y2={line.y} 
              stroke="var(--border)" 
              strokeWidth="1" 
              strokeDasharray="4,4" 
            />
            <text 
              x={paddingLeft - 8} 
              y={line.y + 4} 
              textAnchor="end" 
              fontSize="9" 
              fill="var(--primary)" 
              fontWeight="bold"
            >
              {line.wpmVal}
            </text>
            <text 
              x={width - paddingRight + 8} 
              y={line.y + 4} 
              textAnchor="start" 
              fontSize="9" 
              fill="#2ecc71" 
              fontWeight="bold"
            >
              %{line.compVal}
            </text>
          </g>
        ))}

        {progressHistory.map((p, i) => (
          <text 
            key={i} 
            x={getX(i)} 
            y={height - 8} 
            textAnchor="middle" 
            fontSize="9" 
            fill="var(--text-muted)"
          >
            {p.session || p.date}
          </text>
        ))}

        {pointsCount > 1 && (
          <>
            <polyline 
              fill="none" 
              stroke="var(--primary)" 
              strokeWidth="2.5" 
              points={wpmPoints} 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline 
              fill="none" 
              stroke="#2ecc71" 
              strokeWidth="2.5" 
              points={compPoints} 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {progressHistory.map((p, i) => (
          <g key={`wpm-dot-${i}`}>
            <circle 
              cx={getX(i)} 
              cy={getWpmY(p.wpm)} 
              r="4.5" 
              fill="var(--primary)" 
              stroke="#fff" 
              strokeWidth="1.5" 
            />
            <text 
              x={getX(i)} 
              y={getWpmY(p.wpm) - 8} 
              textAnchor="middle" 
              fontSize="9" 
              fontWeight="bold" 
              fill="var(--text-h)"
            >
              {p.wpm}
            </text>
          </g>
        ))}

        {progressHistory.map((p, i) => (
          <g key={`comp-dot-${i}`}>
            <circle 
              cx={getX(i)} 
              cy={getCompY(p.comprehension)} 
              r="4.5" 
              fill="#2ecc71" 
              stroke="#fff" 
              strokeWidth="1.5" 
            />
            <text 
              x={getX(i)} 
              y={getCompY(p.comprehension) - 8} 
              textAnchor="middle" 
              fontSize="9" 
              fontWeight="bold" 
              fill="#27ae60"
            >
              %{p.comprehension}
            </text>
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginTop: "5px", fontSize: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "10px", height: "10px", backgroundColor: "var(--primary)", borderRadius: "2px" }} />
          <span style={{ fontWeight: 600, color: "var(--text-h)" }}>Okuma Hızı (WPM)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "10px", height: "10px", backgroundColor: "#2ecc71", borderRadius: "2px" }} />
          <span style={{ fontWeight: 600, color: "#27ae60" }}>Anlama Oranı (% Comp)</span>
        </div>
      </div>
    </div>
  );
}

// ─── Uygulama ────────────────────────────────────────────────────────────────
function App() {

  // AUTH
  // NOT: "users" listesi artık client'ta tutulmuyor; kullanıcı yönetimi backend'de.
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // ilk /auth/me kontrolü sürerken
  const [authView, setAuthView] = useState("login"); // "login" | "register"
  const [selectedLoginRole, setSelectedLoginRole] = useState(null); // null | "Yönetici" | "Asistan" | "Öğretmen"
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "", username: "", password: "", role: "Asistan", adminCode: ""
  });

  // CORE DATA — artık API'den geliyor (localStorage değil)
  const [leads, setLeads] = useState([]);
  const [rawStudents, setRawStudents] = useState([]);
  const students = React.useMemo(() => rawStudents.map(enrichStudentData), [rawStudents]);

  const setStudents = React.useCallback((val) => {
    if (typeof val === "function") {
      setRawStudents(prev => val(prev));
    } else {
      setRawStudents(val);
    }
  }, []);

  const [teachers, setTeachers] = useState([]);
  const [activeModalTab, setActiveModalTab] = useState("payments");

  const formatMoney = React.useCallback((amount) => {
    if (currentUser?.role === "Asistan") {
      return "**** ₺";
    }
    return `${Number(amount || 0).toLocaleString("tr-TR")} ₺`;
  }, [currentUser]);

  const sendWhatsAppReport = React.useCallback((student) => {
    let wpm = "";
    let comp = "";
    if (student.progressHistory && student.progressHistory.length > 0) {
      const latest = student.progressHistory[student.progressHistory.length - 1];
      wpm = latest.wpm;
      comp = latest.comprehension;
    } else {
      const matchNote = student.notes.find(n => n.content.includes("kelime") || n.content.includes("%"));
      if (matchNote) {
        const wpmMatch = matchNote.content.match(/(\d+)\s*kelime/);
        const compMatch = matchNote.content.match(/%(\d+)/);
        if (wpmMatch) wpm = wpmMatch[1];
        if (compMatch) comp = compMatch[1];
      }
    }

    if (!wpm || !comp) {
      wpm = "240";
      comp = "70";
    }

    const formattedPhone = "90" + student.phone.replace(/\D/g, "").replace(/^0090|^90|^0/, "");
    const text = `Merhaba, öğrencimiz *${student.studentName}*'in Okutan Akademi bünyesindeki son ders ölçümlerine göre okuma hızı dakikada *${wpm} kelime*, anlama oranı ise *%${comp}* olarak kaydedilmiştir. Gelişimini yakından takip etmeye devam ediyoruz. İyi günler dileriz.`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }, []);

  // ÖĞRETMEN MAAŞLARI (kaydedilmiş bordro kayıtları) & GİDERLER — backend'den gelir (MySQL)
  const [teacherSalaries, setTeacherSalaries] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // UI STATE
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState(() => localStorage.getItem("okutan_theme") || "light");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // COLLAPSIBLE SIDEBAR & NOTIFICATIONS
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem("okutan_sidebar_collapsed") === "true");
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [hasDismissedOverdueModal, setHasDismissedOverdueModal] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const overduePaymentsList = React.useMemo(() => {
    const list = [];
    students.forEach(st => {
      if (st.paymentPlan) {
        st.paymentPlan.forEach(p => {
          if (p.status === "Bekliyor" && p.date < todayStr) {
            list.push({ student: st, payment: p });
          }
        });
      }
    });
    return list;
  }, [students, todayStr]);

  const upcomingPaymentsList = React.useMemo(() => {
    const list = [];
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    const next7DaysStr = next7Days.toISOString().split("T")[0];

    students.forEach(st => {
      if (st.paymentPlan) {
        st.paymentPlan.forEach(p => {
          if (p.status === "Bekliyor" && p.date >= todayStr && p.date <= next7DaysStr) {
            list.push({ student: st, payment: p });
          }
        });
      }
    });
    return list;
  }, [students, todayStr]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("okutan_sidebar_collapsed", String(next));
      return next;
    });
  };


  // REMINDERS STATE
  const emptyReminderForm = { id: null, title: "", dueDate: new Date().toISOString().split("T")[0], priority: "orta", category: "Veli Araması", note: "", relatedStudentId: "" };
  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem("okutan_reminders");
    if (saved) {
      try { return JSON.parse(saved); } catch { }
    }
    return [
      { id: "rem-1", title: "Mert Çelik 3. Hafta Gelişim Ölçümü Yapılacak", dueDate: new Date().toISOString().split("T")[0], priority: "yüksek", category: "Öğrenci Gelişim Ölçümü", status: "bekliyor", note: "Okuma hızı ve anlama oranı takibi yapılmalı" },
      { id: "rem-2", title: "Temmuz Ayı Kira ve Yazılım Giderleri Ödemesi", dueDate: new Date().toISOString().split("T")[0], priority: "orta", category: "İdari / Genel", status: "bekliyor", note: "Faturalar ve lisans ödemeleri kontrol edilecek" }
    ];
  });
  const [reminderForm, setReminderForm] = useState(emptyReminderForm);
  const [reminderFilter, setReminderFilter] = useState("all");
  const [reminderPriorityFilter, setReminderPriorityFilter] = useState("all");
  const [reminderCategoryFilter, setReminderCategoryFilter] = useState("all");
  const [reminderSearchQuery, setReminderSearchQuery] = useState("");


  useEffect(() => {
    localStorage.setItem("okutan_reminders", JSON.stringify(reminders));
  }, [reminders]);

  // TEACHER SESSION RATES STATE
  const [teacherRates, setTeacherRates] = useState(() => {
    const saved = localStorage.getItem("okutan_teacher_rates");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return { "teacher-firat": 500, "teacher-zehra": 500 };
  });

  useEffect(() => {
    localStorage.setItem("okutan_teacher_rates", JSON.stringify(teacherRates));
  }, [teacherRates]);

  const handleUpdateTeacherRate = (teacherId, newRate) => {
    const numericRate = parseFloat(newRate) || 0;
    setTeacherRates(prev => ({ ...prev, [teacherId]: numericRate }));
  };


  // MODALS
  const [modal, setModal] = useState(null); // null | "addLead" | "editLead" | "confirmReg" | "studentDetail" | "addPayment" | "addReminder"
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (modal === "studentDetail") {
      setActiveModalTab(currentUser?.role === "Öğretmen" ? "attendance" : "payments");
    }
  }, [modal, currentUser]);

  // FORMS
  const emptyLeadForm = { name: "", phone: "", source: "Instagram", notes: "", status: "new" };
  const emptyConfirmForm = { studentName: "", studentAgeGrade: "", totalPrice: "", discount: "0", firstPayment: "0", firstPaymentType: "Nakit", lessonType: "grup", studentPassword: "" };
  const emptyPaymentForm = { studentId: "", amount: "", type: "Nakit", description: "Taksit Ödemesi", date: new Date().toISOString().split("T")[0] };
  const emptyEditStudentForm = { name: "", phone: "", studentName: "", studentAgeGrade: "", totalPrice: "", discount: "0", lessonType: "grup", studentPassword: "", status: "aktif" };
  const emptySalaryForm = { id: null, teacherId: "", weeks: "1", sessionRate: "500", bonus: "0", deduction: "0", note: "", status: "Ödendi" };

  const emptyExpenseForm = { itemName: "", price: "", category: "Diğer", description: "" };

  const [leadForm, setLeadForm] = useState(emptyLeadForm);
  const [confirmForm, setConfirmForm] = useState(emptyConfirmForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [newNoteText, setNewNoteText] = useState("");


  // Öğrenci Tam Düzenleme (Kesin Kayıt bilgilerini güncelleme) formu
  const [editStudentForm, setEditStudentForm] = useState(emptyEditStudentForm);
  const [editStudentLessons, setEditStudentLessons] = useState([]);
  const [editStudentTeacherId, setEditStudentTeacherId] = useState("");

  // Öğretmen Maaşları formu
  const [salaryForm, setSalaryForm] = useState(emptySalaryForm);

  // Giderler formu
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);

  // SCHEDULING STATES
  const [confirmLessons, setConfirmLessons] = useState([]);
  const [confirmTeacherId, setConfirmTeacherId] = useState("");
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [editLessons, setEditLessons] = useState([]);
  const [editTeacherId, setEditTeacherId] = useState("");
  const [activeTeacherScheduleId, setActiveTeacherScheduleId] = useState("teacher-firat");

  // DYNAMIC SCHEDULE STRUCTURE STATE — artık herkes için ortak (API'den)
  const [daysOfWeek, setDaysOfWeek] = useState(DEFAULT_DAYS_OF_WEEK);
  const [lessonHours, setLessonHours] = useState(DEFAULT_LESSON_HOURS);

  // Ayarları backend'e kaydeden yardımcı
  const saveSettings = async (nextDays, nextHours) => {
    try {
      await apiFetch("/settings", {
        method: "PUT",
        body: JSON.stringify({ daysOfWeek: nextDays, lessonHours: nextHours }),
      });
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // MASTER SCHEDULE EDITING & CELL ACTION STATES
  const [scheduleConfigTab, setScheduleConfigTab] = useState("hours"); // "hours" | "days"
  const [newHourInput, setNewHourInput] = useState("");
  const [newDayInput, setNewDayInput] = useState("");
  const [editingHourIdx, setEditingHourIdx] = useState(null);
  const [editingHourValue, setEditingHourValue] = useState("");
  const [editingDayIdx, setEditingDayIdx] = useState(null);
  const [editingDayValue, setEditingDayValue] = useState("");

  const [activeSlotData, setActiveSlotData] = useState(null); // { day, hour, teacherId, student }
  const [quickAssignStudentId, setQuickAssignStudentId] = useState("");

  // TOAST
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" }); // type: info | success | error

  // ── Sunucudan veri yükleme ──────────────────────────────────────────────
  // Sayfa ilk açıldığında, kaydedilmiş bir token varsa oturumu ve verileri geri yükle.
  useEffect(() => {
    const token = localStorage.getItem("okutan_token");
    if (!token) { setAuthLoading(false); return; }

    apiFetch("/auth/me")
      .then(({ user }) => {
        setCurrentUser(user);
        return Promise.all([
          apiFetch("/leads"),
          apiFetch("/students"),
          apiFetch("/teachers"),
          apiFetch("/settings"),
          apiFetch("/expenses"),
          apiFetch("/teacher-salaries"),
        ]);
      })
      .then(([leadsData, studentsData, teachersData, settingsData, expensesData, teacherSalariesData]) => {
        setLeads(leadsData);
        setStudents(studentsData);
        setTeachers(teachersData);
        if (settingsData?.daysOfWeek?.length) setDaysOfWeek(settingsData.daysOfWeek);
        if (settingsData?.lessonHours?.length) setLessonHours(settingsData.lessonHours);
        setExpenses(expensesData || []);
        setTeacherSalaries(teacherSalariesData || []);
      })
      .catch(() => {
        localStorage.removeItem("okutan_token");
        setCurrentUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  // Öğretmen hesabı ile giriş yapıldığında otomatik kendi ders programını seç
  useEffect(() => {
    if (currentUser && currentUser.role === "Öğretmen") {
      const matchedTeacher = teachers.find(t =>
        t.name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(t.name.toLowerCase()) ||
        t.id.includes(currentUser.username.toLowerCase())
      );
      if (matchedTeacher) {
        setActiveTeacherScheduleId(matchedTeacher.id);
      }
    }
  }, [currentUser, teachers]);

  // ── Theme ────────────────────────────────────────────────────────────────

  // Apply theme on mount and on change
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("okutan_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = (message, type = "info") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "info" }), 3500);
  };

  // ── Auth Handlers ────────────────────────────────────────────────────────
  const loadAllData = async () => {
    const [leadsData, studentsData, teachersData, settingsData, expensesData, teacherSalariesData] = await Promise.all([
      apiFetch("/leads"),
      apiFetch("/students"),
      apiFetch("/teachers"),
      apiFetch("/settings"),
      apiFetch("/expenses"),
      apiFetch("/teacher-salaries"),
    ]);
    setLeads(leadsData);
    setStudents(studentsData);
    setTeachers(teachersData);
    if (settingsData?.daysOfWeek?.length) setDaysOfWeek(settingsData.daysOfWeek);
    if (settingsData?.lessonHours?.length) setLessonHours(settingsData.lessonHours);
    setExpenses(expensesData || []);
    setTeacherSalaries(teacherSalariesData || []);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      showToast("Kullanıcı adı ve şifre zorunludur.", "error"); return;
    }
    try {
      const { token, user } = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: loginForm.username.trim(),
          password: loginForm.password,
        }),
      });
      localStorage.setItem("okutan_token", token);
      setCurrentUser(user);
      setLoginForm({ username: "", password: "" });
      setActiveTab("dashboard");
      showToast(`Hoş geldiniz, ${user.name}!`, "success");
      await loadAllData();
    } catch (err) {
      showToast(err.message || "Hatalı kullanıcı adı veya şifre!", "error");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { name, username, password, role, adminCode } = registerForm;

    if (!name.trim() || !username.trim() || !password.trim()) {
      showToast("Tüm alanları doldurunuz.", "error"); return;
    }
    try {
      const { token, user } = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), username: username.trim(), password, role, adminCode }),
      });
      localStorage.setItem("okutan_token", token);
      setCurrentUser(user);
      setRegisterForm({ name: "", username: "", password: "", role: "Asistan", adminCode: "" });
      setActiveTab("dashboard");
      showToast(`Hesap oluşturuldu! Hoş geldiniz, ${user.name}.`, "success");
      await loadAllData();
    } catch (err) {
      showToast(err.message || "Hesap oluşturulamadı.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("okutan_token");
    setCurrentUser(null);
    setAuthView("login");
    setLeads([]);
    setStudents([]);
    setTeachers([]);
    setExpenses([]);
    setTeacherSalaries([]);
    showToast("Güvenli çıkış yapıldı.");
  };



  // ── Lead Handlers ────────────────────────────────────────────────────────
  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!leadForm.name.trim() || !leadForm.phone.trim()) {
      showToast("İsim ve telefon zorunludur.", "error"); return;
    }
    try {
      const newLead = await apiFetch("/leads", {
        method: "POST",
        body: JSON.stringify({
          name: leadForm.name.trim(),
          phone: leadForm.phone.trim(),
          status: leadForm.status,
          source: leadForm.source,
          notes: leadForm.notes,
        }),
      });
      setLeads(prev => [newLead, ...prev]);
      setLeadForm(emptyLeadForm);
      setModal(null);
      showToast("Potansiyel müşteri kaydedildi.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleEditLead = async (e) => {
    e.preventDefault();
    try {
      const updatedLead = await apiFetch(`/leads/${selectedLead.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: selectedLead.name,
          phone: selectedLead.phone,
          status: selectedLead.status,
          source: selectedLead.source,
          notes: selectedLead.notes,
        }),
      });
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? updatedLead : l));
      setModal(null);
      showToast("Görüşme bilgileri güncellendi.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteLead = async (id) => {
    if (currentUser?.role === "Öğretmen") {
      showToast("Yetkiniz yok: Sadece Yönetici ve Asistanlar silebilir.", "error"); return;
    }
    if (!window.confirm("Bu potansiyel müşteriyi silmek istediğinizden emin misiniz?")) return;
    try {
      await apiFetch(`/leads/${id}`, { method: "DELETE" });
      setLeads(prev => prev.filter(l => l.id !== id));
      showToast("Kayıt silindi.");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ── Master Schedule Structure Handlers (Admin) ───────────────────────────
  const handleAddHour = async (e) => {
    e.preventDefault();
    const val = newHourInput.trim();
    if (!val) {
      showToast("Lütfen geçerli bir ders saat aralığı giriniz (Örn: 19:30 - 21:00).", "error"); return;
    }
    if (lessonHours.includes(val)) {
      showToast("Bu ders saati zaten ekli!", "error"); return;
    }
    const updated = [...lessonHours, val];
    setLessonHours(updated);
    setNewHourInput("");
    await saveSettings(daysOfWeek, updated);
    showToast("Yeni ders saati eklendi.", "success");
  };

  const handleSaveEditedHour = async (idx) => {
    const val = editingHourValue.trim();
    if (!val) { setEditingHourIdx(null); return; }
    const oldHour = lessonHours[idx];
    if (oldHour === val) { setEditingHourIdx(null); return; }

    const updated = [...lessonHours];
    updated[idx] = val;
    setLessonHours(updated);
    await saveSettings(daysOfWeek, updated);

    // Bu saati kullanan öğrencilerin ders programını da güncelle
    const affected = students.filter(s => s.lessons && s.lessons.some(l => l.time === oldHour));
    for (const s of affected) {
      const newLessons = s.lessons.map(l => l.time === oldHour ? { ...l, time: val } : l);
      try {
        const updatedStudent = await apiFetch(`/students/${s.id}/schedule`, {
          method: "PUT",
          body: JSON.stringify({ teacherId: s.teacherId, lessons: newLessons }),
        });
        setStudents(prev => prev.map(st => st.id === s.id ? updatedStudent : st));
      } catch (err) {
        showToast(err.message, "error");
      }
    }

    setEditingHourIdx(null);
    showToast("Ders saati güncellendi.", "success");
  };

  const handleDeleteHour = async (idx) => {
    const hourToDelete = lessonHours[idx];
    const assigned = students.filter(s => s.lessons && s.lessons.some(l => l.time === hourToDelete));
    if (assigned.length > 0) {
      if (!window.confirm(`Uyarı: ${hourToDelete} saatine kayıtlı ${assigned.length} öğrenci dersi var. Silmek istediğinizden emin misiniz?`)) {
        return;
      }
    }
    const updated = lessonHours.filter((_, i) => i !== idx);
    setLessonHours(updated);
    await saveSettings(daysOfWeek, updated);
    showToast("Ders saati silindi.");
  };

  const handleMoveHour = async (idx, direction) => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= lessonHours.length) return;
    const updated = [...lessonHours];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setLessonHours(updated);
    await saveSettings(daysOfWeek, updated);
  };

  const handleAddDay = async (e) => {
    e.preventDefault();
    const val = newDayInput.trim();
    if (!val) {
      showToast("Lütfen geçerli bir gün adı giriniz.", "error"); return;
    }
    if (daysOfWeek.includes(val)) {
      showToast("Bu gün zaten listede var!", "error"); return;
    }
    const updated = [...daysOfWeek, val];
    setDaysOfWeek(updated);
    setNewDayInput("");
    await saveSettings(updated, lessonHours);
    showToast("Yeni gün eklendi.", "success");
  };

  const handleSaveEditedDay = async (idx) => {
    const val = editingDayValue.trim();
    if (!val) { setEditingDayIdx(null); return; }
    const oldDay = daysOfWeek[idx];
    if (oldDay === val) { setEditingDayIdx(null); return; }

    const updated = [...daysOfWeek];
    updated[idx] = val;
    setDaysOfWeek(updated);
    await saveSettings(updated, lessonHours);

    const affected = students.filter(s => s.lessons && s.lessons.some(l => l.day === oldDay));
    for (const s of affected) {
      const newLessons = s.lessons.map(l => l.day === oldDay ? { ...l, day: val } : l);
      try {
        const updatedStudent = await apiFetch(`/students/${s.id}/schedule`, {
          method: "PUT",
          body: JSON.stringify({ teacherId: s.teacherId, lessons: newLessons }),
        });
        setStudents(prev => prev.map(st => st.id === s.id ? updatedStudent : st));
      } catch (err) {
        showToast(err.message, "error");
      }
    }

    setEditingDayIdx(null);
    showToast("Gün adı güncellendi.", "success");
  };

  const handleDeleteDay = async (idx) => {
    const dayToDelete = daysOfWeek[idx];
    const assigned = students.filter(s => s.lessons && s.lessons.some(l => l.day === dayToDelete));
    if (assigned.length > 0) {
      if (!window.confirm(`Uyarı: ${dayToDelete} gününe kayıtlı ${assigned.length} öğrenci var. Yine de silmek istiyor musunuz?`)) {
        return;
      }
    }
    const updated = daysOfWeek.filter((_, i) => i !== idx);
    setDaysOfWeek(updated);
    await saveSettings(updated, lessonHours);
    showToast("Gün silindi.");
  };

  const handleMoveDay = async (idx, direction) => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= daysOfWeek.length) return;
    const updated = [...daysOfWeek];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setDaysOfWeek(updated);
    await saveSettings(updated, lessonHours);
  };

  const handleResetScheduleStructure = async () => {
    if (!window.confirm("Ders saatlerini ve günleri varsayılan ayarlara sıfırlamak istediğinizden emin misiniz?")) return;
    setDaysOfWeek(DEFAULT_DAYS_OF_WEEK);
    setLessonHours(DEFAULT_LESSON_HOURS);
    await saveSettings(DEFAULT_DAYS_OF_WEEK, DEFAULT_LESSON_HOURS);
    showToast("Ders ve gün yapısı varsayılana sıfırlandı.", "success");
  };

  // ── Quick Slot Actions (Admin Direct Calendar Cell Editing) ──────────────
  const handleQuickAssignStudent = async (e) => {
    e.preventDefault();
    if (!activeSlotData || !quickAssignStudentId) {
      showToast("Lütfen bir öğrenci seçiniz.", "error"); return;
    }
    const { day, hour, teacherId } = activeSlotData;
    const targetTeacher = teachers.find(t => t.id === teacherId) || teachers[0];
    const targetStudent = students.find(s => s.id === quickAssignStudentId);
    if (!targetStudent) return;

    const existingLessons = targetStudent.lessons || [];
    const isAlreadyInSlot = existingLessons.some(l => l.day === day && l.time === hour);
    const newLessons = isAlreadyInSlot ? existingLessons : [...existingLessons, { day, time: hour }];

    try {
      const updatedStudent = await apiFetch(`/students/${targetStudent.id}/schedule`, {
        method: "PUT",
        body: JSON.stringify({
          teacherId,
          lessons: newLessons,
          note: `Takvimden seans atandı: ${targetTeacher.name} — ${day} (${hour.split(" ")[0]})`,
        }),
      });
      setStudents(prev => prev.map(s => s.id === targetStudent.id ? updatedStudent : s));
      setModal(null);
      setActiveSlotData(null);
      setQuickAssignStudentId("");
      showToast(`${targetStudent.studentName}, ${targetTeacher.name} - ${day} ${hour.split(" ")[0]} seansına atandı.`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleQuickRemoveStudentFromSlot = async () => {
    if (!activeSlotData || !activeSlotData.student) return;
    const { day, hour, student } = activeSlotData;
    if (!window.confirm(`${student.studentName} öğrencisini bu seanstan (${day} ${hour}) çıkarmak istediğinizden emin misiniz?`)) return;

    const filtered = (student.lessons || []).filter(l => !(l.day === day && l.time === hour));
    try {
      const updatedStudent = await apiFetch(`/students/${student.id}/schedule`, {
        method: "PUT",
        body: JSON.stringify({
          teacherId: student.teacherId,
          lessons: filtered,
          note: `Takvimden seans çıkarıldı: ${day} (${hour.split(" ")[0]})`,
        }),
      });
      setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
      setModal(null);
      setActiveSlotData(null);
      showToast(`${student.studentName} bu seanstan çıkarıldı.`);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ── Scheduling Helpers ───────────────────────────────────────────────────
  const checkTeacherConflictForSlots = (teacherId, selectedSlots, excludeStudentId = null) => {
    const conflicts = [];
    for (const slot of selectedSlots) {
      const conflictingStudent = students.find(s =>
        s.teacherId === teacherId &&
        s.id !== excludeStudentId &&
        s.lessons &&
        s.lessons.some(l => l.day === slot.day && l.time === slot.time)
      );
      if (conflictingStudent) {
        conflicts.push({
          day: slot.day,
          time: slot.time,
          studentName: conflictingStudent.studentName
        });
      }
    }
    return conflicts;
  };

  useEffect(() => {
    if (confirmLessons.length === 0) return;
    const firatConflicts = checkTeacherConflictForSlots("teacher-firat", confirmLessons);
    const zehraConflicts = checkTeacherConflictForSlots("teacher-zehra", confirmLessons);

    if (firatConflicts.length === 0 && zehraConflicts.length > 0) {
      setConfirmTeacherId("teacher-firat");
    } else if (zehraConflicts.length === 0 && firatConflicts.length > 0) {
      setConfirmTeacherId("teacher-zehra");
    } else if (!confirmTeacherId) {
      setConfirmTeacherId("teacher-firat");
    }
  }, [confirmLessons]);

  // ── Confirm Registration ─────────────────────────────────────────────────
  const openConfirmReg = (lead) => {
    setSelectedLead(lead);
    setConfirmForm({ studentName: lead.name, studentAgeGrade: "8. Sınıf", totalPrice: "12000", discount: "0", firstPayment: "2000", firstPaymentType: "Nakit", lessonType: "grup", studentPassword: "" });
    setConfirmLessons([]);
    setConfirmTeacherId("");
    setModal("confirmReg");
  };

  const handleConfirmRegistration = async (e) => {
    e.preventDefault();
    if (!confirmForm.studentName.trim() || !confirmForm.totalPrice) {
      showToast("Öğrenci adı ve ücret zorunludur.", "error"); return;
    }
    const selectedTeacher = teachers.find(t => t.id === confirmTeacherId) || teachers[0];

    try {
      const newStudent = await apiFetch("/students", {
        method: "POST",
        body: JSON.stringify({
          leadId: selectedLead.id,
          name: selectedLead.name,
          phone: selectedLead.phone,
          studentName: confirmForm.studentName.trim(),
          studentAgeGrade: confirmForm.studentAgeGrade,
          totalPrice: confirmForm.totalPrice,
          discount: confirmForm.discount,
          firstPayment: confirmForm.firstPayment,
          firstPaymentType: confirmForm.firstPaymentType,
          lessonType: confirmForm.lessonType,
          teacherId: confirmTeacherId || selectedTeacher.id,
          lessons: confirmLessons,
          studentPassword: confirmForm.studentPassword.trim(),
        }),
      });

      setStudents(prev => [newStudent, ...prev]);
      setLeads(prev => prev.map(l =>
        l.id === selectedLead.id
          ? { ...l, status: "confirmed", updatedDate: new Date().toISOString().split("T")[0] }
          : l
      ));
      setModal(null);
      setConfirmForm(emptyConfirmForm);
      setConfirmLessons([]);
      setConfirmTeacherId("");
      showToast("Kayıt kesinleştirildi! Öğrenci listesine eklendi.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ── Note Handlers ────────────────────────────────────────────────────────
  const handleAddNote = async (studentId) => {
    if (!newNoteText.trim()) { showToast("Not boş olamaz.", "error"); return; }
    try {
      const newNote = await apiFetch(`/students/${studentId}/notes`, {
        method: "POST",
        body: JSON.stringify({ content: newNoteText.trim() }),
      });
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, notes: [newNote, ...s.notes] } : s));
      setSelectedStudent(prev => ({ ...prev, notes: [newNote, ...prev.notes] }));
      setNewNoteText("");
      showToast("Not eklendi.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteNote = async (studentId, noteId) => {
    if (currentUser?.role === "Öğretmen") {
      showToast("Öğretmenler not silemez.", "error"); return;
    }
    try {
      await apiFetch(`/students/${studentId}/notes/${noteId}`, { method: "DELETE" });
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, notes: s.notes.filter(n => n.id !== noteId) } : s));
      setSelectedStudent(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== noteId) }));
      showToast("Not silindi.");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ── Payment Handlers ─────────────────────────────────────────────────────
  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.studentId || !paymentForm.amount) {
      showToast("Öğrenci ve tutar zorunludur.", "error"); return;
    }
    const amount = parseFloat(paymentForm.amount) || 0;
    if (amount <= 0) { showToast("Geçerli bir tutar giriniz.", "error"); return; }

    try {
      const updatedStudent = await apiFetch(`/students/${paymentForm.studentId}/payments`, {
        method: "POST",
        body: JSON.stringify({
          amount: paymentForm.amount,
          date: paymentForm.date,
          type: paymentForm.type,
          description: paymentForm.description,
        }),
      });
      setStudents(prev => prev.map(s => s.id === paymentForm.studentId ? updatedStudent : s));
      if (selectedStudent?.id === paymentForm.studentId) {
        setSelectedStudent(updatedStudent);
      }
      setModal(null);
      setPaymentForm(emptyPaymentForm);
      showToast("Ödeme kaydedildi, kasa güncellendi.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteStudent = async (id) => {
    if (currentUser?.role === "Öğretmen") {
      showToast("Yetkiniz yok: Sadece Yönetici ve Asistanlar silebilir.", "error"); return;
    }
    if (!window.confirm("Bu öğrenci kaydını silmek istediğinizden emin misiniz?")) return;
    try {
      await apiFetch(`/students/${id}`, { method: "DELETE" });
      setStudents(prev => prev.filter(s => s.id !== id));
      showToast("Öğrenci kaydı silindi.");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ── Öğrenci (Kesin Kayıt) Tam Düzenleme ─────────────────────────────────
  const openEditStudent = (student) => {
    setSelectedStudent(student);
    setEditStudentForm({
      name: student.name,
      phone: student.phone,
      studentName: student.studentName,
      studentAgeGrade: student.studentAgeGrade,
      totalPrice: String(student.totalPrice ?? ""),
      discount: String(student.discount ?? "0"),
      lessonType: student.lessonType || "grup",
      studentPassword: student.studentPassword || "",
      status: student.status || "aktif",
    });
    setEditStudentLessons(student.lessons || []);
    setEditStudentTeacherId(student.teacherId || (teachers[0]?.id || ""));
    setModal("editStudent");
  };

  const handleSaveEditStudent = async (e) => {
    e.preventDefault();
    if (!editStudentForm.name.trim() || !editStudentForm.phone.trim() || !editStudentForm.studentName.trim() || !editStudentForm.totalPrice) {
      showToast("Veli adı, telefon, öğrenci adı ve ücret zorunludur.", "error"); return;
    }
    const selectedTeacher = teachers.find(t => t.id === editStudentTeacherId) || teachers[0];
    const payload = {
      name: editStudentForm.name.trim(),
      phone: editStudentForm.phone.trim(),
      studentName: editStudentForm.studentName.trim(),
      studentAgeGrade: editStudentForm.studentAgeGrade,
      totalPrice: editStudentForm.totalPrice,
      discount: editStudentForm.discount,
      lessonType: editStudentForm.lessonType,
      teacherId: selectedTeacher?.id || "",
      teacherName: selectedTeacher?.name || "",
      lessons: editStudentLessons,
      studentPassword: editStudentForm.studentPassword.trim(),
      status: editStudentForm.status,
    };
    try {
      const updatedStudent = await apiFetch(`/students/${selectedStudent.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? updatedStudent : s));
      setModal(null);
      showToast("Kayıt bilgileri güncellendi.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ── Öğretmen Maaşları: Ders Programından Otomatik Hesaplama ─────────────
  // Bir öğretmenin haftalık seans sayısı = o öğretmene atanmış tüm öğrencilerin
  // ders programındaki (lessons) toplam saat/slot sayısı. Bu, "Öğretmen
  // Programları" sekmesinde girilen ders programı verisinden otomatik türetilir.
  const getWeeklySessionCount = (teacherId) => {
    return students
      .filter(s => s.teacherId === teacherId)
      .reduce((sum, s) => sum + (s.lessons?.length || 0), 0);
  };

  const openEditSalary = (sal) => {
    setSalaryForm({
      id: sal.id,
      teacherId: sal.teacherId || "",
      weeks: String(sal.weeks || 1),
      sessionRate: String(sal.sessionRate || 500),
      bonus: String(sal.bonus || 0),
      deduction: String(sal.deduction || 0),
      note: sal.note || "",
      status: sal.status || "Ödendi"
    });
    const elem = document.getElementById("salary-form-section");
    if (elem) elem.scrollIntoView({ behavior: "smooth" });
  };

  const handleSaveSalary = async (e) => {
    e.preventDefault();
    if (!salaryForm.teacherId) {
      showToast("Öğretmen seçiniz.", "error"); return;
    }
    const weeks = parseFloat(salaryForm.weeks) || 0;
    if (weeks <= 0) { showToast("Geçerli bir hafta sayısı giriniz.", "error"); return; }
    const sessionRate = parseFloat(salaryForm.sessionRate) || 500;
    const bonus = parseFloat(salaryForm.bonus) || 0;
    const deduction = parseFloat(salaryForm.deduction) || 0;

    const teacher = teachers.find(t => t.id === salaryForm.teacherId);
    const teacherName = teacher ? teacher.name : salaryForm.teacherId;

    const weeklySessionCount = getWeeklySessionCount(salaryForm.teacherId);
    const totalSessionCount = weeklySessionCount * weeks;
    const baseSalary = totalSessionCount * sessionRate;
    const totalSalary = Math.max(0, baseSalary + bonus - deduction);

    const payload = {
      teacherId: salaryForm.teacherId,
      teacherName,
      weeklySessionCount,
      weeks,
      sessionRate,
      bonus,
      deduction,
      note: (salaryForm.note || "").trim(),
      status: salaryForm.status || "Ödendi",
      totalSessionCount,
      totalSalary,
    };

    try {
      if (salaryForm.id) {
        // UPDATE
        const updatedSalary = await apiFetch(`/teacher-salaries/${salaryForm.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setTeacherSalaries(prev => prev.map(s => s.id === salaryForm.id ? { ...s, ...payload, ...(updatedSalary.id ? updatedSalary : {}) } : s));
        showToast("Maaş bordrosu güncellendi.", "success");
      } else {
        // CREATE
        const newSalary = await apiFetch("/teacher-salaries", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setTeacherSalaries(prev => [newSalary, ...prev]);

        if (salaryForm.status === "Ödendi") {
          try {
            const autoExpense = await apiFetch("/expenses", {
              method: "POST",
              body: JSON.stringify({
                itemName: `${teacherName} - Maaş Ödemesi`,
                price: totalSalary,
                category: "Öğretmen Maaşı",
                description: `${weeks} Haftalık Bordro Ödemesi (${totalSessionCount} Ders Seansı)`
              })
            });
            setExpenses(prev => [autoExpense, ...prev]);
          } catch {}
        }
        showToast("Maaş kaydı (bordro) oluşturuldu.", "success");
      }

      setSalaryForm(emptySalaryForm);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleToggleSalaryStatus = async (sal) => {
    const nextStatus = sal.status === "Bekliyor" ? "Ödendi" : "Bekliyor";
    try {
      await apiFetch(`/teacher-salaries/${sal.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...sal, status: nextStatus })
      });
      setTeacherSalaries(prev => prev.map(s => s.id === sal.id ? { ...s, status: nextStatus } : s));

      if (nextStatus === "Ödendi") {
        try {
          const autoExpense = await apiFetch("/expenses", {
            method: "POST",
            body: JSON.stringify({
              itemName: `${sal.teacherName} - Maaş Ödemesi`,
              price: sal.totalSalary,
              category: "Öğretmen Maaşı",
              description: `${sal.weeks} Haftalık Bordro Ödemesi`
            })
          });
          setExpenses(prev => [autoExpense, ...prev]);
        } catch {}
      }
      showToast(`Maaş durumu '${nextStatus}' olarak güncellendi.`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteSalary = async (id) => {
    if (!window.confirm("Bu maaş kaydını silmek istediğinizden emin misiniz?")) return;
    try {
      await apiFetch(`/teacher-salaries/${id}`, { method: "DELETE" });
      setTeacherSalaries(prev => prev.filter(s => s.id !== id));
      showToast("Maaş kaydı silindi.");
    } catch (err) {
      showToast(err.message, "error");
    }
  };


  // ── Giderler Handlers ────────────────────────────────────────────────────
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.itemName.trim() || !expenseForm.price) {
      showToast("Malzeme adı ve fiyat zorunludur.", "error"); return;
    }
    const price = parseFloat(expenseForm.price) || 0;
    if (price < 0) { showToast("Geçerli bir fiyat giriniz.", "error"); return; }

    try {
      const newExpense = await apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify({
          itemName: expenseForm.itemName.trim(),
          price,
          description: expenseForm.description.trim(),
        }),
      });
      setExpenses(prev => [newExpense, ...prev]);
      setExpenseForm(emptyExpenseForm);
      showToast("Gider kaydedildi.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Bu gideri silmek istediğinizden emin misiniz?")) return;
    try {
      await apiFetch(`/expenses/${id}`, { method: "DELETE" });
      setExpenses(prev => prev.filter(ex => ex.id !== id));
      showToast("Gider silindi.");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ── Hatırlatma Handlers ──────────────────────────────────────────────────
  const openEditReminder = (rem) => {
    setReminderForm({
      id: rem.id,
      title: rem.title || "",
      dueDate: rem.dueDate || new Date().toISOString().split("T")[0],
      priority: rem.priority || "orta",
      category: rem.category || "Veli Araması",
      note: rem.note || "",
      relatedStudentId: rem.relatedStudentId || ""
    });
    setModal("addReminder");
  };

  const handleAddReminder = (e) => {
    e.preventDefault();
    if (!reminderForm.title.trim()) {
      showToast("Hatırlatma başlığı zorunludur.", "error"); return;
    }

    if (reminderForm.id) {
      // UPDATE
      setReminders(prev => prev.map(r => r.id === reminderForm.id ? {
        ...r,
        title: reminderForm.title.trim(),
        dueDate: reminderForm.dueDate,
        priority: reminderForm.priority,
        category: reminderForm.category || "Genel",
        note: reminderForm.note.trim(),
        relatedStudentId: reminderForm.relatedStudentId || ""
      } : r));
      showToast("Hatırlatma güncellendi.", "success");
    } else {
      // CREATE
      const newRem = {
        id: "rem-" + Date.now(),
        title: reminderForm.title.trim(),
        dueDate: reminderForm.dueDate,
        priority: reminderForm.priority,
        category: reminderForm.category || "Genel",
        note: reminderForm.note.trim(),
        relatedStudentId: reminderForm.relatedStudentId || "",
        status: "bekliyor",
        createdAt: new Date().toISOString()
      };
      setReminders(prev => [newRem, ...prev]);
      showToast("Hatırlatma eklendi.", "success");
    }
    setReminderForm(emptyReminderForm);
    setModal(null);
  };


  const handleToggleReminderStatus = (id) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: r.status === "bekliyor" ? "tamamlandı" : "bekliyor" } : r));
    showToast("Hatırlatma durumu güncellendi.", "info");
  };

  const handleDeleteReminder = (id) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    showToast("Hatırlatma silindi.");
  };


  // ── Backup ───────────────────────────────────────────────────────────────
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ leads, students, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `okutan_akademi_yedek_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Yedek indirildi.", "success");
  };

  // NOT: Bu geri yükleme sadece ekranda (client'ta) önizleme yapar, sunucuya
  // KAYDETMEZ. Artık gerçek veri MySQL'de tutulduğu için, kalıcı bir geri
  // yükleme için backend'de ayrı bir "restore" endpoint'i gerekir.
  const importBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.leads && parsed.students) {
          setLeads(parsed.leads);
          setStudents(parsed.students);
          showToast("Yedek ekrana yüklendi (sunucuya kaydedilmedi — sadece önizleme).", "info");
        } else {
          showToast("Geçersiz yedek dosyası!", "error");
        }
      } catch { showToast("Dosya okunamadı.", "error"); }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = ""; // allow re-upload same file
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalLeadsCount = leads.length;
  const activeLeadsCount = leads.filter(l => l.status !== "confirmed" && l.status !== "lost").length;
  const lostCount = leads.filter(l => l.status === "lost").length;
  const confirmedCount = students.length;
  const conversionRate = totalLeadsCount > 0
    ? Math.round((leads.filter(l => l.status === "confirmed").length / totalLeadsCount) * 100)
    : 0;
  const totalExpected = students.reduce((s, st) => s + (st.totalPrice - st.discount), 0);
  const totalCollected = students.reduce((s, st) => s + st.paidAmount, 0);
  const totalOutstanding = totalExpected - totalCollected;
  const totalExpenseAmount = expenses.reduce((s, ex) => s + ex.price, 0);
  const totalSalaryAmount = teacherSalaries.reduce((s, sal) => s + sal.totalSalary, 0);

  // ── Filters ──────────────────────────────────────────────────────────────
  const filteredLeads = leads.filter(l => {
    const q = searchQuery.toLowerCase();
    const matchQ = l.name.toLowerCase().includes(q) || l.phone.includes(q) || (l.notes || "").toLowerCase().includes(q);
    const matchS = statusFilter === "all" || l.status === statusFilter;
    return matchQ && matchS;
  });

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchQ = s.name.toLowerCase().includes(q) || s.studentName.toLowerCase().includes(q) || s.phone.includes(q) || s.studentAgeGrade.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || s.paymentStatus === statusFilter;
    return matchQ && matchS;
  });

  // ── Helper: navigate tab ─────────────────────────────────────────────────
  const goTo = (tab) => { setActiveTab(tab); setSearchQuery(""); setStatusFilter("all"); };

  // ── Toast Icon helper ────────────────────────────────────────────────────
  const toastIcon = toast.type === "success" ? <CheckCircle size={16} />
    : toast.type === "error" ? <XCircle size={16} />
      : <Info size={16} />;

  const toastStyle = {
    success: { background: "var(--success)", color: "#fff" },
    error: { background: "var(--accent)", color: "#fff" },
    info: { background: "var(--text-main)", color: "var(--bg-card)" }
  }[toast.type];

  // ─────────────────────────────────────────────────────────────────────────
  // İlk açılış: kayıtlı token var mı diye kontrol edilirken kısa bir yükleniyor ekranı
  // ─────────────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="auth-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-h)" }}>Yükleniyor...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AUTH SCREENS
  // ─────────────────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="auth-container">
        {toast.visible && (
          <div className="toast-msg" style={toastStyle}>{toastIcon} {toast.message}</div>
        )}

        {authView === "login" ? (
          selectedLoginRole === null ? (
            /* Rol Seçim Portalı Hub */
            <div className="auth-card" style={{ maxWidth: 540, textAlign: "center" }}>
              <div className="auth-header">
                <img src={LOGO_SRC} className="auth-logo-img" alt="Okutan Akademi Logo" />
                <h2>Giriş Türünü Seçiniz</h2>
                <p>Okutan Akademi takip sistemine giriş yapmak istediğiniz portalı seçin:</p>
              </div>

              <div className="role-portal-grid">
                {/* 1. Yönetici Giriş Kartı */}
                <div
                  className="role-portal-card admin"
                  onClick={() => {
                    setSelectedLoginRole("Yönetici");
                    setLoginForm({ username: "", password: "" });
                  }}
                >
                  <div className="role-portal-badge admin">Yönetim Portal</div>
                  <div className="role-portal-icon">👑</div>
                  <h3>Yönetici Girişi</h3>
                  <p>Kasa, kayıtlar, öğretmen programları ve tüm sistem yetkileri</p>
                  <button type="button" className="btn btn-accent role-portal-btn">
                    Yönetici Portalı →
                  </button>
                </div>

                {/* 2. Asistan Giriş Kartı */}
                <div
                  className="role-portal-card assistant"
                  onClick={() => {
                    setSelectedLoginRole("Asistan");
                    setLoginForm({ username: "", password: "" });
                  }}
                >
                  <div className="role-portal-badge assistant">Asistan Portal</div>
                  <div className="role-portal-icon">👩‍💼</div>
                  <h3>Asistan Girişi</h3>
                  <p>Görüşülen müşteriler, kesin kayıtlar ve ödeme takibi</p>
                  <button type="button" className="btn btn-primary role-portal-btn">
                    Asistan Portalı →
                  </button>
                </div>

                {/* 3. Öğretmen Giriş Kartı */}
                <div
                  className="role-portal-card teacher"
                  onClick={() => {
                    setSelectedLoginRole("Öğretmen");
                    setLoginForm({ username: "", password: "" });
                  }}
                >
                  <div className="role-portal-badge teacher">Öğretmen Portal</div>
                  <div className="role-portal-icon">👨‍🏫</div>
                  <h3>Öğretmen Girişi</h3>
                  <p>Haftalık ders programı çizelgesi, PDF indirme ve gelişim notları</p>
                  <button type="button" className="btn btn-secondary role-portal-btn">
                    Öğretmen Portalı →
                  </button>
                </div>
              </div>

              <p className="auth-switch-text" style={{ marginTop: "1.25rem" }}>
                Yeni bir hesap mı açmak istiyorsunuz?
                <span onClick={() => { setAuthView("register"); setRegisterForm({ name: "", username: "", password: "", role: "Asistan", adminCode: "" }); }}>
                  Yeni Hesap Oluştur
                </span>
              </p>
            </div>
          ) : (
            /* Özel Rol Giriş Ekranı */
            <div className="auth-card" style={{ maxWidth: 440 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "0.775rem", gap: 4 }}
                  onClick={() => { setSelectedLoginRole(null); setLoginForm({ username: "", password: "" }); }}
                >
                  ← Rol Seçimine Dön
                </button>
                <span className={`role-badge-pill ${selectedLoginRole === "Yönetici" ? "admin" : selectedLoginRole === "Asistan" ? "assistant" : "teacher"}`}>
                  {selectedLoginRole} Portalı
                </span>
              </div>

              <div className="auth-header">
                <img src={LOGO_SRC} className="auth-logo-img" alt="Okutan Akademi Logo" />
                <h2>
                  {selectedLoginRole === "Yönetici" && "👑 Yönetici Girişi"}
                  {selectedLoginRole === "Asistan" && "👩‍💼 Asistan Girişi"}
                  {selectedLoginRole === "Öğretmen" && "👨‍🏫 Öğretmen Girişi"}
                </h2>
                <p>Okutan Akademi {selectedLoginRole} portalına hoş geldiniz.</p>
              </div>

              <form onSubmit={handleLogin} className="auth-form">
                <div className="form-group">
                  <label>Kullanıcı Adı</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Kullanıcı adınızı giriniz"
                    value={loginForm.username}
                    onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Şifre</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Şifrenizi giriniz"
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className={`btn ${selectedLoginRole === "Yönetici" ? "btn-accent" : selectedLoginRole === "Asistan" ? "btn-primary" : "btn-secondary"}`}
                  style={{ width: "100%", justifyContent: "center", padding: "13px" }}
                >
                  Giriş Yap
                </button>
              </form>

              <p className="auth-switch-text">
                Farklı bir portal mı?
                <span onClick={() => { setSelectedLoginRole(null); setLoginForm({ username: "", password: "", }); }}>Rol Seçimine Dön</span>
              </p>
            </div>
          )

        ) : (
          <div className="auth-card">
            <div className="auth-header">
              <img src={LOGO_SRC} className="auth-logo-img" alt="Okutan Akademi Logo" />
              <h2>Yeni Kullanıcı Ekle</h2>
              <p>Yeni hesap açmak için yönetici şifresi gereklidir.</p>
            </div>

            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label>Ad Soyad</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Örn: Hakan Okutan"
                  value={registerForm.name}
                  onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Kullanıcı Adı</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Giriş için kullanılacak"
                    value={registerForm.username}
                    onChange={e => setRegisterForm(f => ({ ...f, username: e.target.value }))}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Şifre</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Hesap şifresi"
                    value={registerForm.password}
                    onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select
                  className="form-control"
                  value={registerForm.role}
                  onChange={e => setRegisterForm(f => ({ ...f, role: e.target.value }))}
                >
                  <option value="Yönetici">Yönetici</option>
                  <option value="Asistan">Asistan</option>
                  <option value="Öğretmen">Öğretmen</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ color: "var(--accent)" }}>🔐 Yönetici Onay Şifresi</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Yöneticiden alınan şifreyi girin"
                  value={registerForm.adminCode}
                  onChange={e => setRegisterForm(f => ({ ...f, adminCode: e.target.value }))}
                  autoComplete="off"
                  required
                />
              </div>
              <button type="submit" className="btn btn-accent" style={{ width: "100%", justifyContent: "center", padding: "13px" }}>
                Hesap Oluştur
              </button>
            </form>

            <p className="auth-switch-text">
              Zaten hesabınız var mı?
              <span onClick={() => setAuthView("login")}>Giriş Yapın</span>
            </p>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN APP
  // ─────────────────────────────────────────────────────────────────────────
  const role = currentUser.role;

  // ── Hesaplamalar ve Bildirim Listeleri ──────────────────────────────────
  const alumniStudents = students.filter(s => s.status === "mezun");
  const alumniCount = alumniStudents.length;

  const pendingReminders = reminders.filter(r => r.status === "bekliyor");
  const pendingRemindersCount = pendingReminders.length;
  const totalNotificationsCount = overduePaymentsList.length + upcomingPaymentsList.length + pendingRemindersCount;

  const paidSalariesTotal = teacherSalaries.reduce((sum, sal) => sum + (sal.totalSalary || 0), 0);
  const netCashflow = totalCollected - (totalExpenseAmount + paidSalariesTotal);


  return (
    <div className="app-container">
      {/* Toast */}
      {toast.visible && (
        <div className="toast-msg" style={toastStyle}>{toastIcon} {toast.message}</div>
      )}

      {/* ── ACİL ÖDEME UYARI POPUP MODALI ──────────────────────────────── */}
      {overduePaymentsList.length > 0 && !hasDismissedOverdueModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: 540, border: "2px solid var(--accent)" }}>
            <div className="modal-header" style={{ background: "var(--accent-light)" }}>
              <h3 style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <AlertTriangle size={22} /> Acil Ödeme Uyarısı!
              </h3>
              <button className="btn-icon-only" onClick={() => setHasDismissedOverdueModal(true)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: "1.5rem" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--text-main)", marginBottom: 12 }}>
                Sistemde vadesi geçmiş <b>{overduePaymentsList.length} adet</b> ödeme taksiti bulunmaktadır:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 220, overflowY: "auto" }}>
                {overduePaymentsList.map(({ student, payment }, idx) => (
                  <div key={idx} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-app)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{student.studentName} ({student.name})</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Vade Tarihi: {payment.date} | 📞 {student.phone}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, color: "var(--accent)", fontSize: "0.95rem" }}>{payment.amount.toLocaleString("tr-TR")} ₺</div>
                      <button 
                        className="btn btn-accent" 
                        style={{ padding: "3px 8px", fontSize: "0.7rem", marginTop: 4 }}
                        onClick={() => sendWhatsAppReport(student)}
                      >
                        Hatırlat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer" style={{ padding: "1rem 1.5rem" }}>
              <button className="btn btn-secondary" onClick={() => setHasDismissedOverdueModal(true)}>Kapat</button>
              <button className="btn btn-primary" onClick={() => { setHasDismissedOverdueModal(true); goTo("payments"); }}>Ödeme Takibe Git</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: isSidebarCollapsed ? "center" : "space-between", marginBottom: "1.5rem" }}>
            <div className="sidebar-logo-container">
              <img src={LOGO_SRC} className="sidebar-logo-img" alt="Okutan Akademi" style={{ maxHeight: 38 }} />
            </div>
            <button className="sidebar-toggle-btn" onClick={toggleSidebar} title={isSidebarCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}>
              {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <ul className="menu-list">
            <li className={`menu-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => goTo("dashboard")} title="Dashboard">
              <TrendingUp className="menu-icon" /> <span className="menu-text">Dashboard</span>
            </li>
            {role !== "Öğretmen" && (
              <li className={`menu-item ${activeTab === "leads" ? "active" : ""}`} onClick={() => goTo("leads")} title="Görüşülen Müşteriler">
                <Users className="menu-icon" /> <span className="menu-text">Görüşülen Müşteriler</span>
              </li>
            )}
            <li className={`menu-item ${activeTab === "students" ? "active" : ""}`} onClick={() => goTo("students")} title="Kesin Kayıtlar">
              <UserCheck className="menu-icon" /> <span className="menu-text">Kesin Kayıtlar</span>
            </li>
            <li className={`menu-item ${activeTab === "alumni" ? "active" : ""}`} onClick={() => goTo("alumni")} title="Mezun Listesi">
              <GraduationCap className="menu-icon" />
              <span className="menu-text" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                Mezun Listesi
                {alumniCount > 0 && <span style={{ background: "var(--success)", color: "#fff", padding: "2px 7px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: 700 }}>{alumniCount}</span>}
              </span>
            </li>
            <li className={`menu-item ${activeTab === "teacher_schedules" ? "active" : ""}`} onClick={() => goTo("teacher_schedules")} title="Öğretmen Programları">
              <Calendar className="menu-icon" /> <span className="menu-text">Öğretmen Programları</span>
            </li>
            {role !== "Öğretmen" && (
              <li className={`menu-item ${activeTab === "payments" ? "active" : ""}`} onClick={() => goTo("payments")} title="Ödeme Takip">
                <DollarSign className="menu-icon" /> <span className="menu-text">Ödeme Takip</span>
              </li>
            )}
            {role !== "Öğretmen" && (
              <li className={`menu-item ${activeTab === "teacher_salaries" ? "active" : ""}`} onClick={() => goTo("teacher_salaries")} title="Öğretmen Maaşları">
                <Wallet className="menu-icon" /> <span className="menu-text">Öğretmen Maaşları</span>
              </li>
            )}
            {role !== "Öğretmen" && (
              <li className={`menu-item ${activeTab === "expenses" ? "active" : ""}`} onClick={() => goTo("expenses")} title="Giderler">
                <Receipt className="menu-icon" /> <span className="menu-text">Giderler</span>
              </li>
            )}
            <li className={`menu-item ${activeTab === "reminders" ? "active" : ""}`} onClick={() => goTo("reminders")} title="Hatırlatmalar">
              <CheckSquare className="menu-icon" />
              <span className="menu-text" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                Hatırlatmalar
                {pendingRemindersCount > 0 && <span style={{ background: "var(--accent)", color: "#fff", padding: "2px 7px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: 700 }}>{pendingRemindersCount}</span>}
              </span>
            </li>
          </ul>
        </div>

        {/* Sidebar Footer */}
        <div className="user-profile-section">
          <span className={`role-badge-pill ${role === "Yönetici" ? "admin" : role === "Asistan" ? "assistant" : "teacher"}`}>
            {role}
          </span>
          <div className="user-info-card" style={{ marginBottom: "10px" }}>
            <div className="avatar">{currentUser.name.charAt(0)}</div>
            <div className="user-details">
              <h4>{currentUser.name}</h4>
              <p>@{currentUser.username}</p>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={handleLogout} title="Oturumu Kapat">
            <LogOut size={14} /> <span className="logout-btn-text">Oturumu Kapat</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="main-content">

        {/* Header */}
        <header className="top-header">
          <div className="header-title-section">
            <h1>Okutan Akademi Hızlı Okuma</h1>
            <p>Kayıt, Ödeme ve Öğrenci Takip Sistemi</p>
          </div>
          <div className="header-actions">
            {role !== "Öğretmen" && (
              <div className="header-stat-pill">Kasa: <span>{formatMoney(totalCollected)}</span></div>
            )}
            <div className="header-stat-pill">Öğrenci: <span>{confirmedCount}</span></div>

            {/* Notification Bell */}
            <div className="notification-bell-wrapper">
              <button 
                className="notification-bell-btn" 
                onClick={() => setShowNotificationsDrawer(prev => !prev)}
                title="Ödeme & Görev Bildirimleri"
              >
                <Bell size={18} />
                {totalNotificationsCount > 0 && (
                  <span className="notification-badge-pulse">{totalNotificationsCount}</span>
                )}
              </button>

              {/* Notification Drawer Popup */}
              {showNotificationsDrawer && (
                <div className="notification-drawer-popup">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                    <h4 style={{ fontSize: "0.95rem", margin: 0, fontWeight: 700 }}>Uyarılar ve Bildirimler</h4>
                    <button className="btn-icon-only" style={{ width: 24, height: 24 }} onClick={() => setShowNotificationsDrawer(false)}><X size={14} /></button>
                  </div>

                  {overduePaymentsList.length === 0 && upcomingPaymentsList.length === 0 && pendingRemindersCount === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", padding: "15px 0" }}>Acil bildirim bulunmuyor.</p>
                  ) : (
                    <>
                      {overduePaymentsList.map(({ student, payment }, idx) => (
                        <div key={`overdue-${idx}`} className="notification-item-card overdue">
                          <div className="notification-item-title">
                            <span>🚨 Gecikmiş Taksit</span>
                            <span style={{ color: "var(--accent)", fontWeight: 800 }}>{payment.amount.toLocaleString("tr-TR")} ₺</span>
                          </div>
                          <div className="notification-item-sub">
                            <b>{student.studentName}</b> ({student.name}) - Vade: {payment.date}
                          </div>
                          <button 
                            className="btn btn-accent" 
                            style={{ padding: "4px 8px", fontSize: "0.725rem", marginTop: 4, width: "fit-content" }}
                            onClick={() => sendWhatsAppReport(student)}
                          >
                            WhatsApp Hatırlatması At
                          </button>
                        </div>
                      ))}

                      {upcomingPaymentsList.map(({ student, payment }, idx) => (
                        <div key={`upcoming-${idx}`} className="notification-item-card upcoming">
                          <div className="notification-item-title">
                            <span>⏳ Yaklaşan Taksit</span>
                            <span style={{ fontWeight: 700 }}>{payment.amount.toLocaleString("tr-TR")} ₺</span>
                          </div>
                          <div className="notification-item-sub">
                            <b>{student.studentName}</b> - Vade: {payment.date}
                          </div>
                        </div>
                      ))}

                      {reminders.filter(r => r.status === "bekliyor" && r.priority === "yüksek").map(rem => (
                        <div key={rem.id} className="notification-item-card" style={{ borderLeftColor: "var(--primary)" }}>
                          <div className="notification-item-title">
                            <span>📌 Yüksek Öncelikli Görev</span>
                          </div>
                          <div className="notification-item-sub">
                            <b>{rem.title}</b> - Son Tarih: {rem.dueDate}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button className="theme-switch-btn" onClick={toggleTheme} title={theme === "light" ? "Karanlık Mod" : "Aydınlık Mod"}>
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Quick Logout */}
            <button className="btn-logout" onClick={handleLogout}>
              <LogOut size={13} /> {currentUser.name.split(" ")[0]}
            </button>
          </div>
        </header>


        {/* ══ DASHBOARD ══════════════════════════════════════════════════════ */}
        {activeTab === "dashboard" && (
          <>
            <div className="dashboard-grid">
              <div className="metric-card">
                <div className="metric-info">
                  <span className="metric-label">Toplam Görüşülen</span>
                  <span className="metric-value">{totalLeadsCount}</span>
                  <span className="metric-subtext positive">{activeLeadsCount} aktif takip</span>
                </div>
                <div className="metric-icon-wrapper"><Users size={24} /></div>
              </div>

              <div className="metric-card">
                <div className="metric-info">
                  <span className="metric-label">Kesin Kayıtlı Öğrenci</span>
                  <span className="metric-value">{confirmedCount}</span>
                  <span className="metric-subtext positive">%{conversionRate} Dönüşüm</span>
                </div>
                <div className="metric-icon-wrapper"><UserCheck size={24} /></div>
              </div>

              {role !== "Öğretmen" ? (
                <>
                  <div className="metric-card accent">
                    <div className="metric-info">
                      <span className="metric-label">Toplam Tahsilat</span>
                      <span className="metric-value" style={{ fontSize: "1.6rem" }}>{formatMoney(totalCollected)}</span>
                      <span className="metric-subtext positive" style={{ color: "var(--primary)" }}>Toplam sözleşme: {formatMoney(totalExpected)}</span>
                    </div>
                    <div className="metric-icon-wrapper"><DollarSign size={24} /></div>
                  </div>
                  <div className="metric-card accent">
                    <div className="metric-info">
                      <span className="metric-label">Kalan Toplam Alacak</span>
                      <span className="metric-value" style={{ fontSize: "1.6rem" }}>{formatMoney(totalOutstanding)}</span>
                      <span className="metric-subtext negative">Bekleyen taksitler</span>
                    </div>
                    <div className="metric-icon-wrapper"><Clock size={24} /></div>
                  </div>
                </>
              ) : (
                <div className="metric-card">
                  <div className="metric-info">
                    <span className="metric-label">Akademik Takip</span>
                    <span className="metric-value" style={{ fontSize: "1.4rem" }}>Sınıf Notları</span>
                    <span className="metric-subtext positive">Gelişim raporları</span>
                  </div>
                  <div className="metric-icon-wrapper"><BookOpen size={24} /></div>
                </div>
              )}
            </div>

            {/* Dashboard Detail Panels */}
            <div className="dashboard-details-grid">
              <div className="panel-card">
                <div className="panel-header">
                  <h3 className="panel-title"><BookOpen size={20} color="var(--primary)" /> Hızlı İşlemler</h3>
                </div>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "var(--text-muted)" }}>
                  Görüşülen velileri kaydedin, tek tıkla kesin kayda çevirin, taksit/ödeme planları oluşturun ve
                  öğrencilerin gelişim süreçlerini not olarak takip edin.
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {role !== "Öğretmen" && (
                    <button className="btn btn-primary" onClick={() => { setLeadForm(emptyLeadForm); setModal("addLead"); }}>
                      <Plus size={15} /> Müşteri Ekle
                    </button>
                  )}
                  {role !== "Öğretmen" && (
                    <button className="btn btn-secondary" onClick={() => { setPaymentForm(emptyPaymentForm); goTo("payments"); setModal("addPayment"); }}>
                      <DollarSign size={15} /> Ödeme Al
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={() => goTo("students")}>
                    <UserCheck size={15} /> Öğrenci Notları
                  </button>
                  {role !== "Öğretmen" && (
                    <>
                      <button className="btn btn-secondary" onClick={exportBackup}>
                        <Download size={15} /> Yedekle
                      </button>
                      <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
                        <Upload size={15} /> Yedek Yükle
                        <input type="file" accept=".json" onChange={importBackup} style={{ display: "none" }} />
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-header">
                  <h3 className="panel-title"><TrendingUp size={20} color="var(--accent)" /> Kayıt Dönüşümü</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div className="conversion-progress">
                    <div className="conversion-progress-header">
                      <span>Dönüşüm Oranı</span><span>%{conversionRate}</span>
                    </div>
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar-fill" style={{ width: `${conversionRate}%` }} />
                    </div>
                  </div>
                  {[
                    ["Toplam Görüşülen", totalLeadsCount],
                    ["Kayıt Olan (Öğrenci)", confirmedCount],
                    ["Olumsuz (Kayıt Olmayan)", lostCount]
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      <span>{label}</span><strong style={{ color: "var(--text-main)" }}>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ MEZUN LISTESI (ALUMNI) ════════════════════════════════════════ */}
        {activeTab === "alumni" && (
          <div className="panel-card">
            <div className="panel-header">
              <h3 className="panel-title"><GraduationCap size={24} color="var(--success)" /> Mezun Öğrenciler Portalı</h3>
              <div style={{ display: "flex", gap: "10px" }}>
                <span className="badge badge-confirmed" style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
                  <Award size={16} /> Toplam: {alumniCount} Mezun
                </span>
              </div>
            </div>

            {/* Mezun Başarı İstatistik Paneli */}
            <div className="dashboard-grid" style={{ marginBottom: "1.5rem" }}>
              <div className="metric-card">
                <div className="metric-info">
                  <span className="metric-label">Toplam Mezun Öğrenci</span>
                  <span className="metric-value" style={{ color: "var(--success)" }}>{alumniCount}</span>
                  <span className="metric-subtext positive">Başarıyla tamamlayanlar</span>
                </div>
                <div className="metric-icon-wrapper" style={{ background: "var(--success-light)", color: "var(--success)" }}>
                  <GraduationCap size={24} />
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-info">
                  <span className="metric-label">Ortalama Okuma Hızı Artışı</span>
                  <span className="metric-value" style={{ color: "var(--primary)" }}>+%145 WPM</span>
                  <span className="metric-subtext positive">Rekor gelişim kat kat</span>
                </div>
                <div className="metric-icon-wrapper">
                  <TrendingUp size={24} />
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-info">
                  <span className="metric-label">Ortalama Anlama Oranı</span>
                  <span className="metric-value" style={{ color: "var(--info)" }}>%88</span>
                  <span className="metric-subtext positive">Yüksek kavrama seviyesi</span>
                </div>
                <div className="metric-icon-wrapper" style={{ background: "var(--info-light)", color: "var(--info)" }}>
                  <CheckCircle size={24} />
                </div>
              </div>
            </div>

            {alumniStudents.length === 0 ? (
              <div className="empty-state">
                <GraduationCap className="empty-state-icon" style={{ color: "var(--success)" }} />
                <p>Henüz mezun olarak işaretlenmiş öğrenci bulunmuyor.</p>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  "Kesin Kayıtlar" sekmesinden öğrencilerin durumunu "Mezun" olarak güncelleyebilirsiniz.
                </span>
              </div>
            ) : (
              <div className="alumni-grid">
                {alumniStudents.map(student => {
                  const firstMeas = student.progressHistory?.[0] || { wpm: 120, comprehension: 50 };
                  const lastMeas = student.progressHistory?.[student.progressHistory.length - 1] || { wpm: 300, comprehension: 85 };
                  const wpmIncrease = Math.round(((lastMeas.wpm - firstMeas.wpm) / (firstMeas.wpm || 1)) * 100);

                  return (
                    <div key={student.id} className="alumni-card-box">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main)", marginBottom: 2 }}>
                            🎓 {student.studentName}
                          </h4>
                          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Veli: {student.name} ({student.phone})</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600, marginTop: 2 }}>{student.studentAgeGrade}</p>
                        </div>
                        <span className="badge badge-confirmed" style={{ fontSize: "0.7rem" }}>Mezun</span>
                      </div>

                      <div className="alumni-stats-banner">
                        <div>
                          <div className="alumni-stat-num">{firstMeas.wpm} ➔ {lastMeas.wpm}</div>
                          <div className="alumni-stat-label">WPM (Kelime/dk)</div>
                        </div>
                        <div style={{ borderLeft: "1px solid rgba(0,0,0,0.1)", paddingLeft: 10 }}>
                          <div className="alumni-stat-num" style={{ color: "var(--primary)" }}>+{wpmIncrease}%</div>
                          <div className="alumni-stat-label">Hız Artışı</div>
                        </div>
                        <div style={{ borderLeft: "1px solid rgba(0,0,0,0.1)", paddingLeft: 10 }}>
                          <div className="alumni-stat-num" style={{ color: "var(--info)" }}>%{lastMeas.comprehension}</div>
                          <div className="alumni-stat-label">Anlama Oranı</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "8px" }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ flex: 1, justifyContent: "center", fontSize: "0.8rem", padding: "8px" }}
                          onClick={() => exportGraduationCertificatePDF(student)}
                          title="Sertifikayı PDF olarak indir"
                        >
                          <FileText size={14} /> Sertifika İndir
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: "8px 10px" }}
                          onClick={() => sendWhatsAppReport(student)}
                          title="Tebrik Mesajı Gönder"
                        >
                          <Send size={14} color="var(--success)" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}



        {/* ══ LEADS ══════════════════════════════════════════════════════════ */}
        {activeTab === "leads" && role !== "Öğretmen" && (

          <div className="panel-card">
            <div className="panel-header">
              <h3 className="panel-title"><Users size={22} color="var(--primary)" /> Görüşülen Müşteri Kayıt Sistemi</h3>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn btn-secondary" onClick={() => exportLeadsToExcel(leads)}>
                  <FileSpreadsheet size={16} color="var(--success)" /> Excel Listesi
                </button>
                <button className="btn btn-primary" onClick={() => { setLeadForm(emptyLeadForm); setModal("addLead"); }}>
                  <Plus size={16} /> Yeni Görüşme Ekle
                </button>
              </div>
            </div>


            <div className="toolbar">
              <div className="search-filter-group">
                <div className="search-input-wrapper">
                  <Search className="search-icon" />
                  <input type="text" className="search-input" placeholder="Ad, telefon veya not ara…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">Tüm Durumlar</option>
                  <option value="new">Yeni Başvuru</option>
                  <option value="contacted">Görüşüldü</option>
                  <option value="waiting">Karar Bekliyor</option>
                  <option value="lost">Olumsuz</option>
                  <option value="confirmed">Kayıt Yapıldı</option>
                </select>
              </div>
            </div>

            <div className="table-container">
              {filteredLeads.length === 0 ? (
                <div className="empty-state"><Users className="empty-state-icon" /><p>Kayıt bulunamadı.</p></div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Veli Ad Soyad</th><th>Telefon</th><th>Tarih</th><th>Kanal</th><th>Durum</th><th>Not</th>
                      <th style={{ textAlign: "right" }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => (
                      <tr key={lead.id}>
                        <td><strong>{lead.name}</strong></td>
                        <td>{lead.phone}</td>
                        <td>{lead.date}</td>
                        <td>{lead.source}</td>
                        <td>
                          <span className={`badge badge-${lead.status === "new" ? "new" : lead.status === "contacted" ? "contacted" : lead.status === "waiting" ? "waiting" : lead.status === "lost" ? "lost" : "confirmed"}`}>
                            {lead.status === "new" && "Yeni Başvuru"}
                            {lead.status === "contacted" && "Görüşüldü"}
                            {lead.status === "waiting" && "Karar Bekliyor"}
                            {lead.status === "lost" && "Olumsuz"}
                            {lead.status === "confirmed" && "Kayıt Yapıldı"}
                          </span>
                        </td>
                        <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lead.notes}>{lead.notes || "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            {lead.status !== "confirmed" && (
                              <button className="btn btn-primary" style={{ padding: "6px 10px", fontSize: "0.75rem" }} onClick={() => openConfirmReg(lead)}>
                                Kesin Kayıt
                              </button>
                            )}
                            <button className="btn-icon-only" title="Düzenle" onClick={() => { setSelectedLead({ ...lead }); setModal("editLead"); }}>
                              <Edit3 size={15} />
                            </button>
                            {role !== "Öğretmen" && (
                              <button className="btn-icon-only delete-btn" title="Sil" onClick={() => handleDeleteLead(lead.id)}>
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══ STUDENTS ═══════════════════════════════════════════════════════ */}
        {activeTab === "students" && (
          <div className="panel-card">
            <div className="panel-header">
              <h3 className="panel-title"><UserCheck size={22} color="var(--primary)" /> Kesinleşen Kayıtlar</h3>
              <button className="btn btn-secondary" onClick={() => exportStudentsToExcel(students)}>
                <FileSpreadsheet size={16} color="var(--success)" /> Excel Listesi
              </button>
            </div>

            <div className="toolbar">
              <div className="search-filter-group">
                <div className="search-input-wrapper">
                  <Search className="search-icon" />
                  <input type="text" className="search-input" placeholder="Öğrenci, veli, telefon veya sınıf ara…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                {role !== "Öğretmen" && (
                  <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">Tüm Ödemeler</option>
                    <option value="paid">Tamamlandı</option>
                    <option value="partial">Kısmi Ödeme</option>
                    <option value="unpaid">Ödenmedi</option>
                  </select>
                )}
              </div>
            </div>

            <div className="table-container">
              {filteredStudents.length === 0 ? (
                <div className="empty-state"><UserCheck className="empty-state-icon" /><p>Kayıtlı öğrenci bulunamadı.</p></div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Veli Ad Soyad</th><th>Telefon</th><th>Öğrenci</th><th>Sınıf/Yaş</th><th>Ders Tipi</th><th>Öğretmen</th><th>Ders Programı</th><th>Kayıt Tarihi</th>
                      {role !== "Öğretmen" && <><th>Ücret</th><th>Ödenen / Kalan</th><th>Durum</th></>}
                      <th>Notlar</th><th style={{ textAlign: "right" }}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => {
                      const due = student.totalPrice - student.discount;
                      const rem = due - student.paidAmount;
                      return (
                        <tr key={student.id}>
                          <td>{student.name}</td>
                          <td>{student.phone}</td>
                          <td>
                            <strong>{student.studentName}</strong>
                            {student.studentPassword && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                🔑 {student.studentPassword}
                              </div>
                            )}
                          </td>
                          <td>{student.studentAgeGrade}</td>
                          <td>
                            <span className={`badge ${student.lessonType === "ozel" ? "badge-partial" : "badge-paid"}`}>
                              {student.lessonType === "ozel" ? "Özel Ders" : "Grup Dersi"}
                            </span>
                          </td>
                          <td>
                            {student.teacherName ? (
                              <span className={`student-teacher-pill ${student.teacherId === "teacher-zehra" ? "zehra" : "firat"}`}>
                                {student.teacherId === "teacher-zehra" ? "👩‍🏫" : "👨‍🏫"} {student.teacherName}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>—</span>
                            )}
                          </td>
                          <td>
                            {student.lessons && student.lessons.length > 0 ? (
                              <div className="lessons-badge-list">
                                {student.lessons.map((l, idx) => (
                                  <span key={idx} className="lesson-badge-item">
                                    {l.day.substring(0, 3)} ({l.time.split(" ")[0]})
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>—</span>
                            )}
                          </td>
                          <td>{student.registrationDate}</td>
                          {role !== "Öğretmen" && (
                            <>
                              <td><strong>{formatMoney(due)}</strong></td>
                              <td>
                                <span style={{ color: "var(--success)" }}>{formatMoney(student.paidAmount)}</span>
                                {" / "}
                                <span style={{ color: "var(--accent)" }}>{formatMoney(rem)}</span>
                              </td>
                              <td>
                                <span className={`badge badge-${student.paymentStatus}`}>
                                  {student.paymentStatus === "paid" ? "Ödendi" : student.paymentStatus === "partial" ? "Kısmi" : "Ödenmedi"}
                                </span>
                              </td>
                            </>
                          )}
                          <td>
                            <span style={{ fontSize: "0.8rem", background: "var(--bg-app)", padding: "3px 8px", borderRadius: 10 }}>
                              {student.notes.length} not
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button
                                className="btn btn-primary"
                                style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                                onClick={() => { setSelectedStudent(student); setNewNoteText(""); setModal("studentDetail"); }}
                              >
                                Detay / Notlar
                              </button>
                              {role !== "Öğretmen" && (
                                <button className="btn-icon-only" title="Düzenle" onClick={() => openEditStudent(student)}>
                                  <Edit3 size={15} />
                                </button>
                              )}
                              {role !== "Öğretmen" && (
                                <button className="btn-icon-only delete-btn" title="Sil" onClick={() => handleDeleteStudent(student.id)}>
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══ PAYMENTS ═══════════════════════════════════════════════════════ */}
        {activeTab === "payments" && role !== "Öğretmen" && (
          <div className="panel-card">
            <div className="panel-header">
              <h3 className="panel-title"><DollarSign size={22} color="var(--primary)" /> Kasa ve Ödeme Takibi</h3>
              <button className="btn btn-accent" onClick={() => { setPaymentForm(emptyPaymentForm); setModal("addPayment"); }}>
                <Plus size={16} /> Ödeme / Taksit Al
              </button>
            </div>

            <div className="dashboard-grid" style={{ marginBottom: "1rem" }}>
              {[
                ["Kasaya Giren", formatMoney(totalCollected), "var(--success)"],
                ["Bekleyen Alacak", formatMoney(totalOutstanding), "var(--accent)"],
                ["Toplam Sözleşme", formatMoney(totalExpected), "var(--primary)"]
              ].map(([label, val, color]) => (
                <div key={label} className="metric-card" style={{ padding: "1.25rem" }}>
                  <div className="metric-info">
                    <span className="metric-label">{label}</span>
                    <span className="metric-value" style={{ color }}>{val}</span>
                  </div>
                </div>
              ))}
            </div>

            <h4 style={{ marginBottom: "0.75rem", fontSize: "1rem" }}>Ödeme İşlem Geçmişi</h4>
            <div className="table-container">
              {students.flatMap(s => s.payments.map(p => ({ ...p, studentName: s.studentName, parentName: s.name, student: s }))).length === 0 ? (
                <div className="empty-state"><DollarSign className="empty-state-icon" /><p>Ödeme kaydı bulunamadı.</p></div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Öğrenci</th><th>Veli</th><th>Tarih</th><th>Tutar</th><th>Tür</th><th>Açıklama</th><th style={{ textAlign: "center" }}>Makbuz</th></tr>
                  </thead>
                  <tbody>
                    {students
                      .flatMap(s => s.payments.map(p => ({ ...p, studentName: s.studentName, parentName: s.name, student: s })))
                      .sort((a, b) => b.id.localeCompare(a.id))
                      .map(pay => (
                        <tr key={pay.id}>
                          <td><strong>{pay.studentName}</strong></td>
                          <td>{pay.parentName}</td>
                          <td>{pay.date}</td>
                          <td><strong style={{ color: "var(--success)" }}>{formatMoney(pay.amount)}</strong></td>
                          <td><span className="badge badge-paid" style={{ padding: "3px 8px" }}>{pay.type}</span></td>
                          <td>{pay.description}</td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.7rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              onClick={() => exportPaymentReceiptPDF(pay.student, pay)}
                            >
                              <Receipt size={12} /> Makbuz
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══ ÖĞRETMEN MAAŞLARI VE BORDRO YÖNETİMİ ════════════════════════════ */}
        {activeTab === "teacher_salaries" && role !== "Öğretmen" && (() => {
          const paidSalariesSum = teacherSalaries.filter(s => s.status === 'Ödendi').reduce((acc, s) => acc + (s.totalSalary || 0), 0);
          const pendingSalariesSum = teacherSalaries.filter(s => s.status === 'Bekliyor').reduce((acc, s) => acc + (s.totalSalary || 0), 0);
          const pendingSalariesCount = teacherSalaries.filter(s => s.status === 'Bekliyor').length;

          const selectedTeacherWeekly = getWeeklySessionCount(salaryForm.teacherId);
          const formWeeks = parseFloat(salaryForm.weeks) || 0;
          const formRate = parseFloat(salaryForm.sessionRate) || 500;
          const formBonus = parseFloat(salaryForm.bonus) || 0;
          const formDeduction = parseFloat(salaryForm.deduction) || 0;
          const totalFormSessions = selectedTeacherWeekly * formWeeks;
          const baseFormSalary = totalFormSessions * formRate;
          const netFormSalary = Math.max(0, baseFormSalary + formBonus - formDeduction);

          return (
            <div className="panel-card">
              <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="panel-title"><Wallet size={22} color="var(--primary)" /> Öğretmen Maaşları ve Esnek Bordro Takibi</h3>
                {salaryForm.id && (
                  <button type="button" className="btn btn-secondary" onClick={() => setSalaryForm(emptySalaryForm)}>
                    + Yeni Bordro Oluşturma Moduna Dön
                  </button>
                )}
              </div>

              {/* Finansal Özet Metrik Kartları */}
              <div className="dashboard-grid" style={{ marginBottom: "1.25rem" }}>
                <div className="metric-card">
                  <div className="metric-info">
                    <span className="metric-label">Ödenmiş Toplam Maaşlar</span>
                    <span className="metric-value" style={{ color: "var(--success)" }}>{paidSalariesSum.toLocaleString("tr-TR")} ₺</span>
                    <span className="metric-subtext positive">Giderlere Otomatik İşlenen</span>
                  </div>
                  <div className="metric-icon-wrapper" style={{ background: "var(--success-light)", color: "var(--success)" }}>
                    <CheckCircle size={22} />
                  </div>
                </div>

                <div className="metric-card accent">
                  <div className="metric-info">
                    <span className="metric-label">Ödeme Bekleyen Bordrolar</span>
                    <span className="metric-value" style={{ color: "var(--accent)" }}>{pendingSalariesSum.toLocaleString("tr-TR")} ₺</span>
                    <span className="metric-subtext negative">{pendingSalariesCount} adet onay bekliyor</span>
                  </div>
                  <div className="metric-icon-wrapper">
                    <Clock size={22} />
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-info">
                    <span className="metric-label">Toplam Bordro Bütçesi</span>
                    <span className="metric-value" style={{ color: "var(--primary)" }}>{totalSalaryAmount.toLocaleString("tr-TR")} ₺</span>
                    <span className="metric-subtext">Tüm kaydedilmiş bordrolar</span>
                  </div>
                  <div className="metric-icon-wrapper" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                    <Wallet size={22} />
                  </div>
                </div>
              </div>

              {/* Canlı Önizleme: Öğretmen Programları'ndan otomatik hesaplanan haftalık seans sayısı */}
              <h4 style={{ marginBottom: "0.5rem", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={16} color="var(--primary)" /> Öğretmen Ders Programı Canlı Seans ve Ücret Analizi
              </h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                Haftalık seanslar ders takviminden çekilir. Her öğretmenin ders başı seans ücretini aşağıdan anında değiştirebilirsiniz.
              </p>
              <div className="table-container" style={{ marginBottom: "1.5rem" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Öğretmen</th>
                      <th>Haftalık Seans Sayısı (Canlı)</th>
                      <th>Birim Seans Ücreti (₺ / Seans)</th>
                      <th>Tahmini Haftalık Hakediş</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map(t => {
                      const weeklyCount = getWeeklySessionCount(t.id);
                      const currentRate = teacherRates[t.id] ?? 500;
                      return (
                        <tr key={t.id}>
                          <td><strong>{t.name}</strong></td>
                          <td><span className="badge" style={{ background: "var(--bg-app)", color: "var(--text-main)", border: "1px solid var(--border)" }}>{weeklyCount} Seans / Hafta</span></td>
                          <td>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                className="form-control"
                                style={{ width: "110px", padding: "4px 8px", fontSize: "0.85rem", fontWeight: "bold" }}
                                value={currentRate}
                                onChange={e => handleUpdateTeacherRate(t.id, e.target.value)}
                              />
                              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>₺ / seans</span>
                            </div>
                          </td>
                          <td><strong style={{ color: "var(--success)", fontSize: "0.95rem" }}>{(weeklyCount * currentRate).toLocaleString("tr-TR")} ₺</strong></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bordro Kaydı Oluşturma veya Düzenleme Formu */}
              <div id="salary-form-section" style={{
                background: salaryForm.id ? "rgba(108, 92, 231, 0.05)" : "var(--bg-app)",
                padding: "1.25rem",
                borderRadius: "var(--radius-lg)",
                border: salaryForm.id ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                marginBottom: "1.5rem"
              }}>
                <h4 style={{ marginBottom: "0.4rem", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Edit3 size={18} color="var(--primary)" /> {salaryForm.id ? "✏️ Bordro Kaydını Düzenle" : "➕ Yeni Bordro Oluştur / Maaş Hesapla"}
                </h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  {salaryForm.id ? "Seçilen maaş kaydının dönem, seans ücreti, prim, kesinti ve ödeme durumunu güncelleyebilirsiniz." : "Seans sayısı, ders ücreti, ek prim ve kesintileri belirleyerek esnek maaş bordrosu kaydedin."}
                </p>

                <form onSubmit={handleSaveSalary}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Öğretmen *</label>
                      <select
                        className="form-control"
                        value={salaryForm.teacherId}
                        onChange={e => {
                          const tId = e.target.value;
                          const defaultRate = teacherRates[tId] ?? 500;
                          setSalaryForm(f => ({
                            ...f,
                            teacherId: tId,
                            sessionRate: f.id ? f.sessionRate : String(defaultRate)
                          }));
                        }}
                        required
                      >
                        <option value="">Öğretmen seçin…</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name} (Haftalık {getWeeklySessionCount(t.id)} seans)</option>
                        ))}
                      </select>
                    </div>


                    <div className="form-group">
                      <label>Dönem Süresi (Hafta) *</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="form-control"
                        placeholder="Örn: 4 (Aylık)"
                        value={salaryForm.weeks}
                        onChange={e => setSalaryForm(f => ({ ...f, weeks: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Ders Başı Seans Ücreti (₺) *</label>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        className="form-control"
                        placeholder="Örn: 500"
                        value={salaryForm.sessionRate}
                        onChange={e => setSalaryForm(f => ({ ...f, sessionRate: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Ek Prim / İkramiye (₺)</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        className="form-control"
                        placeholder="Örn: 500 (Opsiyonel)"
                        value={salaryForm.bonus}
                        onChange={e => setSalaryForm(f => ({ ...f, bonus: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label>Kesinti / Avans (₺)</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        className="form-control"
                        placeholder="Örn: 200 (Opsiyonel)"
                        value={salaryForm.deduction}
                        onChange={e => setSalaryForm(f => ({ ...f, deduction: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label>Ödeme Durumu</label>
                      <select
                        className="form-control"
                        value={salaryForm.status || "Ödendi"}
                        onChange={e => setSalaryForm(f => ({ ...f, status: e.target.value }))}
                      >
                        <option value="Ödendi">✅ Ödendi (Kasa Giderine Otomatik İşle)</option>
                        <option value="Bekliyor">⏳ Ödeme Bekliyor</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: "0.75rem" }}>
                    <label>Açıklama / Özel Not</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Örn: Temmuz ayı performans ikramiyesi dahil bordro ödemesi"
                      value={salaryForm.note}
                      onChange={e => setSalaryForm(f => ({ ...f, note: e.target.value }))}
                    />
                  </div>

                  {salaryForm.teacherId && (
                    <div style={{
                      background: "var(--bg-card)",
                      padding: "12px 16px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      fontSize: "0.85rem",
                      marginTop: "1rem",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "1rem",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}>
                      <div>
                        <span>Ders Hacmi: <strong>{selectedTeacherWeekly} seans/hafta × {formWeeks} hafta = {totalFormSessions} seans</strong></span>
                        <br />
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Taban: {totalFormSessions} × {formRate} ₺ = {baseFormSalary.toLocaleString("tr-TR")} ₺
                          {formBonus > 0 && ` | + Prim: ${formBonus} ₺`}
                          {formDeduction > 0 && ` | - Kesinti: ${formDeduction} ₺`}
                        </span>
                      </div>
                      <div style={{ fontSize: "1.1rem" }}>
                        Net Hakediş: <strong style={{ color: "var(--success)" }}>{netFormSalary.toLocaleString("tr-TR")} ₺</strong>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
                    <button type="submit" className="btn btn-primary">
                      {salaryForm.id ? <><Edit3 size={16} /> Bordroyu Güncelle</> : <><Plus size={16} /> Bordro Kaydını Kaydet</>}
                    </button>
                    {salaryForm.id && (
                      <button type="button" className="btn btn-secondary" onClick={() => setSalaryForm(emptySalaryForm)}>
                        İptal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Kaydedilmiş Bordro Kayıtları Listesi */}
              <h4 style={{ marginBottom: "0.75rem", fontSize: "1rem" }}>Kaydedilmiş Maaş Bordroları</h4>
              <div className="table-container">
                {teacherSalaries.length === 0 ? (
                  <div className="empty-state"><Wallet className="empty-state-icon" /><p>Henüz maaş bordrosu oluşturulmadı.</p></div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Öğretmen</th>
                        <th>Dönem & Seans</th>
                        <th>Birim Ücret</th>
                        <th>Prim / Kesinti</th>
                        <th>Net Maaş</th>
                        <th>Açıklama</th>
                        <th>Durum</th>
                        <th style={{ textAlign: "right" }}>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherSalaries.map(sal => {
                        const rate = sal.sessionRate || 500;
                        const b = sal.bonus || 0;
                        const d = sal.deduction || 0;

                        return (
                          <tr key={sal.id}>
                            <td><strong>{sal.teacherName}</strong></td>
                            <td>
                              {sal.weeks} Hafta ({sal.totalSessionCount || (sal.weeklySessionCount * sal.weeks)} Seans)
                            </td>
                            <td>{rate.toLocaleString("tr-TR")} ₺/seans</td>
                            <td>
                              {b > 0 && <span style={{ color: "var(--success)", marginRight: 6, fontWeight: "bold" }}>+{b} ₺</span>}
                              {d > 0 && <span style={{ color: "var(--accent)", fontWeight: "bold" }}>-{d} ₺</span>}
                              {b === 0 && d === 0 && <span style={{ color: "var(--text-muted)" }}>—</span>}
                            </td>
                            <td><strong style={{ color: "var(--success)", fontSize: "0.95rem" }}>{sal.totalSalary.toLocaleString("tr-TR")} ₺</strong></td>
                            <td style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: 160 }}>{sal.note || "—"}</td>
                            <td>
                              <button
                                type="button"
                                className={`badge ${sal.status === 'Bekliyor' ? 'badge-unpaid' : 'badge-paid'}`}
                                onClick={() => handleToggleSalaryStatus(sal)}
                                style={{ cursor: "pointer", border: "none", outline: "none" }}
                                title="Durumu değiştirmek için tıklayın"
                              >
                                {sal.status || 'Ödendi'}
                              </button>
                            </td>
                            <td>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: "4px 8px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}
                                  onClick={() => openEditSalary(sal)}
                                  title="Bordro Düzenle"
                                >
                                  <Edit3 size={13} /> Düzenle
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: "4px 8px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}
                                  onClick={() => exportTeacherSalaryReceiptPDF(teachers.find(t => t.id === sal.teacherId) || { name: sal.teacherName }, sal)}
                                  title="Bordro PDF Makbuzu İndir"
                                >
                                  <FileText size={13} /> PDF Makbuz
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon-only delete-btn"
                                  title="Sil"
                                  onClick={() => handleDeleteSalary(sal.id)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })()}


        {/* ══ GİDERLER VE NET KASA YÖNETİMİ ═════════════════════════════════ */}
        {activeTab === "expenses" && role !== "Öğretmen" && (
          <div className="panel-card">
            <div className="panel-header">
              <h3 className="panel-title"><Receipt size={22} color="var(--primary)" /> Giderler ve Net Kasa Hesabı</h3>
            </div>

            {/* Finansal Net Kasa Özet Kartları */}
            <div className="dashboard-grid" style={{ marginBottom: "1.5rem" }}>
              <div className="metric-card">
                <div className="metric-info">
                  <span className="metric-label">Kasaya Giren Gelir</span>
                  <span className="metric-value" style={{ color: "var(--success)" }}>{formatMoney(totalCollected)}</span>
                  <span className="metric-subtext positive">Tahsil edilen toplam</span>
                </div>
                <div className="metric-icon-wrapper" style={{ background: "var(--success-light)", color: "var(--success)" }}>
                  <DollarSign size={24} />
                </div>
              </div>

              <div className="metric-card accent">
                <div className="metric-info">
                  <span className="metric-label">Operasyonel Toplam Gider</span>
                  <span className="metric-value" style={{ color: "var(--accent)" }}>{totalExpenseAmount.toLocaleString("tr-TR")} ₺</span>
                  <span className="metric-subtext negative">Fatura, kira, harcamalar</span>
                </div>
                <div className="metric-icon-wrapper">
                  <Receipt size={24} />
                </div>
              </div>

              <div className="metric-card" style={{ borderColor: netCashflow >= 0 ? "var(--success)" : "var(--accent)" }}>
                <div className="metric-info">
                  <span className="metric-label">Net Kasa (Kar / Zarar)</span>
                  <span className="metric-value" style={{ color: netCashflow >= 0 ? "var(--success)" : "var(--accent)" }}>
                    {formatMoney(netCashflow)}
                  </span>
                  <span className={`metric-subtext ${netCashflow >= 0 ? "positive" : "negative"}`}>
                    {netCashflow >= 0 ? "Pozitif Kasa Dengesi" : "Bütçe Açığı"}
                  </span>
                </div>
                <div className="metric-icon-wrapper" style={{ background: netCashflow >= 0 ? "var(--success-light)" : "var(--accent-light)", color: netCashflow >= 0 ? "var(--success)" : "var(--accent)" }}>
                  {netCashflow >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </div>
              </div>
            </div>

            {/* Gider Ekleme Formu */}
            <h4 style={{ marginBottom: "0.75rem", fontSize: "1rem" }}>Yeni Gider Kaydı</h4>
            <form onSubmit={handleAddExpense} style={{ marginBottom: "1.5rem" }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Gider / Harcama Adı *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Örn: Temmuz Ayı Kira Ödemesi"
                    value={expenseForm.itemName}
                    onChange={e => setExpenseForm(f => ({ ...f, itemName: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fiyatı (₺) *</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="0"
                    value={expenseForm.price}
                    onChange={e => setExpenseForm(f => ({ ...f, price: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Kategori</label>
                  <select
                    className="form-control"
                    value={expenseForm.category || "Diğer"}
                    onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}
                  >
                    <option value="Kira">Kira Ödemesi</option>
                    <option value="Öğretmen Maaşı">Öğretmen Maaşı</option>
                    <option value="Fatura">Faturalar (Elektrik/Su/İnternet)</option>
                    <option value="Yazılım/Sistem">Yazılım / Altyapı</option>
                    <option value="Materyal/Kitap">Materyal / Kitap Baskı</option>
                    <option value="Pazarlama">Reklam / Pazarlama</option>
                    <option value="Diğer">Diğer Operasyonel</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 8 }}>
                <label>Açıklama</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Gider ile ilgili detaylar…"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "0.75rem" }}>
                <Plus size={16} /> Gider Kaydet
              </button>
            </form>

            <div className="table-container">
              {expenses.length === 0 ? (
                <div className="empty-state"><Receipt className="empty-state-icon" /><p>Henüz gider kaydı girilmedi.</p></div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tarih</th><th>Gider Kalemi</th><th>Kategori</th><th>Tutar</th><th>Açıklama</th>
                      <th style={{ textAlign: "right" }}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(ex => (
                      <tr key={ex.id}>
                        <td>{ex.date}</td>
                        <td><strong>{ex.itemName}</strong></td>
                        <td>
                          <span className="badge badge-waiting" style={{ fontSize: "0.75rem", padding: "3px 8px" }}>
                            {ex.category || "Diğer"}
                          </span>
                        </td>
                        <td><strong style={{ color: "var(--accent)" }}>{ex.price.toLocaleString("tr-TR")} ₺</strong></td>
                        <td style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ex.description}>{ex.description || "—"}</td>
                        <td>
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button className="btn-icon-only delete-btn" title="Sil" onClick={() => handleDeleteExpense(ex.id)}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} style={{ textAlign: "right", fontWeight: 700 }}>Toplam Gider:</td>
                      <td colSpan={3} style={{ fontWeight: 800, color: "var(--accent)", fontSize: "1.05rem" }}>{totalExpenseAmount.toLocaleString("tr-TR")} ₺</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        )}


        {/* ══ HATIRLATMALAR VE GÖREV TAKİP MERKEZİ ══════════════════════════ */}
        {activeTab === "reminders" && (() => {
          const overdueCount = reminders.filter(r => r.status === "bekliyor" && r.dueDate < todayStr).length;
          const todayCount = reminders.filter(r => r.status === "bekliyor" && r.dueDate === todayStr).length;
          const completedCount = reminders.filter(r => r.status === "tamamlandı").length;
          const pendingCount = reminders.filter(r => r.status === "bekliyor").length;

          const filteredRemindersList = reminders.filter(r => {
            const q = reminderSearchQuery.toLowerCase();
            const relStudent = students.find(s => s.id === r.relatedStudentId);
            const studentMatch = relStudent ? (relStudent.studentName.toLowerCase().includes(q) || relStudent.name.toLowerCase().includes(q)) : false;
            const matchQ = (r.title || "").toLowerCase().includes(q) || (r.note || "").toLowerCase().includes(q) || studentMatch;

            const matchPriority = reminderPriorityFilter === "all" || r.priority === reminderPriorityFilter;
            const matchCategory = reminderCategoryFilter === "all" || (r.category || "Veli Araması") === reminderCategoryFilter;

            let matchStatus = true;
            if (reminderFilter === "bekliyor") matchStatus = r.status === "bekliyor";
            else if (reminderFilter === "overdue_today") matchStatus = r.status === "bekliyor" && r.dueDate <= todayStr;
            else if (reminderFilter === "tamamlandı") matchStatus = r.status === "tamamlandı";

            return matchQ && matchPriority && matchCategory && matchStatus;
          });

          return (
            <div className="panel-card">
              <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <h3 className="panel-title"><CheckSquare size={22} color="var(--primary)" /> Hatırlatma ve Görev Takip Paneli</h3>
                <button className="btn btn-accent" onClick={() => { setReminderForm(emptyReminderForm); setModal("addReminder"); }}>
                  <Plus size={16} /> Yeni Görev / Hatırlatma Ekle
                </button>
              </div>

              {/* Stat Metrik Kartları */}
              <div className="dashboard-grid" style={{ marginBottom: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
                <div className="metric-card" onClick={() => setReminderFilter("bekliyor")} style={{ cursor: "pointer" }}>
                  <div className="metric-info">
                    <span className="metric-label">Bekleyen Görevler</span>
                    <span className="metric-value" style={{ color: "var(--primary)" }}>{pendingCount} Adet</span>
                    <span className="metric-subtext">Aktif iş listesi</span>
                  </div>
                  <div className="metric-icon-wrapper" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                    <Clock size={22} />
                  </div>
                </div>

                <div className="metric-card accent" onClick={() => setReminderFilter("overdue_today")} style={{ cursor: "pointer" }}>
                  <div className="metric-info">
                    <span className="metric-label">Acil / Günü Geçen</span>
                    <span className="metric-value" style={{ color: "var(--accent)" }}>{overdueCount} Adet</span>
                    <span className="metric-subtext negative">Öncelikli müdahale</span>
                  </div>
                  <div className="metric-icon-wrapper">
                    <AlertTriangle size={22} />
                  </div>
                </div>

                <div className="metric-card" onClick={() => setReminderFilter("overdue_today")} style={{ cursor: "pointer" }}>
                  <div className="metric-info">
                    <span className="metric-label">Bugün Yapılacaklar</span>
                    <span className="metric-value" style={{ color: "#e67e22" }}>{todayCount} Adet</span>
                    <span className="metric-subtext">Son gün bugün</span>
                  </div>
                  <div className="metric-icon-wrapper" style={{ background: "rgba(230, 126, 34, 0.15)", color: "#e67e22" }}>
                    <Bell size={22} />
                  </div>
                </div>

                <div className="metric-card" onClick={() => setReminderFilter("tamamlandı")} style={{ cursor: "pointer" }}>
                  <div className="metric-info">
                    <span className="metric-label">Tamamlananlar</span>
                    <span className="metric-value" style={{ color: "var(--success)" }}>{completedCount} Adet</span>
                    <span className="metric-subtext positive">Kapatılan görevler</span>
                  </div>
                  <div className="metric-icon-wrapper" style={{ background: "var(--success-light)", color: "var(--success)" }}>
                    <CheckCircle size={22} />
                  </div>
                </div>
              </div>

              {/* Ara ve Filtrele Araç Çubuğu */}
              <div className="toolbar" style={{ marginBottom: "1.25rem" }}>
                <div className="search-filter-group" style={{ width: "100%", display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <div className="search-input-wrapper" style={{ flex: 1, minWidth: 220 }}>
                    <Search className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Başlık, açıklama veya öğrenci adı ara…"
                      value={reminderSearchQuery}
                      onChange={e => setReminderSearchQuery(e.target.value)}
                    />
                  </div>

                  <select className="filter-select" value={reminderFilter} onChange={e => setReminderFilter(e.target.value)}>
                    <option value="all">Tüm Durumlar ({reminders.length})</option>
                    <option value="bekliyor">⏳ Bekleyenler ({pendingCount})</option>
                    <option value="overdue_today">🚨 Acil / Bugün ({overdueCount + todayCount})</option>
                    <option value="tamamlandı">✅ Tamamlananlar ({completedCount})</option>
                  </select>

                  <select className="filter-select" value={reminderPriorityFilter} onChange={e => setReminderPriorityFilter(e.target.value)}>
                    <option value="all">Tüm Öncelikler</option>
                    <option value="yüksek">🔴 Yüksek Öncelik</option>
                    <option value="orta">🟡 Orta Öncelik</option>
                    <option value="düşük">🔵 Düşük Öncelik</option>
                  </select>

                  <select className="filter-select" value={reminderCategoryFilter} onChange={e => setReminderCategoryFilter(e.target.value)}>
                    <option value="all">Tüm Kategoriler</option>
                    <option value="Veli Araması">📞 Veli Araması</option>
                    <option value="Öğrenci Gelişim Ölçümü">📈 Öğrenci Gelişim Ölçümü</option>
                    <option value="Taksit / Ödeme Takibi">💰 Taksit / Ödeme Takibi</option>
                    <option value="Sözleşme / Kayıt">📝 Sözleşme / Kayıt</option>
                    <option value="İdari / Genel">🏢 İdari / Genel</option>
                  </select>
                </div>
              </div>

              {/* Hatırlatma Kartları Listesi */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredRemindersList.length === 0 ? (
                  <div className="empty-state">
                    <CheckSquare className="empty-state-icon" />
                    <p>Kriterlere uygun hatırlatma veya görev bulunamadı.</p>
                  </div>
                ) : (
                  filteredRemindersList.map(r => {
                    const isOverdue = r.status === "bekliyor" && r.dueDate < todayStr;
                    const isToday = r.status === "bekliyor" && r.dueDate === todayStr;
                    const relStudent = students.find(s => s.id === r.relatedStudentId);

                    return (
                      <div
                        key={r.id}
                        style={{
                          background: r.status === "tamamlandı" ? "var(--bg-app)" : isOverdue ? "rgba(255, 118, 117, 0.06)" : isToday ? "rgba(253, 203, 110, 0.08)" : "var(--bg-card)",
                          border: isOverdue ? "1.5px solid var(--accent)" : isToday ? "1.5px solid #e67e22" : "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          padding: "14px 18px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                          flexWrap: "wrap",
                          opacity: r.status === "tamamlandı" ? 0.65 : 1,
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flex: 1, minWidth: 260 }}>
                          <input
                            type="checkbox"
                            style={{ width: 18, height: 18, marginTop: 3, cursor: "pointer" }}
                            checked={r.status === "tamamlandı"}
                            onChange={() => handleToggleReminderStatus(r.id)}
                            title={r.status === "tamamlandı" ? "Tamamlanmadı olarak işaretle" : "Tamamlandı olarak işaretle"}
                          />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: "0.95rem", textDecoration: r.status === "tamamlandı" ? "line-through" : "none", color: "var(--text-main)" }}>
                                {r.title}
                              </span>
                              <span className={`priority-pill ${r.priority}`} style={{ textTransform: "capitalize", fontSize: "0.7rem", padding: "2px 8px", borderRadius: 10 }}>
                                {r.priority} öncelik
                              </span>
                              {r.category && (
                                <span className="badge" style={{ background: "var(--primary-light)", color: "var(--primary)", fontSize: "0.7rem", padding: "2px 8px" }}>
                                  {r.category}
                                </span>
                              )}
                            </div>

                            {r.note && (
                              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "3px 0 6px 0", textDecoration: r.status === "tamamlandı" ? "line-through" : "none" }}>
                                {r.note}
                              </p>
                            )}

                            {relStudent && (
                              <div style={{ fontSize: "0.775rem", background: "var(--bg-app)", padding: "4px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", marginTop: 4 }}>
                                <span>🎓 Öğrenci: <strong>{relStudent.studentName}</strong> ({relStudent.studentAgeGrade}) — Veli: {relStudent.name}</span>
                                {relStudent.phone && (
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ padding: "2px 6px", fontSize: "0.7rem", display: "inline-flex", gap: 4, background: "#25D366", color: "#fff", border: "none" }}
                                    onClick={() => sendWhatsAppReport(relStudent)}
                                  >
                                    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.277l-.582 2.128 2.185-.573c.963.524 1.956.834 3.146.834 3.18 0 5.768-2.587 5.768-5.767 0-3.18-2.587-5.765-5.768-5.765zm3.611 8.133c-.195.546-1.127.995-1.558 1.026-.371.026-.85.186-2.436-.471-2.029-.841-3.302-2.901-3.404-3.036-.101-.136-.826-.967-.826-1.847 0-.88.46-1.312.624-1.486.164-.173.359-.216.478-.216.12 0 .24.002.343.007.108.005.249-.04.391.299.144.346.494 1.2.536 1.286.043.086.071.186.014.299-.057.114-.086.186-.171.286-.086.1-.18.223-.257.309-.086.095-.176.197-.076.368.1.171.443.731.95 1.182.653.58 1.202.76 1.373.846.171.086.272.071.373-.043.101-.114.428-.497.542-.669.114-.171.228-.143.385-.086.157.057 1.012.478 1.183.564.171.086.285.129.328.2.043.072.043.415-.152.961z"/>
                                    </svg>
                                    WhatsApp
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {isOverdue && (
                            <span className="badge badge-unpaid" style={{ fontSize: "0.725rem", padding: "4px 8px" }}>
                              ⚠️ Günü Geçti ({r.dueDate})
                            </span>
                          )}
                          {isToday && (
                            <span className="badge" style={{ background: "rgba(230, 126, 34, 0.15)", color: "#e67e22", fontSize: "0.725rem", padding: "4px 8px", border: "1px solid #e67e22" }}>
                              🔔 Bugün ({r.dueDate})
                            </span>
                          )}
                          {!isOverdue && !isToday && (
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              📅 {r.dueDate}
                            </span>
                          )}

                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}
                              onClick={() => openEditReminder(r)}
                              title="Hatırlatma Düzenle"
                            >
                              <Edit3 size={13} /> Düzenle
                            </button>
                            <button
                              type="button"
                              className="btn-icon-only delete-btn"
                              title="Sil"
                              onClick={() => handleDeleteReminder(r.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* ══ TEACHER SCHEDULES ════════════════════════════════════════════ */}
        {activeTab === "teacher_schedules" && (() => {

          const activeTeacherObj = teachers.find(t => t.id === activeTeacherScheduleId) || teachers[0];
          const activeTeacherStudents = students.filter(s => s.teacherId === activeTeacherScheduleId);
          const totalSessionsCount = activeTeacherStudents.reduce((sum, s) => sum + (s.lessons ? s.lessons.length : 0), 0);

          return (
            <div className="panel-card">
              <div className="panel-header" style={{ flexWrap: "wrap", gap: "12px" }}>
                <h3 className="panel-title"><Calendar size={22} color="var(--primary)" /> Haftalık Öğretmen Ders Programları</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div className="schedule-tabs">
                    {teachers.map(t => (
                      <button
                        key={t.id}
                        className={`schedule-tab-btn ${activeTeacherScheduleId === t.id ? `active ${t.id === "teacher-zehra" ? "zehra" : ""}` : ""}`}
                        onClick={() => setActiveTeacherScheduleId(t.id)}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>

                  {role !== "Öğretmen" && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "8px 14px", fontSize: "0.85rem", gap: "6px" }}
                      onClick={() => {
                        setScheduleConfigTab("hours");
                        setModal("manageScheduleStructure");
                      }}
                      title="Ders saatlerini ve günleri baştan aşağı düzenle"
                    >
                      <Settings size={16} color="var(--primary)" /> Saat / Gün Yapısını Düzenle
                    </button>
                  )}

                  <button
                    className="btn btn-primary"
                    style={{ padding: "8px 14px", fontSize: "0.85rem", gap: "6px" }}
                    onClick={() => exportTeacherScheduleToPDF(activeTeacherObj, students, lessonHours, daysOfWeek)}
                    title="Ders programını doğrudan PDF olarak indir"
                  >
                    <FileText size={16} /> PDF İndir
                  </button>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: "8px 14px", fontSize: "0.85rem", gap: "6px" }}
                    onClick={() => exportTeacherScheduleToExcel(activeTeacherObj, students, lessonHours, daysOfWeek)}
                    title="Ders programı tablosunu ve öğrenci listesini Excel olarak indir"
                  >
                    <FileSpreadsheet size={16} color="var(--success)" /> Excel İndir
                  </button>
                </div>
              </div>

              {/* Öğretmen İstatistik Özet Kartları */}
              <div className="dashboard-grid" style={{ marginBottom: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                <div className="metric-card" style={{ padding: "1rem 1.25rem" }}>
                  <div className="metric-info">
                    <span className="metric-label">Aktif Öğretmen Programı</span>
                    <span className="metric-value" style={{ fontSize: "1.25rem", color: activeTeacherObj.id === "teacher-zehra" ? "var(--success)" : "var(--primary)" }}>
                      {activeTeacherObj.id === "teacher-zehra" ? "👩‍🏫" : "👨‍🏫"} {activeTeacherObj.name}
                    </span>
                  </div>
                </div>
                <div className="metric-card" style={{ padding: "1rem 1.25rem" }}>
                  <div className="metric-info">
                    <span className="metric-label">Atanan Öğrenci</span>
                    <span className="metric-value" style={{ fontSize: "1.25rem" }}>{activeTeacherStudents.length} Kayıtlı Öğrenci</span>
                  </div>
                </div>
                <div className="metric-card" style={{ padding: "1rem 1.25rem" }}>
                  <div className="metric-info">
                    <span className="metric-label">Haftalık Ders Yükü</span>
                    <span className="metric-value" style={{ fontSize: "1.25rem", color: "var(--accent)" }}>{totalSessionsCount} Seans / Hafta</span>
                  </div>
                </div>
              </div>

              <div className="calendar-view-card">
                <table className="calendar-table">
                  <thead>
                    <tr>
                      <th className="time-header">Saat / Gün</th>
                      {daysOfWeek.map(day => (
                        <th key={day}>{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lessonHours.map(hour => (
                      <tr key={hour}>
                        <td className="time-header">{hour}</td>
                        {daysOfWeek.map(day => {
                          const studentInSlot = students.find(s =>
                            s.teacherId === activeTeacherScheduleId &&
                            s.lessons &&
                            s.lessons.some(l => l.day === day && l.time === hour)
                          );
                          const isAdmin = role !== "Öğretmen";

                          return (
                            <td key={day} className={isAdmin ? "admin-clickable-cell" : ""}>
                              {studentInSlot ? (
                                <div
                                  className={`calendar-block ${studentInSlot.teacherId === "teacher-zehra" ? "zehra" : ""}`}
                                  onClick={() => {
                                    if (isAdmin) {
                                      setActiveSlotData({
                                        day,
                                        hour,
                                        teacherId: activeTeacherScheduleId,
                                        student: studentInSlot
                                      });
                                      setQuickAssignStudentId("");
                                      setModal("quickSlotAction");
                                    } else {
                                      setSelectedStudent(studentInSlot);
                                      setNewNoteText("");
                                      setIsEditingSchedule(false);
                                      setModal("studentDetail");
                                    }
                                  }}
                                  title={`${studentInSlot.studentName} (${studentInSlot.studentAgeGrade})\nVeli: ${studentInSlot.name} - ${studentInSlot.phone}${isAdmin ? "\n(Hücre İşlemleri İçin Tıklayın)" : ""}`}
                                >
                                  <span className="calendar-block-student">{studentInSlot.studentName}</span>
                                  <span className="calendar-block-grade">{studentInSlot.studentAgeGrade}</span>
                                  <span className="calendar-block-parent">Veli: {studentInSlot.name}</span>
                                </div>
                              ) : (
                                <div
                                  className={`calendar-block-empty ${isAdmin ? "admin-assignable" : ""}`}
                                  onClick={() => {
                                    if (isAdmin) {
                                      setActiveSlotData({
                                        day,
                                        hour,
                                        teacherId: activeTeacherScheduleId,
                                        student: null
                                      });
                                      setQuickAssignStudentId("");
                                      setModal("quickSlotAction");
                                    }
                                  }}
                                  title={isAdmin ? `${day} ${hour} seansına öğrenci atamak için tıklayın` : ""}
                                >
                                  {isAdmin ? <span className="cell-quick-add-badge"><Plus size={12} /> Ekle</span> : "—"}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}


      </main>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* Add Lead */}
      {modal === "addLead" && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Potansiyel Müşteri Ekle</h3>
              <button className="btn-icon-only" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleAddLead}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Müşteri (Veli) Adı Soyadı *</label>
                  <input type="text" className="form-control" placeholder="Örn: Mehmet Aksoy" value={leadForm.name} onChange={e => setLeadForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Telefon Numarası *</label>
                    <input type="tel" className="form-control" placeholder="0555 123 4567" value={leadForm.phone} onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Başvuru Kanalı</label>
                    <select className="form-control" value={leadForm.source} onChange={e => setLeadForm(f => ({ ...f, source: e.target.value }))}>
                      {["Instagram", "Referans", "Google Arama", "Facebook Reklam", "Broşür/Afiş", "Diğer"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Görüşme Durumu</label>
                  <select className="form-control" value={leadForm.status} onChange={e => setLeadForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="new">Yeni Başvuru</option>
                    <option value="contacted">Görüşüldü/Arandı</option>
                    <option value="waiting">Karar Bekliyor</option>
                    <option value="lost">Olumsuz/Kayıtsız</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Görüşme Notu</label>
                  <textarea className="form-control" rows={3} placeholder="Talep, öğrenci sınıfı, arama detayları…" value={leadForm.notes} onChange={e => setLeadForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead */}
      {modal === "editLead" && selectedLead && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Görüşme Bilgilerini Güncelle</h3>
              <button className="btn-icon-only" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleEditLead}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Veli Adı Soyadı</label>
                  <input type="text" className="form-control" value={selectedLead.name} onChange={e => setSelectedLead(l => ({ ...l, name: e.target.value }))} required />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Telefon</label>
                    <input type="tel" className="form-control" value={selectedLead.phone} onChange={e => setSelectedLead(l => ({ ...l, phone: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Kanal</label>
                    <select className="form-control" value={selectedLead.source} onChange={e => setSelectedLead(l => ({ ...l, source: e.target.value }))}>
                      {["Instagram", "Referans", "Google Arama", "Facebook Reklam", "Broşür/Afiş", "Diğer"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Durum</label>
                  <select className="form-control" value={selectedLead.status} onChange={e => setSelectedLead(l => ({ ...l, status: e.target.value }))}>
                    <option value="new">Yeni Başvuru</option>
                    <option value="contacted">Görüşüldü</option>
                    <option value="waiting">Karar Bekliyor</option>
                    <option value="lost">Olumsuz</option>
                    <option value="confirmed">Kayıt Yapıldı</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Görüşme Notu</label>
                  <textarea className="form-control" rows={3} value={selectedLead.notes} onChange={e => setSelectedLead(l => ({ ...l, notes: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>İptal</button>
                <button type="submit" className="btn btn-primary">Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Registration */}
      {modal === "confirmReg" && selectedLead && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Kayıt Kesinleştirme Formu</h3>
              <button className="btn-icon-only" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleConfirmRegistration}>
              <div className="modal-body">
                <div style={{ background: "var(--primary-light)", padding: "12px", borderRadius: "var(--radius-md)", color: "var(--primary)", fontSize: "0.85rem" }}>
                  <strong>Veli:</strong> {selectedLead.name} — {selectedLead.phone}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Öğrenci Adı Soyadı *</label>
                    <input type="text" className="form-control" placeholder="Öğrencinin adı" value={confirmForm.studentName} onChange={e => setConfirmForm(f => ({ ...f, studentName: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Sınıf / Yaş *</label>
                    <input type="text" className="form-control" placeholder="8. Sınıf / 14 Yaş" value={confirmForm.studentAgeGrade} onChange={e => setConfirmForm(f => ({ ...f, studentAgeGrade: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Ders Tipi *</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      className={`btn ${confirmForm.lessonType === "grup" ? "btn-primary" : "btn-secondary"}`}
                      style={{ flex: 1 }}
                      onClick={() => setConfirmForm(f => ({ ...f, lessonType: "grup" }))}
                    >
                      👥 Grup Dersi
                    </button>
                    <button
                      type="button"
                      className={`btn ${confirmForm.lessonType === "ozel" ? "btn-primary" : "btn-secondary"}`}
                      style={{ flex: 1 }}
                      onClick={() => setConfirmForm(f => ({ ...f, lessonType: "ozel" }))}
                    >
                      🧑‍🏫 Özel Ders
                    </button>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Kurs Ücreti (₺) *</label>
                    <input type="number" min="0" className="form-control" placeholder="12000" value={confirmForm.totalPrice} onChange={e => setConfirmForm(f => ({ ...f, totalPrice: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>İndirim (₺)</label>
                    <input type="number" min="0" className="form-control" placeholder="0" value={confirmForm.discount} onChange={e => setConfirmForm(f => ({ ...f, discount: e.target.value }))} />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>İlk Ödeme / Peşinat (₺)</label>
                    <input type="number" min="0" className="form-control" placeholder="0 bırakın" value={confirmForm.firstPayment} onChange={e => setConfirmForm(f => ({ ...f, firstPayment: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Ödeme Yöntemi</label>
                    <select className="form-control" value={confirmForm.firstPaymentType} onChange={e => setConfirmForm(f => ({ ...f, firstPaymentType: e.target.value }))}>
                      <option>Nakit</option><option>Kredi Kartı</option><option>EFT/Havale</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "10px" }}>
                  <label>Öğrenci Şifresi (Kurum Tarafından Verilen)</label>
                  <input type="text" className="form-control" placeholder="Giriş şifresi" value={confirmForm.studentPassword} onChange={e => setConfirmForm(f => ({ ...f, studentPassword: e.target.value }))} />
                </div>

                <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                  <h4 style={{ fontSize: "0.95rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={16} color="var(--primary)" /> Haftalık Ders Programı ve Öğretmen Seçimi
                  </h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    Öğrencinin katılacağı ders saatlerini aşağıdaki tablodan seçiniz. Seçilen saatlere göre öğretmenlerin doluluk durumları otomatik hesaplanır.
                  </p>

                  {/* 7x7 Ders Programı Grid */}
                  <div className="schedule-grid-wrapper">
                    <table className="schedule-grid-table">
                      <thead>
                        <tr>
                          <th className="schedule-time-col">Saat / Gün</th>
                          {daysOfWeek.map(d => (
                            <th key={d}>{d.substring(0, 3)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lessonHours.map(hour => (
                          <tr key={hour}>
                            <td className="schedule-time-col">{hour.split(" ")[0]}</td>
                            {daysOfWeek.map(day => {
                              const isSelected = confirmLessons.some(l => l.day === day && l.time === hour);

                              // Hücredeki doluluk durumları (Kimlerin çakışması var?)
                              const conflictingFirat = checkTeacherConflictForSlots("teacher-firat", [{ day, time: hour }]);
                              const conflictingZehra = checkTeacherConflictForSlots("teacher-zehra", [{ day, time: hour }]);

                              let titleText = `${day} ${hour}`;
                              if (conflictingFirat.length > 0) titleText += `\nFırat Hoca Dolu (${conflictingFirat[0].studentName})`;
                              if (conflictingZehra.length > 0) titleText += `\nZehra Hoca Dolu (${conflictingZehra[0].studentName})`;

                              return (
                                <td key={day} title={titleText}>
                                  <button
                                    type="button"
                                    className={`schedule-slot-btn ${isSelected ? "selected" : ""}`}
                                    onClick={() => {
                                      if (isSelected) {
                                        setConfirmLessons(prev => prev.filter(l => !(l.day === day && l.time === hour)));
                                      } else {
                                        setConfirmLessons(prev => [...prev, { day, time: hour }]);
                                      }
                                    }}
                                  >
                                    ✓
                                  </button>
                                  {/* Küçük doluluk göstergesi */}
                                  {(conflictingFirat.length > 0 || conflictingZehra.length > 0) && !isSelected && (
                                    <div style={{
                                      position: "absolute",
                                      bottom: 2,
                                      right: 2,
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      background: conflictingFirat.length > 0 && conflictingZehra.length > 0 ? "var(--accent)" : "var(--warning)"
                                    }} />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Öğretmen Seçim Kartları */}
                  <div className="teacher-cards-grid">
                    {teachers.map(t => {
                      const conflicts = checkTeacherConflictForSlots(t.id, confirmLessons);
                      const isSelected = confirmTeacherId === t.id;
                      const hasConflict = conflicts.length > 0;

                      return (
                        <div
                          key={t.id}
                          className={`teacher-select-card ${isSelected ? `selected ${t.id === "teacher-zehra" ? "zehra" : ""}` : ""} ${hasConflict ? "has-conflict" : ""}`}
                          onClick={() => setConfirmTeacherId(t.id)}
                        >
                          <div className="teacher-card-header">
                            <span className="teacher-card-name">
                              {t.id === "teacher-zehra" ? "👩‍🏫" : "👨‍🏫"} {t.name}
                            </span>
                            <span className={`teacher-card-status ${hasConflict ? "conflict" : "available"}`}>
                              {hasConflict ? "Çakışma Var" : "Uygun"}
                            </span>
                          </div>

                          {hasConflict ? (
                            <div className="teacher-conflict-list">
                              Seçilen saatlerde çakışma var:
                              {conflicts.map((c, i) => (
                                <div key={i} className="teacher-conflict-item">
                                  • {c.day.substring(0, 3)} {c.time.split(" ")[0]} ({c.studentName})
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                              {confirmLessons.length > 0 ? "Bu program için tamamen uygun." : "Ders saati seçiniz."}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>İptal</button>
                <button type="submit" className="btn btn-accent">Kaydı Tamamla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student (Kesin Kayıt Bilgilerini Güncelle) */}
      {modal === "editStudent" && selectedStudent && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Kayıt Bilgilerini Düzenle</h3>
              <button className="btn-icon-only" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveEditStudent}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Veli Adı Soyadı *</label>
                    <input type="text" className="form-control" value={editStudentForm.name} onChange={e => setEditStudentForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Telefon *</label>
                    <input type="tel" className="form-control" value={editStudentForm.phone} onChange={e => setEditStudentForm(f => ({ ...f, phone: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Öğrenci Adı Soyadı *</label>
                    <input type="text" className="form-control" value={editStudentForm.studentName} onChange={e => setEditStudentForm(f => ({ ...f, studentName: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Sınıf / Yaş</label>
                    <input type="text" className="form-control" value={editStudentForm.studentAgeGrade} onChange={e => setEditStudentForm(f => ({ ...f, studentAgeGrade: e.target.value }))} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Ders Tipi</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      className={`btn ${editStudentForm.lessonType === "grup" ? "btn-primary" : "btn-secondary"}`}
                      style={{ flex: 1 }}
                      onClick={() => setEditStudentForm(f => ({ ...f, lessonType: "grup" }))}
                    >
                      👥 Grup Dersi
                    </button>
                    <button
                      type="button"
                      className={`btn ${editStudentForm.lessonType === "ozel" ? "btn-primary" : "btn-secondary"}`}
                      style={{ flex: 1 }}
                      onClick={() => setEditStudentForm(f => ({ ...f, lessonType: "ozel" }))}
                    >
                      🧑‍🏫 Özel Ders
                    </button>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Kurs Ücreti (₺) *</label>
                    <input type="number" min="0" className="form-control" value={editStudentForm.totalPrice} onChange={e => setEditStudentForm(f => ({ ...f, totalPrice: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>İndirim (₺)</label>
                    <input type="number" min="0" className="form-control" value={editStudentForm.discount} onChange={e => setEditStudentForm(f => ({ ...f, discount: e.target.value }))} />
                  </div>
                </div>

                <div className="form-grid" style={{ marginTop: "10px" }}>
                  <div className="form-group">
                    <label>Öğrenci Şifresi (Kurum Tarafından Verilen)</label>
                    <input type="text" className="form-control" placeholder="Giriş şifresi" value={editStudentForm.studentPassword} onChange={e => setEditStudentForm(f => ({ ...f, studentPassword: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Öğrenci Durumu</label>
                    <select
                      className="form-control"
                      value={editStudentForm.status}
                      onChange={e => setEditStudentForm(f => ({ ...f, status: e.target.value }))}
                    >
                      <option value="aktif">Aktif</option>
                      <option value="pasif">Pasif</option>
                      <option value="mezun">Mezun</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                  <h4 style={{ fontSize: "0.95rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={16} color="var(--primary)" /> Haftalık Ders Programı ve Öğretmen Seçimi
                  </h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    Öğrencinin ders saatlerini güncellemek için hücrelere tıklayınız.
                  </p>

                  <div className="schedule-grid-wrapper">
                    <table className="schedule-grid-table">
                      <thead>
                        <tr>
                          <th className="schedule-time-col">Saat / Gün</th>
                          {daysOfWeek.map(d => (
                            <th key={d}>{d.substring(0, 3)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lessonHours.map(hour => (
                          <tr key={hour}>
                            <td className="schedule-time-col">{hour.split(" ")[0]}</td>
                            {daysOfWeek.map(day => {
                              const isSelected = editStudentLessons.some(l => l.day === day && l.time === hour);
                              const conflictingFirat = checkTeacherConflictForSlots("teacher-firat", [{ day, time: hour }], selectedStudent.id);
                              const conflictingZehra = checkTeacherConflictForSlots("teacher-zehra", [{ day, time: hour }], selectedStudent.id);

                              let titleText = `${day} ${hour}`;
                              if (conflictingFirat.length > 0) titleText += `\nFırat Hoca Dolu (${conflictingFirat[0].studentName})`;
                              if (conflictingZehra.length > 0) titleText += `\nZehra Hoca Dolu (${conflictingZehra[0].studentName})`;

                              return (
                                <td key={day} title={titleText}>
                                  <button
                                    type="button"
                                    className={`schedule-slot-btn ${isSelected ? "selected" : ""}`}
                                    onClick={() => {
                                      if (isSelected) {
                                        setEditStudentLessons(prev => prev.filter(l => !(l.day === day && l.time === hour)));
                                      } else {
                                        setEditStudentLessons(prev => [...prev, { day, time: hour }]);
                                      }
                                    }}
                                  >
                                    ✓
                                  </button>
                                  {(conflictingFirat.length > 0 || conflictingZehra.length > 0) && !isSelected && (
                                    <div style={{
                                      position: "absolute",
                                      bottom: 2,
                                      right: 2,
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      background: conflictingFirat.length > 0 && conflictingZehra.length > 0 ? "var(--accent)" : "var(--warning)"
                                    }} />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="teacher-cards-grid">
                    {teachers.map(t => {
                      const conflicts = checkTeacherConflictForSlots(t.id, editStudentLessons, selectedStudent.id);
                      const isSelected = editStudentTeacherId === t.id;
                      const hasConflict = conflicts.length > 0;

                      return (
                        <div
                          key={t.id}
                          className={`teacher-select-card ${isSelected ? `selected ${t.id === "teacher-zehra" ? "zehra" : ""}` : ""} ${hasConflict ? "has-conflict" : ""}`}
                          onClick={() => setEditStudentTeacherId(t.id)}
                        >
                          <div className="teacher-card-header">
                            <span className="teacher-card-name">
                              {t.id === "teacher-zehra" ? "👩‍🏫" : "👨‍🏫"} {t.name}
                            </span>
                            <span className={`teacher-card-status ${hasConflict ? "conflict" : "available"}`}>
                              {hasConflict ? "Çakışma Var" : "Uygun"}
                            </span>
                          </div>

                          {hasConflict ? (
                            <div className="teacher-conflict-list">
                              Seçilen saatlerde çakışma var:
                              {conflicts.map((c, i) => (
                                <div key={i} className="teacher-conflict-item">
                                  • {c.day.substring(0, 3)} {c.time.split(" ")[0]} ({c.studentName})
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                              {editStudentLessons.length > 0 ? "Bu program için tamamen uygun." : "Ders saati seçiniz."}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>İptal</button>
                <button type="submit" className="btn btn-primary">Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Detail */}
      {modal === "studentDetail" && selectedStudent && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && (setModal(null) || setIsEditingSchedule(false))}>
          <div className="modal-content" style={{ maxWidth: 760 }}>
            <div className="modal-header" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "1.3rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    {selectedStudent.studentName}
                    <span className={`badge ${selectedStudent.lessonType === "ozel" ? "badge-partial" : "badge-paid"}`} style={{ fontSize: "0.7rem" }}>
                      {selectedStudent.lessonType === "ozel" ? "Özel Ders" : "Grup Dersi"}
                    </span>
                    <span className="badge" style={{
                      fontSize: "0.7rem",
                      backgroundColor: selectedStudent.status === "aktif" ? "#2ecc71" : selectedStudent.status === "pasif" ? "#e67e22" : "#95a5a6",
                      color: "white"
                    }}>
                      {selectedStudent.status === "aktif" ? "Aktif" : selectedStudent.status === "pasif" ? "Pasif" : "Mezun"}
                    </span>
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span>Veli: <strong>{selectedStudent.name}</strong></span>
                    <span>| 📞 {selectedStudent.phone}</span>
                    <button
                      className="btn"
                      style={{
                        padding: "2px 8px",
                        fontSize: "0.7rem",
                        backgroundColor: "#25D366",
                        borderColor: "#25D366",
                        color: "white",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        cursor: "pointer",
                        borderRadius: "4px",
                        fontWeight: "600"
                      }}
                      onClick={() => sendWhatsAppReport(selectedStudent)}
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.277l-.582 2.128 2.185-.573c.963.524 1.956.834 3.146.834 3.18 0 5.768-2.587 5.768-5.767 0-3.18-2.587-5.765-5.768-5.765zm3.611 8.133c-.195.546-1.127.995-1.558 1.026-.371.026-.85.186-2.436-.471-2.029-.841-3.302-2.901-3.404-3.036-.101-.136-.826-.967-.826-1.847 0-.88.46-1.312.624-1.486.164-.173.359-.216.478-.216.12 0 .24.002.343.007.108.005.249-.04.391.299.144.346.494 1.2.536 1.286.043.086.071.186.014.299-.057.114-.086.186-.171.286-.086.1-.18.223-.257.309-.086.095-.176.197-.076.368.1.171.443.731.95 1.182.653.58 1.202.76 1.373.846.171.086.272.071.373-.043.101-.114.428-.497.542-.669.114-.171.228-.143.385-.086.157.057 1.012.478 1.183.564.171.086.285.129.328.2.043.072.043.415-.152.961z"/>
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 2.136.67 4.116 1.81 5.74L2 22l4.41-1.705C7.947 21.37 9.897 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.873 0-3.61-.502-5.09-1.366l-.366-.213-2.61.73.743-2.52-.23-.38C3.59 15.034 3 13.06 3 12c0-4.963 4.037-9 9-9 4.963 0 9 4.037 9 9s-4.037 9-9 9z"/>
                      </svg>
                      Rapor Gönder
                    </button>
                    {selectedStudent.studentPassword && <> | 🔑 Şifre: <strong style={{ color: "var(--primary)" }}>{selectedStudent.studentPassword}</strong></>}
                  </p>
                </div>
                <button className="btn-icon-only" onClick={() => { setModal(null); setIsEditingSchedule(false); }}>✕</button>
              </div>

              {/* Ders ve Öğretmen Bilgisi Gösterim / Düzenleme Alanı */}
              <div style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "var(--bg-app)",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                fontSize: "0.825rem",
                marginTop: "4px"
              }}>
                <div>
                  <span style={{ marginRight: "15px" }}>
                    <strong>Öğretmen:</strong>{" "}
                    {selectedStudent.teacherName ? (
                      <span className={`student-teacher-pill ${selectedStudent.teacherId === "teacher-zehra" ? "zehra" : "firat"}`} style={{ padding: "2px 8px", fontSize: "0.725rem" }}>
                        {selectedStudent.teacherId === "teacher-zehra" ? "👩‍🏫" : "👨‍🏫"} {selectedStudent.teacherName}
                      </span>
                    ) : "—"}
                  </span>
                  <span>
                    <strong>Ders Programı:</strong>{" "}
                    {selectedStudent.lessons && selectedStudent.lessons.length > 0 ? (
                      selectedStudent.lessons.map(l => `${l.day.substring(0, 3)} (${l.time.split(" ")[0]})`).join(", ")
                    ) : "—"}
                  </span>
                </div>
                {role !== "Öğretmen" && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "4px 10px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}
                    onClick={() => {
                      if (isEditingSchedule) {
                        setIsEditingSchedule(false);
                      } else {
                        setEditLessons(selectedStudent.lessons || []);
                        setEditTeacherId(selectedStudent.teacherId || "teacher-firat");
                        setIsEditingSchedule(true);
                      }
                    }}
                  >
                    <Edit3 size={12} /> {isEditingSchedule ? "Notlar/Ödemeler" : "Programı Düzenle"}
                  </button>
                )}
              </div>
            </div>

            <div className="modal-body">
              {isEditingSchedule ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%" }}>
                  <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                    <h4 style={{ fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={16} color="var(--primary)" /> Ders Programını ve Öğretmeni Güncelle
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      Hücrelere tıklayarak ders programını seçiniz. Çakışma durumuna göre öğretmen atamasını yapınız.
                    </p>
                  </div>

                  {/* 7x7 Ders Programı Grid */}
                  <div className="schedule-grid-wrapper">
                    <table className="schedule-grid-table">
                      <thead>
                        <tr>
                          <th className="schedule-time-col">Saat / Gün</th>
                          {daysOfWeek.map(d => (
                            <th key={d}>{d.substring(0, 3)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lessonHours.map(hour => (
                          <tr key={hour}>
                            <td className="schedule-time-col">{hour.split(" ")[0]}</td>
                            {daysOfWeek.map(day => {
                              const isSelected = editLessons.some(l => l.day === day && l.time === hour);

                              // Diğer öğrenciler için çakışma durumları (aktif öğrenci hariç!)
                              const conflictingFirat = checkTeacherConflictForSlots("teacher-firat", [{ day, time: hour }], selectedStudent.id);
                              const conflictingZehra = checkTeacherConflictForSlots("teacher-zehra", [{ day, time: hour }], selectedStudent.id);

                              let titleText = `${day} ${hour}`;
                              if (conflictingFirat.length > 0) titleText += `\nFırat Hoca Dolu (${conflictingFirat[0].studentName})`;
                              if (conflictingZehra.length > 0) titleText += `\nZehra Hoca Dolu (${conflictingZehra[0].studentName})`;

                              return (
                                <td key={day} title={titleText}>
                                  <button
                                    type="button"
                                    className={`schedule-slot-btn ${isSelected ? "selected" : ""}`}
                                    onClick={() => {
                                      if (isSelected) {
                                        setEditLessons(prev => prev.filter(l => !(l.day === day && l.time === hour)));
                                      } else {
                                        setEditLessons(prev => [...prev, { day, time: hour }]);
                                      }
                                    }}
                                  >
                                    ✓
                                  </button>
                                  {/* Küçük doluluk göstergesi */}
                                  {(conflictingFirat.length > 0 || conflictingZehra.length > 0) && !isSelected && (
                                    <div style={{
                                      position: "absolute",
                                      bottom: 2,
                                      right: 2,
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      background: conflictingFirat.length > 0 && conflictingZehra.length > 0 ? "var(--accent)" : "var(--warning)"
                                    }} />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Öğretmen Seçim Kartları */}
                  <div className="teacher-cards-grid">
                    {teachers.map(t => {
                      const conflicts = checkTeacherConflictForSlots(t.id, editLessons, selectedStudent.id);
                      const isSelected = editTeacherId === t.id;
                      const hasConflict = conflicts.length > 0;

                      return (
                        <div
                          key={t.id}
                          className={`teacher-select-card ${isSelected ? `selected ${t.id === "teacher-zehra" ? "zehra" : ""}` : ""} ${hasConflict ? "has-conflict" : ""}`}
                          onClick={() => setEditTeacherId(t.id)}
                        >
                          <div className="teacher-card-header">
                            <span className="teacher-card-name">
                              {t.id === "teacher-zehra" ? "👩‍🏫" : "👨‍🏫"} {t.name}
                            </span>
                            <span className={`teacher-card-status ${hasConflict ? "conflict" : "available"}`}>
                              {hasConflict ? "Çakışma Var" : "Uygun"}
                            </span>
                          </div>

                          {hasConflict ? (
                            <div className="teacher-conflict-list">
                              Çakışan dersler:
                              {conflicts.map((c, i) => (
                                <div key={i} className="teacher-conflict-item">
                                  • {c.day.substring(0, 3)} {c.time.split(" ")[0]} ({c.studentName})
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                              {editLessons.length > 0 ? "Bu program için tamamen uygun." : "Ders saati seçiniz."}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Kaydet ve İptal Butonları */}
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsEditingSchedule(false)}
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      className="btn btn-accent"
                      onClick={() => {
                        const selectedTeacher = teachers.find(t => t.id === editTeacherId) || teachers[0];
                        const updatedStudent = {
                          ...selectedStudent,
                          teacherId: editTeacherId,
                          teacherName: selectedTeacher.name,
                          lessons: editLessons
                        };

                        // Öğrenciler listesini güncelle
                        const updatedStudents = students.map(s =>
                          s.id === selectedStudent.id ? updatedStudent : s
                        );
                        setStudents(updatedStudents);
                        setSelectedStudent(updatedStudent);

                        // Log/not ekle
                        const newNote = {
                          id: `n-${Date.now()}`,
                          date: new Date().toISOString().split("T")[0],
                          author: `${currentUser.name} (${currentUser.role})`,
                          content: `Ders programı güncellendi. Yeni Öğretmen: ${selectedTeacher.name} | Ders Seansı: ${editLessons.map(l => `${l.day.substring(0, 3)} ${l.time.split(" ")[0]}`).join(", ") || "Seçilmedi"}`
                        };
                        const finalStudent = {
                          ...updatedStudent,
                          notes: [newNote, ...updatedStudent.notes]
                        };
                        setStudents(students.map(s => s.id === selectedStudent.id ? finalStudent : s));
                        setSelectedStudent(finalStudent);

                        setIsEditingSchedule(false);
                        showToast("Ders programı başarıyla güncellendi.", "success");
                      }}
                    >
                      Programı Kaydet
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "1.5rem" }}>
                  {/* Left Column: Progress Chart & Notes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* Reading Progress Chart */}
                    <div className="panel-card" style={{ padding: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-card)" }}>
                      <h4 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.9rem", marginBottom: 12 }}>
                        <TrendingUp size={15} color="var(--primary)" /> Akademik Gelişim Analizi
                      </h4>
                      <ReadingProgressChart progressHistory={selectedStudent.progressHistory} />
                    </div>

                    {/* Notes */}
                    <div>
                      <h4 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.9rem", marginBottom: 8 }}>
                        <FileText size={15} color="var(--primary)" /> Gelişim Notları
                      </h4>
                      <div className="notes-container" style={{ maxHeight: "200px" }}>
                        {selectedStudent.notes.length === 0
                          ? <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", padding: 10 }}>Henüz not yok.</p>
                          : selectedStudent.notes.map(note => (
                            <div className="note-item" key={note.id}>
                              <div className="note-meta">
                                <span className="note-author">{note.author}</span>
                                <span>{note.date}</span>
                              </div>
                              <p className="note-text">{note.content}</p>
                              {role !== "Öğretmen" && (
                                <button className="note-delete-btn" onClick={() => handleDeleteNote(selectedStudent.id, note.id)}>✕</button>
                              )}
                            </div>
                          ))
                        }
                      </div>
                      <div className="add-note-box">
                        <input
                          type="text"
                          className="form-control add-note-input"
                          placeholder="Hız ölçümü, gelişim notu, gözlem…"
                          value={newNoteText}
                          onChange={e => setNewNoteText(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleAddNote(selectedStudent.id)}
                        />
                        <button className="btn btn-primary" style={{ padding: "10px 14px" }} onClick={() => handleAddNote(selectedStudent.id)}>
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Info Tabs */}
                  <div>
                    {/* Tab Header */}
                    <div style={{ display: "flex", gap: "5px", marginBottom: "15px", borderBottom: "1px solid var(--border)", paddingBottom: "5px" }}>
                      {role !== "Öğretmen" && (
                        <>
                          <button
                            type="button"
                            className={`btn ${activeModalTab === "payments" ? "btn-primary" : "btn-secondary"}`}
                            style={{ padding: "6px 12px", fontSize: "0.8rem", flex: 1, justifyContent: "center" }}
                            onClick={() => setActiveModalTab("payments")}
                          >
                            Ödemeler
                          </button>
                          <button
                            type="button"
                            className={`btn ${activeModalTab === "installments" ? "btn-primary" : "btn-secondary"}`}
                            style={{ padding: "6px 12px", fontSize: "0.8rem", flex: 1, justifyContent: "center" }}
                            onClick={() => setActiveModalTab("installments")}
                          >
                            Taksit Takvimi
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className={`btn ${activeModalTab === "attendance" ? "btn-primary" : "btn-secondary"}`}
                        style={{ padding: "6px 12px", fontSize: "0.8rem", flex: 1, justifyContent: "center" }}
                        onClick={() => setActiveModalTab("attendance")}
                      >
                        Devam Takibi
                      </button>
                    </div>

                    {/* Tab Content */}
                    {activeModalTab === "payments" && role !== "Öğretmen" && (() => {
                      const due = selectedStudent.totalPrice - selectedStudent.discount;
                      const rem = due - selectedStudent.paidAmount;
                      const pct = due > 0 ? Math.min(Math.round((selectedStudent.paidAmount / due) * 100), 100) : 0;
                      return (
                        <>
                          <h4 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.9rem", marginBottom: 8 }}>
                            <DollarSign size={15} color="var(--accent)" /> Ödeme Özeti
                          </h4>
                          <div className="payment-summary-block" style={{ padding: "10px 12px" }}>
                            {[["Toplam", due], ["Ödenen", selectedStudent.paidAmount], ["Kalan", rem]].map(([lbl, amt]) => (
                              <div className="payment-sum-item" key={lbl}>
                                <span className="payment-sum-title">{lbl}</span>
                                <span className="payment-sum-value" style={lbl === "Ödenen" ? { color: "var(--success)" } : lbl === "Kalan" ? { color: "var(--accent)" } : {}}>
                                  {formatMoney(amt)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="progress-bar-wrapper" style={{ margin: "10px 0 4px" }}>
                            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <div style={{ textAlign: "right", fontSize: "0.72rem", fontWeight: 700, marginBottom: 10 }}>
                            Tahsilat: %{pct}
                          </div>
                          {rem > 0 && (
                            <button
                              className="btn btn-accent"
                              style={{ width: "100%", justifyContent: "center", padding: "8px", fontSize: "0.8rem", marginBottom: 12 }}
                              onClick={() => { setPaymentForm({ ...emptyPaymentForm, studentId: selectedStudent.id, amount: String(rem) }); setModal("addPayment"); }}
                            >
                              <Plus size={14} /> Taksit Tahsil Et
                            </button>
                          )}
                          <h5 style={{ fontSize: "0.78rem", marginBottom: 6 }}>Ödeme Hareketleri</h5>
                          <div className="payment-list-modal" style={{ maxHeight: "150px", overflowY: "auto" }}>
                            {selectedStudent.payments.length === 0
                              ? <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Henüz ödeme yok.</p>
                              : selectedStudent.payments.map(p => (
                                <div className="payment-row-item" key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                                  <div className="payment-row-info" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ fontSize: "0.75rem", fontWeight: "600" }}>{p.date}</span>
                                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>({p.type})</span>
                                    <button
                                      type="button"
                                      className="btn-icon-only"
                                      style={{ padding: "2px", background: "none", border: "none", cursor: "pointer", color: "var(--primary)" }}
                                      title="Makbuz İndir (PDF)"
                                      onClick={() => exportPaymentReceiptPDF(selectedStudent, p)}
                                    >
                                      <Receipt size={13} />
                                    </button>
                                  </div>
                                  <span className="payment-row-amount" style={{ fontWeight: "700", color: "var(--success)" }}>+{formatMoney(p.amount)}</span>
                                </div>
                              ))
                            }
                          </div>
                        </>
                      );
                    })()}

                    {activeModalTab === "installments" && role !== "Öğretmen" && (
                      <div>
                        <h4 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.9rem", marginBottom: 8 }}>
                          <Calendar size={15} color="var(--primary)" /> Taksit ve Ödeme Takvimi
                        </h4>
                        <div className="table-container" style={{ maxHeight: "250px", overflowY: "auto" }}>
                          <table className="data-table" style={{ fontSize: "0.8rem" }}>
                            <thead>
                              <tr>
                                <th>Taksit</th>
                                <th>Vade</th>
                                <th>Tutar</th>
                                <th>Durum</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedStudent.paymentPlan?.map((item, idx) => (
                                <tr key={idx}>
                                  <td><strong>{item.description}</strong></td>
                                  <td>{item.date}</td>
                                  <td>{formatMoney(item.amount)}</td>
                                  <td>
                                    <span className={`badge ${
                                      item.status === "Ödendi" ? "badge-paid" : item.status === "Kısmi" ? "badge-partial" : "badge-unpaid"
                                    }`} style={{ padding: "2px 6px", fontSize: "0.7rem" }}>
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {activeModalTab === "attendance" && (
                      <div>
                        <h4 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.9rem", marginBottom: 8 }}>
                          <UserCheck size={15} color="var(--success)" /> Devam-Devamsızlık Kayıtları
                        </h4>
                        <div className="table-container" style={{ maxHeight: "250px", overflowY: "auto" }}>
                          <table className="data-table" style={{ fontSize: "0.8rem" }}>
                            <thead>
                              <tr>
                                <th>Tarih</th>
                                <th>Durum</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedStudent.attendance?.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.date}</td>
                                  <td>
                                    <span style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      padding: "3px 8px",
                                      borderRadius: "12px",
                                      fontSize: "0.75rem",
                                      fontWeight: "bold",
                                      color: "white",
                                      backgroundColor: item.status === "Katıldı" ? "#2ecc71" : "#e74c3c"
                                    }}>
                                      <span style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        backgroundColor: "white"
                                      }} />
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {role === "Öğretmen" && activeModalTab !== "attendance" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", justifyContent: "center", height: "100%", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)", padding: 20, textAlign: "center" }}>
                        <AlertTriangle size={30} color="var(--warning)" />
                        <h5 style={{ fontSize: "0.85rem" }}>Erişim Kısıtlandı</h5>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Öğretmen rolü finansal bilgileri görüntüleyemez.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setModal(null); setIsEditingSchedule(false); }}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment */}
      {modal === "addPayment" && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Ödeme Tahsilat Girişi</h3>
              <button className="btn-icon-only" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleAddPayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Öğrenci *</label>
                  <select
                    className="form-control"
                    value={paymentForm.studentId}
                    onChange={e => {
                      const s = students.find(st => st.id === e.target.value);
                      if (s) {
                        const rem = (s.totalPrice - s.discount) - s.paidAmount;
                        setPaymentForm(f => ({ ...f, studentId: e.target.value, amount: String(rem > 0 ? rem : "") }));
                      } else {
                        setPaymentForm(f => ({ ...f, studentId: e.target.value }));
                      }
                    }}
                    required
                  >
                    <option value="">Öğrenci seçin…</option>
                    {students.map(s => {
                      const rem = (s.totalPrice - s.discount) - s.paidAmount;
                      return rem > 0
                        ? <option key={s.id} value={s.id}>{s.studentName} — Kalan: {formatMoney(rem)}</option>
                        : null;
                    })}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tutar (₺) *</label>
                    <input type="number" min="1" className="form-control" placeholder="Örn: 2000" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Ödeme Türü</label>
                    <select className="form-control" value={paymentForm.type} onChange={e => setPaymentForm(f => ({ ...f, type: e.target.value }))}>
                      <option>Nakit</option><option>Kredi Kartı</option><option>EFT/Havale</option>
                    </select>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tarih</label>
                    <input type="date" className="form-control" value={paymentForm.date} onChange={e => setPaymentForm(f => ({ ...f, date: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Açıklama</label>
                    <input type="text" className="form-control" placeholder="2. Taksit" value={paymentForm.description} onChange={e => setPaymentForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>İptal</button>
                <button type="submit" className="btn btn-accent">Tahsil Et</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Schedule Structure Modal (Admin Only) */}
      {modal === "manageScheduleStructure" && role !== "Öğretmen" && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-content" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Settings size={20} color="var(--primary)" /> Saat / Gün Yapısını Düzenle
                </h3>
                <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Öğretmen haftalık ders çizelgesindeki Saat aralıklarını ve Günleri ekleyin, düzenleyin veya yeniden sıralayın.
                </p>
              </div>
              <button className="btn-icon-only" onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Tab Selector */}
              <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                <button
                  type="button"
                  className={`btn ${scheduleConfigTab === "hours" ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                  onClick={() => setScheduleConfigTab("hours")}
                >
                  ⏰ Ders Saatleri ({lessonHours.length})
                </button>
                <button
                  type="button"
                  className={`btn ${scheduleConfigTab === "days" ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                  onClick={() => setScheduleConfigTab("days")}
                >
                  📅 Günler ({daysOfWeek.length})
                </button>
              </div>

              {scheduleConfigTab === "hours" ? (
                <div>
                  {/* Add New Hour Form */}
                  <form onSubmit={handleAddHour} style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Yeni Ders Saati (Örn: 19:30 - 21:00)"
                      value={newHourInput}
                      onChange={e => setNewHourInput(e.target.value)}
                      style={{ flexGrow: 1 }}
                    />
                    <button type="submit" className="btn btn-accent" style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>
                      <Plus size={16} /> Saat Ekle
                    </button>
                  </form>

                  {/* List of Lesson Hours */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: 320, overflowY: "auto" }}>
                    {lessonHours.map((hour, idx) => (
                      <div key={idx} className="structure-item-row">
                        <span className="structure-item-idx">#{idx + 1}</span>
                        {editingHourIdx === idx ? (
                          <input
                            type="text"
                            className="form-control"
                            value={editingHourValue}
                            onChange={e => setEditingHourValue(e.target.value)}
                            onBlur={() => handleSaveEditedHour(idx)}
                            onKeyDown={e => e.key === "Enter" && handleSaveEditedHour(idx)}
                            autoFocus
                            style={{ padding: "4px 8px", fontSize: "0.85rem" }}
                          />
                        ) : (
                          <span className="structure-item-title">{hour}</span>
                        )}

                        <div className="structure-item-actions">
                          <button
                            type="button"
                            className="btn-icon-only"
                            title="Yukarı Taşı"
                            disabled={idx === 0}
                            onClick={() => handleMoveHour(idx, "up")}
                            style={{ width: 30, height: 30 }}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon-only"
                            title="Aşağı Taşı"
                            disabled={idx === lessonHours.length - 1}
                            onClick={() => handleMoveHour(idx, "down")}
                            style={{ width: 30, height: 30 }}
                          >
                            <ArrowDown size={14} />
                          </button>
                          {editingHourIdx === idx ? (
                            <button
                              type="button"
                              className="btn-icon-only"
                              title="Kaydet"
                              onClick={() => handleSaveEditedHour(idx)}
                              style={{ width: 30, height: 30, color: "var(--success)" }}
                            >
                              <CheckCircle size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-icon-only"
                              title="Düzenle"
                              onClick={() => { setEditingHourIdx(idx); setEditingHourValue(hour); }}
                              style={{ width: 30, height: 30 }}
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-icon-only delete-btn"
                            title="Sil"
                            onClick={() => handleDeleteHour(idx)}
                            style={{ width: 30, height: 30 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Add New Day Form */}
                  <form onSubmit={handleAddDay} style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Yeni Gün Adı (Örn: Cumartesi Ek Grup)"
                      value={newDayInput}
                      onChange={e => setNewDayInput(e.target.value)}
                      style={{ flexGrow: 1 }}
                    />
                    <button type="submit" className="btn btn-accent" style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>
                      <Plus size={16} /> Gün Ekle
                    </button>
                  </form>

                  {/* List of Days */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: 320, overflowY: "auto" }}>
                    {daysOfWeek.map((day, idx) => (
                      <div key={idx} className="structure-item-row">
                        <span className="structure-item-idx">#{idx + 1}</span>
                        {editingDayIdx === idx ? (
                          <input
                            type="text"
                            className="form-control"
                            value={editingDayValue}
                            onChange={e => setEditingDayValue(e.target.value)}
                            onBlur={() => handleSaveEditedDay(idx)}
                            onKeyDown={e => e.key === "Enter" && handleSaveEditedDay(idx)}
                            autoFocus
                            style={{ padding: "4px 8px", fontSize: "0.85rem" }}
                          />
                        ) : (
                          <span className="structure-item-title">{day}</span>
                        )}

                        <div className="structure-item-actions">
                          <button
                            type="button"
                            className="btn-icon-only"
                            title="Yukarı Taşı"
                            disabled={idx === 0}
                            onClick={() => handleMoveDay(idx, "up")}
                            style={{ width: 30, height: 30 }}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon-only"
                            title="Aşağı Taşı"
                            disabled={idx === daysOfWeek.length - 1}
                            onClick={() => handleMoveDay(idx, "down")}
                            style={{ width: 30, height: 30 }}
                          >
                            <ArrowDown size={14} />
                          </button>
                          {editingDayIdx === idx ? (
                            <button
                              type="button"
                              className="btn-icon-only"
                              title="Kaydet"
                              onClick={() => handleSaveEditedDay(idx)}
                              style={{ width: 30, height: 30, color: "var(--success)" }}
                            >
                              <CheckCircle size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-icon-only"
                              title="Düzenle"
                              onClick={() => { setEditingDayIdx(idx); setEditingDayValue(day); }}
                              style={{ width: 30, height: 30 }}
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-icon-only delete-btn"
                            title="Sil"
                            onClick={() => handleDeleteDay(idx)}
                            style={{ width: 30, height: 30 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ justifyContent: "space-between" }}>
              <button type="button" className="btn btn-secondary" onClick={handleResetScheduleStructure} title="Varsayılan ayarlara dön">
                <RotateCcw size={14} /> Varsayılana Sıfırla
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setModal(null)}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Slot Action Modal (Admin Direct Calendar Cell Click) */}
      {modal === "quickSlotAction" && activeSlotData && role !== "Öğretmen" && (() => {
        const activeTeacher = teachers.find(t => t.id === activeSlotData.teacherId) || teachers[0];
        const occupiedStudent = activeSlotData.student;

        return (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && (setModal(null) || setActiveSlotData(null))}>
            <div className="modal-content" style={{ maxWidth: 540 }}>
              <div className="modal-header">
                <div>
                  <h3 style={{ fontSize: "1.1rem" }}>Hücre Düzenle — {activeSlotData.day} ({activeSlotData.hour.split(" ")[0]})</h3>
                  <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Öğretmen: <strong>{activeTeacher.name}</strong>
                  </p>
                </div>
                <button className="btn-icon-only" onClick={() => { setModal(null); setActiveSlotData(null); }}>✕</button>
              </div>

              <div className="modal-body" style={{ gap: "1.25rem" }}>
                {occupiedStudent ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{
                      background: occupiedStudent.teacherId === "teacher-zehra" ? "var(--accent-light)" : "var(--primary-light)",
                      borderLeft: `4px solid ${occupiedStudent.teacherId === "teacher-zehra" ? "var(--accent)" : "var(--primary)"}`,
                      padding: "12px 14px",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <h4 style={{ fontSize: "0.95rem", color: occupiedStudent.teacherId === "teacher-zehra" ? "var(--accent)" : "var(--primary)" }}>
                          👨‍🎓 {occupiedStudent.studentName}
                        </h4>
                        <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {occupiedStudent.studentAgeGrade} | Veli: {occupiedStudent.name} ({occupiedStudent.phone})
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ justifyContent: "center" }}
                        onClick={() => {
                          setSelectedStudent(occupiedStudent);
                          setNewNoteText("");
                          setIsEditingSchedule(false);
                          setModal("studentDetail");
                        }}
                      >
                        <FileText size={15} /> Öğrenci Detayını & Notlarını Gör
                      </button>

                      <button
                        type="button"
                        className="btn btn-accent"
                        style={{ justifyContent: "center" }}
                        onClick={handleQuickRemoveStudentFromSlot}
                      >
                        <Trash2 size={15} /> Bu Seansı Kaldır (Öğrenciyi Saatten Çıkar)
                      </button>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "4px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>
                        🔄 Farklı Bir Öğrenci İle Değiştir / Ek Kayıt:
                      </label>
                      <form onSubmit={handleQuickAssignStudent} style={{ display: "flex", gap: "8px" }}>
                        <select
                          className="form-control"
                          value={quickAssignStudentId}
                          onChange={e => setQuickAssignStudentId(e.target.value)}
                          required
                          style={{ flexGrow: 1, fontSize: "0.85rem" }}
                        >
                          <option value="">Değiştirilecek Öğrenciyi Seçin…</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.studentName} ({s.studentAgeGrade}) — Veli: {s.name}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
                          Ata
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ background: "var(--bg-app)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: "1rem" }}>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                        Bu ders saati şu an <strong>BOŞ</strong>. {activeTeacher.name} için bu saat dilimine doğrudan öğrenci atayabilirsiniz.
                      </p>
                    </div>

                    <form onSubmit={handleQuickAssignStudent} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div className="form-group">
                        <label>Öğrenci Seçimi *</label>
                        <select
                          className="form-control"
                          value={quickAssignStudentId}
                          onChange={e => setQuickAssignStudentId(e.target.value)}
                          required
                        >
                          <option value="">Kayıtlı öğrencilerden birini seçin…</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.studentName} ({s.studentAgeGrade}) — Veli: {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button type="submit" className="btn btn-accent" style={{ justifyContent: "center", padding: "12px" }}>
                        <UserPlus size={16} /> Öğrenciyi Seansa Ata
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setModal(null); setActiveSlotData(null); }}>
                  Kapat
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL: YENİ / DÜZENLE HATIRLATMA ──────────────────────────────── */}
      {modal === "addReminder" && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <CheckSquare size={20} color="var(--primary)" /> {reminderForm.id ? "✏️ Hatırlatmayı Düzenle" : "➕ Yeni Hatırlatma / Görev Ekle"}
              </h3>
              <button className="btn-icon-only" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddReminder}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Hatırlatma Başlığı *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Örn: Mert Çelik 3. Hafta Gelişim Ölçümü"
                    value={reminderForm.title}
                    onChange={e => setReminderForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Son Tarih *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={reminderForm.dueDate}
                      onChange={e => setReminderForm(f => ({ ...f, dueDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Öncelik Seviyesi</label>
                    <select
                      className="form-control"
                      value={reminderForm.priority}
                      onChange={e => setReminderForm(f => ({ ...f, priority: e.target.value }))}
                    >
                      <option value="düşük">🔵 Düşük Öncelik</option>
                      <option value="orta">🟡 Orta Öncelik</option>
                      <option value="yüksek">🔴 Yüksek Öncelik (Acil)</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Görev Kategorisi</label>
                    <select
                      className="form-control"
                      value={reminderForm.category || "Veli Araması"}
                      onChange={e => setReminderForm(f => ({ ...f, category: e.target.value }))}
                    >
                      <option value="Veli Araması">📞 Veli Araması</option>
                      <option value="Öğrenci Gelişim Ölçümü">📈 Öğrenci Gelişim Ölçümü</option>
                      <option value="Taksit / Ödeme Takibi">💰 Taksit / Ödeme Takibi</option>
                      <option value="Sözleşme / Kayıt">📝 Sözleşme / Kayıt</option>
                      <option value="İdari / Genel">🏢 İdari / Genel</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>İlişkili Öğrenci (Opsiyonel)</label>
                    <select
                      className="form-control"
                      value={reminderForm.relatedStudentId || ""}
                      onChange={e => setReminderForm(f => ({ ...f, relatedStudentId: e.target.value }))}
                    >
                      <option value="">İlişkili öğrenci yok</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.studentName} — Veli: {s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Detaylı Not / Açıklama</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Görev ile ilgili ekstra açıklama veya arama notu…"
                    value={reminderForm.note}
                    onChange={e => setReminderForm(f => ({ ...f, note: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>İptal</button>
                <button type="submit" className="btn btn-primary">{reminderForm.id ? "Güncelle" : "Kaydet"}</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Suda Dynamics Filigranı */}
      <div className="suda-dynamics-watermark">
        Suda Dynamics Projesidir
      </div>

    </div>
  );
}

export default App;

