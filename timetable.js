// ===== CONFIGURATION =====
const CONFIG = {
  apiBaseUrl: 'http://localhost:5000/api',
  currentSemester: 'Fall 2024',
  weekDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  timeSlots: [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ]
};

// ===== STATE MANAGEMENT =====
let state = {
  userData: null,
  theme: localStorage.getItem('theme') || 'dark',
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  schedule: [],
  currentView: 'week', // 'week', 'month', 'list'
  currentSemester: 'Fall 2024',
  currentDate: new Date(),
  stats: {
    totalClasses: 0,
    weekClasses: 0,
    upcomingClasses: 0
  }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Timetable Page...');
  
  // Check authentication
  checkAuthentication();
  
  // Initialize theme
  initTheme();
  
  // Load user data
  loadUserData();
  
  // Initialize components
  initComponents();
  
  // Load schedule
  loadSchedule();
  
  // Initialize particles
  initParticles();
  
  // Handle initial resize
  handleResize();
  
  // Apply initial sidebar state
  applySidebarState();
});

// ===== AUTHENTICATION =====
function checkAuthentication() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const token = localStorage.getItem('token');
  
  if (!isLoggedIn || !token) {
    window.location.href = 'login.html';
    return;
  }
}

// ===== LOAD USER DATA =====
async function loadUserData() {
  try {
    const token = localStorage.getItem('token');
    
    if (token && token !== 'demo-token') {
      // Try to fetch from backend
      const response = await fetch(`${CONFIG.apiBaseUrl}/schedule`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        state.userData = data;
        console.log('✅ Live data loaded');
        updateUserInfo();
        return;
      }
    }
    
    // Use demo data
    state.userData = {
      student: {
        id: 1,
        rollNumber: "23FA-003-SE",
        firstName: "Ali",
        lastName: "Ahmed",
        email: "23fa-003-se@nexor.edu",
        department: "Software Engineering",
        semester: 4,
        batch: "23FA",
        cgpa: 3.42,
        creditHours: 18,
        attendanceRate: 92.5,
        classRank: 12,
        totalStudents: 85
      }
    };
    
    console.log('🔄 Demo data loaded');
    updateUserInfo();
    
  } catch (error) {
    console.log('❌ Error loading data:', error.message);
    showToast('Error loading user data', 'danger');
  }
}

function updateUserInfo() {
  const user = state.userData?.student;
  if (!user) return;
  
  // Update header info
  const elements = {
    'miniName': `${user.firstName} ${user.lastName}`,
    'miniRoll': user.rollNumber,
    'userName': `${user.firstName} ${user.lastName}`,
    'miniAvatar': user.firstName.charAt(0)
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

// ===== THEME MANAGEMENT =====
function initTheme() {
  const root = document.getElementById('themeRoot');
  
  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (!localStorage.getItem('theme')) {
    state.theme = prefersDark ? 'dark' : 'light';
  }
  
  root.setAttribute('data-theme', state.theme);
  updateThemeIcon();
  
  // Update particles on theme change
  updateParticlesTheme();
}

function updateThemeIcon() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;
  
  const icon = themeToggle.querySelector('i');
  if (state.theme === 'dark') {
    icon.className = 'fas fa-sun';
    themeToggle.style.background = 'linear-gradient(135deg, #f59e0b, #fbbf24)';
  } else {
    icon.className = 'fas fa-moon';
    themeToggle.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
  }
}

function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggle');
  const root = document.getElementById('themeRoot');
  
  if (!toggleBtn || !root) return;
  
  toggleBtn.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
    
    // Update icon
    updateThemeIcon();
    
    // Update particles
    updateParticlesTheme();
    
    // Show toast
    showToast(`Theme changed to ${state.theme} mode`, 'info');
  });
}

function updateParticlesTheme() {
  if (window.pJSDom && window.pJSDom.length > 0) {
    const particles = window.pJSDom[0].pJS;
    if (particles) {
      particles.particles.color.value = state.theme === 'dark' ? '#ffffff' : '#4f46e5';
      particles.particles.line_linked.color = state.theme === 'dark' ? '#ffffff' : '#4f46e5';
      particles.particles.line_linked.opacity = state.theme === 'dark' ? 0.1 : 0.05;
      particles.fn.particlesRefresh();
    }
  }
}

