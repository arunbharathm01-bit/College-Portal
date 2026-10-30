const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Admin@2026";
const TEACHER_USERNAME = "teacher";
const TEACHER_PASSWORD = "Teacher@2026";
const HOD_USERNAME = "hod";
const HOD_PASSWORD = "HOD@2026";
const STORAGE_KEY = "campusManagementPortal.v1";
const PREFERENCES_KEY = "campusManagementPortal.preferences.v1";
const DEFAULT_PREFERENCES = {
  theme: "light",
  largeText: false,
  reducedMotion: false
};

const defaultState = {
  departments: [
    { id: "dept-cse", name: "Computer Science & Engineering", code: "CSE" },
    { id: "dept-ece", name: "Electronics & Communication Engineering", code: "ECE" }
  ],
  classes: [
    { id: "class-cse-1a", departmentId: "dept-cse", name: "B.E. CSE", year: "1", section: "A" },
    { id: "class-ece-1a", departmentId: "dept-ece", name: "B.E. ECE", year: "1", section: "A" }
  ],
  students: [
    {
      name: "Alex Morgan",
      rollNumber: "2026CSE01",
      dob: "2004-05-15",
      email: "alex.morgan@college.edu",
      departmentId: "dept-cse",
      classId: "class-cse-1a",
      phone: "+1 555-0192",
      parentName: "Robert Morgan",
      parentPhone: "+1 555-0193",
      address: "104 Campus Avenue, University Town",
      admissionType: "Regular",
      avatarUrl: ""
    }
  ],
  staff: [
    {
      id: "staff-01",
      name: "Dr. Sarah Jenkins",
      role: "Teacher",
      username: "teacher",
      password: "Teacher@2026",
      departmentId: "dept-cse",
      classId: "class-cse-1a",
      subject: "Data Structures & Algorithms",
      phone: "+1 555-0482"
    }
  ],
  news: [
    {
      id: "news-01",
      title: "Welcome to Spring 2026 Semester",
      audience: "All Students & Staff",
      body: "Classes commence this Monday. Please verify your course timetables and classroom allocations on your portal.",
      date: "2026-07-20"
    }
  ],
  schedules: [
    {
      id: "sched-01",
      exam: "End Semester Examinations",
      date: "2026-08-15",
      departmentId: "dept-cse",
      classId: "class-cse-1a",
      details: "Hall A, Main Academic Block - 10:00 AM to 1:00 PM"
    }
  ],
  classSchedules: [
    { id: "class-sched-01", departmentId: "dept-cse", classId: "class-cse-1a", day: "Monday", time: "09:00 – 10:00", subject: "Data Structures", venue: "Lab 204", faculty: "Dr. Sarah Jenkins" },
    { id: "class-sched-02", departmentId: "dept-cse", classId: "class-cse-1a", day: "Wednesday", time: "11:00 – 12:00", subject: "Mathematics I", venue: "A-102", faculty: "Prof. Vikram Rao" },
    { id: "class-sched-03", departmentId: "dept-cse", classId: "class-cse-1a", day: "Friday", time: "14:00 – 16:00", subject: "Programming Lab", venue: "Lab 204", faculty: "Dr. Sarah Jenkins" }
  ],
  assessments: [
    {
      id: "assmt-01",
      title: "Data Structures Lab Project",
      dueDate: "2026-08-01",
      description: "Implement Binary Search Trees and Graph Traversal Algorithms with full documentation.",
      departmentId: "dept-cse",
      classId: "class-cse-1a",
      teacherName: "Dr. Sarah Jenkins",
      date: "2026-07-22"
    }
  ],
  classroomPosts: [
    {
      id: "post-01",
      title: "Assignment 1 Submission Extended",
      message: "The deadline for Data Structures Assignment 1 has been extended to Friday 5:00 PM.",
      departmentId: "dept-cse",
      classId: "class-cse-1a",
      teacherName: "Dr. Sarah Jenkins",
      date: "2026-07-23"
    }
  ],
  resources: [
    { id: "resource-01", title: "Binary Search Tree Reference Notes", type: "PDF", url: "#classroom-resource-01", description: "Faculty resource for the current module.", departmentId: "dept-cse", classId: "class-cse-1a", uploadedBy: "Dr. Sarah Jenkins", date: "2026-07-23" },
    { id: "resource-02", title: "Graph Traversal Lab Starter Files", type: "ZIP", url: "#classroom-resource-02", description: "Starter material for the week 4 lab.", departmentId: "dept-cse", classId: "class-cse-1a", uploadedBy: "Dr. Sarah Jenkins", date: "2026-07-24" }
  ],
  reviews: [
    {
      id: "rev-01",
      rollNumber: "2026CSE01",
      area: "Library",
      rating: "Excellent",
      text: "Great collection of computer science references and quiet study spaces.",
      date: "2026-07-21"
    }
  ],
  attendance: [],
  results: [
    {
      id: "res-01",
      rollNumber: "2026CSE01",
      exam: "Semester 1 Examinations",
      resultType: "regular",
      semester: "1",
      subjects: [
        { name: "Data Structures", code: "CS101", mark: 92, credit: 4, grade: "S", status: "Pass" },
        { name: "Digital Logic", code: "EC102", mark: 85, credit: 3, grade: "A+", status: "Pass" },
        { name: "Mathematics I", code: "MA101", mark: 78, credit: 4, grade: "A", status: "Pass" }
      ],
      publishedDate: "2026-07-01",
      reportCard: {
        name: "Semester 1 Verified Report Card.pdf",
        url: "#secure-report-card-res-01",
        uploadedBy: "Administration",
        uploadedDate: "2026-07-01"
      }
    }
  ],
  parents: [
    {
      id: "par-01",
      name: "Robert Morgan",
      rollNumber: "2026CSE01",
      role: "Representative",
      contact: "+1 555-0193",
      notes: "PTA CSE Department Delegate"
    }
  ]
};

let state = loadState();
let preferences = loadPreferences();
let loginMode = "student";
let managementRole = "teacher";
let currentStudent = null;
let currentTeacher = null;
let activeStudentSection = "profile";
let activeTeacherSection = "students";
let activeAdminSection = "admission";
let teacherFilters = { departmentId: "", classId: "", attendanceDate: today() };
let toastTimeout;

const q = (selector) => document.querySelector(selector);
const qa = (selector) => [...document.querySelectorAll(selector)];

const views = {
  login: q("#login-view"),
  student: q("#student-view"),
  hod: q("#hod-view"),
  teacher: q("#teacher-view"),
  admin: q("#admin-view")
};

