const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Admin@2026";
const LEGACY_ADMIN_USERNAME = "collegeadmin";
const LEGACY_ADMIN_PASSWORD = "College@2026";
const TEACHER_USERNAME = "teacher";
const TEACHER_PASSWORD = "Teacher@2026";
const STORAGE_KEY = "campusManagementPortal.v1";

const emptyState = {
  students: [],
  staff: [],
  departments: [],
  classes: [],
  news: [],
  schedules: [],
  assessments: [],
  classroomPosts: [],
  reviews: [],
  attendance: [],
  results: [],
  parents: []
};

let state = loadState();
let loginMode = "student";
let managementRole = "teacher";
let currentStudent = null;
let currentTeacher = null;
let activeStudentSection = "profile";
let activeTeacherSection = "students";
let activeAdminSection = "admission";

const q = (selector) => document.querySelector(selector);
const qa = (selector) => [...document.querySelectorAll(selector)];

const views = {
  login: q("#login-view"),
  student: q("#student-view"),
  teacher: q("#teacher-view"),
  admin: q("#admin-view")
};

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return { ...emptyState, ...stored };
  } catch {
    return { ...emptyState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function showView(name) {
  Object.entries(views).forEach(([key, view]) => {
    view.classList.toggle("hidden", key !== name);
  });
}

function showMessage(element, message, type = "error") {
  element.textContent = message;
  element.dataset.type = type;
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

function syncDepartmentSelect(select, options = {}) {
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
    q("#schedule-department-input")
  ];

  departmentSelects.forEach((select) => {
    if (!select) return;
    const includeAll = select.id === "teacher-department" || select.id === "schedule-department-input";
    syncDepartmentSelect(select, { includeAll, includeEmpty: !includeAll });
  });

  syncClassSelect(q("#student-class-input"), q("#student-department-input")?.value, { includeEmpty: true });
  syncClassSelect(q("#staff-class-input"), q("#staff-department-input")?.value, { includeEmpty: true });
  syncClassSelect(q("#teacher-class"), q("#teacher-department")?.value, { includeAll: true });
  syncClassSelect(q("#schedule-class-input"), q("#schedule-department-input")?.value, { includeAll: true });
  syncResultStudentSelect();
}

function syncResultStudentSelect() {
  const select = q("#result-student-input");
  if (!select) return;
  select.innerHTML = state.students.length
    ? state.students.map((student) => (
      `<option value="${escapeHtml(student.rollNumber)}">${escapeHtml(student.name)} - ${escapeHtml(student.rollNumber)}</option>`
    )).join("")
    : '<option value="">Admit students first</option>';
}

function setActiveTab(buttons, activeButton) {
  buttons.forEach((button) => button.classList.toggle("active", button === activeButton));
}

function getMarks(record) {
  return record.subjects.map((subject) => Number(subject.mark));
}

function getSummary(record) {
  const marks = getMarks(record);
  const total = marks.reduce((sum, mark) => sum + mark, 0);
  const max = marks.length * 100;
  const percent = max ? Math.round((total / max) * 100) : 0;
  const passed = marks.length > 0 && marks.every((mark) => mark >= 40);
  return { total, max, percent, passed };
}

function getGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  return "D";
}

function renderMarksheet(record) {
  const summary = getSummary(record);
  const subjectRows = record.subjects.map((subject) => `
    <div class="subject-row">
      <span>${escapeHtml(subject.name)}</span>
      <div class="bar" aria-hidden="true"><span style="width: ${subject.mark}%"></span></div>
      <strong>${subject.mark}</strong>
    </div>
  `).join("");

  return `
    <div class="marksheet-top">
      <div>
        <p class="eyebrow">Verified Result</p>
        <h2>${escapeHtml(record.name)}</h2>
        <p class="muted">${escapeHtml(record.rollNumber)} - ${escapeHtml(record.exam)}</p>
      </div>
      <div class="pass-badge ${summary.passed ? "" : "fail"}">${summary.passed ? "Pass" : "Review"}</div>
    </div>
    <div class="score-grid">
      <div><span>Total</span><strong>${summary.total}/${summary.max}</strong></div>
      <div><span>Percentage</span><strong>${summary.percent}%</strong></div>
      <div><span>Grade</span><strong>${getGrade(summary.percent)}</strong></div>
    </div>
    <div class="subject-list">${subjectRows}</div>
    <div class="marksheet-footer">
      <span>Issued ${new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date())}</span>
      <span>Digital record</span>
    </div>
  `;
}

function renderAdmin() {
  renderStats();
  renderRecords();
}

function renderStats() {
  const summaries = state.students.map((student) => {
    const subjects = state.results.filter((result) => result.rollNumber === student.rollNumber).flatMap((result) => result.subjects);
    const total = subjects.reduce((sum, subject) => sum + (subject.mark || 0), 0);
    const max = subjects.length * 100;
    return { percent: max ? Math.round((total / max) * 100) : 0 };
  });
  const passed = summaries.filter((summary) => summary.percent >= 50).length;
  const average = summaries.length
    ? Math.round(summaries.reduce((sum, summary) => sum + summary.percent, 0) / summaries.length)
    : 0;

  q("#stat-students").textContent = state.students.length;
  q("#stat-passed").textContent = passed;
  q("#stat-review").textContent = state.students.length - passed;
  q("#stat-average").textContent = `${average}%`;
}

function renderRecords() {
  const query = q("#record-search").value.trim().toLowerCase();
  const filtered = state.students.filter((record) => (
    record.name.toLowerCase().includes(query) ||
    record.rollNumber.toLowerCase().includes(query) ||
    record.exam.toLowerCase().includes(query)
  ));

  if (!filtered.length) {
    q("#records-list").innerHTML = `
      <div class="state-card">
        <h2>No record found</h2>
        <p>Add a student result from the editor to make it available for student login.</p>
      </div>
    `;
    return;
  }

  q("#records-list").innerHTML = filtered.map((record) => {
    const summary = getSummary(record);
    return `
      <article class="record">
        <div>
          <h4>${escapeHtml(record.name)}</h4>
          <p>${escapeHtml(record.rollNumber)} - ${escapeHtml(record.exam)}</p>
        </div>
        <div class="record-score">
          <strong>${summary.percent}%</strong>
          <span>${summary.passed ? "Pass" : "Review"}</span>
        </div>
        <div class="actions-inline">
          <button type="button" data-edit="${escapeHtml(record.rollNumber)}">Edit</button>
          <button type="button" data-delete="${escapeHtml(record.rollNumber)}">Delete</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderTeacherStudentView() {
  const departmentId = q("#teacher-department").value;
  const classId = q("#teacher-class").value;
  const students = state.students.filter((student) => (
    (!departmentId || student.departmentId === departmentId) &&
    (!classId || student.classId === classId)
  ));

  if (!students.length) {
    q("#teacher-students-panel").innerHTML = `
      <div class="state-card">
        <h2>No students found</h2>
        <p>Select a department and class.</p>
      </div>
    `;
    return;
  }

  q("#teacher-students-panel").innerHTML = `
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
  const departmentId = q("#teacher-department").value;
  const classId = q("#teacher-class").value;
  const students = state.students.filter((student) => (
    (!departmentId || student.departmentId === departmentId) &&
    (!classId || student.classId === classId)
  ));

  if (!students.length) {
    q("#teacher-attendance-panel").innerHTML = `
      <div class="state-card">
        <h2>No students found</h2>
        <p>Select a department and class.</p>
      </div>
    `;
    return;
  }

  const date = q("#attendance-date").value || today();

  q("#teacher-attendance-panel").innerHTML = `
    <div class="panel-title">
      <div>
        <p class="eyebrow">Daily Register</p>
        <h3>Take Attendance</h3>
      </div>
      <label class="field compact-field">
        <span>Date</span>
        <input id="attendance-date" type="date" value="${date}">
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
            <input type="checkbox" data-attendance-roll="${escapeHtml(student.rollNumber)}">
          </label>
        `).join("")}
      </div>
      <button class="primary-button" type="submit">Save Attendance</button>
      <p id="attendance-message" class="form-message"></p>
    </form>
  `;
}

function renderTeacherAssessments() {
  const departmentId = q("#teacher-department").value;
  const classId = q("#teacher-class").value;
  const items = state.assessments.filter((item) => (
    (!departmentId || item.departmentId === departmentId) &&
    (!classId || item.classId === classId)
  ));

  q("#teacher-assessments-panel").innerHTML = `
    <div class="stack-form">
      <div class="panel-title">
        <div>
          <p class="eyebrow">Student Work</p>
          <h3>Give Assessments</h3>
        </div>
      </div>
      <form id="assessment-form" class="stack-form">
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
          <textarea id="assessment-description" rows="4" required></textarea>
        </label>
        <button class="primary-button" type="submit">Assign To Selected Class</button>
        <p id="assessment-message" class="form-message"></p>
      </form>
      <div class="cards-grid">
        ${items.map((item) => `
          <article class="record">
            <div>
              <h4>${escapeHtml(item.title)}</h4>
              <p>${escapeHtml(item.dueDate)} - ${escapeHtml(className(item.classId))}</p>
            </div>
            <div><p>${escapeHtml(item.description)}</p></div>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function renderTeacherClassroom() {
  const departmentId = q("#teacher-department").value;
  const classId = q("#teacher-class").value;
  const items = state.classroomPosts.filter((item) => (
    (!departmentId || item.departmentId === departmentId) &&
    (!classId || item.classId === classId)
  ));

  q("#teacher-classroom-panel").innerHTML = `
    <div class="stack-form">
      <div class="panel-title">
        <div>
          <p class="eyebrow">Classroom</p>
          <h3>Announcements</h3>
        </div>
      </div>
      <form id="classroom-form" class="stack-form">
        <label class="field">
          <span>Announcement title</span>
          <input id="classroom-title" type="text" required>
        </label>
        <label class="field">
          <span>Message</span>
          <textarea id="classroom-message" rows="4" required></textarea>
        </label>
        <button class="primary-button" type="submit">Post To Classroom</button>
        <p id="classroom-post-message" class="form-message"></p>
      </form>
      <div class="cards-grid">
        ${items.map((item) => `
          <article class="record">
            <div>
              <h4>${escapeHtml(item.title)}</h4>
              <p>${escapeHtml(item.teacherName)} - ${escapeHtml(item.date)}</p>
            </div>
            <div><p>${escapeHtml(item.message)}</p></div>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function renderStudentPage(student) {
  currentStudent = student;
  q("#student-heading").textContent = student.name;
  renderStudentProfile(student);
  renderStudentNews(student);
  renderStudentSchedule(student);
  renderStudentAssessments(student);
  renderStudentClassroom(student);
  renderStudentResults(student);
  switchStudentSection(activeStudentSection);
  showView("student");
}

function renderStudentProfile(student) {
  const attendanceItems = state.attendance.filter((item) => item.rollNumber === student.rollNumber);
  const presentCount = attendanceItems.filter((item) => item.status === "Present").length;
  const attendancePercent = attendanceItems.length ? Math.round((presentCount / attendanceItems.length) * 100) : 0;

  q("#student-profile").innerHTML = `
    <div class="profile-grid">
      <article class="info-card wide">
        <p class="eyebrow">Student Profile</p>
        <h3>${escapeHtml(student.name)}</h3>
        <div class="details-grid">
          <span>Roll number</span><strong>${escapeHtml(student.rollNumber)}</strong>
          <span>Department</span><strong>${escapeHtml(departmentName(student.departmentId))}</strong>
          <span>Class</span><strong>${escapeHtml(className(student.classId))}</strong>
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
  const items = state.news.slice(0, 20);
  q("#student-news").innerHTML = items.length
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
    : `<div class="state-card"><h2>No news yet</h2><p>News and files posted by administration will appear here.</p></div>`;
}

function renderStudentSchedule() {
  const items = state.schedules.filter((item) => item.departmentId === currentStudent.departmentId || !item.departmentId);
  q("#student-schedule").innerHTML = items.length
    ? items.map((item) => `
      <article class="info-card">
        <div class="panel-title">
          <div>
            <p class="eyebrow">Exam Schedule</p>
            <h3>${escapeHtml(item.exam)}</h3>
          </div>
          <span class="muted">${escapeHtml(item.date)}</span>
        </div>
        <p>${escapeHtml(item.details)}</p>
      </article>
    `).join("")
    : `<div class="state-card"><h2>No schedule yet</h2><p>No exam schedule has been published for your department.</p></div>`;
}

function renderStudentAssessments() {
  const items = state.assessments.filter((item) => item.departmentId === currentStudent.departmentId || !item.departmentId);
  q("#student-assessments").innerHTML = items.length
    ? items.map((item) => `
      <article class="info-card">
        <div class="panel-title">
          <div>
            <p class="eyebrow">Assessment</p>
            <h3>${escapeHtml(item.title)}</h3>
          </div>
          <span class="muted">Due ${escapeHtml(item.dueDate)}</span>
        </div>
        <p>${escapeHtml(item.description)}</p>
      </article>
    `).join("")
    : `<div class="state-card"><h2>No assessments yet</h2><p>Assessments assigned to your class will appear here.</p></div>`;
}

function renderStudentClassroom() {
  const items = state.classroomPosts.filter((item) => item.departmentId === currentStudent.departmentId || !item.departmentId);
  q("#student-classroom").innerHTML = items.length
    ? items.map((item) => `
      <article class="info-card">
        <div class="panel-title">
          <div>
            <p class="eyebrow">Classroom</p>
            <h3>${escapeHtml(item.title)}</h3>
          </div>
          <span class="muted">${escapeHtml(item.date)}</span>
        </div>
        <p>${escapeHtml(item.message)}</p>
        <p class="muted">${escapeHtml(item.teacherName)}</p>
      </article>
    `).join("")
    : `<div class="state-card"><h2>No announcements yet</h2><p>Teacher announcements will appear here.</p></div>`;
}

function renderStudentResults() {
  const regular = state.results.filter((item) => item.rollNumber === currentStudent.rollNumber && item.resultType === "regular");
  const arrear = state.results.filter((item) => item.rollNumber === currentStudent.rollNumber && item.resultType === "arrear");

  const renderTable = (items, emptyText) => items.length
    ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Semester</th>
              <th>Subject Code</th>
              <th>Grade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${items.flatMap((result) => result.subjects.map((subject) => `
              <tr>
                <td>Semester ${escapeHtml(result.semester)}</td>
                <td>${escapeHtml(subject.code)}</td>
                <td>${escapeHtml(subject.grade)}</td>
                <td>${escapeHtml(subject.status)}</td>
              </tr>
            `)).join("")}
          </tbody>
        </table>
      </div>
    `
    : `<div class="state-card"><h2>No results</h2><p>${escapeHtml(emptyText)}</p></div>`;

  q("#student-results").innerHTML = `
    <div class="split-results">
      <section class="info-card">
        <div class="panel-title"><div><p class="eyebrow">Regular Results</p><h3>Semesters 1 - 7</h3></div></div>
        ${renderTable(regular, "No regular results have been published yet.")}
      </section>
      <section class="info-card">
        <div class="panel-title"><div><p class="eyebrow">Arrear Results</p><h3>Reattempts</h3></div></div>
        ${renderTable(arrear, "No arrear results have been published yet.")}
      </section>
    </div>
  `;
}

function switchStudentSection(section) {
  activeStudentSection = section;
  qa("[data-student-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.studentSection === section);
  });
  ["profile", "news", "schedule", "assessments", "classroom", "results", "review"].forEach((name) => {
    q(`#student-${name}`).classList.toggle("hidden", name !== section);
  });
}

function switchTeacherSection(section) {
  activeTeacherSection = section;
  qa("[data-teacher-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.teacherSection === section);
  });
  ["students", "attendance", "assessments", "classroom"].forEach((name) => {
    q(`#teacher-${name}-panel`).classList.toggle("hidden", name !== section);
  });
}

function switchAdminSection(section) {
  activeAdminSection = section;
  qa("[data-admin-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminSection === section);
  });
  ["admission", "staff", "reviews", "records", "results", "structure", "parents", "news"].forEach((name) => {
    q(`#admin-${name}`).classList.toggle("hidden", name !== section);
  });
}

function renderTeacherPage(staffUser = null) {
  currentTeacher = staffUser || { name: "Teacher", departmentId: "", classId: "", subject: "" };
  syncAllSelects();
  if (currentTeacher.departmentId) q("#teacher-department").value = currentTeacher.departmentId;
  syncClassSelect(q("#teacher-class"), q("#teacher-department").value, { includeAll: true });
  if (currentTeacher.classId) q("#teacher-class").value = currentTeacher.classId;
  q("#attendance-date").value = today();
  renderTeacherStudentView();
  renderTeacherAttendance();
  renderTeacherAssessments();
  renderTeacherClassroom();
  switchTeacherSection(activeTeacherSection);
  showView("teacher");
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
  q("#stat-students").textContent = state.students.length;
  q("#stat-staff").textContent = state.staff.length;
  q("#stat-departments").textContent = state.departments.length;
  q("#stat-reviews").textContent = state.reviews.length;
}

function renderStudents() {
  const query = q("#student-search").value.trim().toLowerCase();
  const students = state.students.filter((student) => (
    student.name.toLowerCase().includes(query) ||
    student.rollNumber.toLowerCase().includes(query) ||
    departmentName(student.departmentId).toLowerCase().includes(query) ||
    className(student.classId).toLowerCase().includes(query)
  ));

  q("#admin-student-list").innerHTML = renderStudentRecords(students);
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
  q("#staff-list").innerHTML = state.staff.length
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
    : `<div class="state-card"><h2>No staff records</h2><p>No staff records have been added.</p></div>`;
}

function renderReviews() {
  q("#reviews-list").innerHTML = state.reviews.length
    ? state.reviews.map((review) => `
      <article class="info-card">
        <h4>${escapeHtml(review.area)} - ${escapeHtml(review.rating)}</h4>
        <p class="muted">${escapeHtml(studentName(review.rollNumber))} - ${escapeHtml(review.date)}</p>
        <p>${escapeHtml(review.text)}</p>
      </article>
    `).join("")
    : `<div class="state-card"><h2>No reviews</h2><p>Student environment reviews will appear here.</p></div>`;
}

function renderRecordsEditor() {
  q("#records-editor-list").innerHTML = renderStudentRecords(state.students);
}

function renderResults() {
  q("#results-list").innerHTML = state.results.length
    ? state.results.map((result) => {
      const summary = resultSummary(result);
      return `
        <article class="record">
          <div>
            <h4>${escapeHtml(result.exam)}</h4>
            <p>${escapeHtml(studentName(result.rollNumber))} - ${escapeHtml(result.rollNumber)}</p>
          </div>
          <div class="record-score">
            <strong>${escapeHtml(summary.gpa)}</strong>
            <span>${escapeHtml(summary.status)}</span>
          </div>
          <div class="actions-inline">
            <button type="button" data-delete-result="${escapeHtml(result.id)}">Delete</button>
          </div>
        </article>
      `;
    }).join("")
    : `<div class="state-card"><h2>No results</h2><p>Published results will appear here.</p></div>`;
}

function renderDepartments() {
  q("#department-list").innerHTML = state.departments.length
    ? state.departments.map((department) => `
      <article class="record">
        <div><h4>${escapeHtml(department.name)}</h4><p>${escapeHtml(department.code)}</p></div>
        <div class="record-score"><strong>${state.classes.filter((item) => item.departmentId === department.id).length}</strong><span>Classes</span></div>
        <div class="actions-inline">
          <button type="button" data-edit-department="${escapeHtml(department.id)}">Edit</button>
          <button type="button" data-delete-department="${escapeHtml(department.id)}">Delete</button>
        </div>
      </article>
    `).join("")
    : `<div class="state-card"><h2>No departments</h2><p>Add departments before admitting students.</p></div>`;
}

function renderClasses() {
  q("#class-list").innerHTML = state.classes.length
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
  q("#parents-list").innerHTML = state.parents.length
    ? state.parents.map((parent) => `
      <article class="record">
        <div><h4>${escapeHtml(parent.name)}</h4><p>${escapeHtml(studentName(parent.rollNumber))} - ${escapeHtml(parent.rollNumber)}</p></div>
        <div class="record-score"><strong>${escapeHtml(parent.role)}</strong><span>${escapeHtml(parent.contact)}</span></div>
        <div class="actions-inline"><button type="button" data-delete-parent="${escapeHtml(parent.id)}">Delete</button></div>
      </article>
    `).join("")
    : `<div class="state-card"><h2>No parent members</h2><p>Parent association members will appear here.</p></div>`;
}

function renderNewsAndSchedules() {
  q("#news-list").innerHTML = state.news.length
    ? state.news.map((item) => `
      <article class="info-card">
        <h4>${escapeHtml(item.title)}</h4>
        <p class="muted">${escapeHtml(item.audience)} - ${escapeHtml(item.date)}</p>
        <p>${escapeHtml(item.body)}</p>
      </article>
    `).join("")
    : `<div class="state-card"><h2>No news</h2><p>No news announcements posted.</p></div>`;

  q("#schedule-list").innerHTML = state.schedules.length
    ? state.schedules.map((item) => `
      <article class="info-card">
        <h4>${escapeHtml(item.exam)}</h4>
        <p class="muted">${escapeHtml(item.date)} - ${escapeHtml(departmentName(item.departmentId))} - ${escapeHtml(className(item.classId))}</p>
        <p>${escapeHtml(item.details)}</p>
      </article>
    `).join("")
    : `<div class="state-card"><h2>No schedules</h2><p>No exam schedules published.</p></div>`;
}

function resetEditor() {
  q("#record-form").reset();
  q("#editing-roll").value = "";
  q("#editor-title").textContent = "Add Student Result";
  q("#records-editor-list").innerHTML = "";
  q(".subjects-editor").innerHTML = "";
  addSubjectRow();
  addSubjectRow();
  addSubjectRow();
}

function addSubjectRow(subject = "", mark = "") {
  const row = document.createElement("div");
  row.className = "subject-input-row";
  row.innerHTML = `
    <input class="subject-name" type="text" placeholder="Subject" value="${escapeHtml(subject)}">
    <input class="subject-mark" type="number" min="0" max="100" placeholder="Marks" value="${escapeHtml(mark)}">
  `;
  q(".subjects-editor").appendChild(row);
}

function collectRecord() {
  const subjects = [...qa(".subject-input-row")]
    .map((row) => ({
      name: row.querySelector(".subject-name").value.trim(),
      mark: Number(row.querySelector(".subject-mark").value)
    }))
    .filter((subject) => subject.name && Number.isFinite(subject.mark));

  return {
    name: q("#record-name").value.trim(),
    rollNumber: q("#record-roll").value.trim(),
    dob: q("#record-dob").value,
    exam: q("#record-exam").value,
    subjects
  };
}

function validateRecord(record, editingRoll) {
  if (!record.name || !record.rollNumber || !record.dob || !record.exam) {
    return "Fill in all student details.";
  }

  if (state.students.some((item) => item.rollNumber === record.rollNumber && item.rollNumber !== editingRoll)) {
    return "That roll number already exists.";
  }

  if (!record.subjects.length) {
    return "Add at least one subject and mark.";
  }

  if (record.subjects.some((subject) => subject.mark < 0 || subject.mark > 100)) {
    return "Marks must be between 0 and 100.";
  }

  return "";
}

function renderTeacherView() {
  syncAllSelects();
  const student = selectedTeacherStudent();
  q("#teacher-students-panel").innerHTML = student
    ? `
      <div class="profile-grid">
        <article class="info-card wide">
          <div class="panel-title">
            <div>
              <p class="eyebrow">Student Profile</p>
              <h3>${escapeHtml(student.name)}</h3>
            </div>
            <div class="badge">${escapeHtml(student.rollNumber)}</div>
          </div>
          <div class="details-grid">
            <span>Department</span><strong>${escapeHtml(departmentName(student.departmentId))}</strong>
            <span>Class</span><strong>${escapeHtml(className(student.classId))}</strong>
            <span>Attendance</span><strong>${attendanceSummary(student).percent}%</strong>
            <span>Performance</span><strong>${performanceSummary(student).avg}</strong>
          </div>
        </article>
        <article class="info-card">
          <p class="eyebrow">Performance</p>
          <h3>${performanceSummary(student).avg}</h3>
          <p>${performanceSummary(student).arrears} arrear result(s)</p>
        </article>
        <article class="info-card">
          <p class="eyebrow">Attendance</p>
          <h3>${attendanceSummary(student).percent}%</h3>
          <p>${attendanceSummary(student).present} present days of ${attendanceSummary(student).total}</p>
        </article>
      </div>
    `
    : `<div class="state-card"><h2>Student Profile</h2><p>Select a department, class, and student to view profile data.</p></div>`;

  q("#teacher-attendance-panel").innerHTML = renderTeacherAttendanceContent();
  q("#teacher-assessments-panel").innerHTML = renderTeacherAssessmentsContent();
  q("#teacher-classroom-panel").innerHTML = renderTeacherClassroomContent();
  syncAllSelects();
  switchTeacherSection(activeTeacherSection);
  showView("teacher");
}

function performanceSummary(student) {
  const results = state.results.filter((item) => item.rollNumber === student.rollNumber && item.resultType === "regular");
  const subjects = results.flatMap((result) => result.subjects);
  const avg = subjects.length
    ? (subjects.reduce((sum, subject) => sum + (subject.mark || 0), 0) / subjects.length).toFixed(2)
    : "0.00";
  const arrears = state.results.filter((item) => item.rollNumber === student.rollNumber && item.resultType === "arrear").length;
  return { avg, arrears, attendance: attendanceSummary(student) };
}

function attendanceSummary(student) {
  const rows = state.attendance.filter((item) => item.rollNumber === student.rollNumber);
  const total = rows.length;
  const present = rows.filter((row) => row.status === "Present").length;
  return {
    total,
    present,
    percent: total ? Math.round((present / total) * 100) : 0
  };
}

function renderTeacherAttendanceContent() {
  const students = teacherStudents();
  if (!students.length) {
    return `<div class="state-card"><h2>Take Attendance</h2><p>Select a department and class.</p></div>`;
  }
  const date = q("#attendance-date")?.value || today();
  return `
    <div class="panel-title">
      <div>
        <p class="eyebrow">Daily Register</p>
        <h3>Take Attendance</h3>
      </div>
      <label class="field compact-field">
        <span>Date</span>
        <input id="attendance-date" type="date" value="${date}">
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
            <input type="checkbox" data-attendance-roll="${escapeHtml(student.rollNumber)}">
          </label>
        `).join("")}
      </div>
      <button class="primary-button" type="submit">Save Attendance</button>
      <p id="attendance-message" class="form-message"></p>
    </form>
  `;
}

function renderTeacherAssessmentsContent() {
  const departmentId = q("#teacher-department").value;
  const classId = q("#teacher-class").value;
  const items = state.assessments.filter((item) => (
    (!departmentId || item.departmentId === departmentId) &&
    (!classId || item.classId === classId)
  ));
  return `
    <div class="stack-form">
      <div class="panel-title">
        <div>
          <p class="eyebrow">Student Work</p>
          <h3>Give Assessments</h3>
        </div>
      </div>
      <form id="assessment-form" class="stack-form">
        <div class="two-col">
          <label class="field">
            <span>Title</span>
            <input id="assessment-title" type="text">
          </label>
          <label class="field">
            <span>Due date</span>
            <input id="assessment-due" type="date">
          </label>
        </div>
        <label class="field">
          <span>Instructions</span>
          <input id="assessment-description" type="text">
        </label>
        <button class="primary-button" type="submit">Assign</button>
        <p id="assessment-message" class="form-message"></p>
      </form>
      <div class="cards-grid">
        ${items.length ? items.map((item) => `
          <article class="record">
            <div>
              <h4>${escapeHtml(item.title)}</h4>
              <p>${escapeHtml(item.dueDate)} - ${escapeHtml(className(item.classId))}</p>
            </div>
            <div><p>${escapeHtml(item.description)}</p></div>
          </article>
        `).join("") : `<div class="state-card"><h2>No assessments</h2><p>No assessments have been assigned for the selected class.</p></div>`}
      </div>
    </div>
  `;
}

function renderTeacherClassroomContent() {
  const departmentId = q("#teacher-department").value;
  const classId = q("#teacher-class").value;
  const items = state.classroomPosts.filter((item) => (
    (!departmentId || item.departmentId === departmentId) &&
    (!classId || item.classId === classId)
  ));
  return `
    <div class="stack-form">
      <div class="panel-title">
        <div>
          <p class="eyebrow">Classroom</p>
          <h3>Announcements</h3>
        </div>
      </div>
      <form id="classroom-form" class="stack-form">
        <label class="field">
          <span>Title</span>
          <input id="classroom-title" type="text">
        </label>
        <label class="field">
          <span>Message</span>
          <textarea id="classroom-message" rows="4"></textarea>
        </label>
        <button class="primary-button" type="submit">Post</button>
        <p id="classroom-post-message" class="form-message"></p>
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
        `).join("") : `<div class="state-card"><h2>No classroom posts</h2><p>No announcements have been posted for this selection.</p></div>`}
      </div>
    </div>
  `;
}