// ===== SIDEBAR MANAGEMENT =====
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggleSidebar');
  const mobileToggle = document.getElementById('mobileToggle');
  
  // Desktop toggle
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (window.innerWidth > 992) {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
        localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed);
        updateToggleIcon();
        updateMainContentWidth();
      }
    });
  }
  
  // Mobile toggle
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      const isActive = sidebar.classList.contains('active');
      sidebar.classList.toggle('active', !isActive);
      
      if (!isActive) {
        createMobileOverlay();
      } else {
        removeMobileOverlay();
      }
      
      document.body.style.overflow = !isActive ? 'hidden' : '';
    });
  }
  
  // Close sidebar on window resize if needed
  window.addEventListener('resize', handleResize);
}

function updateMainContentWidth() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;
  
  if (window.innerWidth > 992) {
    if (state.sidebarCollapsed) {
      mainContent.style.marginLeft = '100px';
      mainContent.style.width = 'calc(100% - 100px)';
    } else {
      mainContent.style.marginLeft = '300px';
      mainContent.style.width = 'calc(100% - 300px)';
    }
  }
}

function createMobileOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('active');
    document.body.style.overflow = '';
    overlay.remove();
  });
  document.body.appendChild(overlay);
}

function removeMobileOverlay() {
  const overlay = document.querySelector('.sidebar-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// ===== HANDLE RESIZE =====
function handleResize() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  
  if (!sidebar || !mainContent) return;
  
  if (window.innerWidth > 992) {
    // Desktop mode
    sidebar.style.position = 'fixed';
    sidebar.style.left = '20px';
    sidebar.style.top = '20px';
    sidebar.style.height = 'calc(100vh - 40px)';
    sidebar.classList.remove('active');
    
    if (state.sidebarCollapsed) {
      sidebar.classList.add('collapsed');
    } else {
      sidebar.classList.remove('collapsed');
    }
    
    updateMainContentWidth();
  } else {
    // Mobile mode
    sidebar.style.position = 'fixed';
    sidebar.style.left = '-100%';
    sidebar.style.top = '20px';
    sidebar.style.height = 'calc(100vh - 40px)';
    sidebar.classList.remove('collapsed');
    
    mainContent.style.marginLeft = '0';
    mainContent.style.width = '100%';
    
    if (state.sidebarCollapsed) {
      state.sidebarCollapsed = false;
      localStorage.setItem('sidebarCollapsed', 'false');
    }
  }
}

function updateToggleIcon() {
  const toggleBtn = document.getElementById('toggleSidebar');
  if (!toggleBtn) return;
  
  const icon = toggleBtn.querySelector('i');
  if (state.sidebarCollapsed) {
    icon.className = 'fas fa-chevron-right';
    toggleBtn.title = 'Expand Sidebar';
  } else {
    icon.className = 'fas fa-chevron-left';
    toggleBtn.title = 'Collapse Sidebar';
  }
}

function applySidebarState() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  
  if (!sidebar || !mainContent) return;
  
  if (state.sidebarCollapsed) {
    sidebar.classList.add('collapsed');
    updateToggleIcon();
    
    if (window.innerWidth > 992) {
      mainContent.style.marginLeft = '100px';
      mainContent.style.width = 'calc(100% - 100px)';
    }
  }
}

