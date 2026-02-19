/* ============================================
   THE DESIGNER WHO CODES — Main JavaScript
   Handles: sidebar nav, mobile toggle, reading progress, theme toggle,
            course progress, confetti, copy-to-clipboard, graduate modal
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
     3. CONFETTI
     Lightweight canvas-based confetti burst
  ------------------------------------------ */
  function launchConfetti(duration) {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const pieces = [];
    const colors = ['#f5e642', '#ff4d4d', '#4d9fff', '#4dff9a', '#ff9f4d', '#ffffff'];

    for (let i = 0; i < 160; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 4 + 2,
        opacity: 1
      });
    }

    const end = Date.now() + duration;
    let raf;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();
      const remaining = end - now;

      pieces.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        if (remaining < 2000) p.opacity = Math.max(0, remaining / 2000);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();

        if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
      });

      if (now < end) {
        raf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    draw();
    return function () { cancelAnimationFrame(raf); ctx.clearRect(0, 0, canvas.width, canvas.height); };
  }

  /* ------------------------------------------
     4. COURSE PROGRESS TRACKER (sidebar footer)
     Fills when users click "next"; decreases on "previous"
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

  // "Next" buttons → mark current chapter complete + mini confetti (2s)
  const nextLinks = document.querySelectorAll('.chapter-nav__link--next');
  nextLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      const href = link.getAttribute('href');
      if (href) {
        const nextChapter = href.split('/').pop();
        if (nextChapter && /^\d{2}-/.test(nextChapter)) {
          const currentFile = currentPath.split('/').pop() || 'index.html';
          if (currentFile !== 'index.html' && /^\d{2}-/.test(currentFile)) {
            markChapterCompleted(currentFile);
            launchConfetti(2000);
          }
        }
      }
    });
  });

  // "Previous" buttons → unmark current chapter
  const prevLinks = document.querySelectorAll('.chapter-nav .chapter-nav__link:not(.chapter-nav__link--next)');
  prevLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      const href = link.getAttribute('href');
      if (href) {
        const prevChapter = href.split('/').pop();
        if (prevChapter && /^\d{2}-/.test(prevChapter)) {
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
     5. GRADUATE BUTTON + MODAL (Chapter 10)
     Marks ch10 complete, fills progress to 100%,
     launches 10s confetti + celebration modal
  ------------------------------------------ */
  const graduateBtn = document.getElementById('graduateBtn');
  const graduateModal = document.getElementById('graduateModal');
  const graduateClose = document.getElementById('graduateClose');

  if (graduateBtn && graduateModal) {
    graduateBtn.addEventListener('click', function () {
      // Mark Chapter 10 as completed
      markChapterCompleted('10-component-thinking.html');

      // Instantly fill progress bar to 100%
      const fill = document.getElementById('courseProgress');
      if (fill) { fill.style.width = '100%'; fill.title = '100% complete'; }

      // Open modal
      graduateModal.classList.add('graduate-modal--open');

      // Launch big confetti for 10 seconds
      launchConfetti(10000);
    });

    if (graduateClose) {
      graduateClose.addEventListener('click', function () {
        graduateModal.classList.remove('graduate-modal--open');
      });
    }

    // Also close on backdrop click
    graduateModal.addEventListener('click', function (e) {
      if (e.target === graduateModal) {
        graduateModal.classList.remove('graduate-modal--open');
      }
    });
  }

  /* ------------------------------------------
     6. COPY-TO-CLIPBOARD for code blocks
     Adds a "copy" button to every .code-block header
  ------------------------------------------ */
  document.querySelectorAll('.code-block').forEach(function (block) {
    const header = block.querySelector('.code-block__header');
    const code = block.querySelector('code');
    if (!header || !code) return;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-block__copy';
    copyBtn.textContent = 'copy';
    copyBtn.setAttribute('aria-label', 'Copy code to clipboard');

    copyBtn.addEventListener('click', function () {
      const text = code.innerText || code.textContent;
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.textContent = 'copied!';
        copyBtn.classList.add('code-block__copy--copied');
        setTimeout(function () {
          copyBtn.textContent = 'copy';
          copyBtn.classList.remove('code-block__copy--copied');
        }, 2000);
      }).catch(function () {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        copyBtn.textContent = 'copied!';
        copyBtn.classList.add('code-block__copy--copied');
        setTimeout(function () {
          copyBtn.textContent = 'copy';
          copyBtn.classList.remove('code-block__copy--copied');
        }, 2000);
      });
    });

    header.appendChild(copyBtn);
  });

  /* ------------------------------------------
     7. SCROLL-SPY SECTION INDICATOR
     Sticky bar showing current section as user scrolls
  ------------------------------------------ */
  const sections = Array.from(document.querySelectorAll('.chapter-body .section'));

  if (sections.length > 0) {
    // Auto-assign IDs to sections that don't have them
    sections.forEach(function (sec, i) {
      if (!sec.id) sec.id = 'section-' + (i + 1);
    });

    // Build the indicator element and inject after chapter-header
    const chapterHeader = document.querySelector('.chapter-header');
    if (chapterHeader) {
      const indicator = document.createElement('div');
      indicator.className = 'section-indicator';
      indicator.id = 'sectionIndicator';

      const countEl = document.createElement('span');
      countEl.className = 'section-indicator__count';

      const divider = document.createElement('span');
      divider.className = 'section-indicator__divider';

      const titleEl = document.createElement('span');
      titleEl.className = 'section-indicator__title';

      const dotsEl = document.createElement('span');
      dotsEl.className = 'section-indicator__dots';
      sections.forEach(function (_, i) {
        const dot = document.createElement('span');
        dot.className = 'section-indicator__dot';
        dot.dataset.index = i;
        dotsEl.appendChild(dot);
      });

      indicator.appendChild(countEl);
      indicator.appendChild(divider);
      indicator.appendChild(titleEl);
      indicator.appendChild(dotsEl);

      // Insert after the chapter header
      chapterHeader.insertAdjacentElement('afterend', indicator);

      // Update indicator on scroll
      function updateSectionIndicator() {
        const scrollMid = window.scrollY + window.innerHeight * 0.35;
        let activeIndex = -1;

        sections.forEach(function (sec, i) {
          if (sec.offsetTop <= scrollMid) activeIndex = i;
        });

        // Hide until user scrolls past the chapter header
        const headerBottom = chapterHeader.offsetTop + chapterHeader.offsetHeight;
        if (window.scrollY < headerBottom - 10 || activeIndex < 0) {
          indicator.classList.remove('section-indicator--visible');
          return;
        }

        indicator.classList.add('section-indicator--visible');

        const titleEl2 = indicator.querySelector('.section-indicator__title');
        const countEl2 = indicator.querySelector('.section-indicator__count');
        const titleNode = sections[activeIndex].querySelector('.section__title');
        if (titleNode) titleEl2.textContent = titleNode.textContent;
        countEl2.textContent = (activeIndex + 1) + ' / ' + sections.length;

        // Update dots
        indicator.querySelectorAll('.section-indicator__dot').forEach(function (dot) {
          dot.classList.toggle('section-indicator__dot--active',
            parseInt(dot.dataset.index) === activeIndex);
        });
      }

      window.addEventListener('scroll', updateSectionIndicator, { passive: true });
      updateSectionIndicator();
    }
  }

  /* ------------------------------------------
     9. MOBILE SIDEBAR TOGGLE
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
     10. THEME TOGGLE (light / dark mode)
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