function selectedTeacherStudents() {
  return state.students.filter((student) => (
    (!q("#teacher-department").value || student.departmentId === q("#teacher-department").value) &&
    (!q("#teacher-class").value || student.classId === q("#teacher-class").value)
  ));
}

function selectedTeacherStudent() {
  return studentByRoll(q("#teacher-student")?.value);
}

function teacherStudents() {
  const departmentId = q("#teacher-department").value;
  const classId = q("#teacher-class").value;
  return state.students.filter((student) => (
    (!departmentId || student.departmentId === departmentId) &&
    (!classId || student.classId === classId)
  ));
}

function renderStudentSelectors() {
  q("#student-login").classList.toggle("hidden", loginMode !== "student");
  q("#management-login").classList.toggle("hidden", loginMode !== "management");
}

function updateCutoffVisibility() {
  const show = q("#admission-type-input").value !== "Lateral";
  q(".cutoff-field").classList.toggle("hidden", !show);
}

function resetStudentForm() {
  q("#student-form").reset();
  q("#editing-student-roll").value = "";
  q("#student-editor-title").textContent = "Admit Student";
  q("#student-form-message").textContent = "";
  syncAllSelects();
}

function resetStaffForm() {
  q("#staff-form").reset();
  q("#editing-staff-id").value = "";
  q("#staff-editor-title").textContent = "Add Staff";
  q("#staff-form-message").textContent = "";
  syncAllSelects();
}

