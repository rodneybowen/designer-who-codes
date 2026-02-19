/* ============================================
   THE DESIGNER WHO CODES — Main JavaScript
   Handles: sidebar nav, mobile toggle, reading progress, theme toggle
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ------------------------------------------
     1. ACTIVE NAV ITEM
     Highlights the current chapter in the sidebar
  ------------------------------------------ */
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(function (item) {
    item.classList.remove('nav-item--active');
    const href = item.getAttribute('href');
    if (!href) return;

    // Match by filename at end of path
    const hrefFile = href.split('/').pop();
    const pathFile = currentPath.split('/').pop() || 'index.html';

    if (hrefFile === pathFile) {
      item.classList.add('nav-item--active');
    }
  });

  /* ------------------------------------------
     2. READING PROGRESS BAR
     Thin yellow bar at top that fills as you scroll
  ------------------------------------------ */
  const progressBar = document.getElementById('progressBar');

  function updateProgressBar() {
    if (!progressBar) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) {
      progressBar.style.width = '0%';
      return;
    }
    const pct = Math.min(100, (scrollTop / docHeight) * 100);
    progressBar.style.width = pct + '%';
  }

  window.addEventListener('scroll', updateProgressBar, { passive: true });
  updateProgressBar();

  /* ------------------------------------------
     3. COURSE PROGRESS TRACKER (sidebar footer)
     Shows overall progress based on chapters completed (clicked "next" button)
  ------------------------------------------ */
  const TOTAL_CHAPTERS = 10;
  const STORAGE_KEY = 'dwc_completed';

  function getCompleted() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function markChapterCompleted(chapterFile) {
    const completed = getCompleted();
    if (!completed.includes(chapterFile)) {
      completed.push(chapterFile);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
      } catch (e) {}
    }
    updateCourseProgress();
  }

  function unmarkChapterCompleted(chapterFile) {
    const completed = getCompleted();
    const index = completed.indexOf(chapterFile);
    if (index > -1) {
      completed.splice(index, 1);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
      } catch (e) {}
    }
    updateCourseProgress();
  }

  function updateCourseProgress() {
    const fill = document.getElementById('courseProgress');
    if (!fill) return;
    const completed = getCompleted();
    const pct = Math.round((completed.length / TOTAL_CHAPTERS) * 100);
    fill.style.width = pct + '%';
    fill.title = pct + '% complete';
  }

  // Attach click handlers to "next" buttons to mark chapters as completed
  const nextLinks = document.querySelectorAll('.chapter-nav__link--next');
  nextLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      const href = link.getAttribute('href');
      if (href) {
        // Extract filename from href (could be relative or absolute)
        const nextChapter = href.split('/').pop();
        if (nextChapter && /^\d{2}-/.test(nextChapter)) {
          // Mark the current chapter as completed when user clicks next
          const currentFile = currentPath.split('/').pop() || 'index.html';
          if (currentFile !== 'index.html' && /^\d{2}-/.test(currentFile)) {
            markChapterCompleted(currentFile);
          }
        }
      }
    });
  });

  // Attach click handlers to "previous" buttons to unmark chapters
  const prevLinks = document.querySelectorAll('.chapter-nav__link:not(.chapter-nav__link--next)');
  prevLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      const href = link.getAttribute('href');
      if (href) {
        // Extract filename from href (could be relative or absolute)
        const prevChapter = href.split('/').pop();
        if (prevChapter && /^\d{2}-/.test(prevChapter)) {
          // Unmark the current chapter as completed when user clicks previous
          const currentFile = currentPath.split('/').pop() || 'index.html';
          if (currentFile !== 'index.html' && /^\d{2}-/.test(currentFile)) {
            unmarkChapterCompleted(currentFile);
          }
        }
      }
    });
  });

  updateCourseProgress();

  /* ------------------------------------------
     4. MOBILE SIDEBAR TOGGLE
     Hamburger button shows/hides sidebar on mobile
  ------------------------------------------ */
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  function openSidebar() {
    sidebar && sidebar.classList.add('sidebar--open');
    overlay && overlay.classList.add('sidebar-overlay--open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar && sidebar.classList.remove('sidebar--open');
    overlay && overlay.classList.remove('sidebar-overlay--open');
    document.body.style.overflow = '';
  }

  if (hamburger) {
    hamburger.addEventListener('click', function () {
      if (sidebar && sidebar.classList.contains('sidebar--open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  // Close sidebar when a nav link is clicked (mobile)
  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      if (window.innerWidth <= 900) {
        closeSidebar();
      }
    });
  });

  // Close on resize to desktop
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) {
      closeSidebar();
    }
  });

  /* ------------------------------------------
     5. THEME TOGGLE (light / dark mode)
     Persists preference in localStorage
  ------------------------------------------ */
  const THEME_KEY = 'dwc_theme';
  const themeToggle = document.getElementById('themeToggle');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  // On load: restore saved theme, default to dark
  const savedTheme = (function () {
    try { return localStorage.getItem(THEME_KEY) || 'dark'; } catch (e) { return 'dark'; }
  })();
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'light' ? 'dark' : 'light');
    });
  }

});