// ===== LOAD SCHEDULE =====
async function loadSchedule() {
  try {
    showLoading(true);
    
    const token = localStorage.getItem('token');
    let schedule = [];
    
    if (token && token !== 'demo-token') {
      // Try to fetch from backend
      const response = await fetch(`${CONFIG.apiBaseUrl}/schedule?semester=${state.currentSemester}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        schedule = await response.json();
      }
    }
    
    // Use demo schedule if backend fails
    if (schedule.length === 0) {
      schedule = getDemoSchedule();
    }
    
    state.schedule = schedule;
    
    // Calculate stats
    calculateScheduleStats(schedule);
    
    renderSchedule();
    updateScheduleStats();
    
  } catch (error) {
    console.log('❌ Error loading schedule:', error.message);
    showToast('Error loading schedule', 'danger');
  } finally {
    showLoading(false);
  }
}

function getDemoSchedule() {
  return [
    // Monday
    {
      id: 1,
      day: 'Monday',
      time: '09:00',
      endTime: '10:30',
      course: {
        code: 'CS102',
        title: 'Data Structures',
        instructor: 'Dr. Michael Chen',
        room: 'Room 205',
        type: 'LECTURE',
        credits: 4
      }
    },
    {
      id: 2,
      day: 'Monday',
      time: '14:00',
      endTime: '15:30',
      course: {
        code: 'CS202',
        title: 'Database Systems',
        instructor: 'Dr. Robert Kim',
        room: 'Room 205',
        type: 'LECTURE',
        credits: 3
      }
    },
    {
      id: 3,
      day: 'Monday',
      time: '16:00',
      endTime: '17:00',
      course: {
        code: 'CS301',
        title: 'Software Engineering',
        instructor: 'Dr. Sarah Johnson',
        room: 'Room 302',
        type: 'LECTURE',
        credits: 4
      }
    },
    // Tuesday
    {
      id: 4,
      day: 'Tuesday',
      time: '09:00',
      endTime: '10:30',
      course: {
        code: 'CS102',
        title: 'Data Structures',
        instructor: 'Dr. Michael Chen',
        room: 'Room 205',
        type: 'LECTURE',
        credits: 4
      }
    },
    {
      id: 5,
      day: 'Tuesday',
      time: '11:00',
      endTime: '12:30',
      course: {
        code: 'CS202',
        title: 'Database Systems',
        instructor: 'Dr. Robert Kim',
        room: 'Room 205',
        type: 'LECTURE',
        credits: 3
      }
    },
    {
      id: 6,
      day: 'Tuesday',
      time: '14:00',
      endTime: '15:30',
      course: {
        code: 'CS203',
        title: 'Web Development',
        instructor: 'Dr. Lisa Anderson',
        room: 'Lab 1',
        type: 'LAB',
        credits: 1
      }
    },
    // Wednesday
    {
      id: 7,
      day: 'Wednesday',
      time: '09:00',
      endTime: '10:30',
      course: {
        code: 'CS102',
        title: 'Data Structures',
        instructor: 'Dr. Michael Chen',
        room: 'Room 205',
        type: 'LECTURE',
        credits: 4
      }
    },
    {
      id: 8,
      day: 'Wednesday',
      time: '14:00',
      endTime: '15:30',
      course: {
        code: 'CS202',
        title: 'Database Systems',
        instructor: 'Dr. Robert Kim',
        room: 'Room 205',
        type: 'LECTURE',
        credits: 3
      }
    },
    // Thursday
    {
      id: 9,
      day: 'Thursday',
      time: '09:00',
      endTime: '10:30',
      course: {
        code: 'CS202',
        title: 'Database Systems',
        instructor: 'Dr. Robert Kim',
        room: 'Room 205',
        type: 'LECTURE',
        credits: 3
      }
    },
    {
      id: 10,
      day: 'Thursday',
      time: '11:00',
      endTime: '12:30',
      course: {
        code: 'CS203',
        title: 'Web Development',
        instructor: 'Dr. Lisa Anderson',
        room: 'Lab 1',
        type: 'LAB',
        credits: 1
      }
    },
    {
      id: 11,
      day: 'Thursday',
      time: '14:00',
      endTime: '15:30',
      course: {
        code: 'CS301',
        title: 'Software Engineering',
        instructor: 'Dr. Sarah Johnson',
        room: 'Room 302',
        type: 'LECTURE',
        credits: 4
      }
    },
    // Friday
    {
      id: 12,
      day: 'Friday',
      time: '09:00',
      endTime: '10:30',
      course: {
        code: 'CS102',
        title: 'Data Structures',
        instructor: 'Dr. Michael Chen',
        room: 'Room 205',
        type: 'LECTURE',
        credits: 4
      }
    },
    {
      id: 13,
      day: 'Friday',
      time: '14:00',
      endTime: '15:30',
      course: {
        code: 'CS302',
        title: 'Computer Networks',
        instructor: 'Dr. Michael Chen',
        room: 'Room 101',
        type: 'LECTURE',
        credits: 3
      }
    }
  ];
}

function calculateScheduleStats(schedule) {
  state.stats = {
    totalClasses: schedule.length,
    weekClasses: schedule.length,
    upcomingClasses: schedule.filter(cls => {
      const classDateTime = new Date(`${state.currentDate.toDateString()} ${cls.time}`);
      return classDateTime > state.currentDate;
    }).length
  };
}

// ===== INITIALIZATION =====
function initComponents() {
  initThemeToggle();
  initSidebar();
  initViewControls();
  initModals();
  initLogout();
}

function initViewControls() {
  // View toggle buttons
  const weekView = document.getElementById('weekView');
  const monthView = document.getElementById('monthView');
  const listView = document.getElementById('listView');
  
  if (weekView) {
    weekView.addEventListener('click', () => setView('week'));
  }
  
  if (monthView) {
    monthView.addEventListener('click', () => setView('month'));
  }
  
  if (listView) {
    listView.addEventListener('click', () => setView('list'));
  }
  
  // Other controls
  const todayBtn = document.getElementById('todayBtn');
  const exportBtn = document.getElementById('exportBtn');
  const semesterFilter = document.getElementById('semesterFilter');
  
  if (todayBtn) {
    todayBtn.addEventListener('click', goToToday);
  }
  
  if (exportBtn) {
    exportBtn.addEventListener('click', exportSchedule);
  }
  
  if (semesterFilter) {
    semesterFilter.addEventListener('change', (e) => {
      state.currentSemester = e.target.value;
      document.getElementById('currentSemester').textContent = e.target.value;
      loadSchedule();
    });
  }
}

function setView(view) {
  state.currentView = view;
  
  // Update button states
  const weekView = document.getElementById('weekView');
  const monthView = document.getElementById('monthView');
  const listView = document.getElementById('listView');
  
  // Remove active class from all
  [weekView, monthView, listView].forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active class to selected
  if (view === 'week') {
    weekView.classList.add('active');
  } else if (view === 'month') {
    monthView.classList.add('active');
  } else if (view === 'list') {
    listView.classList.add('active');
  }
  
  renderSchedule();
}

function goToToday() {
  state.currentDate = new Date();
  renderSchedule();
  showToast('Showing today\'s schedule', 'info');
}

function exportSchedule() {
  showToast('Exporting schedule...', 'info');
  
  // Simulate export
  setTimeout(() => {
    const scheduleText = generateScheduleText();
    downloadSchedule(scheduleText);
    showToast('Schedule exported successfully!', 'success');
  }, 1000);
}

function generateScheduleText() {
  let text = `Nexor University - Class Schedule\n`;
  text += `Semester: ${state.currentSemester}\n`;
  text += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  state.schedule.forEach(cls => {
    text += `${cls.day} - ${cls.time} to ${cls.endTime}\n`;
    text += `  ${cls.course.code}: ${cls.course.title}\n`;
    text += `  Instructor: ${cls.course.instructor}\n`;
    text += `  Room: ${cls.course.room}\n`;
    text += `  Type: ${cls.course.type}\n\n`;
  });
  
  return text;
}

function downloadSchedule(text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `schedule-${state.currentSemester.replace(' ', '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ===== RENDER SCHEDULE =====
function renderSchedule() {
  const container = document.getElementById('timetableContainer');
  if (!container) return;
  
  if (state.schedule.length === 0) {
    container.innerHTML = `
      <div class="no-classes">
        <i class="fas fa-calendar-times"></i>
        <h3>No classes scheduled</h3>
        <p>No classes found for the selected semester</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  if (state.currentView === 'week') {
    html = renderWeekView();
  } else if (state.currentView === 'month') {
    html = renderMonthView();
  } else if (state.currentView === 'list') {
    html = renderListView();
  }
  
  container.innerHTML = html;
}

function renderWeekView() {
  const weekDays = ['Time', ...CONFIG.weekDays];
  
  let html = `
    <div class="week-timetable">
      <div class="week-header">
        ${weekDays.map(day => `<div class="time-slot">${day}</div>`).join('')}
      </div>
      <div class="week-body">
  `;
  
  // Time slots
  CONFIG.timeSlots.forEach(time => {
    html += `<div class="time-slot-body">${time}</div>`;
    
    // Day columns
    CONFIG.weekDays.forEach(day => {
      const classSlot = findClassSlot(day, time);
      if (classSlot) {
        const isCurrent = isCurrentClass(classSlot);
        html += `
          <div class="class-slot ${isCurrent ? 'current' : ''} ${classSlot.course.type.toLowerCase()}" 
               onclick="showClassDetails(${classSlot.id})">
            <div class="class-info">
              <div class="class-code">${classSlot.course.code}</div>
              <div class="class-title">${classSlot.course.title}</div>
              <div class="class-room">${classSlot.course.room}</div>
            </div>
            ${classSlot.course.type !== 'LECTURE' ? `<div class="class-type">${classSlot.course.type}</div>` : ''}
          </div>
        `;
      } else {
        html += `<div class="class-slot"></div>`;
      }
    });
  });
  
  html += `</div></div>`;
  
  return html;
}

function renderMonthView() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get first day of month and number of days
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
  
  let html = `
    <div class="month-timetable">
      <div class="month-header">
        <div class="month-navigation">
          <button class="month-nav-btn" onclick="changeMonth(-1)">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="month-nav-btn" onclick="changeMonth(1)">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="month-title">${monthNames[currentMonth]} ${currentYear}</div>
      </div>
      <div class="calendar-grid">
  `;
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    html += '<div class="calendar-day other-month"></div>';
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    const dayClasses = getClassesForDay(day, currentMonth, currentYear);
    
    html += `
      <div class="calendar-day ${isToday ? 'today' : ''}">
        <div class="calendar-day-header">${day}</div>
        <div class="day-classes">
          ${dayClasses.map(cls => `
            <div class="day-class" onclick="showClassDetails(${cls.id})">
              ${cls.course.code}: ${cls.course.title}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Add empty cells for remaining days
  const totalCells = startingDayOfWeek + daysInMonth;
  const remainingCells = 42 - totalCells; // 6 weeks × 7 days
  for (let i = 0; i < remainingCells; i++) {
    html += '<div class="calendar-day other-month"></div>';
  }
  
  html += `</div></div>`;
  
  return html;
}

function renderListView() {
  const sortedSchedule = [...state.schedule].sort((a, b) => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
  });
  
  let html = `
    <div class="list-timetable">
      <div class="list-header">
        <div class="list-title">Class Schedule - ${state.currentSemester}</div>
      </div>
      <div class="schedule-list">
  `;
  
  sortedSchedule.forEach(cls => {
    const isCurrent = isCurrentClass(cls);
    html += `
      <div class="schedule-item ${isCurrent ? 'current' : ''}" onclick="showClassDetails(${cls.id})">
        <div class="schedule-time">${cls.time} - ${cls.endTime}</div>
        <div class="schedule-details">
          <div class="schedule-course">${cls.course.code}: ${cls.course.title}</div>
          <div class="schedule-info">${cls.course.instructor} • ${cls.course.room}</div>
          <div class="schedule-room">Room: ${cls.course.room}</div>
        </div>
        <div class="schedule-actions">
          <button class="schedule-action-btn" onclick="event.stopPropagation(); viewResources(${cls.id})">
            <i class="fas fa-book"></i>
          </button>
          <button class="schedule-action-btn" onclick="event.stopPropagation(); viewMap(${cls.course.room})">
            <i class="fas fa-map-marker-alt"></i>
          </button>
        </div>
      </div>
    `;
  });
  
  html += `</div></div>`;
  
  return html;
}

function findClassSlot(day, time) {
  return state.schedule.find(cls => 
    cls.day === day && cls.time === time
  );
}

function getClassesForDay(day, month, year) {
  return state.schedule.filter(cls => {
    const classDate = new Date(cls.date || `${year}-${month}-${day}`);
    return classDate.getDate() === day;
  });
}

function isCurrentClass(classSlot) {
  const now = new Date();
  const classDate = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${classSlot.time}`);
  const classEndTime = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${classSlot.endTime}`);
  
  return now >= classDate && now <= classEndTime;
}

// ===== UPDATE SCHEDULE STATS =====
function updateScheduleStats() {
  document.getElementById('totalClasses').textContent = state.stats.totalClasses;
  document.getElementById('weekClasses').textContent = state.stats.weekClasses;
  document.getElementById('upcomingClasses').textContent = state.stats.upcomingClasses;
}

// ===== CLASS DETAILS MODAL =====
function showClassDetails(classId) {
  const classSlot = state.schedule.find(cls => cls.id === classId);
  if (!classSlot) return;
  
  const modal = document.getElementById('classModal');
  const modalTitle = document.getElementById('modalClassTitle');
  const modalContent = document.getElementById('modalContent');
  
  modalTitle.textContent = `${classSlot.course.code}: ${classSlot.course.title}`;
  
  modalContent.innerHTML = `
    <div class="class-detail-section">
      <h4><i class="fas fa-info-circle"></i> Class Information</h4>
      <div class="class-meta">
        <div class="meta-item">
          <span class="meta-label">Course Code:</span>
          <span class="meta-value">${classSlot.course.code}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Course Title:</span>
          <span class="meta-value">${classSlot.course.title}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Instructor:</span>
          <span class="meta-value">${classSlot.course.instructor}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Credits:</span>
          <span class="meta-value">${classSlot.course.credits}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Type:</span>
          <span class="meta-value">${classSlot.course.type}</span>
        </div>
      </div>
    </div>
    
    <div class="class-detail-section">
      <h4><i class="fas fa-clock"></i> Schedule</h4>
      <div class="class-meta">
        <div class="meta-item">
          <span class="meta-label">Day:</span>
          <span class="meta-value">${classSlot.day}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Time:</span>
          <span class="meta-value">${classSlot.time} - ${classSlot.endTime}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Room:</span>
          <span class="meta-value">${classSlot.course.room}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Semester:</span>
          <span class="meta-value">${state.currentSemester}</span>
        </div>
      </div>
    </div>
    
    <div class="class-detail-section">
      <h4><i class="fas fa-bullseye"></i> Course Description</h4>
      <p>This is a ${classSlot.course.type.toLowerCase()} course for ${classSlot.course.title}. 
         Students will learn fundamental concepts and practical applications in this field.</p>
    </div>
  `;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeClassModal() {
  const modal = document.getElementById('classModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function viewResources(classId) {
  const classSlot = state.schedule.find(cls => cls.id === classId);
  if (!classSlot) return;
  
  showToast(`Opening resources for ${classSlot.course.code}: ${classSlot.course.title}`, 'info');
  
  // Simulate opening resources
  setTimeout(() => {
    showToast('Resources loaded successfully!', 'success');
  }, 1000);
}

function viewMap(room) {
  showToast(`Opening map for room: ${room}`, 'info');
  
  // Simulate opening map
  setTimeout(() => {
    showToast('Map loaded successfully!', 'success');
  }, 1000);
}

function changeMonth(direction) {
  state.currentDate.setMonth(state.currentDate.getMonth() + direction);
  renderSchedule();
}

function addToCalendar(classId) {
  const classSlot = state.schedule.find(cls => cls.id === classId);
  if (!classSlot) return;
  
  // Create calendar event
  const event = {
    title: `${classSlot.course.code}: ${classSlot.course.title}`,
    description: `Instructor: ${classSlot.course.instructor}\\nRoom: ${classSlot.course.room}`,
    location: classSlot.course.room,
    startTime: classSlot.time,
    endTime: classSlot.endTime
  };
  
  // Add to calendar (this is a simplified version)
  const icsContent = generateICSContent(event);
  downloadICS(icsContent, `${classSlot.course.code}.ics`);
  
  showToast('Class added to calendar!', 'success');
}

function generateICSContent(event) {
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Nexor University//Class Schedule
BEGIN:VEVENT
UID:${event.title}@nexor.edu
DTSTART:${new Date().toISOString().split('T')[0]}T${event.startTime.replace(':', '')}00
DTEND:${new Date().toISOString().split('T')[0]}T${event.endTime.replace(':', '')}00
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;
}

function downloadICS(content, filename) {
  const blob = new Blob([content], { type: 'text/calendar' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ===== INITIALIZATION =====
function initModals() {
  // Close modal buttons
  const closeModalBtn = document.getElementById('closeModalBtn');
  const closeModalX = document.getElementById('closeModal');
  const addToCalendarBtn = document.getElementById('addToCalendarBtn');
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeClassModal);
  }
  
  if (closeModalX) {
    closeModalX.addEventListener('click', closeClassModal);
  }
  
  if (addToCalendarBtn) {
    addToCalendarBtn.addEventListener('click', () => {
      const modalTitle = document.getElementById('modalClassTitle').textContent;
      const classCode = modalTitle.split(':')[0];
      const classSlot = state.schedule.find(cls => cls.course.code === classCode);
      if (classSlot) {
        addToCalendar(classSlot.id);
      }
    });
  }
  
  // Close on overlay click
  const modal = document.getElementById('classModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        closeClassModal();
      }
    });
  }
  
  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeClassModal();
    }
  });
}

function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Swal.fire({
        title: 'Confirm Logout',
        text: 'Are you sure you want to logout from Nexor Portal?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Logout',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          showToast('Logging out...', 'info');
          
          setTimeout(() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
          }, 1500);
        }
      });
    });
  }
}

// ===== UTILITY FUNCTIONS =====
function showLoading(show) {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    spinner.style.display = show ? 'flex' : 'none';
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'fa-check-circle' : 
               type === 'warning' ? 'fa-exclamation-triangle' : 
               type === 'danger' ? 'fa-times-circle' : 'fa-info-circle';
  
  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <div class="toast-content">
      <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
      <p>${message}</p>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Remove toast after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

// ===== PARTICLES BACKGROUND =====
function initParticles() {
  if (typeof particlesJS !== 'undefined') {
    particlesJS("particles-js", {
      particles: {
        number: { 
          value: state.theme === 'dark' ? 60 : 40, 
          density: { enable: true, value_area: 800 } 
        },
        color: { value: state.theme === 'dark' ? '#ffffff' : '#4f46e5' },
        shape: { type: "circle" },
        opacity: { value: state.theme === 'dark' ? 0.15 : 0.08, random: true },
        size: { value: 2, random: true },
        line_linked: { 
          enable: true, 
          distance: 150, 
          color: state.theme === 'dark' ? '#ffffff' : '#4f46e5', 
          opacity: state.theme === 'dark' ? 0.1 : 0.05, 
          width: 1 
        },
        move: { enable: true, speed: 1, direction: "none", random: true }
      },
      interactivity: { 
        detect_on: "canvas",
        events: { 
          onhover: { enable: true, mode: "grab" },
          onclick: { enable: true, mode: "push" }
        } 
      },
      retina_detect: true
    });
  }
}

// ===== UPDATE DATE/TIME =====
function updateDateTime() {
  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const dateTimeStr = now.toLocaleDateString('en-US', options);
  const element = document.getElementById('currentDateTime');
  if (element) element.textContent = dateTimeStr;
}

// Start date/time updates
setInterval(updateDateTime, 60000);
updateDateTime();

// ===== WINDOW RESIZE HANDLER =====
window.addEventListener('resize', () => {
  handleResize();
});

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
  console.error('Timetable page error:', e.error);
  showToast('An error occurred. Some features may not work properly.', 'danger');
});