function resetDepartmentForm() {
  q("#department-form").reset();
  q("#editing-department-id").value = "";
  q("#department-editor-title").textContent = "Add Department";
  q("#department-form-message").textContent = "";
}

function resetClassForm() {
  q("#class-form").reset();
  q("#editing-class-id").value = "";
  q("#class-editor-title").textContent = "Add Class";
  q("#class-form-message").textContent = "";
  syncAllSelects();
}

function addResultRow(subject = {}) {
  const row = document.createElement("div");
  row.className = "result-subject-row";
  row.innerHTML = `
    <input class="result-subject-name" type="text" placeholder="Subject" value="${escapeHtml(subject.name || "")}">
    <input class="result-subject-mark" type="number" min="0" max="100" placeholder="Marks" value="${escapeHtml(subject.mark || "")}">
    <input class="result-subject-credit" type="number" min="1" max="6" placeholder="Credits" value="${escapeHtml(subject.credit || "3")}">
  `;
  q("#result-subjects").appendChild(row);
}

function resetResultSubjects() {
  q("#result-subjects").innerHTML = "";
  addResultRow();
  addResultRow();
  addResultRow();
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
    address: q("#student-address-input").value.trim()
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

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportCsv() {
  const header = ["Name", "Roll Number", "DOB", "Department", "Class", "Phone", "Parent", "Parent Phone"];
  const rows = state.students.map((student) => [
    student.name,
    student.rollNumber,
    student.dob,
    departmentName(student.departmentId),
    className(student.classId),
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

function handleLoginTabs() {
  qa("[data-login-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      loginMode = button.dataset.loginTab;
      setActiveTab(qa("[data-login-tab]"), button);
      renderStudentSelectors();
      showMessage(q("#login-message"), "");
    });
  });

  qa("[data-management-role]").forEach((button) => {
    button.addEventListener("click", () => {
      managementRole = button.dataset.managementRole;
      setActiveTab(qa("[data-management-role]"), button);
      showMessage(q("#login-message"), "");
    });
  });
}

function attachTabHandlers() {
  document.addEventListener("click", (event) => {
    const student = event.target.closest("[data-student-section]");
    const teacher = event.target.closest("[data-teacher-section]");
    const admin = event.target.closest("[data-admin-section]");
    if (student) switchStudentSection(student.dataset.studentSection);
    if (teacher) switchTeacherSection(teacher.dataset.teacherSection);
    if (admin) switchAdminSection(admin.dataset.adminSection);
  });
}

function attachFormHandlers() {
  q("#student-login").addEventListener("submit", (event) => {
    event.preventDefault();
    const rollNumber = q("#student-roll").value.trim();
    const dob = q("#student-dob").value;
    const record = state.students.find((item) => item.rollNumber === rollNumber && item.dob === dob);

    if (!record) {
      showMessage(q("#login-message"), "No matching student record found.");
      return;
    }

    activeStudentSection = "profile";
    renderStudentPage(record);
  });

  q("#management-login").addEventListener("submit", (event) => {
    event.preventDefault();
    const username = q("#management-username").value.trim();
    const password = q("#management-password").value;

    if (managementRole === "teacher") {
      const staffUser = state.staff.find((item) => item.role === "Teacher" && item.username === username && item.password === password);
      if ((username === TEACHER_USERNAME && password === TEACHER_PASSWORD) || staffUser) {
        activeTeacherSection = "students";
        renderTeacherPage(staffUser);
        return;
      }
    }

    if (managementRole === "admin") {
      const staffUser = state.staff.find((item) => item.role === "Administration" && item.username === username && item.password === password);
      const defaultAdmin = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
      const legacyAdmin = username === LEGACY_ADMIN_USERNAME && password === LEGACY_ADMIN_PASSWORD;
      if (defaultAdmin || legacyAdmin || staffUser) {
        activeAdminSection = "admission";
        renderAdminPage();
        return;
      }
    }

    showMessage(q("#login-message"), "Invalid management credentials.");
  });

  q("#review-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!currentStudent) return;
    state.reviews.unshift({
      id: uid("review"),
      rollNumber: currentStudent.rollNumber,
      rating: q("#review-rating").value,
      area: q("#review-area").value,
      text: q("#review-text").value.trim(),
      date: today(),
      replyText: ""
    });
    saveState();
    q("#review-form").reset();
    showMessage(q("#review-message"), "Review submitted successfully.", "success");
  });

  q("#teacher-view").addEventListener("change", (event) => {
    if (event.target.id === "teacher-department" || event.target.id === "teacher-class" || event.target.id === "attendance-date") {
      renderTeacherPage(currentTeacher);
    }
  });

  q("#teacher-view").addEventListener("submit", (event) => {
    if (event.target.id === "attendance-form") {
      event.preventDefault();
      const date = q("#attendance-date").value || today();
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
      showMessage(q("#attendance-message"), "Attendance saved.", "success");
    }

    if (event.target.id === "assessment-form") {
      event.preventDefault();
      state.assessments.unshift({
        id: uid("assessment"),
        title: q("#assessment-title").value.trim(),
        dueDate: q("#assessment-due").value,
        description: q("#assessment-description").value.trim(),
        departmentId: q("#teacher-department").value,
        classId: q("#teacher-class").value,
        teacherName: currentTeacher?.name || "Teacher",
        date: today()
      });
      saveState();
      q("#assessment-form").reset();
      showMessage(q("#assessment-message"), "Assessment assigned.", "success");
      renderTeacherAssessments();
    }

    if (event.target.id === "classroom-form") {
      event.preventDefault();
      state.classroomPosts.unshift({
        id: uid("post"),
        title: q("#classroom-title").value.trim(),
        message: q("#classroom-message").value.trim(),
        departmentId: q("#teacher-department").value,
        classId: q("#teacher-class").value,
        teacherName: currentTeacher?.name || "Teacher",
        date: today()
      });
      saveState();
      q("#classroom-form").reset();
      showMessage(q("#classroom-post-message"), "Classroom announcement posted.", "success");
      renderTeacherClassroom();
    }
  });

  q("#admin-view").addEventListener("change", (event) => {
    if (event.target.id === "admission-type-input") updateCutoffVisibility();
    if (event.target.id === "student-department-input") syncClassSelect(q("#student-class-input"), q("#student-department-input").value, { includeEmpty: true });
    if (event.target.id === "staff-department-input") syncClassSelect(q("#staff-class-input"), q("#staff-department-input").value, { includeEmpty: true });
    if (event.target.id === "schedule-department-input") syncClassSelect(q("#schedule-class-input"), q("#schedule-department-input").value, { includeAll: true });
    if (event.target.id === "result-department-input") {
      syncClassSelect(q("#result-class-input"), q("#result-department-input").value, { includeEmpty: true });
      syncResultStudentSelect();
    }
    if (event.target.id === "result-class-input") syncResultStudentSelect();
    if (event.target.id === "admission-department-filter" || event.target.id === "admission-year-filter" || event.target.id === "admission-class-filter") renderAdmissionPanel();
  });

  q("#admin-view").addEventListener("input", (event) => {
    if (event.target.id === "record-search") renderRecords();
    if (event.target.id === "history-from" || event.target.id === "history-to" || event.target.id === "history-search") renderHistoryList();
  });

  q("#admin-view").addEventListener("click", (event) => {
    const deleteStudent = event.target.closest("[data-delete-student]");
    const editStudentBtn = event.target.closest("[data-edit-student]");
    const deleteStaff = event.target.closest("[data-delete-staff]");
    const editStaffBtn = event.target.closest("[data-edit-staff]");
    const deleteDepartment = event.target.closest("[data-delete-department]");
    const editDepartmentBtn = event.target.closest("[data-edit-department]");
    const deleteClass = event.target.closest("[data-delete-class]");
    const editClassBtn = event.target.closest("[data-edit-class]");
    const deleteParent = event.target.closest("[data-delete-parent]");
    const deleteResult = event.target.closest("[data-delete-result]");
    if (deleteStudent) removeStudent(deleteStudent.dataset.deleteStudent);
    if (editStudentBtn) editStudent(editStudentBtn.dataset.editStudent);
    if (deleteStaff) removeStaff(deleteStaff.dataset.deleteStaff);
    if (editStaffBtn) editStaff(editStaffBtn.dataset.editStaff);
    if (deleteDepartment) removeDepartment(deleteDepartment.dataset.deleteDepartment);
    if (editDepartmentBtn) editDepartment(editDepartmentBtn.dataset.editDepartment);
    if (deleteClass) removeClass(deleteClass.dataset.deleteClass);
    if (editClassBtn) editClass(editClassBtn.dataset.editClass);
    if (deleteParent) removeParent(deleteParent.dataset.deleteParent);
    if (deleteResult) removeResult(deleteResult.dataset.deleteResult);
    if (event.target.id === "add-result-subject") addResultRow();
  });

  q("#admin-view").addEventListener("submit", (event) => {
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

  q("#student-search")?.addEventListener("input", renderStudents);
  q("#reset-student-form")?.addEventListener("click", resetStudentForm);
  q("#reset-staff-form")?.addEventListener("click", resetStaffForm);
  q("#reset-department-form")?.addEventListener("click", resetDepartmentForm);
  q("#reset-class-form")?.addEventListener("click", resetClassForm);
  q("#student-print")?.addEventListener("click", () => window.print());
  q("#export-json")?.addEventListener("click", exportJson);
  q("#export-csv")?.addEventListener("click", exportCsv);
  qa(".logout-button").forEach((button) => button.addEventListener("click", () => {
    currentStudent = null;
    currentTeacher = null;
    showMessage(q("#login-message"), "");
    showView("login");
  }));
}

function saveStudent() {
  const editingRoll = q("#editing-roll").value;
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
  } else {
    state.students.push(student);
  }
  saveState();
  resetStudentForm();
  renderAdminPage();
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
  state.departments = editingId
    ? state.departments.map((item) => item.id === editingId ? department : item)
    : [...state.departments, department];
  saveState();
  resetDepartmentForm();
  renderAdminPage();
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
  state.classes = editingId
    ? state.classes.map((item) => item.id === editingId ? classItem : item)
    : [...state.classes, classItem];
  saveState();
  resetClassForm();
  renderAdminPage();
}

function saveParent() {
  state.parents.unshift({
    id: uid("parent"),
    name: q("#parent-name-input").value.trim(),
    rollNumber: q("#parent-roll-input").value.trim(),
    role: q("#parent-role-input").value.trim(),
    contact: q("#parent-contact-input").value.trim(),
    notes: q("#parent-notes-input").value.trim()
  });
  saveState();
  q("#parent-form").reset();
  renderAdminPage();
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
}

function saveResult() {
  const subjects = qa(".result-subject-row")
    .map((row) => {
      const mark = Number(row.querySelector(".result-subject-mark").value);
      const credit = Number(row.querySelector(".result-subject-credit").value);
      return {
        name: row.querySelector(".result-subject-name").value.trim(),
        mark,
        credit,
        grade: gradeFromMark(mark),
        status: mark >= 40 ? "Pass" : "RA"
      };
    })
    .filter((subject) => subject.name && Number.isFinite(subject.mark) && Number.isFinite(subject.credit));

  const rollNumber = q("#result-student-input").value;
  if (!rollNumber || !q("#result-exam-input").value.trim() || !subjects.length) {
    showMessage(q("#result-form-message"), "Select student, enter exam, and add subject marks.");
    return;
  }

  state.results.push({
    id: uid("result"),
    rollNumber,
    exam: q("#result-exam-input").value.trim(),
    subjects,
    publishedDate: today()
  });
  saveState();
  q("#result-form").reset();
  resetResultSubjects();
  renderAdminPage();
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

function removeStudent(rollNumber) {
  state.students = state.students.filter((student) => student.rollNumber !== rollNumber);
  saveState();
  renderAdminPage();
}

function removeStaff(id) {
  state.staff = state.staff.filter((staff) => staff.id !== id);
  saveState();
  renderAdminPage();
}

function removeDepartment(id) {
  state.departments = state.departments.filter((department) => department.id !== id);
  saveState();
  renderAdminPage();
}

function removeClass(id) {
  state.classes = state.classes.filter((klass) => klass.id !== id);
  saveState();
  renderAdminPage();
}

function removeParent(id) {
  state.parents = state.parents.filter((parent) => parent.id !== id);
  saveState();
  renderAdminPage();
}

function removeResult(id) {
  state.results = state.results.filter((result) => result.id !== id);
  saveState();
  renderAdminPage();
}

function selectedTeacherDepartment() {
  return q("#teacher-department").value;
}

function selectedTeacherClass() {
  return q("#teacher-class").value;
}

function selectedTeacherStudent() {
  return studentByRoll(q("#teacher-student").value);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-login-tab]").forEach((button) => button.addEventListener("click", () => {
    loginMode = button.dataset.loginTab;
    setActiveTab(qa("[data-login-tab]"), button);
    renderStudentSelectors();
    showMessage(q("#login-message"), "");
  }));
  document.querySelectorAll("[data-management-role]").forEach((button) => button.addEventListener("click", () => {
    managementRole = button.dataset.managementRole;
    setActiveTab(qa("[data-management-role]"), button);
    showMessage(q("#login-message"), "");
  }));
  document.querySelectorAll("[data-student-section]").forEach((button) => button.addEventListener("click", () => switchStudentSection(button.dataset.studentSection)));
  document.querySelectorAll("[data-teacher-section]").forEach((button) => button.addEventListener("click", () => switchTeacherSection(button.dataset.teacherSection)));
  document.querySelectorAll("[data-admin-section]").forEach((button) => button.addEventListener("click", () => switchAdminSection(button.dataset.adminSection)));

  q("#student-login").addEventListener("submit", (event) => {
    event.preventDefault();
    const rollNumber = q("#student-roll").value.trim();
    const dob = q("#student-dob").value;
    const record = state.students.find((item) => item.rollNumber === rollNumber && item.dob === dob);
    if (!record) {
      showMessage(q("#login-message"), "No matching student record found.");
      return;
    }
    currentStudent = record;
    activeStudentSection = "profile";
    renderStudentPage(record);
  });

  q("#management-login").addEventListener("submit", (event) => {
    event.preventDefault();
    const username = q("#management-username").value.trim();
    const password = q("#management-password").value;

    if (managementRole === "teacher") {
      const staffUser = state.staff.find((item) => item.role === "Teacher" && item.username === username && item.password === password);
      if ((username === TEACHER_USERNAME && password === TEACHER_PASSWORD) || staffUser) {
        currentTeacher = staffUser || { name: "Teacher", departmentId: "", classId: "" };
        activeTeacherSection = "students";
        renderTeacherPage(currentTeacher);
        return;
      }
    }

    if (managementRole === "admin") {
      const staffUser = state.staff.find((item) => item.role === "Administration" && item.username === username && item.password === password);
      const defaultAdmin = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
      const legacyAdmin = username === LEGACY_ADMIN_USERNAME && password === LEGACY_ADMIN_PASSWORD;
      if (defaultAdmin || legacyAdmin || staffUser) {
        activeAdminSection = "admission";
        renderAdminPage();
        return;
      }
    }

    showMessage(q("#login-message"), "Invalid management credentials.");
  });

  q("#review-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!currentStudent) return;
    state.reviews.unshift({
      id: uid("review"),
      rollNumber: currentStudent.rollNumber,
      rating: q("#review-rating").value,
      area: q("#review-area").value,
      text: q("#review-text").value.trim(),
      date: today(),
      replyText: ""
    });
    saveState();
    q("#review-form").reset();
    showMessage(q("#review-message"), "Review submitted successfully.", "success");
  });

  q("#teacher-view").addEventListener("change", (event) => {
    if (event.target.id === "teacher-department" || event.target.id === "teacher-class") {
      renderTeacherPage(currentTeacher);
    }
    if (event.target.id === "attendance-date") {
      renderTeacherPage(currentTeacher);
    }
  });

  q("#teacher-view").addEventListener("submit", (event) => {
    if (event.target.id === "attendance-form") {
      event.preventDefault();
      const date = q("#attendance-date").value || today();
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
      showMessage(q("#attendance-message"), "Attendance saved.", "success");
    }
    if (event.target.id === "assessment-form") {
      event.preventDefault();
      state.assessments.unshift({
        id: uid("assessment"),
        title: q("#assessment-title").value.trim(),
        dueDate: q("#assessment-due").value,
        description: q("#assessment-description").value.trim(),
        departmentId: q("#teacher-department").value,
        classId: q("#teacher-class").value,
        teacherName: currentTeacher?.name || "Teacher",
        date: today()
      });
      saveState();
      q("#assessment-form").reset();
      showMessage(q("#assessment-message"), "Assessment assigned.", "success");
      renderTeacherAssessments();
    }
    if (event.target.id === "classroom-form") {
      event.preventDefault();
      state.classroomPosts.unshift({
        id: uid("post"),
        title: q("#classroom-title").value.trim(),
        message: q("#classroom-message").value.trim(),
        departmentId: q("#teacher-department").value,
        classId: q("#teacher-class").value,
        teacherName: currentTeacher?.name || "Teacher",
        date: today()
      });
      saveState();
      q("#classroom-form").reset();
      showMessage(q("#classroom-post-message"), "Classroom announcement posted.", "success");
      renderTeacherClassroom();
    }
  });

  q("#admin-view").addEventListener("change", (event) => {
    if (event.target.id === "admission-type-input") updateCutoffVisibility();
    if (event.target.id === "student-department-input") syncClassSelect(q("#student-class-input"), q("#student-department-input").value, { includeEmpty: true });
    if (event.target.id === "staff-department-input") syncClassSelect(q("#staff-class-input"), q("#staff-department-input").value, { includeEmpty: true });
    if (event.target.id === "schedule-department-input") syncClassSelect(q("#schedule-class-input"), q("#schedule-department-input").value, { includeAll: true });
    if (event.target.id === "result-department-input") {
      syncClassSelect(q("#result-class-input"), q("#result-department-input").value, { includeEmpty: true });
      syncResultStudentSelect();
    }
    if (event.target.id === "result-class-input") syncResultStudentSelect();
    if (event.target.id === "admission-department-filter" || event.target.id === "admission-year-filter" || event.target.id === "admission-class-filter") renderAdmissionPanel();
  });

  q("#admin-view").addEventListener("input", (event) => {
    if (event.target.id === "record-search") renderRecords();
  });

  q("#admin-view").addEventListener("click", (event) => {
    const deleteStudent = event.target.closest("[data-delete-student]");
    const editStudentBtn = event.target.closest("[data-edit-student]");
    const deleteStaff = event.target.closest("[data-delete-staff]");
    const editStaffBtn = event.target.closest("[data-edit-staff]");
    const deleteDepartment = event.target.closest("[data-delete-department]");
    const editDepartmentBtn = event.target.closest("[data-edit-department]");
    const deleteClass = event.target.closest("[data-delete-class]");
    const editClassBtn = event.target.closest("[data-edit-class]");
    const deleteParent = event.target.closest("[data-delete-parent]");
    const deleteResult = event.target.closest("[data-delete-result]");
    if (deleteStudent) removeStudent(deleteStudent.dataset.deleteStudent);
    if (editStudentBtn) editStudentBtn.dataset.editStudent && editStudent(editStudentBtn.dataset.editStudent);
    if (deleteStaff) removeStaff(deleteStaff.dataset.deleteStaff);
    if (editStaffBtn) editStaff(editStaffBtn.dataset.editStaff);
    if (deleteDepartment) removeDepartment(deleteDepartment.dataset.deleteDepartment);
    if (editDepartmentBtn) editDepartment(editDepartmentBtn.dataset.editDepartment);
    if (deleteClass) removeClass(deleteClass.dataset.deleteClass);
    if (editClassBtn) editClass(editClassBtn.dataset.editClass);
    if (deleteParent) removeParent(deleteParent.dataset.deleteParent);
    if (deleteResult) removeResult(deleteResult.dataset.deleteResult);
    if (event.target.id === "add-result-subject") addResultRow();
  });

  q("#admin-view").addEventListener("submit", (event) => {
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

  q("#student-search")?.addEventListener("input", renderStudents);
  q("#reset-student-form")?.addEventListener("click", resetStudentForm);
  q("#reset-staff-form")?.addEventListener("click", resetStaffForm);
  q("#reset-department-form")?.addEventListener("click", resetDepartmentForm);
  q("#reset-class-form")?.addEventListener("click", resetClassForm);
  q("#student-print")?.addEventListener("click", () => window.print());
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
  q("#attendance-date").value = today();
});