function loadState() {
  const fallback = JSON.parse(JSON.stringify(defaultState));
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
      return fallback;
    }
    return Object.fromEntries(Object.entries(fallback).map(([key, value]) => [
      key,
      Array.isArray(stored[key]) ? stored[key] : value
    ]));
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(PREFERENCES_KEY));
    const theme = ["system", "light", "dark"].includes(stored?.theme) ? stored.theme : DEFAULT_PREFERENCES.theme;
    return {
      theme,
      largeText: Boolean(stored?.largeText),
      reducedMotion: Boolean(stored?.reducedMotion)
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function savePreferences() {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function showView(name) {
  Object.entries(views).forEach(([key, view]) => {
    if (view) view.classList.toggle("hidden", key !== name);
  });
}

function showMessage(element, message, type = "error") {
  if (!element) return;
  element.textContent = message;
  element.dataset.type = type;
}

function showToast(message, type = "success") {
  const toast = q("#portal-toast");
  if (!toast) return;
  window.clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.dataset.type = type;
  toast.classList.add("visible");
  toastTimeout = window.setTimeout(() => toast.classList.remove("visible"), 4200);
}

function applyPreferences() {
  const systemPrefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const theme = preferences.theme === "system" ? (systemPrefersDark ? "dark" : "light") : preferences.theme;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.textScale = preferences.largeText ? "large" : "default";
  document.documentElement.dataset.reducedMotion = String(preferences.reducedMotion);

  const themeSelect = q("#student-theme-select");
  if (themeSelect) themeSelect.value = preferences.theme;
  const largeTextToggle = q("#student-large-text-toggle");
  if (largeTextToggle) largeTextToggle.checked = preferences.largeText;
  const reducedMotionToggle = q("#student-reduced-motion-toggle");
  if (reducedMotionToggle) reducedMotionToggle.checked = preferences.reducedMotion;
}

function updatePreferences(nextPreferences, message = "Settings saved.") {
  preferences = { ...preferences, ...nextPreferences };
  savePreferences();
  applyPreferences();
  showMessage(q("#student-settings-message"), message, "success");
}

function matchesStudentScope(item, student) {
  return (!item.departmentId || item.departmentId === student.departmentId) &&
    (!item.classId || item.classId === student.classId);
}

function safeDocumentLink(value, fallback = "#") {
  const href = String(value || "").trim();
  return /^(#|https?:\/\/|mailto:)/i.test(href) ? href : fallback;
}

function studentAvatarUrl(student) {
  if (student.avatarUrl) return student.avatarUrl;
  const initials = student.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).replace(/[^a-z0-9]/gi, "").toUpperCase() || "ST";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="32" fill="#d9f3ef"/><circle cx="80" cy="60" r="30" fill="#0f766e"/><path d="M28 142c7-34 27-50 52-50s45 16 52 50" fill="#0f766e"/><text x="80" y="150" fill="#ffffff" font-family="Arial,sans-serif" font-size="20" font-weight="700" text-anchor="middle">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function updateReviewStars(value, persist = false) {
  const rating = Number(value) || 0;
  const ratingInput = q("#review-rating");
  if (persist && ratingInput) ratingInput.value = rating ? String(rating) : "";
  qa("[data-review-star]").forEach((star) => {
    const isActive = Number(star.dataset.reviewStar) <= rating;
    star.classList.toggle("active", isActive);
    if (persist) star.setAttribute("aria-checked", String(Number(star.dataset.reviewStar) === rating));
  });
  const copy = q("#review-rating-copy");
  if (copy) copy.textContent = rating ? `${rating} out of 5 stars selected.` : "Choose a rating from 1 to 5 stars.";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function departmentName(id) {
  return state.departments.find((department) => department.id === id)?.name || "Not assigned";
}

function className(id) {
  const classItem = state.classes.find((item) => item.id === id);
  if (!classItem) return "Not assigned";
  return `${classItem.name} - Year ${classItem.year} ${classItem.section}`;
}

function studentName(rollNumber) {
  return state.students.find((student) => student.rollNumber === rollNumber)?.name || rollNumber;
}

function studentByRoll(rollNumber) {
  return state.students.find((student) => student.rollNumber === rollNumber) || null;
}

function resultSummary(result) {
  const subjects = result.subjects || [];
  const total = subjects.reduce((sum, s) => sum + (Number(s.mark) || 0), 0);
  const max = subjects.length * 100;
  const percent = max ? Math.round((total / max) * 100) : 0;
  const gradePoints = { S: 10, "A+": 9, A: 8, "B+": 7, B: 6, "C+": 5, C: 4, U: 0 };
  const totalCredits = subjects.reduce((sum, subject) => sum + (Number(subject.credit) || 0), 0);
  const qualityPoints = subjects.reduce((sum, subject) => {
    const grade = subject.grade || gradeFromMark(Number(subject.mark) || 0);
    return sum + ((gradePoints[grade] ?? 0) * (Number(subject.credit) || 0));
  }, 0);
  const gpa = totalCredits ? (qualityPoints / totalCredits).toFixed(2) : "0.00";
  const status = subjects.length && subjects.every((s) => (Number(s.mark) || 0) >= 40) ? "Pass" : "RA";
  return { total, max, percent, gpa, status };
}

function syncDepartmentSelect(select, options = {}) {
  if (!select) return;
  const { includeAll = false, includeEmpty = false } = options;
  let html = "";
  if (includeAll) html += '<option value="">All departments</option>';
  if (includeEmpty && !includeAll) html += '<option value="">Select department</option>';
  html += state.departments.map((department) => (
    `<option value="${escapeHtml(department.id)}">${escapeHtml(department.name)} (${escapeHtml(department.code)})</option>`
  )).join("");
  if (!state.departments.length && !includeAll) {
    html = '<option value="">Add department first</option>';
  }
  select.innerHTML = html;
}

function syncClassSelect(select, departmentId = "", options = {}) {
  if (!select) return;
  const { includeAll = false, includeEmpty = false } = options;
  const classes = state.classes.filter((item) => !departmentId || item.departmentId === departmentId);
  let html = "";
  if (includeAll) html += '<option value="">All classes</option>';
  if (includeEmpty && !includeAll) html += '<option value="">Select class</option>';
  html += classes.map((item) => (
    `<option value="${escapeHtml(item.id)}">${escapeHtml(className(item.id))}</option>`
  )).join("");
  if (!classes.length && !includeAll) {
    html = '<option value="">Add class first</option>';
  }
  select.innerHTML = html;
}

function syncAllSelects() {
  const departmentSelects = [
    q("#student-department-input"),
    q("#staff-department-input"),
    q("#class-department-input"),
    q("#teacher-department"),
    q("#schedule-department-input"),
    q("#result-department-input")
  ];

  departmentSelects.forEach((select) => {
    if (!select) return;
    const includeAll = select.id === "teacher-department" || select.id === "schedule-department-input" || select.id === "result-department-input";
    syncDepartmentSelect(select, { includeAll, includeEmpty: !includeAll });
  });

  syncClassSelect(q("#student-class-input"), q("#student-department-input")?.value, { includeEmpty: true });
  syncClassSelect(q("#staff-class-input"), q("#staff-department-input")?.value, { includeEmpty: true });
  syncClassSelect(q("#teacher-class"), q("#teacher-department")?.value, { includeAll: true });
  syncClassSelect(q("#schedule-class-input"), q("#schedule-department-input")?.value, { includeAll: true });
  syncClassSelect(q("#result-class-input"), q("#result-department-input")?.value, { includeAll: true });
  syncResultStudentSelect();
}

function syncResultStudentSelect() {
  const select = q("#result-student-input");
  if (!select) return;
  const deptId = q("#result-department-input")?.value;
  const classId = q("#result-class-input")?.value;

  const filtered = state.students.filter((s) => (
    (!deptId || s.departmentId === deptId) &&
    (!classId || s.classId === classId)
  ));

  select.innerHTML = filtered.length
    ? filtered.map((student) => (
      `<option value="${escapeHtml(student.rollNumber)}">${escapeHtml(student.name)} - ${escapeHtml(student.rollNumber)}</option>`
    )).join("")
    : '<option value="">No matching students</option>';
}

function setActiveTab(buttons, activeButton) {
  buttons.forEach((button) => button.classList.toggle("active", button === activeButton));
}

function renderAdminPage() {
  syncAllSelects();
  renderAdminStats();
  renderStudents();
  renderStaff();
  renderReviews();
  renderRecordsEditor();
  renderResults();
  renderDepartments();
  renderClasses();
  renderParents();
  renderNewsAndSchedules();
  switchAdminSection(activeAdminSection);
  showView("admin");
}

function renderAdminStats() {
  if (q("#stat-students")) q("#stat-students").textContent = state.students.length;
  if (q("#stat-staff")) q("#stat-staff").textContent = state.staff.length;
  if (q("#stat-departments")) q("#stat-departments").textContent = state.departments.length;
  if (q("#stat-reviews")) q("#stat-reviews").textContent = state.reviews.length;
}

function renderStudents() {
  const searchInput = q("#student-search");
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const students = state.students.filter((student) => (
    student.name.toLowerCase().includes(query) ||
    student.rollNumber.toLowerCase().includes(query) ||
    departmentName(student.departmentId).toLowerCase().includes(query) ||
    className(student.classId).toLowerCase().includes(query)
  ));

  const listEl = q("#admin-student-list");
  if (listEl) listEl.innerHTML = renderStudentRecords(students);
}

function renderStudentRecords(students) {
  if (!students.length) {
    return `<div class="state-card"><h2>No students found</h2><p>Use Student Admission to add records.</p></div>`;
  }
  return students.map((student) => `
    <article class="record">
      <div>
        <h4>${escapeHtml(student.name)}</h4>
        <p>${escapeHtml(student.rollNumber)} - ${escapeHtml(className(student.classId))}</p>
      </div>
      <div class="record-score">
        <strong>${escapeHtml(departmentName(student.departmentId))}</strong>
        <span>${escapeHtml(student.parentPhone || "No parent phone")}</span>
      </div>
      <div class="actions-inline">
        <button type="button" data-edit-student="${escapeHtml(student.rollNumber)}">Edit</button>
        <button type="button" data-delete-student="${escapeHtml(student.rollNumber)}">Delete</button>
      </div>
    </article>
  `).join("");
}

function renderStaff() {
  const listEl = q("#staff-list");
  if (!listEl) return;
  listEl.innerHTML = state.staff.length
    ? state.staff.map((staff) => `
      <article class="record">
        <div>
          <h4>${escapeHtml(staff.name)}</h4>
          <p>${escapeHtml(staff.role)} - ${escapeHtml(staff.subject || "No subject")}</p>
        </div>
        <div class="record-score">
          <strong>${escapeHtml(staff.username)}</strong>
          <span>${escapeHtml(className(staff.classId))}</span>
        </div>
        <div class="actions-inline">
          <button type="button" data-edit-staff="${escapeHtml(staff.id)}">Edit</button>
          <button type="button" data-delete-staff="${escapeHtml(staff.id)}">Delete</button>
        </div>
      </article>
    `).join("")
    : `<div class="state-card"><h2>No staff records</h2><p>No staff members added yet.</p></div>`;
}

function renderReviews() {
  const listEl = q("#reviews-list");
  if (!listEl) return;
  listEl.innerHTML = state.reviews.length
    ? state.reviews.map((review) => `
      <article class="info-card">
        <h4>${escapeHtml(review.area)} - ${escapeHtml(review.rating)}</h4>
        <p class="muted">${escapeHtml(studentName(review.rollNumber))} (${escapeHtml(review.rollNumber)}) - ${escapeHtml(review.date)}</p>
        <p>${escapeHtml(review.text)}</p>
      </article>
    `).join("")
    : `<div class="state-card"><h2>No reviews</h2><p>Student environment reviews will appear here.</p></div>`;
}

function renderRecordsEditor() {
  const searchInput = q("#record-search");
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const filtered = state.students.filter((s) => (
    s.name.toLowerCase().includes(query) ||
    s.rollNumber.toLowerCase().includes(query)
  ));
  const listEl = q("#records-editor-list");
  if (listEl) listEl.innerHTML = renderStudentRecords(filtered);
}

function renderResults() {
  const listEl = q("#results-list");
  if (!listEl) return;
  listEl.innerHTML = state.results.length
    ? state.results.map((result) => {
      const summary = resultSummary(result);
      return `
        <article class="record">
          <div>
            <h4>${escapeHtml(result.exam)}</h4>
            <p>${escapeHtml(studentName(result.rollNumber))} (${escapeHtml(result.rollNumber)})</p>
          </div>
          <div class="record-score">
            <strong>GPA: ${escapeHtml(summary.gpa)}</strong>
            <span>${escapeHtml(summary.status)} (${summary.percent}%)</span>
          </div>
          <div class="actions-inline">
            <button type="button" data-delete-result="${escapeHtml(result.id)}">Delete</button>
          </div>
        </article>
      `;
    }).join("")
    : `<div class="state-card"><h2>No results</h2><p>Published examination results will appear here.</p></div>`;
}

function renderDepartments() {
  const listEl = q("#department-list");
  if (!listEl) return;
  listEl.innerHTML = state.departments.length
    ? state.departments.map((department) => `
      <article class="record">
        <div><h4>${escapeHtml(department.name)}</h4><p>Code: ${escapeHtml(department.code)}</p></div>
        <div class="record-score"><strong>${state.classes.filter((item) => item.departmentId === department.id).length}</strong><span>Classes</span></div>
        <div class="actions-inline">
          <button type="button" data-edit-department="${escapeHtml(department.id)}">Edit</button>
          <button type="button" data-delete-department="${escapeHtml(department.id)}">Delete</button>
        </div>
      </article>
    `).join("")
    : `<div class="state-card"><h2>No departments</h2><p>Add academic departments here.</p></div>`;
}

function renderClasses() {
  const listEl = q("#class-list");
  if (!listEl) return;
  listEl.innerHTML = state.classes.length
    ? state.classes.map((item) => `
      <article class="record">
        <div><h4>${escapeHtml(className(item.id))}</h4><p>${escapeHtml(departmentName(item.departmentId))}</p></div>
        <div class="record-score"><strong>${state.students.filter((student) => student.classId === item.id).length}</strong><span>Students</span></div>
        <div class="actions-inline">
          <button type="button" data-edit-class="${escapeHtml(item.id)}">Edit</button>
          <button type="button" data-delete-class="${escapeHtml(item.id)}">Delete</button>
        </div>
      </article>
    `).join("")
    : `<div class="state-card"><h2>No classes</h2><p>Add classes under each department.</p></div>`;
}

function renderParents() {
  const listEl = q("#parents-list");
  if (!listEl) return;
  listEl.innerHTML = state.parents.length
    ? state.parents.map((parent) => `
      <article class="record">
        <div><h4>${escapeHtml(parent.name)}</h4><p>Student: ${escapeHtml(studentName(parent.rollNumber))} (${escapeHtml(parent.rollNumber)})</p></div>
        <div class="record-score"><strong>${escapeHtml(parent.role)}</strong><span>${escapeHtml(parent.contact)}</span></div>
        <div class="actions-inline"><button type="button" data-delete-parent="${escapeHtml(parent.id)}">Delete</button></div>
      </article>
    `).join("")
    : `<div class="state-card"><h2>No PTA members</h2><p>Parent Teacher Association entries will appear here.</p></div>`;
}

function renderNewsAndSchedules() {
  const newsList = q("#news-list");
  if (newsList) {
    newsList.innerHTML = state.news.length
      ? state.news.map((item) => `
        <article class="info-card">
          <h4>${escapeHtml(item.title)}</h4>
          <p class="muted">${escapeHtml(item.audience)} - ${escapeHtml(item.date)}</p>
          <p>${escapeHtml(item.body)}</p>
        </article>
      `).join("")
      : `<div class="state-card"><h2>No news</h2><p>No news bulletins posted yet.</p></div>`;
  }

  const scheduleList = q("#schedule-list");
  if (scheduleList) {
    scheduleList.innerHTML = state.schedules.length
      ? state.schedules.map((item) => `
        <article class="info-card">
          <h4>${escapeHtml(item.exam)}</h4>
          <p class="muted">${escapeHtml(item.date)} - ${escapeHtml(departmentName(item.departmentId))} - ${escapeHtml(className(item.classId))}</p>
          <p>${escapeHtml(item.details)}</p>
        </article>
      `).join("")
      : `<div class="state-card"><h2>No schedules</h2><p>No exam schedules published yet.</p></div>`;
  }
}

function renderTeacherPage(staffUser = null) {
  currentTeacher = staffUser || currentTeacher || { name: "Teacher", departmentId: "", classId: "", subject: "" };
  syncAllSelects();
  const departmentSelect = q("#teacher-department");
  const classSelect = q("#teacher-class");
  if (departmentSelect) departmentSelect.value = teacherFilters.departmentId;
  if (classSelect) {
    syncClassSelect(classSelect, teacherFilters.departmentId, { includeAll: true });
    classSelect.value = teacherFilters.classId;
  }
  if (q("#attendance-date")) q("#attendance-date").value = teacherFilters.attendanceDate || today();

  renderTeacherStudentView();
  renderTeacherAttendance();
  renderTeacherAssessments();
  renderTeacherClassroom();
  switchTeacherSection(activeTeacherSection);
  showView("teacher");
}

function renderTeacherStudentView() {
  const departmentId = q("#teacher-department")?.value || "";
  const classId = q("#teacher-class")?.value || "";
  const students = state.students.filter((student) => (
    (!departmentId || student.departmentId === departmentId) &&
    (!classId || student.classId === classId)
  ));

  const panel = q("#teacher-students-panel");
  if (!panel) return;

  if (!students.length) {
    panel.innerHTML = `
      <div class="state-card">
        <h2>No students found</h2>
        <p>Select department and class filters to view enrolled students.</p>
      </div>
    `;
    return;
  }

  panel.innerHTML = `
    <div class="records-list">
      ${students.map((student) => `
        <article class="record">
          <div>
            <h4>${escapeHtml(student.name)}</h4>
            <p>${escapeHtml(student.rollNumber)} - ${escapeHtml(className(student.classId))}</p>
          </div>
          <div class="record-score">
            <strong>${escapeHtml(departmentName(student.departmentId))}</strong>
            <span>${escapeHtml(student.phone || "No phone")}</span>
          </div>
          <div><p>${escapeHtml(student.email || "No email")}</p></div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderTeacherAttendance() {
  const departmentId = q("#teacher-department")?.value || "";
  const classId = q("#teacher-class")?.value || "";
  const students = state.students.filter((student) => (
    (!departmentId || student.departmentId === departmentId) &&
    (!classId || student.classId === classId)
  ));

  const panel = q("#teacher-attendance-panel");
  if (!panel) return;

  if (!students.length) {
    panel.innerHTML = `
      <div class="state-card">
        <h2>Take Attendance</h2>
        <p>Select department and class filters above.</p>
      </div>
    `;
    return;
  }

  const currentDate = q("#attendance-date")?.value || today();
  const attendanceByRoll = new Map(state.attendance
    .filter((item) => item.date === currentDate)
    .map((item) => [item.rollNumber, item.status]));

  panel.innerHTML = `
    <div class="panel-title">
      <div>
        <p class="eyebrow">Daily Register</p>
        <h3>Take Attendance</h3>
      </div>
      <label class="field compact-field">
        <span>Date</span>
        <input id="attendance-date" type="date" value="${currentDate}">
      </label>
    </div>
    <form id="attendance-form" class="stack-form">
      <div id="attendance-list" class="records-list">
        ${students.map((student) => `
          <label class="record">
            <div>
              <h4>${escapeHtml(student.name)}</h4>
              <p>${escapeHtml(student.rollNumber)}</p>
            </div>
            <input type="checkbox" data-attendance-roll="${escapeHtml(student.rollNumber)}" ${attendanceByRoll.get(student.rollNumber) === "Present" ? "checked" : ""}>
          </label>
        `).join("")}
      </div>
      <button class="primary-button" type="submit">Save Attendance</button>
      <p id="attendance-message" class="form-message" aria-live="polite"></p>
    </form>
  `;
}

function renderTeacherAssessments() {
  const departmentId = q("#teacher-department")?.value || "";
  const classId = q("#teacher-class")?.value || "";
  const items = state.assessments.filter((item) => (
    (!departmentId || item.departmentId === departmentId) &&
    (!classId || item.classId === classId)
  ));

  const panel = q("#teacher-assessments-panel");
  if (!panel) return;

  panel.innerHTML = `
    <div class="stack-form">
      <div class="panel-title">
        <div>
          <p class="eyebrow">Student Work</p>
          <h3>Give Assessments</h3>
        </div>
      </div>
      <form id="assessment-form" class="stack-form" autocomplete="off">
        <div class="two-col">
          <label class="field">
            <span>Title</span>
            <input id="assessment-title" type="text" required>
          </label>
          <label class="field">
            <span>Due date</span>
            <input id="assessment-due" type="date" required>
          </label>
        </div>
        <label class="field">
          <span>Instructions</span>
          <textarea id="assessment-description" rows="3" required></textarea>
        </label>
        <button class="primary-button" type="submit">Assign To Selected Class</button>
        <p id="assessment-message" class="form-message" aria-live="polite"></p>
      </form>
      <div class="cards-grid">
        ${items.length ? items.map((item) => `
          <article class="record">
            <div>
              <h4>${escapeHtml(item.title)}</h4>
              <p>Due: ${escapeHtml(item.dueDate)} - ${escapeHtml(className(item.classId))}</p>
            </div>
            <div><p>${escapeHtml(item.description)}</p></div>
          </article>
        `).join("") : `<div class="state-card"><h2>No assessments</h2><p>No assessments assigned for this selection.</p></div>`}
      </div>
    </div>
  `;
}

function renderTeacherClassroom() {
  const departmentId = q("#teacher-department")?.value || "";
  const classId = q("#teacher-class")?.value || "";
  const items = state.classroomPosts.filter((item) => (
    (!departmentId || item.departmentId === departmentId) &&
    (!classId || item.classId === classId)
  ));

  const panel = q("#teacher-classroom-panel");
  if (!panel) return;

  panel.innerHTML = `
    <div class="stack-form">
      <div class="panel-title">
        <div>
          <p class="eyebrow">Classroom</p>
          <h3>Announcements</h3>
        </div>
      </div>
      <form id="classroom-form" class="stack-form" autocomplete="off">
        <label class="field">
          <span>Announcement Title</span>
          <input id="classroom-title" type="text" required>
        </label>
        <label class="field">
          <span>Message</span>
          <textarea id="classroom-message" rows="3" required></textarea>
        </label>
        <button class="primary-button" type="submit">Post Announcement</button>
        <p id="classroom-post-message" class="form-message" aria-live="polite"></p>
      </form>
      <div class="cards-grid">
        ${items.length ? items.map((item) => `
          <article class="record">
            <div>
              <h4>${escapeHtml(item.title)}</h4>
              <p>${escapeHtml(item.teacherName)} - ${escapeHtml(item.date)}</p>
            </div>
            <div><p>${escapeHtml(item.message)}</p></div>
          </article>
        `).join("") : `<div class="state-card"><h2>No classroom posts</h2><p>No announcements posted for this selection.</p></div>`}
      </div>
    </div>
  `;
}

function renderStudentPage(student) {
  currentStudent = student;
  if (q("#student-heading")) q("#student-heading").textContent = student.name;
  renderStudentProfile(student);
  renderStudentNews();
  renderStudentTimetable();
  renderStudentClassroom();
  renderStudentResults();
  switchStudentSection(activeStudentSection);
  showView("student");
}

function renderStudentProfile(student) {
  const attendanceItems = state.attendance.filter((item) => item.rollNumber === student.rollNumber);
  const presentCount = attendanceItems.filter((item) => item.status === "Present").length;
  const attendancePercent = attendanceItems.length ? Math.round((presentCount / attendanceItems.length) * 100) : 0;

  const profileEl = q("#student-profile");
  if (!profileEl) return;

  profileEl.innerHTML = `
    <div class="profile-grid">
      <article class="profile-hero wide">
        <div class="student-avatar-frame"><img src="${escapeHtml(studentAvatarUrl(student))}" alt="${escapeHtml(student.name)} profile avatar"></div>
        <div>
          <p class="eyebrow">Student Profile</p>
          <h3>${escapeHtml(student.name)}</h3>
          <p class="muted">${escapeHtml(student.rollNumber)} · ${escapeHtml(className(student.classId))}</p>
          <span class="verified-chip">Verified student record</span>
        </div>
        <div class="profile-hero-note"><span>Avatar source</span><strong>Admin-managed record</strong></div>
      </article>
      <article class="info-card wide">
        <p class="eyebrow">Academic details</p>
        <div class="details-grid">
          <span>Department</span><strong>${escapeHtml(departmentName(student.departmentId))}</strong>
          <span>Class</span><strong>${escapeHtml(className(student.classId))}</strong>
          <span>Admission type</span><strong>${escapeHtml(student.admissionType || "Regular")}</strong>
          <span>Date of birth</span><strong>${escapeHtml(student.dob)}</strong>
          <span>Email</span><strong>${escapeHtml(student.email || "Not added")}</strong>
          <span>Phone</span><strong>${escapeHtml(student.phone || "Not added")}</strong>
        </div>
      </article>
      <article class="info-card">
        <p class="eyebrow">Parent Details</p>
        <h3>${escapeHtml(student.parentName || "Not added")}</h3>
        <p>${escapeHtml(student.parentPhone || "No parent phone added")}</p>
      </article>
      <article class="info-card">
        <p class="eyebrow">Attendance</p>
        <h3>${attendancePercent}%</h3>
        <p>${presentCount} present days from ${attendanceItems.length} marked days.</p>
      </article>
    </div>
  `;
}

function renderStudentNews() {
  const panel = q("#student-news");
  if (!panel) return;
  const items = state.news
    .filter((item) => item.audience !== "Teachers Only")
    .slice(0, 20);
  panel.innerHTML = items.length
    ? items.map((item) => `
      <article class="info-card">
        <div class="panel-title">
          <div>
            <p class="eyebrow">Campus News</p>
            <h3>${escapeHtml(item.title)}</h3>
          </div>
          <span class="muted">${escapeHtml(item.date)}</span>
        </div>
        <p class="muted">${escapeHtml(item.audience)}</p>
        <p>${escapeHtml(item.body)}</p>
      </article>
    `).join("")
    : `<div class="state-card"><h2>No news yet</h2><p>News bulletins will appear here.</p></div>`;
}

function renderStudentTimetable() {
  const panel = q("#student-timetable");
  if (!panel || !currentStudent) return;
  const classItems = state.classSchedules.filter((item) => matchesStudentScope(item, currentStudent));
  const examItems = state.schedules.filter((item) => matchesStudentScope(item, currentStudent));
  const approvalBadge = '<span class="hod-approved">✓ HOD Approved</span>';

  panel.innerHTML = `
    <div class="panel-title"><div><p class="eyebrow">Academic Planner</p><h3>Time Table</h3></div></div>
    <div class="timetable-grid">
      <section class="timetable-group">
        <header><div><p class="eyebrow">Weekly learning plan</p><h4>Class Schedule</h4></div>${approvalBadge}</header>
        <div class="schedule-list">
          ${classItems.length ? classItems.map((item) => `
            <article class="schedule-row"><span class="schedule-day">${escapeHtml(item.day)}</span><div><strong>${escapeHtml(item.subject)}</strong><small>${escapeHtml(item.faculty)} · ${escapeHtml(item.venue)}</small></div><time>${escapeHtml(item.time)}</time></article>
          `).join("") : '<p class="muted">No class schedule has been published for your group.</p>'}
        </div>
      </section>
      <section class="timetable-group">
        <header><div><p class="eyebrow">Examination office</p><h4>Exam Schedule</h4></div>${approvalBadge}</header>
        <div class="schedule-list">
          ${examItems.length ? examItems.map((item) => `
            <article class="schedule-row"><span class="schedule-day">Exam</span><div><strong>${escapeHtml(item.exam)}</strong><small>${escapeHtml(item.details)}</small></div><time>${escapeHtml(item.date)}</time></article>
          `).join("") : '<p class="muted">No exam schedule has been published for your group.</p>'}
        </div>
      </section>
    </div>
  `;
}

function renderStudentClassroom() {
  const panel = q("#student-classroom");
  if (!panel || !currentStudent) return;
  const announcements = state.classroomPosts.filter((item) => matchesStudentScope(item, currentStudent));
  const assessments = state.assessments.filter((item) => matchesStudentScope(item, currentStudent));
  const resources = state.resources.filter((item) => matchesStudentScope(item, currentStudent));

  panel.innerHTML = `
    <div class="panel-title"><div><p class="eyebrow">Faculty Workspace</p><h3>Classroom</h3></div></div>
    <div class="classroom-layout">
      <section class="classroom-feed">
        <h4>Faculty updates</h4>
        ${announcements.length ? announcements.map((item) => `
          <article class="classroom-post"><div><p class="eyebrow">Announcement · ${escapeHtml(item.date)}</p><h4>${escapeHtml(item.title)}</h4></div><p>${escapeHtml(item.message)}</p><small>Posted by ${escapeHtml(item.teacherName)}</small></article>
        `).join("") : '<p class="muted">No classroom announcements yet.</p>'}
      </section>
      <section class="classroom-resources" id="classroom-resources">
        <h4>Links &amp; documents</h4>
        ${resources.map((item) => `
          <a class="resource-node" href="${escapeHtml(safeDocumentLink(item.url, "#classroom-resources"))}"><span class="resource-filetype">${escapeHtml(item.type)}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.description)} · Uploaded by ${escapeHtml(item.uploadedBy)}</small></span><span aria-hidden="true">↗</span></a>
        `).join("")}
        ${assessments.map((item) => `
          <a class="resource-node" href="#assessment-${escapeHtml(item.id)}"><span class="resource-filetype">TASK</span><span><strong>${escapeHtml(item.title)}</strong><small>Due ${escapeHtml(item.dueDate)} · ${escapeHtml(item.description)}</small></span><span aria-hidden="true">↗</span></a>
        `).join("") || '<p class="muted">No faculty resources have been uploaded yet.</p>'}
      </section>
    </div>
  `;
}

function renderStudentResults() {
  const panel = q("#student-results");
  if (!panel || !currentStudent) return;
  const studentResults = state.results.filter((item) => item.rollNumber === currentStudent.rollNumber);

  panel.innerHTML = studentResults.length
    ? studentResults.map((result) => {
      const summary = resultSummary(result);
      return `
        <article class="info-card">
          <div class="marksheet-top">
            <div>
              <p class="eyebrow">Verified Result</p>
              <h3>${escapeHtml(result.exam)}</h3>
              <p class="muted">Published: ${escapeHtml(result.publishedDate || today())}</p>
            </div>
            <div class="pass-badge ${summary.status === "Pass" ? "" : "fail"}">${summary.status}</div>
          </div>
          <div class="score-grid">
            <div><span>Total</span><strong>${summary.total}/${summary.max}</strong></div>
            <div><span>Percentage</span><strong>${summary.percent}%</strong></div>
            <div><span>GPA</span><strong>${summary.gpa}</strong></div>
          </div>
          <div class="report-card-node">
            <div class="report-pdf-mark" aria-hidden="true">PDF</div>
            <div><p class="eyebrow">Institutional report card</p><strong>${escapeHtml(result.reportCard?.name || "Report card awaiting administration upload")}</strong><small>${result.reportCard ? `Uploaded by ${escapeHtml(result.reportCard.uploadedBy)} · ${escapeHtml(result.reportCard.uploadedDate)}` : "Only Administration can upload a verified PDF report card."}</small></div>
            ${result.reportCard?.url ? `<a class="ghost-button small-button" href="${escapeHtml(safeDocumentLink(result.reportCard.url))}" aria-label="Open secure report card PDF">Open secure PDF</a>` : '<span class="report-pending">Pending</span>'}
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Marks</th>
                  <th>Credits</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${(result.subjects || []).map((sub) => `
                  <tr>
                    <td>${escapeHtml(sub.name)}</td>
                    <td>${escapeHtml(sub.code || "CS")}</td>
                    <td><strong>${sub.mark}</strong></td>
                    <td>${sub.credit || 3}</td>
                    <td>${escapeHtml(sub.grade || "-")}</td>
                    <td>${escapeHtml(sub.status || "Pass")}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </article>
      `;
    }).join("")
    : `<div class="state-card"><h2>No published results</h2><p>No examination results have been published for your roll number.</p></div>`;
}

function switchStudentSection(section) {
  activeStudentSection = section;
  qa("[data-student-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.studentSection === section);
  });
  ["profile", "timetable", "classroom", "results", "news", "review", "support", "settings"].forEach((name) => {
    const el = q(`#student-${name}`);
    if (el) el.classList.toggle("hidden", name !== section);
  });
}

function switchTeacherSection(section) {
  activeTeacherSection = section;
  qa("[data-teacher-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.teacherSection === section);
  });
  ["students", "attendance", "assessments", "classroom"].forEach((name) => {
    const el = q(`#teacher-${name}-panel`);
    if (el) el.classList.toggle("hidden", name !== section);
  });
}

function switchAdminSection(section) {
  activeAdminSection = section;
  qa("[data-admin-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminSection === section);
  });
  ["admission", "staff", "reviews", "records", "results", "structure", "parents", "news"].forEach((name) => {
    const el = q(`#admin-${name}`);
    if (el) el.classList.toggle("hidden", name !== section);
  });
}

function renderStudentSelectors() {
  if (q("#student-login")) q("#student-login").classList.toggle("hidden", loginMode !== "student");
  if (q("#management-login")) q("#management-login").classList.toggle("hidden", loginMode !== "management");
}

function resetStudentForm() {
  if (q("#student-form")) q("#student-form").reset();
  if (q("#editing-student-roll")) q("#editing-student-roll").value = "";
  if (q("#student-editor-title")) q("#student-editor-title").textContent = "Admit Student";
  if (q("#student-form-message")) q("#student-form-message").textContent = "";
  syncAllSelects();
}

function resetStaffForm() {
  if (q("#staff-form")) q("#staff-form").reset();
  if (q("#editing-staff-id")) q("#editing-staff-id").value = "";
  if (q("#staff-editor-title")) q("#staff-editor-title").textContent = "Add Staff";
  if (q("#staff-form-message")) q("#staff-form-message").textContent = "";
  syncAllSelects();
}

function resetDepartmentForm() {
  if (q("#department-form")) q("#department-form").reset();
  if (q("#editing-department-id")) q("#editing-department-id").value = "";
  if (q("#department-editor-title")) q("#department-editor-title").textContent = "Add Department";
  if (q("#department-form-message")) q("#department-form-message").textContent = "";
}

function resetClassForm() {
  if (q("#class-form")) q("#class-form").reset();
  if (q("#editing-class-id")) q("#editing-class-id").value = "";
  if (q("#class-editor-title")) q("#class-editor-title").textContent = "Add Class";
  if (q("#class-form-message")) q("#class-form-message").textContent = "";
  syncAllSelects();
}

function addResultRow(subject = {}) {
  const container = q("#result-subjects");
  if (!container) return;
  const row = document.createElement("div");
  row.className = "two-col";
  row.style.gap = "8px";
  row.style.marginBottom = "8px";
  row.innerHTML = `
    <input class="result-subject-name" type="text" placeholder="Subject Name" value="${escapeHtml(subject.name || "")}" required>
    <input class="result-subject-code" type="text" placeholder="Subject Code" value="${escapeHtml(subject.code || "")}">
    <input class="result-subject-mark" type="number" min="0" max="100" placeholder="Marks (0-100)" value="${escapeHtml(subject.mark ?? "")}" required>
    <input class="result-subject-credit" type="number" min="1" max="6" placeholder="Credits" value="${escapeHtml(subject.credit || "3")}" required>
  `;
  container.appendChild(row);
}

function resetResultSubjects() {
  const container = q("#result-subjects");
  if (!container) return;
  container.innerHTML = "";
  addResultRow({ name: "Data Structures", code: "CS101", mark: 85, credit: 4 });
  addResultRow({ name: "Digital Logic", code: "EC102", mark: 78, credit: 3 });
}

function collectStudent() {
  return {
    name: q("#student-name-input").value.trim(),
    rollNumber: q("#student-roll-input").value.trim(),
    dob: q("#student-dob-input").value,
    email: q("#student-email-input").value.trim(),
    departmentId: q("#student-department-input").value,
    classId: q("#student-class-input").value,
    phone: q("#student-phone-input").value.trim(),
    parentName: q("#student-parent-input").value.trim(),
    parentPhone: q("#student-parent-phone-input").value.trim(),
    address: q("#student-address-input").value.trim(),
    admissionType: q("#admission-type-input").value
  };
}

function collectStaff() {
  return {
    id: q("#editing-staff-id").value || uid("staff"),
    name: q("#staff-name-input").value.trim(),
    role: q("#staff-role-input").value,
    username: q("#staff-username-input").value.trim(),
    password: q("#staff-password-input").value.trim(),
    departmentId: q("#staff-department-input").value,
    classId: q("#staff-class-input").value,
    subject: q("#staff-subject-input").value.trim(),
    phone: q("#staff-phone-input").value.trim()
  };
}

function editStudent(rollNumber) {
  const student = studentByRoll(rollNumber);
  if (!student) return;
  q("#editing-student-roll").value = student.rollNumber;
  q("#student-name-input").value = student.name;
  q("#student-roll-input").value = student.rollNumber;
  q("#student-dob-input").value = student.dob;
  q("#student-email-input").value = student.email || "";
  q("#student-department-input").value = student.departmentId || "";
  syncClassSelect(q("#student-class-input"), student.departmentId, { includeEmpty: true });
  q("#student-class-input").value = student.classId || "";
  q("#student-phone-input").value = student.phone || "";
  q("#student-parent-input").value = student.parentName || "";
  q("#student-parent-phone-input").value = student.parentPhone || "";
  q("#student-address-input").value = student.address || "";
  q("#admission-type-input").value = student.admissionType || "Regular";
  q("#student-editor-title").textContent = "Edit Student Record";
  switchAdminSection("admission");
}

function editStaff(id) {
  const staff = state.staff.find((s) => s.id === id);
  if (!staff) return;
  q("#editing-staff-id").value = staff.id;
  q("#staff-name-input").value = staff.name;
  q("#staff-role-input").value = staff.role;
  q("#staff-username-input").value = staff.username;
  q("#staff-password-input").value = staff.password;
  q("#staff-department-input").value = staff.departmentId || "";
  syncClassSelect(q("#staff-class-input"), staff.departmentId, { includeEmpty: true });
  q("#staff-class-input").value = staff.classId || "";
  q("#staff-subject-input").value = staff.subject || "";
  q("#staff-phone-input").value = staff.phone || "";
  q("#staff-editor-title").textContent = "Edit Staff Member";
  switchAdminSection("staff");
}

function editDepartment(id) {
  const department = state.departments.find((d) => d.id === id);
  if (!department) return;
  q("#editing-department-id").value = department.id;
  q("#department-name-input").value = department.name;
  q("#department-code-input").value = department.code;
  q("#department-editor-title").textContent = "Edit Department";
  switchAdminSection("structure");
}

function editClass(id) {
  const classItem = state.classes.find((c) => c.id === id);
  if (!classItem) return;
  q("#editing-class-id").value = classItem.id;
  q("#class-department-input").value = classItem.departmentId;
  q("#class-name-input").value = classItem.name;
  q("#class-year-input").value = classItem.year;
  q("#class-section-input").value = classItem.section;
  q("#class-editor-title").textContent = "Edit Class";
  switchAdminSection("structure");
}

function saveStudent() {
  const editingRoll = q("#editing-student-roll").value;
  const student = collectStudent();

  if (!student.name || !student.rollNumber || !student.dob || !student.departmentId || !student.classId) {
    showMessage(q("#student-form-message"), "Fill student name, roll number, DOB, department, and class.");
    return;
  }
  if (state.students.some((item) => item.rollNumber === student.rollNumber && item.rollNumber !== editingRoll)) {
    showMessage(q("#student-form-message"), "This roll number already exists.");
    return;
  }

  if (editingRoll) {
    state.students = state.students.map((item) => item.rollNumber === editingRoll ? student : item);
    if (editingRoll !== student.rollNumber) {
      ["attendance", "results", "reviews", "parents"].forEach((collection) => {
        state[collection] = state[collection].map((item) => (
          item.rollNumber === editingRoll ? { ...item, rollNumber: student.rollNumber } : item
        ));
      });
    }
  } else {
    state.students.push(student);
  }
  saveState();
  resetStudentForm();
  renderAdminPage();
  showMessage(q("#student-form-message"), editingRoll ? "Student record updated." : "Student admitted successfully.", "success");
}

function saveStaff() {
  const staff = collectStaff();
  const editingId = q("#editing-staff-id").value;
  if (!staff.name || !staff.username || !staff.password || !staff.role) {
    showMessage(q("#staff-form-message"), "Fill staff name, role, username, and password.");
    return;
  }
  if (state.staff.some((item) => item.username === staff.username && item.id !== editingId)) {
    showMessage(q("#staff-form-message"), "This staff username already exists.");
    return;
  }
  state.staff = editingId
    ? state.staff.map((item) => item.id === editingId ? staff : item)
    : [...state.staff, staff];
  saveState();
  resetStaffForm();
  renderAdminPage();
  showMessage(q("#staff-form-message"), editingId ? "Staff record updated." : "Staff member added.", "success");
}

function saveDepartment() {
  const editingId = q("#editing-department-id").value;
  const department = {
    id: editingId || uid("dept"),
    name: q("#department-name-input").value.trim(),
    code: q("#department-code-input").value.trim().toUpperCase()
  };
  if (!department.name || !department.code) {
    showMessage(q("#department-form-message"), "Fill department name and code.");
    return;
  }
  if (state.departments.some((item) => item.code.toUpperCase() === department.code && item.id !== editingId)) {
    showMessage(q("#department-form-message"), "A department with this code already exists.");
    return;
  }
  state.departments = editingId
    ? state.departments.map((item) => item.id === editingId ? department : item)
    : [...state.departments, department];
  saveState();
  resetDepartmentForm();
  renderAdminPage();
  showMessage(q("#department-form-message"), editingId ? "Department updated." : "Department saved.", "success");
}

function saveClass() {
  const editingId = q("#editing-class-id").value;
  const classItem = {
    id: editingId || uid("class"),
    departmentId: q("#class-department-input").value,
    name: q("#class-name-input").value.trim(),
    year: q("#class-year-input").value.trim(),
    section: q("#class-section-input").value.trim().toUpperCase()
  };
  if (!classItem.departmentId || !classItem.name || !classItem.year || !classItem.section) {
    showMessage(q("#class-form-message"), "Fill department, class name, year, and section.");
    return;
  }
  const isDuplicate = state.classes.some((item) => (
    item.id !== editingId &&
    item.departmentId === classItem.departmentId &&
    item.name.toLowerCase() === classItem.name.toLowerCase() &&
    item.year === classItem.year &&
    item.section.toUpperCase() === classItem.section
  ));
  if (isDuplicate) {
    showMessage(q("#class-form-message"), "This class, year, and section already exist in the department.");
    return;
  }
  state.classes = editingId
    ? state.classes.map((item) => item.id === editingId ? classItem : item)
    : [...state.classes, classItem];
  saveState();
  resetClassForm();
  renderAdminPage();
  showMessage(q("#class-form-message"), editingId ? "Class updated." : "Class saved.", "success");
}

function saveParent() {
  const rollNumber = q("#parent-roll-input").value.trim();
  if (!studentByRoll(rollNumber)) {
    showMessage(q("#parent-form-message"), "Enter the roll number of an admitted student.");
    return;
  }
  state.parents.unshift({
    id: uid("parent"),
    name: q("#parent-name-input").value.trim(),
    rollNumber,
    role: q("#parent-role-input").value.trim(),
    contact: q("#parent-contact-input").value.trim(),
    notes: q("#parent-notes-input").value.trim()
  });
  saveState();
  q("#parent-form").reset();
  renderAdminPage();
  showMessage(q("#parent-form-message"), "PTA Member added.", "success");
}

function saveNews() {
  state.news.unshift({
    id: uid("news"),
    title: q("#news-title-input").value.trim(),
    audience: q("#news-audience-input").value,
    body: q("#news-body-input").value.trim(),
    date: today()
  });
  saveState();
  q("#news-form").reset();
  renderAdminPage();
  showMessage(q("#news-form-message"), "Bulletin published.", "success");
}

function saveSchedule() {
  state.schedules.unshift({
    id: uid("schedule"),
    exam: q("#schedule-exam-input").value.trim(),
    date: q("#schedule-date-input").value,
    departmentId: q("#schedule-department-input").value,
    classId: q("#schedule-class-input").value,
    details: q("#schedule-details-input").value.trim()
  });
  saveState();
  q("#schedule-form").reset();
  renderAdminPage();
  showMessage(q("#schedule-form-message"), "Schedule published.", "success");
}

function gradeFromMark(mark) {
  if (mark >= 90) return "S";
  if (mark >= 80) return "A+";
  if (mark >= 70) return "A";
  if (mark >= 60) return "B+";
  if (mark >= 55) return "B";
  if (mark >= 50) return "C+";
  if (mark >= 45) return "C";
  return "U";
}

function saveResult() {
  const subjects = qa("#result-subjects .two-col")
    .map((row) => {
      const name = row.querySelector(".result-subject-name")?.value.trim();
      const code = row.querySelector(".result-subject-code")?.value.trim();
      const mark = Number(row.querySelector(".result-subject-mark")?.value);
      const credit = Number(row.querySelector(".result-subject-credit")?.value) || 3;
      return {
        name,
        code,
        mark,
        credit,
        grade: gradeFromMark(mark),
        status: mark >= 40 ? "Pass" : "RA"
      };
    })
    .filter((subject) => subject.name && Number.isFinite(subject.mark));

  const rollNumber = q("#result-student-input")?.value;
  const exam = q("#result-exam-input")?.value.trim();
  if (!rollNumber || !exam || !subjects.length) {
    showMessage(q("#result-form-message"), "Select student, enter exam, and add subject marks.");
    return;
  }

  state.results.unshift({
    id: uid("result"),
    rollNumber,
    exam,
    subjects,
    publishedDate: today()
  });
  saveState();
  q("#result-form").reset();
  resetResultSubjects();
  renderAdminPage();
  showMessage(q("#result-form-message"), "Result published successfully.", "success");
}

function removeStudent(rollNumber) {
  const student = studentByRoll(rollNumber);
  if (!student) return;
  const confirmed = window.confirm(`Delete ${student.name}'s record? Their attendance, results, reviews, and PTA entry will also be removed.`);
  if (!confirmed) return;
  state.students = state.students.filter((student) => student.rollNumber !== rollNumber);
  state.attendance = state.attendance.filter((item) => item.rollNumber !== rollNumber);
  state.results = state.results.filter((item) => item.rollNumber !== rollNumber);
  state.reviews = state.reviews.filter((item) => item.rollNumber !== rollNumber);
  state.parents = state.parents.filter((item) => item.rollNumber !== rollNumber);
  saveState();
  renderAdminPage();
  showToast("Student record and related data deleted.");
}

function removeStaff(id) {
  const staff = state.staff.find((item) => item.id === id);
  if (!staff || !window.confirm(`Delete ${staff.name}'s staff account?`)) return;
  state.staff = state.staff.filter((staff) => staff.id !== id);
  saveState();
  renderAdminPage();
  showToast("Staff account deleted.");
}

function removeDepartment(id) {
  const department = state.departments.find((item) => item.id === id);
  if (!department) return;
  const inUse = state.classes.some((item) => item.departmentId === id) ||
    state.students.some((item) => item.departmentId === id) ||
    state.staff.some((item) => item.departmentId === id) ||
    state.schedules.some((item) => item.departmentId === id) ||
    state.assessments.some((item) => item.departmentId === id) ||
    state.classroomPosts.some((item) => item.departmentId === id);
  if (inUse) {
    showToast("This department is still used by people, classes, or academic items.", "error");
    return;
  }
  if (!window.confirm(`Delete ${department.name}?`)) return;
  state.departments = state.departments.filter((department) => department.id !== id);
  saveState();
  renderAdminPage();
  showToast("Department deleted.");
}

function removeClass(id) {
  const classItem = state.classes.find((item) => item.id === id);
  if (!classItem) return;
  const inUse = state.students.some((item) => item.classId === id) ||
    state.staff.some((item) => item.classId === id) ||
    state.schedules.some((item) => item.classId === id) ||
    state.assessments.some((item) => item.classId === id) ||
    state.classroomPosts.some((item) => item.classId === id);
  if (inUse) {
    showToast("This class is still used by people or published academic items.", "error");
    return;
  }
  if (!window.confirm(`Delete ${className(id)}?`)) return;
  state.classes = state.classes.filter((klass) => klass.id !== id);
  saveState();
  renderAdminPage();
  showToast("Class deleted.");
}

function removeParent(id) {
  if (!window.confirm("Delete this PTA member?")) return;
  state.parents = state.parents.filter((parent) => parent.id !== id);
  saveState();
  renderAdminPage();
  showToast("PTA member deleted.");
}

function removeResult(id) {
  if (!window.confirm("Delete this published result?")) return;
  state.results = state.results.filter((result) => result.id !== id);
  saveState();
  renderAdminPage();
  showToast("Result deleted.");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

function exportCsv() {
  const header = ["Name", "Roll Number", "DOB", "Department", "Class", "Admission Type", "Phone", "Parent", "Parent Phone"];
  const rows = state.students.map((student) => [
    student.name,
    student.rollNumber,
    student.dob,
    departmentName(student.departmentId),
    className(student.classId),
    student.admissionType || "Regular",
    student.phone || "",
    student.parentName || "",
    student.parentPhone || ""
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  downloadFile("campus-students.csv", csv, "text/csv");
}

function exportJson() {
  downloadFile("campus-management-data.json", JSON.stringify(state, null, 2), "application/json");
}

document.addEventListener("DOMContentLoaded", () => {
  applyPreferences();

  const colorScheme = window.matchMedia?.("(prefers-color-scheme: dark)");
  colorScheme?.addEventListener?.("change", () => {
    if (preferences.theme === "system") applyPreferences();
  });

  q("#student-theme-select")?.addEventListener("change", (event) => {
    updatePreferences({ theme: event.target.value });
  });
  q("#student-large-text-toggle")?.addEventListener("change", (event) => {
    updatePreferences({ largeText: event.target.checked });
  });
  q("#student-reduced-motion-toggle")?.addEventListener("change", (event) => {
    updatePreferences({ reducedMotion: event.target.checked });
  });
  const geminiKeyInput = q("#user-gemini-api-key");
  if (geminiKeyInput) geminiKeyInput.value = localStorage.getItem("user_gemini_api_key") || "";
  q("#student-settings-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    localStorage.setItem("user_gemini_api_key", q("#user-gemini-api-key").value);
    savePreferences();
    showMessage(q("#student-settings-message"), "Local settings saved to this browser.", "success");
  });

  // Login Role Switching
  qa("[data-login-tab]").forEach((button) => button.addEventListener("click", () => {
    loginMode = button.dataset.loginTab;
    setActiveTab(qa("[data-login-tab]"), button);
    renderStudentSelectors();
    showMessage(q("#login-message"), "");
  }));

  qa("[data-management-role]").forEach((button) => button.addEventListener("click", () => {
    managementRole = button.dataset.managementRole;
    setActiveTab(qa("[data-management-role]"), button);
    const submitButton = q("#management-login-submit");
    if (submitButton) submitButton.textContent = `Open ${managementRole === "admin" ? "Administration" : managementRole === "hod" ? "HOD" : "Teacher"} Portal`;
    showMessage(q("#login-message"), "");
  }));

  // Workspace Navigation Tabs
  document.addEventListener("click", (event) => {
    const studentTab = event.target.closest("[data-student-section]");
    const teacherTab = event.target.closest("[data-teacher-section]");
    const adminTab = event.target.closest("[data-admin-section]");

    if (studentTab) switchStudentSection(studentTab.dataset.studentSection);
    if (teacherTab) switchTeacherSection(teacherTab.dataset.teacherSection);
    if (adminTab) switchAdminSection(adminTab.dataset.adminSection);
  });

  // Login Form Submissions
  q("#student-login")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const rollNumber = q("#student-roll").value.trim();
    const dob = q("#student-dob").value;
    const record = state.students.find((item) => item.rollNumber.toLowerCase() === rollNumber.toLowerCase() && item.dob === dob);

    if (!record) {
      showMessage(q("#login-message"), "No matching student record found. Use demo roll 2026CSE01 and DOB 2004-05-15.");
      return;
    }
    currentStudent = record;
    activeStudentSection = "profile";
    renderStudentPage(record);
  });

  q("#management-login")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = q("#management-username").value.trim();
    const password = q("#management-password").value;

    if (managementRole === "teacher") {
      const staffUser = state.staff.find((item) => item.role === "Teacher" && item.username === username && item.password === password);
      if ((username === TEACHER_USERNAME && password === TEACHER_PASSWORD) || staffUser) {
        currentTeacher = staffUser || { name: "Dr. Sarah Jenkins", departmentId: "dept-cse", classId: "class-cse-1a" };
        teacherFilters = {
          departmentId: currentTeacher.departmentId || "",
          classId: currentTeacher.classId || "",
          attendanceDate: today()
        };
        activeTeacherSection = "students";
        renderTeacherPage();
        return;
      }
    }

    if (managementRole === "admin") {
      const staffUser = state.staff.find((item) => item.role === "Administration" && item.username === username && item.password === password);
      const defaultAdmin = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
      if (defaultAdmin || staffUser) {
        activeAdminSection = "admission";
        renderAdminPage();
        return;
      }
    }

    if (managementRole === "hod" && username === HOD_USERNAME && password === HOD_PASSWORD) {
      showView("hod");
      return;
    }

    showMessage(q("#login-message"), "Invalid management credentials.");
  });

  // Student Environment Review
  q("#review-stars")?.addEventListener("click", (event) => {
    const star = event.target.closest("[data-review-star]");
    if (star) updateReviewStars(star.dataset.reviewStar, true);
  });
  q("#review-stars")?.addEventListener("pointerover", (event) => {
    const star = event.target.closest("[data-review-star]");
    if (star) updateReviewStars(star.dataset.reviewStar);
  });
  q("#review-stars")?.addEventListener("pointerleave", () => {
    updateReviewStars(q("#review-rating")?.value || 0);
  });
  q("#review-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!currentStudent) return;
    const rating = q("#review-rating").value;
    if (!rating) {
      showMessage(q("#review-message"), "Choose a star rating before submitting your review.");
      return;
    }
    state.reviews.unshift({
      id: uid("review"),
      rollNumber: currentStudent.rollNumber,
      rating: `${rating} / 5`,
      area: q("#review-area").value,
      text: q("#review-text").value.trim(),
      date: today()
    });
    saveState();
    q("#review-form").reset();
    updateReviewStars(0, true);
    showMessage(q("#review-message"), "Review submitted successfully.", "success");
  });

  // Teacher Workspace Listeners
  q("#teacher-view")?.addEventListener("change", (event) => {
    if (event.target.id === "teacher-department") {
      teacherFilters.departmentId = event.target.value;
      teacherFilters.classId = "";
      renderTeacherPage();
    }
    if (event.target.id === "teacher-class") {
      teacherFilters.classId = event.target.value;
      renderTeacherPage();
    }
    if (event.target.id === "attendance-date") {
      teacherFilters.attendanceDate = event.target.value || today();
      renderTeacherPage();
    }
  });

  q("#teacher-view")?.addEventListener("submit", (event) => {
    if (event.target.id === "attendance-form") {
      event.preventDefault();
      const date = q("#attendance-date")?.value || today();
      teacherFilters.attendanceDate = date;
      const rows = qa("[data-attendance-roll]");
      state.attendance = state.attendance.filter((item) => (
        item.date !== date || !rows.some((row) => row.dataset.attendanceRoll === item.rollNumber)
      ));
      rows.forEach((row) => {
        state.attendance.push({
          id: uid("att"),
          date,
          rollNumber: row.dataset.attendanceRoll,
          status: row.checked ? "Present" : "Absent",
          teacherName: currentTeacher?.name || "Teacher"
        });
      });
      saveState();
      showMessage(q("#attendance-message"), "Attendance saved successfully.", "success");
    }

    if (event.target.id === "assessment-form") {
      event.preventDefault();
      state.assessments.unshift({
        id: uid("assessment"),
        title: q("#assessment-title").value.trim(),
        dueDate: q("#assessment-due").value,
        description: q("#assessment-description").value.trim(),
        departmentId: q("#teacher-department")?.value || "",
        classId: q("#teacher-class")?.value || "",
        teacherName: currentTeacher?.name || "Teacher",
        date: today()
      });
      saveState();
      renderTeacherAssessments();
      showMessage(q("#assessment-message"), "Assessment assigned.", "success");
    }

    if (event.target.id === "classroom-form") {
      event.preventDefault();
      state.classroomPosts.unshift({
        id: uid("post"),
        title: q("#classroom-title").value.trim(),
        message: q("#classroom-message").value.trim(),
        departmentId: q("#teacher-department")?.value || "",
        classId: q("#teacher-class")?.value || "",
        teacherName: currentTeacher?.name || "Teacher",
        date: today()
      });
      saveState();
      renderTeacherClassroom();
      showMessage(q("#classroom-post-message"), "Announcement posted.", "success");
    }
  });

  // Admin Workspace Listeners
  q("#admin-view")?.addEventListener("change", (event) => {
    if (event.target.id === "student-department-input") syncClassSelect(q("#student-class-input"), q("#student-department-input").value, { includeEmpty: true });
    if (event.target.id === "staff-department-input") syncClassSelect(q("#staff-class-input"), q("#staff-department-input").value, { includeEmpty: true });
    if (event.target.id === "schedule-department-input") syncClassSelect(q("#schedule-class-input"), q("#schedule-department-input").value, { includeAll: true });
    if (event.target.id === "result-department-input") {
      syncClassSelect(q("#result-class-input"), q("#result-department-input").value, { includeAll: true });
      syncResultStudentSelect();
    }
    if (event.target.id === "result-class-input") syncResultStudentSelect();
  });

  q("#admin-view")?.addEventListener("input", (event) => {
    if (event.target.id === "student-search") renderStudents();
    if (event.target.id === "record-search") renderRecordsEditor();
  });

  q("#admin-view")?.addEventListener("click", (event) => {
    const deleteStudentBtn = event.target.closest("[data-delete-student]");
    const editStudentBtn = event.target.closest("[data-edit-student]");
    const deleteStaffBtn = event.target.closest("[data-delete-staff]");
    const editStaffBtn = event.target.closest("[data-edit-staff]");
    const deleteDepartmentBtn = event.target.closest("[data-delete-department]");
    const editDepartmentBtn = event.target.closest("[data-edit-department]");
    const deleteClassBtn = event.target.closest("[data-delete-class]");
    const editClassBtn = event.target.closest("[data-edit-class]");
    const deleteParentBtn = event.target.closest("[data-delete-parent]");
    const deleteResultBtn = event.target.closest("[data-delete-result]");

    if (deleteStudentBtn) removeStudent(deleteStudentBtn.dataset.deleteStudent);
    if (editStudentBtn) editStudent(editStudentBtn.dataset.editStudent);
    if (deleteStaffBtn) removeStaff(deleteStaffBtn.dataset.deleteStaff);
    if (editStaffBtn) editStaff(editStaffBtn.dataset.editStaff);
    if (deleteDepartmentBtn) removeDepartment(deleteDepartmentBtn.dataset.deleteDepartment);
    if (editDepartmentBtn) editDepartment(editDepartmentBtn.dataset.editDepartment);
    if (deleteClassBtn) removeClass(deleteClassBtn.dataset.deleteClass);
    if (editClassBtn) editClass(editClassBtn.dataset.editClass);
    if (deleteParentBtn) removeParent(deleteParentBtn.dataset.deleteParent);
    if (deleteResultBtn) removeResult(deleteResultBtn.dataset.deleteResult);

    if (event.target.id === "add-result-subject") addResultRow();
  });

  q("#admin-view")?.addEventListener("submit", (event) => {
    if (event.target.id === "student-form") {
      event.preventDefault();
      saveStudent();
    }
    if (event.target.id === "staff-form") {
      event.preventDefault();
      saveStaff();
    }
    if (event.target.id === "department-form") {
      event.preventDefault();
      saveDepartment();
    }
    if (event.target.id === "class-form") {
      event.preventDefault();
      saveClass();
    }
    if (event.target.id === "parent-form") {
      event.preventDefault();
      saveParent();
    }
    if (event.target.id === "news-form") {
      event.preventDefault();
      saveNews();
    }
    if (event.target.id === "schedule-form") {
      event.preventDefault();
      saveSchedule();
    }
    if (event.target.id === "result-form") {
      event.preventDefault();
      saveResult();
    }
  });

  q("#reset-student-form")?.addEventListener("click", resetStudentForm);
  q("#reset-staff-form")?.addEventListener("click", resetStaffForm);
  q("#reset-department-form")?.addEventListener("click", resetDepartmentForm);
  q("#reset-class-form")?.addEventListener("click", resetClassForm);
  q("#export-json")?.addEventListener("click", exportJson);
  q("#export-csv")?.addEventListener("click", exportCsv);

  qa(".logout-button").forEach((button) => button.addEventListener("click", () => {
    currentStudent = null;
    currentTeacher = null;
    showMessage(q("#login-message"), "");
    showView("login");
  }));

  syncAllSelects();
  resetResultSubjects();
});
