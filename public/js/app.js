// Hermes.io — Main Application Controller & View Orchestrator
// Coordinates Auth, Onboarding Wizard, Template Gallery, Roadmap Explorer & State


// ============================================================
// PLANET AVATAR GENERATOR
// Generates unique deterministic SVG space avatars from email seed
// ============================================================
function generatePlanetAvatar(seed) {
  // Simple hash from seed string
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h) + seed.charCodeAt(i);
    h |= 0;
  }
  const abs = Math.abs(h);

  const palettes = [
    { planet: '#E8845A', ring: '#C4623A', glow: '#FF9966', bg: '#0D0812' }, // Rusty Mars
    { planet: '#6AB8E8', ring: '#3A8AC4', glow: '#88CCFF', bg: '#080D14' }, // Icy Neptune
    { planet: '#5ECC8A', ring: '#3AAA66', glow: '#77EEA8', bg: '#080F0C' }, // Emerald
    { planet: '#B48EE8', ring: '#8A5EC4', glow: '#CC99FF', bg: '#0C080F' }, // Lavender
    { planet: '#E88A6A', ring: '#C45A3A', glow: '#FFAA88', bg: '#0F0A08' }, // Coral
    { planet: '#E8C84A', ring: '#C4A020', glow: '#FFE066', bg: '#0F0E08' }, // Golden Saturn
    { planet: '#E85A6A', ring: '#C43A4A', glow: '#FF7788', bg: '#0F080A' }, // Crimson
    { planet: '#4AE8CC', ring: '#20C4A0', glow: '#66FFEE', bg: '#080F0E' }, // Teal
  ];

  const pal = palettes[abs % palettes.length];
  const hasRing = (abs >> 3) % 2 === 0;
  const hasMoon = (abs >> 5) % 2 === 0;
  const starCount = 12 + (abs % 8);
  const planetX = 50, planetY = 52, planetR = 22;
  const moonAngle = ((abs >> 7) % 360) * (Math.PI / 180);
  const moonDist = 34;
  const moonX = planetX + Math.cos(moonAngle) * moonDist;
  const moonY = planetY + Math.sin(moonAngle) * moonDist;

  // Generate star positions deterministically
  let stars = '';
  for (let i = 0; i < starCount; i++) {
    const sx = ((abs * (i + 3) * 7919) % 90) + 5;
    const sy = ((abs * (i + 7) * 6271) % 90) + 5;
    const sr = 0.4 + ((abs * (i + 11)) % 10) / 10;
    const opacity = 0.4 + ((abs * (i + 2)) % 6) / 10;
    stars += `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="white" opacity="${opacity.toFixed(1)}"/>`;
  }

  // Planet gradient spots
  const glowId = 'g' + (abs % 99999);
  const ringPath = hasRing
    ? `<ellipse cx="${planetX}" cy="${planetY}" rx="${planetR + 12}" ry="5"
         fill="none" stroke="${pal.ring}" stroke-width="3.5" opacity="0.75"
         transform="rotate(-15 ${planetX} ${planetY})"/>`
    : '';
  const moonEl = hasMoon
    ? `<circle cx="${moonX.toFixed(1)}" cy="${moonY.toFixed(1)}" r="4" fill="#CCCCCC" opacity="0.85"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <radialGradient id="${glowId}" cx="38%" cy="35%" r="60%">
      <stop offset="0%" stop-color="${pal.glow}" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="${pal.planet}"/>
      <stop offset="100%" stop-color="${pal.ring}" stop-opacity="0.8"/>
    </radialGradient>
    <filter id="f${glowId}">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="c${glowId}">
      <circle cx="${planetX}" cy="${planetY}" r="${planetR}"/>
    </clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="${pal.bg}"/>
  ${stars}
  ${ringPath}
  <circle cx="${planetX}" cy="${planetY}" r="${planetR}"
    fill="url(#${glowId})" filter="url(#f${glowId})"/>
  <ellipse cx="${planetX - 5}" cy="${planetY - 8}" rx="8" ry="5"
    fill="white" opacity="0.12" clip-path="url(#c${glowId})"/>
  ${moonEl}
</svg>`;
}

function getPlanetAvatarUrl(seed) {
  const svg = generatePlanetAvatar(seed || 'default');
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

class HermesApp {
  constructor() {
    this.currentUser = null;
    this.currentRoadmap = null;
    this.roadmapsList = [];
    this.currentView = 'dashboard';
    
    // Wizard State (Flow A)
    this.wizardData = {
      step: 1,
      interests: [],
      skillLevel: 'Beginner',
      skillDetails: '',
      goal: '',
      targetRole: ''
    };

    this.init();
  }

  async init() {
    this.bindGlobalNavigation();
    this.bindAuthModal();
    this.bindWizardEvents();
    this.bindSettingsModal();
    this.bindActionModals();
    this.initTheme();

    // Check auth session
    await this.checkAuthSession();

    // Handle hash routing
    window.addEventListener('hashchange', () => this.handleRouting());
    this.handleRouting();
  }

  // ==========================================
  // AUTHENTICATION & SESSIONS
  // ==========================================

  async checkAuthSession() {
    try {
      this.currentUser = await window.hermesAI.getCurrentUser();
      this.updateAuthUI();
      if (this.currentUser) {
        // Claim any guest roadmaps generated prior to login
        const guestRoadmaps = JSON.parse(localStorage.getItem('hermes_guest_roadmaps') || '[]');
        if (guestRoadmaps.length > 0) {
          await window.hermesAI.claimGuestRoadmaps(guestRoadmaps);
          localStorage.removeItem('hermes_guest_roadmaps');
        }
      }
    } catch (err) {
      console.error('Session check error:', err);
      this.currentUser = null;
      this.updateAuthUI();
    }
  }

  updateAuthUI() {
    const userBadge = document.getElementById('navbar-user-badge');
    const authBtn = document.getElementById('navbar-auth-btn');

    if (this.currentUser) {
      if (authBtn) authBtn.classList.add('hidden');
      if (userBadge) {
        userBadge.classList.remove('hidden');
        userBadge.innerHTML = `
          <div class="user-avatar-wrap">
            <img src="${(this.currentUser.avatar && !this.currentUser.avatar.includes('dicebear')) ? this.currentUser.avatar : (window.getCelestialAvatarUrl ? window.getCelestialAvatarUrl(this.currentUser.email) : getPlanetAvatarUrl(this.currentUser.email))}" alt="User Avatar" class="user-avatar-img">
            <span class="user-name-text">${this.escapeHTML(this.currentUser.name)}</span>
            <i class="ph ph-caret-down"></i>
          </div>
          <div class="user-dropdown-menu">
            <div class="user-menu-header">
              <strong>${this.escapeHTML(this.currentUser.name)}</strong>
              <span>${this.escapeHTML(this.currentUser.email)}</span>
            </div>
            <div class="user-menu-divider"></div>
            <button class="user-menu-item" id="btn-user-my-roadmaps">
              <i class="ph ph-tree-structure"></i> My Roadmaps
            </button>
            <button class="user-menu-item" id="btn-user-settings">
              <i class="ph ph-gear"></i> Settings
            </button>
            <div class="user-menu-divider"></div>
            <button class="user-menu-item text-danger" id="btn-user-logout">
              <i class="ph ph-sign-out"></i> Sign Out
            </button>
          </div>
        `;

        // Toggle dropdown on avatar click
        const avatarWrap = userBadge.querySelector('.user-avatar-wrap');
        const dropdownMenu = userBadge.querySelector('.user-dropdown-menu');

        avatarWrap?.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = dropdownMenu?.classList.toggle('show');
          userBadge.classList.toggle('open', isOpen);
        });

        if (!this.userDropdownDocListenerBound) {
          this.userDropdownDocListenerBound = true;
          document.addEventListener('click', (e) => {
            const badge = document.getElementById('navbar-user-badge');
            if (badge && !badge.contains(e.target)) {
              badge.classList.remove('open');
              badge.querySelector('.user-dropdown-menu')?.classList.remove('show');
            }
          });
        }

        // User dropdown clicks
        userBadge.querySelector('#btn-user-my-roadmaps')?.addEventListener('click', () => {
          dropdownMenu?.classList.remove('show');
          userBadge.classList.remove('open');
          this.navigateTo('dashboard');
        });
        userBadge.querySelector('#btn-user-settings')?.addEventListener('click', () => {
          dropdownMenu?.classList.remove('show');
          userBadge.classList.remove('open');
          this.openSettingsModal();
        });
        userBadge.querySelector('#btn-user-logout')?.addEventListener('click', () => {
          dropdownMenu?.classList.remove('show');
          userBadge.classList.remove('open');
          this.handleLogout();
        });
      }
    } else {
      if (userBadge) userBadge.classList.add('hidden');
      if (authBtn) {
        authBtn.classList.remove('hidden');
        authBtn.innerHTML = `<i class="ph ph-user"></i> <span>Sign In / Register</span>`;
      }
    }
  }

  bindAuthModal() {
    const authModal = document.getElementById('auth-modal');
    const authBtn = document.getElementById('navbar-auth-btn');
    const closeAuth = document.getElementById('close-auth-modal');
    const tabLogin = document.getElementById('tab-auth-login');
    const tabSignup = document.getElementById('tab-auth-signup');
    const formLogin = document.getElementById('form-login');
    const formSignup = document.getElementById('form-signup');
    const demoButtonsContainer = document.getElementById('demo-users-container');

    authBtn?.addEventListener('click', () => {
      this.openAuthModal('login');
    });

    closeAuth?.addEventListener('click', () => {
      authModal.classList.add('hidden');
    });

    authModal?.addEventListener('click', (e) => {
      if (e.target === authModal) {
        authModal.classList.add('hidden');
      }
    });

    tabLogin?.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabSignup.classList.remove('active');
      formLogin.classList.remove('hidden');
      formSignup.classList.add('hidden');
    });

    tabSignup?.addEventListener('click', () => {
      tabSignup.classList.add('active');
      tabLogin.classList.remove('active');
      formSignup.classList.remove('hidden');
      formLogin.classList.add('hidden');
    });

    // Handle Login Submit
    formLogin?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error-msg');
      const submitBtn = formLogin.querySelector('button[type="submit"]');

      errorEl.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Signing In...`;

      try {
        const res = await window.hermesAI.login(email, password);
        localStorage.setItem('hermes_auth_token', res.token);
        this.currentUser = res.user;
        this.updateAuthUI();
        authModal.classList.add('hidden');
        this.showToast(`Welcome back, ${res.user.name}!`, 'success');
        
        // Refresh dashboard data
        if (this.currentView === 'dashboard') {
          this.loadDashboard();
        }
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Sign In`;
      }
    });

    // Handle Signup Submit
    formSignup?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const errorEl = document.getElementById('signup-error-msg');
      const submitBtn = formSignup.querySelector('button[type="submit"]');

      errorEl.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Creating Account...`;

      try {
        const res = await window.hermesAI.signup(name, email, password);
        localStorage.setItem('hermes_auth_token', res.token);
        this.currentUser = res.user;
        this.updateAuthUI();
        authModal.classList.add('hidden');
        this.showToast(`Account created! Welcome to Hermes.io, ${res.user.name}`, 'success');

        // Refresh dashboard
        if (this.currentView === 'dashboard') {
          this.loadDashboard();
        }
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Create Account`;
      }
    });

    // Load Demo Users for 1-click test login
    if (demoButtonsContainer) {
      window.hermesAI.getDemoUsers().then(demos => {
        demoButtonsContainer.innerHTML = demos.map(d => `
          <button type="button" class="btn btn-demo-user" data-email="${d.email}" data-pass="${d.password}">
            <i class="ph ph-user-circle"></i>
            <div>
              <strong>${d.name}</strong>
              <small>${d.email}</small>
            </div>
          </button>
        `).join('');

        demoButtonsContainer.querySelectorAll('.btn-demo-user').forEach(btn => {
          btn.addEventListener('click', () => {
            document.getElementById('login-email').value = btn.dataset.email;
            document.getElementById('login-password').value = btn.dataset.pass;
            formLogin.dispatchEvent(new Event('submit'));
          });
        });
      }).catch(console.error);
    }
  }

  openAuthModal(tab = 'login') {
    const modal = document.getElementById('auth-modal');
    const tabLogin = document.getElementById('tab-auth-login');
    const tabSignup = document.getElementById('tab-auth-signup');
    const formLogin = document.getElementById('form-login');
    const formSignup = document.getElementById('form-signup');

    if (tab === 'signup') {
      tabSignup?.classList.add('active');
      tabLogin?.classList.remove('active');
      formSignup?.classList.remove('hidden');
      formLogin?.classList.add('hidden');
    } else {
      tabLogin?.classList.add('active');
      tabSignup?.classList.remove('active');
      formLogin?.classList.remove('hidden');
      formSignup?.classList.add('hidden');
    }

    modal?.classList.remove('hidden');
  }

  async handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: window.hermesAI.getHeaders()
      });
    } catch (e) {
      console.warn(e);
    }
    localStorage.removeItem('hermes_auth_token');
    this.currentUser = null;
    this.updateAuthUI();
    this.showToast('You have been signed out', 'info');
    this.navigateTo('dashboard');
  }

  // ==========================================
  // ROUTING & VIEW NAVIGATION
  // ==========================================

  bindGlobalNavigation() {
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const target = el.getAttribute('data-nav');
        this.navigateTo(target);
      });
    });

    document.getElementById('navbar-brand-btn')?.addEventListener('click', () => {
      this.navigateTo('dashboard');
    });

    document.getElementById('btn-new-roadmap-nav')?.addEventListener('click', () => {
      this.startOnboardingWizard();
    });

    document.getElementById('btn-explore-templates-nav')?.addEventListener('click', () => {
      this.navigateTo('gallery');
    });

    // Mobile Navigation Drawer Toggle & Navigation
    const mobileNavToggle = document.getElementById('btn-mobile-nav-toggle');
    const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
    const closeMobileNav = () => {
      mobileNavDrawer?.classList.add('hidden');
      if (mobileNavToggle) {
        mobileNavToggle.innerHTML = '<i class="ph ph-list"></i>';
      }
    };

    mobileNavToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isClosed = mobileNavDrawer?.classList.contains('hidden');
      if (isClosed) {
        mobileNavDrawer?.classList.remove('hidden');
        mobileNavToggle.innerHTML = '<i class="ph ph-x"></i>';
      } else {
        closeMobileNav();
      }
    });

    mobileNavDrawer?.querySelectorAll('.mobile-nav-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const navTarget = btn.getAttribute('data-nav');
        if (navTarget) {
          this.navigateTo(navTarget);
        } else if (btn.id === 'btn-mobile-new-roadmap') {
          this.startOnboardingWizard();
        } else if (btn.id === 'btn-mobile-settings') {
          this.openSettingsModal();
        }
        closeMobileNav();
      });
    });

    document.addEventListener('click', (e) => {
      if (!mobileNavDrawer?.contains(e.target) && !mobileNavToggle?.contains(e.target)) {
        closeMobileNav();
      }
    });
  }

  handleRouting() {
    const hash = window.location.hash.substring(1) || 'dashboard';
    const [route, param] = hash.split('/');

    if (route === 'roadmap' && param) {
      this.openRoadmapById(param);
    } else if (route === 'wizard') {
      this.showView('view-wizard');
    } else if (route === 'gallery') {
      this.showView('view-gallery');
      this.loadTemplateGallery();
    } else {
      this.showView('view-dashboard');
      this.loadDashboard();
    }
  }

  navigateTo(route, param = null) {
    if (param) {
      window.location.hash = `${route}/${param}`;
    } else {
      window.location.hash = route;
    }
  }

  showView(viewId) {
    document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
    const target = document.getElementById(viewId);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ==========================================
  // DASHBOARD VIEW
  // ==========================================

  async loadDashboard() {
    const container = document.getElementById('dashboard-roadmaps-grid');
    const statsTotalHours = document.getElementById('dash-stat-hours');
    const statsActiveCount = document.getElementById('dash-stat-active');
    const statsCompletedCount = document.getElementById('dash-stat-completed');
    const emptyState = document.getElementById('dashboard-empty-state');

    if (!container) return;

    container.innerHTML = `
      <div class="skeleton-shimmer-card" style="height: 180px;"></div>
      <div class="skeleton-shimmer-card" style="height: 180px;"></div>
      <div class="skeleton-shimmer-card" style="height: 180px;"></div>
    `;

    try {
      this.roadmapsList = await window.hermesAI.getRoadmaps();
      
      let totalLearnedHours = 0;
      let completedRoadmaps = 0;
      let activeRoadmaps = 0;

      this.roadmapsList.forEach(r => {
        totalLearnedHours += (r.completedHours || 0);
        if (r.overallProgress === 100) {
          completedRoadmaps++;
        } else {
          activeRoadmaps++;
        }
      });

      if (statsTotalHours) statsTotalHours.textContent = `${Math.round(totalLearnedHours)}h`;
      if (statsActiveCount) statsActiveCount.textContent = `${this.roadmapsList.length}`;
      if (statsCompletedCount) statsCompletedCount.textContent = `${completedRoadmaps}`;

      if (this.roadmapsList.length === 0) {
        container.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }

      if (emptyState) emptyState.classList.add('hidden');
      container.classList.remove('hidden');
      container.innerHTML = '';

      this.roadmapsList.forEach(roadmap => {
        const card = document.createElement('div');
        card.className = 'roadmap-dash-card animate-fade-in-up';
        
        // Parse skills/interests tags cleanly
        const rawInterests = (roadmap.interests || '')
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
        
        // Clean display role
        let roleBadge = roadmap.targetRole ? roadmap.targetRole.trim() : '';
        if (!roleBadge && rawInterests.length > 0) {
          roleBadge = rawInterests[0];
        }
        if (!roleBadge) {
          roleBadge = 'Custom Track';
        }
        if (roleBadge.length > 28) {
          roleBadge = roleBadge.substring(0, 26) + '...';
        }

        // Distinct skill tags (exclude the role if already shown as roleBadge)
        const displayTags = rawInterests.filter(t => t.toLowerCase() !== roleBadge.toLowerCase());
        const maxTags = 3;
        const visibleTags = displayTags.length > 0 ? displayTags.slice(0, maxTags) : [roleBadge];
        const extraCount = displayTags.length > maxTags ? displayTags.length - maxTags : 0;

        card.innerHTML = `
          <div class="card-top-row">
            <span class="card-role-tag" title="${this.escapeHTML(roleBadge)}">${this.escapeHTML(roleBadge)}</span>
            <div class="card-actions-wrapper">
              <button class="btn-card-quick-delete" data-id="${roadmap.id}" title="Delete Roadmap" aria-label="Delete Roadmap">
                <i class="ph ph-trash"></i>
              </button>
              <div class="card-more-dropdown-wrap">
                <button class="btn-card-more-menu" aria-label="More Actions">
                  <i class="ph ph-dots-three-vertical"></i>
                </button>
                <div class="card-more-dropdown-menu">
                  <button class="card-dropdown-item btn-open-from-menu" data-id="${roadmap.id}">
                    <i class="ph ph-arrow-square-out"></i> Open Roadmap
                  </button>
                  <button class="card-dropdown-item btn-dup-from-menu" data-id="${roadmap.id}">
                    <i class="ph ph-copy"></i> Duplicate Track
                  </button>
                  <button class="card-dropdown-item btn-export-from-menu" data-id="${roadmap.id}">
                    <i class="ph ph-download-simple"></i> Export
                  </button>
                  <div class="card-dropdown-divider"></div>
                  <button class="card-dropdown-item text-danger btn-delete-from-menu" data-id="${roadmap.id}">
                    <i class="ph ph-trash"></i> Delete Roadmap
                  </button>
                </div>
              </div>
            </div>
          </div>

          <h3 class="card-roadmap-title" title="${this.escapeHTML(roadmap.title)}">${this.escapeHTML(roadmap.title)}</h3>
          <p class="card-roadmap-goal" title="${this.escapeHTML(roadmap.goal || 'Goal-driven curriculum roadmap')}">${this.escapeHTML(roadmap.goal || 'Goal-driven curriculum roadmap')}</p>

          <div class="card-tags-row">
            ${visibleTags.map(tag => `<span class="tag-pill" title="${this.escapeHTML(tag)}">${this.escapeHTML(tag)}</span>`).join('')}
            ${extraCount > 0 ? `<span class="tag-pill-more" title="${extraCount} more skills">+${extraCount} more</span>` : ''}
          </div>

          <div class="card-progress-section">
            <div class="card-progress-meta">
              <span>Overall Progress</span>
              <strong>${roadmap.overallProgress || 0}%</strong>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${roadmap.overallProgress || 0}%"></div>
            </div>
          </div>

          <div class="card-footer-row">
            <div class="card-stats-badges">
              <span class="pill-stat"><i class="ph ph-check-square"></i> ${roadmap.milestonesCount || 0} Checkpoints</span>
              <span class="pill-stat"><i class="ph ph-clock"></i> ${roadmap.completedHours || 0} / ${roadmap.totalHours || 0}h</span>
            </div>
            <button class="btn btn-primary btn-sm btn-open-roadmap" data-id="${roadmap.id}">
              Continue <i class="ph ph-arrow-right"></i>
            </button>
          </div>
        `;

        // Card navigation
        card.querySelector('.btn-open-roadmap').addEventListener('click', () => {
          this.navigateTo('roadmap', roadmap.id);
        });

        card.querySelector('.btn-open-from-menu')?.addEventListener('click', () => {
          this.navigateTo('roadmap', roadmap.id);
        });

        // Quick delete button
        card.querySelector('.btn-card-quick-delete')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(`Are you sure you want to delete "${roadmap.title}"?`)) {
            await window.hermesAI.deleteRoadmap(roadmap.id);
            this.showToast('🗑️ Roadmap deleted', 'info');
            this.loadDashboard();
          }
        });

        // Menu delete button
        card.querySelector('.btn-delete-from-menu')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(`Are you sure you want to delete "${roadmap.title}"?`)) {
            await window.hermesAI.deleteRoadmap(roadmap.id);
            this.showToast('🗑️ Roadmap deleted', 'info');
            this.loadDashboard();
          }
        });

        // Duplicate track
        card.querySelector('.btn-dup-from-menu')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            const raw = await fetch(`/api/roadmaps/${roadmap.id}`, { headers: window.hermesAI.getHeaders() });
            const fullRoadmap = await raw.json();
            const cloned = {
              ...fullRoadmap,
              id: `rdm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              title: `${fullRoadmap.title} (Copy)`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await window.hermesAI.saveRoadmap(cloned);
            this.showToast('📋 Roadmap duplicated!', 'success');
            this.loadDashboard();
          } catch (err) {
            this.showToast(`Duplication failed: ${err.message}`, 'error');
          }
        });

        // Export from menu
        card.querySelector('.btn-export-from-menu')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          const raw = await fetch(`/api/roadmaps/${roadmap.id}`, { headers: window.hermesAI.getHeaders() });
          const full = await raw.json();
          this.openExportModal(full);
        });

        container.appendChild(card);
      });

    } catch (err) {
      console.error('Failed to load dashboard:', err);
      container.innerHTML = `<div class="error-banner">Failed to load roadmaps. Please try again.</div>`;
    }
  }

  // ==========================================
  // FLOW A — ONBOARDING WIZARD
  // ==========================================

  startOnboardingWizard() {
    this.wizardData = {
      step: 1,
      interests: [],
      skillLevel: 'Beginner',
      skillDetails: '',
      goal: '',
      targetRole: ''
    };
    this.updateWizardStepUI(1);
    this.navigateTo('wizard');
  }

  bindWizardEvents() {
    // Interest multi-select tags
    const interestPills = document.querySelectorAll('.wizard-interest-tag');
    interestPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const val = pill.getAttribute('data-value');
        pill.classList.toggle('selected');
        if (pill.classList.contains('selected')) {
          if (!this.wizardData.interests.includes(val)) this.wizardData.interests.push(val);
        } else {
          this.wizardData.interests = this.wizardData.interests.filter(i => i !== val);
        }
      });
    });

    // Custom interest tag input
    const customTagInput = document.getElementById('wizard-custom-interest');
    customTagInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = customTagInput.value.trim();
        if (val && !this.wizardData.interests.includes(val)) {
          this.wizardData.interests.push(val);
          const tagSpan = document.createElement('button');
          tagSpan.className = 'wizard-interest-tag selected';
          tagSpan.textContent = val;
          tagSpan.addEventListener('click', () => {
            tagSpan.remove();
            this.wizardData.interests = this.wizardData.interests.filter(i => i !== val);
          });
          document.getElementById('wizard-interests-tags-wrap')?.appendChild(tagSpan);
          customTagInput.value = '';
        }
      }
    });

    // Skill level selection cards
    const levelCards = document.querySelectorAll('.wizard-level-card');
    levelCards.forEach(card => {
      card.addEventListener('click', () => {
        levelCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.wizardData.skillLevel = card.getAttribute('data-level');
      });
    });

    // Quick goal preset chips
    const goalChips = document.querySelectorAll('.wizard-goal-chip');
    goalChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const goalInput = document.getElementById('wizard-goal-input');
        if (goalInput) {
          goalInput.value = chip.textContent.trim();
          this.wizardData.goal = goalInput.value;
        }
      });
    });

    // Next / Back buttons
    document.getElementById('btn-wizard-next-1')?.addEventListener('click', () => {
      if (this.wizardData.interests.length === 0) {
        this.showToast('Please select at least one interest area', 'warning');
        return;
      }
      this.updateWizardStepUI(2);
    });

    document.getElementById('btn-wizard-back-2')?.addEventListener('click', () => this.updateWizardStepUI(1));
    document.getElementById('btn-wizard-next-2')?.addEventListener('click', () => {
      const detailsInput = document.getElementById('wizard-skill-details');
      if (detailsInput) this.wizardData.skillDetails = detailsInput.value.trim();
      this.updateWizardStepUI(3);
    });

    document.getElementById('btn-wizard-back-3')?.addEventListener('click', () => this.updateWizardStepUI(2));
    document.getElementById('btn-wizard-next-3')?.addEventListener('click', () => {
      const goalInput = document.getElementById('wizard-goal-input');
      if (goalInput && !goalInput.value.trim()) {
        this.showToast('Please enter your primary learning goal', 'warning');
        return;
      }
      if (goalInput) this.wizardData.goal = goalInput.value.trim();
      this.updateWizardStepUI(4);
    });

    document.getElementById('btn-wizard-back-4')?.addEventListener('click', () => this.updateWizardStepUI(3));
    
    // Submit Wizard and Trigger AI Generation
    document.getElementById('btn-wizard-submit-generate')?.addEventListener('click', () => {
      const roleInput = document.getElementById('wizard-role-input');
      if (roleInput) this.wizardData.targetRole = roleInput.value.trim();
      this.executeAIOnboardingGeneration();
    });
  }

  updateWizardStepUI(stepNumber) {
    this.wizardData.step = stepNumber;
    
    // Update step tracker
    for (let i = 1; i <= 4; i++) {
      const stepItem = document.getElementById(`wizard-indicator-step-${i}`);
      if (stepItem) {
        if (i < stepNumber) {
          stepItem.className = 'wizard-step-indicator completed';
        } else if (i === stepNumber) {
          stepItem.className = 'wizard-step-indicator active';
        } else {
          stepItem.className = 'wizard-step-indicator pending';
        }
      }
    }

    // Show active step section
    for (let s = 1; s <= 5; s++) {
      const section = document.getElementById(`wizard-step-section-${s}`);
      if (section) {
        if (s === stepNumber) {
          section.classList.remove('hidden');
        } else {
          section.classList.add('hidden');
        }
      }
    }
  }

  showRoadmapGeneratingOverlay(initialText = 'Crafting your personalized learning universe...') {
    const _genOverlayTexts = [
      'Crafting your personalized learning universe...',
      'Mapping skill constellations...',
      'Calibrating milestone trajectories...',
      'Assembling your cosmic roadmap...',
      'Weaving knowledge pathways...',
    ];
    if (!document.getElementById('hermes-gen-overlay-style')) {
      const _s = document.createElement('style');
      _s.id = 'hermes-gen-overlay-style';
      _s.textContent = `
        #hermes-gen-overlay {
          position:fixed;inset:0;z-index:9999;
          background:rgba(10,10,15,0.93);
          backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
          display:flex;flex-direction:column;align-items:center;
          justify-content:center;gap:20px;
          animation:_gFadeIn 0.35s ease;
        }
        @keyframes _gFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes _gFadeOut{from{opacity:1}to{opacity:0}}
        #hermes-gen-overlay.fading{animation:_gFadeOut 0.4s ease forwards;}
        #hermes-gen-overlay img{border-radius:16px;box-shadow:0 0 60px rgba(79,70,229,0.45);width:320px;max-width:88vw;}
        #hermes-gen-ol-text{
          color:#FFFFFF;font-family:'Plus Jakarta Sans',sans-serif;
          font-size:18px;font-weight:700;text-align:center;
          max-width:380px;letter-spacing:-0.01em;line-height:1.4;
          transition:opacity 0.25s ease;
        }
        .hg-dots{display:flex;gap:8px;}
        .hg-dots span{
          width:8px;height:8px;border-radius:50%;
          background:#4F46E5;animation:_gDot 1.2s infinite ease-in-out;
        }
        .hg-dots span:nth-child(2){animation-delay:0.2s;background:#7C73F5;}
        .hg-dots span:nth-child(3){animation-delay:0.4s;background:#A5A0FF;}
        @keyframes _gDot{
          0%,80%,100%{transform:scale(0.7);opacity:0.5;}
          40%{transform:scale(1.2);opacity:1;}
        }
      `;
      document.head.appendChild(_s);
    }
    let _overlay = document.getElementById('hermes-gen-overlay');
    if (!_overlay) {
      _overlay = document.createElement('div');
      _overlay.id = 'hermes-gen-overlay';
      _overlay.innerHTML = `
        <p id="hermes-gen-ol-text">${initialText}</p>
        <div class="hg-dots" style="margin-top:-6px;margin-bottom:6px;"><span></span><span></span><span></span></div>
        <img src="https://cdn.dribbble.com/userupload/42153336/file/original-47d79aeef2b6c2f3d94914d2ecfda559.gif"
             alt="Generating roadmap..." />
      `;
      document.body.appendChild(_overlay);
    }

    let _gti = 0;
    const _gtEl = document.getElementById('hermes-gen-ol-text');
    const _gtInt = setInterval(() => {
      _gti = (_gti + 1) % _genOverlayTexts.length;
      if (_gtEl) { 
        _gtEl.style.opacity='0'; 
        setTimeout(() => { if(_gtEl){_gtEl.textContent=_genOverlayTexts[_gti];_gtEl.style.opacity='1';} }, 150); 
      }
    }, 650);

    const _genT0 = Date.now();
    return () => {
      clearInterval(_gtInt);
      const elapsed = Date.now() - _genT0;
      const wait = Math.max(0, 2000 - elapsed);
      setTimeout(() => { 
        if (_overlay && _overlay.parentNode) { 
          _overlay.classList.add('fading'); 
          setTimeout(() => { if(_overlay && _overlay.parentNode) _overlay.remove(); }, 420); 
        } 
      }, wait);
    };
  }

  async executeAIOnboardingGeneration() {
    this.updateWizardStepUI(5); // Generation animation state

    const genStatusText = document.getElementById('wizard-generation-status-text');
    const progressFill = document.getElementById('wizard-gen-progress-fill');

    const updateStatus = (text, pct) => {
      if (genStatusText) genStatusText.textContent = text;
      if (progressFill) progressFill.style.width = `${pct}%`;
    };

    updateStatus('Synthesizing career objectives and skill profile...', 25);

    // ── AI GENERATION LOADING OVERLAY (minimum 2 seconds) ──────────────────
    const _genOverlayTexts = [
      'Crafting your personalized learning universe...',
      'Mapping skill constellations...',
      'Calibrating milestone trajectories...',
      'Assembling your cosmic roadmap...',
      'Weaving knowledge pathways...',
    ];
    if (!document.getElementById('hermes-gen-overlay-style')) {
      const _s = document.createElement('style');
      _s.id = 'hermes-gen-overlay-style';
      _s.textContent = `
        #hermes-gen-overlay {
          position:fixed;inset:0;z-index:9999;
          background:rgba(10,10,15,0.93);
          backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
          display:flex;flex-direction:column;align-items:center;
          justify-content:center;gap:24px;
          animation:_gFadeIn 0.35s ease;
        }
        @keyframes _gFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes _gFadeOut{from{opacity:1}to{opacity:0}}
        #hermes-gen-overlay.fading{animation:_gFadeOut 0.4s ease forwards;}
        #hermes-gen-overlay img{border-radius:16px;box-shadow:0 0 60px rgba(79,70,229,0.45);}
        #hermes-gen-ol-text{
          color:#E8E8E8;font-family:'Plus Jakarta Sans',sans-serif;
          font-size:16px;font-weight:500;text-align:center;
          max-width:340px;letter-spacing:0.01em;
          transition:opacity 0.25s ease;
        }
        .hg-dots{display:flex;gap:8px;}
        .hg-dots span{
          width:8px;height:8px;border-radius:50%;
          background:#4F46E5;animation:_gDot 1.2s infinite ease-in-out;
        }
        .hg-dots span:nth-child(2){animation-delay:0.2s;background:#7C73F5;}
        .hg-dots span:nth-child(3){animation-delay:0.4s;background:#A5A0FF;}
        @keyframes _gDot{
          0%,80%,100%{transform:scale(0.7);opacity:0.5;}
          40%{transform:scale(1.2);opacity:1;}
        }
      `;
      document.head.appendChild(_s);
    }
    const _overlay = document.createElement('div');
    _overlay.id = 'hermes-gen-overlay';
    _overlay.innerHTML = `
      <p id="hermes-gen-ol-text">${_genOverlayTexts[0]}</p>
      <div class="hg-dots" style="margin-top:-6px;margin-bottom:6px;"><span></span><span></span><span></span></div>
      <img src="https://cdn.dribbble.com/userupload/42153336/file/original-47d79aeef2b6c2f3d94914d2ecfda559.gif"
           width="300" style="max-width:88vw" alt="Generating roadmap..." />
    `;
    document.body.appendChild(_overlay);

    let _gti = 0;
    const _gtEl = document.getElementById('hermes-gen-ol-text');
    const _gtInt = setInterval(() => {
      _gti = (_gti + 1) % _genOverlayTexts.length;
      if (_gtEl) { _gtEl.style.opacity='0'; setTimeout(() => { if(_gtEl){_gtEl.textContent=_genOverlayTexts[_gti];_gtEl.style.opacity='1';} }, 150); }
    }, 650);

    const _genT0 = Date.now();
    const _removeOverlay = () => {
      clearInterval(_gtInt);
      const elapsed = Date.now() - _genT0;
      const wait = Math.max(0, 2000 - elapsed);
      setTimeout(() => { if (_overlay.parentNode) { _overlay.classList.add('fading'); setTimeout(() => { if(_overlay.parentNode) _overlay.remove(); }, 420); } }, wait);
    };
    // ── END OVERLAY ──────────────────────────────────────────────────────────

    try {
      setTimeout(() => updateStatus('Formulating milestone progression and time budgets...', 55), 700);
      setTimeout(() => updateStatus('Curating verified documentation, videos, and exercises...', 80), 1400);

      const generated = await window.hermesAI.generateRoadmap(this.wizardData);

      updateStatus('Finalizing recursive learning tree...', 100);
      _removeOverlay();

      // Pre-set in-memory roadmap for instant, flicker-free navigation
      this.currentRoadmap = generated;

      if (!this.currentUser) {
        // Track in guest roadmaps
        const guestRoadmaps = JSON.parse(localStorage.getItem('hermes_guest_roadmaps') || '[]');
        if (!guestRoadmaps.includes(generated.id)) {
          guestRoadmaps.push(generated.id);
        }
        localStorage.setItem('hermes_guest_roadmaps', JSON.stringify(guestRoadmaps));
      }

      this.showToast('Roadmap generated successfully!', 'success');
      setTimeout(() => {
        this.navigateTo('roadmap', generated.id);
      }, 500);

    } catch (err) {
      _removeOverlay();
      console.error('Generation failed:', err);
      this.showToast(`Generation failed: ${err.message}`, 'error');
      this.updateWizardStepUI(4);
    }
  }

  // ==========================================
  // FLOW B — TEMPLATE GALLERY
  // ==========================================

  loadTemplateGallery() {
    const grid = document.getElementById('gallery-templates-grid');
    const categoryFilters = document.querySelectorAll('.gallery-category-filter');
    if (!grid) return;

    if (!this.galleryFilterBound) {
      this.galleryFilterBound = true;
      categoryFilters.forEach(btn => {
        btn.addEventListener('click', () => {
          categoryFilters.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeGalleryCategory = btn.getAttribute('data-category');
          this.renderTemplateGalleryCards();
        });
      });
    }

    this.activeGalleryCategory = this.activeGalleryCategory || 'all';
    this.renderTemplateGalleryCards();
  }

  renderTemplateGalleryCards() {
    const grid = document.getElementById('gallery-templates-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const templates = window.HERMES_TEMPLATES || [];
    const activeCat = (this.activeGalleryCategory || 'all').toLowerCase();

    const filtered = templates.filter(tpl => {
      if (activeCat === 'all') return true;
      const c = (tpl.category || '').toLowerCase();
      if (c === activeCat || c.includes(activeCat) || activeCat.includes(c)) return true;
      if (activeCat.includes('lang') && (c.includes('lang') || c.includes('programming'))) return true;
      if (activeCat.includes('data') && (c.includes('data') || c.includes('analytics'))) return true;
      if (activeCat.includes('ai') && (c.includes('ai') || c.includes('machine learning'))) return true;
      if (activeCat.includes('cloud') && (c.includes('cloud') || c.includes('devops'))) return true;
      if (activeCat.includes('security') && (c.includes('security') || c.includes('cyber'))) return true;
      return false;
    });

    filtered.forEach((tpl, idx) => {
      const card = document.createElement('div');
      card.className = 'template-gallery-card animate-fade-in-up';
      card.style.animationDelay = `${idx * 40}ms`;

      // Parse tags for template
      const rawInterests = (tpl.interests || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      const maxTags = 3;
      const visibleTags = rawInterests.slice(0, maxTags);
      const extraCount = rawInterests.length > maxTags ? rawInterests.length - maxTags : 0;

      card.innerHTML = `
        <div class="tpl-card-header" style="cursor: pointer;">
          <span class="tpl-badge">${this.escapeHTML(tpl.badge || tpl.category)}</span>
          <span class="tpl-hours"><i class="ph ph-hourglass"></i> ${tpl.estimatedTotalHours || 100}h total</span>
        </div>

        <h3 class="tpl-title" style="cursor: pointer;" title="${this.escapeHTML(tpl.title)}">${this.escapeHTML(tpl.title)}</h3>
        <p class="tpl-desc" title="${this.escapeHTML(tpl.description)}">${this.escapeHTML(tpl.description)}</p>

        <div class="card-tags-row">
          ${visibleTags.map(tag => `<span class="tag-pill" title="${this.escapeHTML(tag)}">${this.escapeHTML(tag)}</span>`).join('')}
          ${extraCount > 0 ? `<span class="tag-pill-more" title="${extraCount} more skills">+${extraCount} more</span>` : ''}
        </div>

        <div class="tpl-meta-tags">
          <span class="meta-tag"><i class="ph ph-check-circle"></i> ${tpl.milestonesCount || (tpl.nodes || []).length} Checkpoints</span>
          <span class="meta-tag"><i class="ph ph-gauge"></i> ${tpl.difficulty || 'All Levels'}</span>
        </div>

        <div class="tpl-actions-row">
          <button class="btn btn-primary btn-sm btn-view-tpl" data-id="${tpl.id}" title="Directly explore this ready-made roadmap">
            <i class="ph ph-graph"></i> Explore Roadmap
          </button>
          <button class="btn btn-secondary btn-sm btn-personalize-tpl" data-id="${tpl.id}" title="Tune difficulty and pacing with AI">
            <i class="ph ph-sparkle"></i> Personalize
          </button>
          <button class="btn btn-secondary btn-sm btn-clone-tpl" data-id="${tpl.id}" title="Clone to your personal dashboard">
            <i class="ph ph-copy"></i> Clone
          </button>
        </div>
      `;

      // Direct Explore / View Roadmap
      const exploreRoadmap = () => {
        this.navigateTo('roadmap', tpl.id);
      };

      card.querySelector('.btn-view-tpl').addEventListener('click', exploreRoadmap);
      card.querySelector('.tpl-title').addEventListener('click', exploreRoadmap);
      card.querySelector('.tpl-card-header').addEventListener('click', exploreRoadmap);

      card.querySelector('.btn-clone-tpl').addEventListener('click', () => {
        this.cloneTemplateDirectly(tpl);
      });

      card.querySelector('.btn-personalize-tpl').addEventListener('click', () => {
        this.openPersonalizeTemplateModal(tpl);
      });

      grid.appendChild(card);
    });
  }

  async cloneTemplateDirectly(template) {
    try {
      const cloned = {
        id: `rdm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: this.currentUser ? this.currentUser.id : 'usr_guest',
        title: template.title,
        goal: `Master ${template.title}`,
        targetRole: template.targetRole,
        interests: template.interests,
        skillLevel: 'Beginner',
        nodes: JSON.parse(JSON.stringify(template.nodes))
      };

      const saved = await window.hermesAI.saveRoadmap(cloned);
      this.showToast(`🎉 Template "${template.title}" cloned to your dashboard!`, 'success');
      this.navigateTo('roadmap', saved.id);
    } catch (err) {
      console.error('Clone failed:', err);
      this.showToast(`Clone failed: ${err.message}`, 'error');
    }
  }

  openPersonalizeTemplateModal(template) {
    const modal = document.getElementById('personalize-tpl-modal');
    if (!modal) return;

    modal.querySelector('#personalize-tpl-title').textContent = `Personalize: ${template.title}`;
    modal.classList.remove('hidden');

    const form = modal.querySelector('#form-personalize-tpl');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const level = modal.querySelector('#personalize-level-select').value;
      const customGoal = modal.querySelector('#personalize-goal-input').value.trim();
      const btnSubmit = form.querySelector('button[type="submit"]');

      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Personalizing...`;

      try {
        const profile = {
          interests: template.interests,
          skillLevel: level,
          goal: customGoal || `Master ${template.title}`,
          targetRole: template.targetRole
        };

        const _hideOverlay = this.showRoadmapGeneratingOverlay('Personalizing tailored curriculum with AI...');
        let personalized;
        try {
          personalized = await window.hermesAI.generateRoadmap(profile);
        } finally {
          _hideOverlay();
        }
        this.currentRoadmap = personalized;
        modal.classList.add('hidden');
        this.showToast('Personalized roadmap created!', 'success');
        this.navigateTo('roadmap', personalized.id);
      } catch (err) {
        console.error(err);
        this.showToast(`Personalization failed: ${err.message}`, 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `Generate Tailored Roadmap`;
      }
    };

    modal.querySelector('#close-personalize-modal').onclick = () => {
      modal.classList.add('hidden');
    };

    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    };
  }

  // ==========================================
  // ROADMAP EXPLORER (TREE & GRAPH VIEW)
  // ==========================================

  async openRoadmapById(id) {
    this.showView('view-roadmap');
    const container = document.getElementById('roadmap-tree-container');
    const stickyHeader = document.getElementById('roadmap-sticky-stats');

    if (container) {
      container.innerHTML = `
        <div class="skeleton-shimmer-card" style="height: 120px; margin-bottom: 1rem;"></div>
        <div class="skeleton-shimmer-card" style="height: 120px; margin-bottom: 1rem;"></div>
        <div class="skeleton-shimmer-card" style="height: 120px;"></div>
      `;
    }

    try {
      // If we already have the target roadmap in memory from recent generation, use it
      if (this.currentRoadmap && this.currentRoadmap.id === id) {
        // Already loaded in memory
      } else if (id.startsWith('tpl_')) {
        const tpl = (window.HERMES_TEMPLATES || []).find(t => t.id === id);
        if (tpl) {
          this.currentRoadmap = {
            id: tpl.id,
            userId: this.currentUser ? this.currentUser.id : 'usr_guest',
            title: tpl.title,
            goal: `Master ${tpl.title}`,
            targetRole: tpl.targetRole,
            interests: tpl.interests,
            skillLevel: 'Beginner',
            nodes: JSON.parse(JSON.stringify(tpl.nodes))
          };
        } else {
          this.currentRoadmap = await window.hermesAI.getRoadmapById(id);
        }
      } else {
        this.currentRoadmap = await window.hermesAI.getRoadmapById(id);
      }
      
      if (!this.roadmapRenderer) {
        this.roadmapRenderer = new window.HermesRoadmapRenderer({
          container: container,
          stickyHeader: stickyHeader,
          onUpdate: async (updatedRoadmap) => {
            try {
              if (!updatedRoadmap.id.startsWith('tpl_')) {
                await window.hermesAI.updateRoadmap(updatedRoadmap.id, updatedRoadmap);
              }
            } catch (err) {
              console.error('Failed to sync roadmap state:', err);
            }
          },
          onAdjustRequested: (node, type) => {
            this.openAdjustModal(node, type);
          },
          onAddSubmodule: (parentNode) => {
            this.openAddNodeModal(parentNode);
          }
        });
      }

      this.roadmapRenderer.setRoadmap(this.currentRoadmap);

    } catch (err) {
      console.error('Failed to load roadmap:', err);
      if (container) {
        container.innerHTML = `
          <div class="error-banner">
            <h3>Roadmap not found</h3>
            <p>The requested roadmap may have been deleted or belongs to another user.</p>
            <button class="btn btn-primary btn-sm" onclick="window.hermesApp.navigateTo('dashboard')">
              Return to Dashboard
            </button>
          </div>
        `;
      }
    }
  }

  // ==========================================
  // MODALS & ACTIONS
  // ==========================================

  bindActionModals() {
    // Level Adjustment Modal
    const adjustModal = document.getElementById('adjust-node-modal');
    const formAdjust = document.getElementById('form-adjust-node');
    const closeAdjust = document.getElementById('close-adjust-modal');

    closeAdjust?.addEventListener('click', () => adjustModal.classList.add('hidden'));
    adjustModal?.addEventListener('click', (e) => {
      if (e.target === adjustModal) adjustModal.classList.add('hidden');
    });

    formAdjust?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const node = this.activeAdjustNode;
      if (!node) return;

      const type = document.getElementById('adjust-type-select').value;
      const notes = document.getElementById('adjust-notes-input').value.trim();
      const submitBtn = formAdjust.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Tuning Section...`;

      try {
        const revised = await window.hermesAI.adjustMilestone(node, type, this.currentRoadmap.skillLevel, notes);
        
        // Update in-place in current roadmap
        Object.assign(node, revised);
        this.roadmapRenderer.recalculateAndRender();
        await window.hermesAI.updateRoadmap(this.currentRoadmap.id, this.currentRoadmap);
        
        adjustModal.classList.add('hidden');
        this.showToast('Section adjusted successfully', 'success');
      } catch (err) {
        console.error(err);
        this.showToast(`Adjustment failed: ${err.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Apply Adjustment`;
      }
    });

    // Add Custom Node Modal
    const addNodeModal = document.getElementById('add-node-modal');
    const formAddNode = document.getElementById('form-add-node');
    const closeAddNode = document.getElementById('close-add-node-modal');

    closeAddNode?.addEventListener('click', () => addNodeModal.classList.add('hidden'));
    addNodeModal?.addEventListener('click', (e) => {
      if (e.target === addNodeModal) addNodeModal.classList.add('hidden');
    });

    formAddNode?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('new-node-title').value.trim();
      const desc = document.getElementById('new-node-desc').value.trim();
      const hours = parseInt(document.getElementById('new-node-hours').value) || 4;
      const resTitle = document.getElementById('new-node-res-title').value.trim();
      const resUrl = document.getElementById('new-node-res-url').value.trim();
      const resType = document.getElementById('new-node-res-type').value;

      const newNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title,
        description: desc,
        status: 'not_started',
        progress: 0,
        estimatedHours: hours,
        resources: resTitle ? [{ type: resType, title: resTitle, url: resUrl, isFree: true }] : [],
        children: [],
        isExpandable: true,
        isExpanded: false
      };

      if (this.activeParentNode) {
        if (!this.activeParentNode.children) this.activeParentNode.children = [];
        this.activeParentNode.children.push(newNode);
        this.activeParentNode.isExpanded = true;
      } else {
        this.currentRoadmap.nodes.push(newNode);
      }

      this.roadmapRenderer.recalculateAndRender();
      await window.hermesAI.updateRoadmap(this.currentRoadmap.id, this.currentRoadmap);
      
      addNodeModal.classList.add('hidden');
      formAddNode.reset();
      this.showToast('Checkpoint added', 'success');
    });

    // Module Quiz Modal Controls
    const quizModal = document.getElementById('module-quiz-modal');
    const closeQuizBtn = document.getElementById('btn-close-quiz-modal');
    const nextQBtn = document.getElementById('btn-quiz-next-q');
    const retakeQuizBtn = document.getElementById('btn-quiz-retake');
    const markMasteredBtn = document.getElementById('btn-quiz-mark-mastered');

    closeQuizBtn?.addEventListener('click', () => quizModal?.classList.add('hidden'));
    quizModal?.addEventListener('click', (e) => {
      if (e.target === quizModal) quizModal.classList.add('hidden');
    });

    nextQBtn?.addEventListener('click', () => {
      this.handleQuizNextQuestion();
    });

    retakeQuizBtn?.addEventListener('click', () => {
      if (this.currentQuizData && this.activeQuizNode) {
        this.startQuizSession(this.currentQuizData, this.activeQuizNode);
      }
    });

    markMasteredBtn?.addEventListener('click', async () => {
      if (this.activeQuizNode && this.currentRoadmap) {
        this.activeQuizNode.status = 'completed';
        this.activeQuizNode.progress = 100;
        this.roadmapRenderer.setAllDescendantsStatus(this.activeQuizNode, 'completed', 100);
        this.roadmapRenderer.recalculateAndRender();
        await window.hermesAI.updateRoadmap(this.currentRoadmap.id, this.currentRoadmap);
        quizModal?.classList.add('hidden');
        this.showToast(`🎉 "${this.activeQuizNode.title}" marked as Completed!`, 'success');
      }
    });
  }

  // ==========================================
  // MODULE QUIZ INTERACTION ENGINE
  // ==========================================
  async openQuizModal(node, roadmap) {
    this.activeQuizNode = node;
    const modal = document.getElementById('module-quiz-modal');
    const loadingState = document.getElementById('quiz-loading-state');
    const activeState = document.getElementById('quiz-active-state');
    const summaryState = document.getElementById('quiz-summary-state');
    const titleEl = document.getElementById('quiz-module-title');

    if (!modal) return;

    modal.classList.remove('hidden');
    loadingState?.classList.remove('hidden');
    activeState?.classList.add('hidden');
    summaryState?.classList.add('hidden');
    if (titleEl) titleEl.textContent = `${node.title} — Quiz`;

    try {
      const quiz = await window.hermesAI.generateQuiz(node.title, node.description || '', 5);
      this.currentQuizData = quiz;
      this.startQuizSession(quiz, node);
    } catch (err) {
      console.error(err);
      this.showToast('Failed to load quiz: ' + err.message, 'error');
      modal.classList.add('hidden');
    }
  }

  startQuizSession(quiz, node) {
    this.quizQuestions = quiz.questions || [];
    this.currentQuestionIdx = 0;
    this.quizScore = 0;
    this.quizUserAnswers = [];

    const loadingState = document.getElementById('quiz-loading-state');
    const activeState = document.getElementById('quiz-active-state');
    const summaryState = document.getElementById('quiz-summary-state');

    loadingState?.classList.add('hidden');
    summaryState?.classList.add('hidden');
    activeState?.classList.remove('hidden');

    this.renderCurrentQuizQuestion();
  }

  renderCurrentQuizQuestion() {
    const q = this.quizQuestions[this.currentQuestionIdx];
    if (!q) {
      this.renderQuizSummary();
      return;
    }

    const total = this.quizQuestions.length;
    const counterEl = document.getElementById('quiz-q-counter');
    const scoreEl = document.getElementById('quiz-live-score');
    const progressEl = document.getElementById('quiz-progress-bar');
    const promptEl = document.getElementById('quiz-question-text');
    const codeBlock = document.getElementById('quiz-code-snippet');
    const optionsContainer = document.getElementById('quiz-options-container');
    const explanationBox = document.getElementById('quiz-explanation-box');
    const nextBtn = document.getElementById('btn-quiz-next-q');

    if (counterEl) counterEl.textContent = `Question ${this.currentQuestionIdx + 1} of ${total}`;
    if (scoreEl) scoreEl.innerHTML = `<i class="ph ph-trophy"></i> Score: ${this.quizScore} / ${total}`;
    if (progressEl) progressEl.style.width = `${Math.round(((this.currentQuestionIdx) / total) * 100)}%`;

    if (promptEl) promptEl.textContent = q.question;

    if (codeBlock) {
      if (q.codeSnippet && q.codeSnippet.trim().length > 0) {
        codeBlock.classList.remove('hidden');
        codeBlock.querySelector('code').textContent = q.codeSnippet;
      } else {
        codeBlock.classList.add('hidden');
      }
    }

    if (explanationBox) explanationBox.classList.add('hidden');
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.innerHTML = this.currentQuestionIdx === total - 1 
        ? `Finish Test & View Score <i class="ph ph-check-circle"></i>`
        : `Next Question <i class="ph ph-arrow-right"></i>`;
    }

    if (optionsContainer) {
      optionsContainer.innerHTML = '';
      optionsContainer.dataset.answered = 'false';
      const letters = ['A', 'B', 'C', 'D'];

      q.options.forEach((optText, optIdx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.innerHTML = `
          <span class="option-letter">${letters[optIdx]}</span>
          <span class="option-text">${this.escapeHTML(optText)}</span>
        `;

        btn.addEventListener('click', () => {
          this.handleQuizAnswerSelect(optIdx, q);
        });

        optionsContainer.appendChild(btn);
      });
    }
  }

  handleQuizAnswerSelect(selectedIdx, question) {
    const optionsContainer = document.getElementById('quiz-options-container');
    const nextBtn = document.getElementById('btn-quiz-next-q');
    const explanationBox = document.getElementById('quiz-explanation-box');
    const expTitle = document.getElementById('quiz-explanation-title');
    const expText = document.getElementById('quiz-explanation-text');

    if (!optionsContainer || optionsContainer.dataset.answered === 'true') return;
    optionsContainer.dataset.answered = 'true';

    const isCorrect = (selectedIdx === question.correctAnswer);
    if (isCorrect) {
      this.quizScore += 1;
    }

    this.quizUserAnswers.push({
      question: question.question,
      selected: selectedIdx,
      correct: question.correctAnswer,
      isCorrect
    });

    const buttons = optionsContainer.querySelectorAll('.quiz-option-btn');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === question.correctAnswer) {
        btn.classList.add('is-correct');
      } else if (idx === selectedIdx && !isCorrect) {
        btn.classList.add('is-wrong');
      }
    });

    if (explanationBox) {
      explanationBox.classList.remove('hidden');
      explanationBox.className = `quiz-explanation-card ${isCorrect ? 'exp-correct' : 'exp-wrong'}`;
      if (expTitle) {
        expTitle.innerHTML = isCorrect 
          ? `<i class="ph ph-check-circle"></i> Correct Answer!`
          : `<i class="ph ph-x-circle"></i> Incorrect.`;
      }
      if (expText) {
        expText.textContent = question.explanation || 'Review topic resources for detailed explanations.';
      }
    }

    if (nextBtn) nextBtn.disabled = false;
  }

  handleQuizNextQuestion() {
    this.currentQuestionIdx += 1;
    if (this.currentQuestionIdx >= this.quizQuestions.length) {
      this.renderQuizSummary();
    } else {
      this.renderCurrentQuizQuestion();
    }
  }

  renderQuizSummary() {
    const activeState = document.getElementById('quiz-active-state');
    const summaryState = document.getElementById('quiz-summary-state');
    const percentEl = document.getElementById('quiz-final-percent');
    const fractionEl = document.getElementById('quiz-final-fraction');
    const headlineEl = document.getElementById('quiz-result-headline');
    const sublineEl = document.getElementById('quiz-result-subline');
    const markMasteredBtn = document.getElementById('btn-quiz-mark-mastered');

    activeState?.classList.add('hidden');
    summaryState?.classList.remove('hidden');

    const total = this.quizQuestions.length;
    const percent = Math.round((this.quizScore / total) * 100);

    if (percentEl) percentEl.textContent = `${percent}%`;
    if (fractionEl) fractionEl.textContent = `${this.quizScore} / ${total} Correct`;

    // Persist quiz performance for overseer telemetry
    try {
      fetch('/api/quiz/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
        },
        body: JSON.stringify({
          userId: this.currentUser?.id || 'usr_guest',
          roadmapId: this.currentRoadmap?.id,
          moduleTitle: this.activeQuizNode?.title || 'Curriculum Milestone',
          score: this.quizScore,
          totalQuestions: total,
          percentage: percent,
          passed: percent >= 80
        })
      }).catch(() => {});
    } catch (_e) {}

    if (percent >= 80) {
      if (headlineEl) headlineEl.textContent = `🏆 Module Mastery Achieved!`;
      if (sublineEl) sublineEl.textContent = `Outstanding! You scored ${percent}% and demonstrated strong mastery over "${this.activeQuizNode?.title || 'this module'}".`;
      if (markMasteredBtn) markMasteredBtn.classList.remove('hidden');
    } else {
      if (headlineEl) headlineEl.textContent = `Good Attempt!`;
      if (sublineEl) sublineEl.textContent = `You scored ${percent}%. Review the verified resources in the drawer and retake the test to reach 80%+ mastery!`;
      if (markMasteredBtn) markMasteredBtn.classList.add('hidden');
    }
  }

  openAdjustModal(node, type = 'adjust') {
    this.activeAdjustNode = node;
    const modal = document.getElementById('adjust-node-modal');
    if (!modal) return;

    modal.querySelector('#adjust-node-heading').textContent = `Adjust: ${node.title}`;
    modal.classList.remove('hidden');
  }

  openAddNodeModal(parentNode = null) {
    this.activeParentNode = parentNode;
    const modal = document.getElementById('add-node-modal');
    if (!modal) return;

    modal.querySelector('#add-node-heading').textContent = parentNode 
      ? `Add Submodule to "${parentNode.title}"` 
      : 'Add Top-Level Milestone';
    modal.classList.remove('hidden');
  }

  // Export Modal (JSON / Markdown)
  openExportModal(roadmap) {
    const modal = document.getElementById('export-modal');
    if (!modal) return;

    const jsonSnippet = JSON.stringify(roadmap, null, 2);
    
    // Generate Markdown document
    let md = `# ${roadmap.title}\n\n`;
    md += `**Goal**: ${roadmap.goal}\n`;
    md += `**Target Role**: ${roadmap.targetRole}\n`;
    md += `**Overall Progress**: ${roadmap.overallProgress || 0}%\n\n`;
    md += `## Milestones & Learning Units\n\n`;

    const traverse = (nodes, depth = 0) => {
      nodes.forEach((n, idx) => {
        const indent = '  '.repeat(depth);
        const statusBox = n.status === 'completed' ? '[x]' : '[ ]';
        md += `${indent}- ${statusBox} **${n.title}** (${n.estimatedHours || 4} hrs) — ${n.description}\n`;
        if (n.resources && n.resources.length > 0) {
          n.resources.forEach(r => {
            md += `${indent}  - [${r.type.toUpperCase()}] ${r.title} ${r.url ? `(${r.url})` : ''}\n`;
          });
        }
        if (n.children && n.children.length > 0) {
          traverse(n.children, depth + 1);
        }
      });
    };

    traverse(roadmap.nodes || []);

    const textarea = modal.querySelector('#export-content-area');
    textarea.value = md;

    modal.querySelector('#tab-export-md').onclick = () => {
      modal.querySelector('#tab-export-md').classList.add('active');
      modal.querySelector('#tab-export-json').classList.remove('active');
      textarea.value = md;
    };

    modal.querySelector('#tab-export-json').onclick = () => {
      modal.querySelector('#tab-export-json').classList.add('active');
      modal.querySelector('#tab-export-md').classList.remove('active');
      textarea.value = jsonSnippet;
    };

    modal.querySelector('#btn-copy-export').onclick = () => {
      navigator.clipboard.writeText(textarea.value);
      this.showToast('Copied to clipboard!', 'success');
    };

    modal.querySelector('#btn-download-export').onclick = () => {
      const isJson = modal.querySelector('#tab-export-json').classList.contains('active');
      const blob = new Blob([textarea.value], { type: isJson ? 'application/json' : 'text/markdown' });
      const dlLink = document.createElement('a');
      dlLink.href = URL.createObjectURL(blob);
      dlLink.download = `${roadmap.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${isJson ? 'json' : 'md'}`;
      dlLink.click();
    };

    modal.querySelector('#close-export-modal').onclick = () => modal.classList.add('hidden');
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    };
    modal.classList.remove('hidden');
  }

  // Settings Modal (API Keys, Supabase & Provider Configuration)
  bindSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const form = document.getElementById('form-settings');
    const closeBtn = document.getElementById('close-settings-modal');
    const navBtn = document.getElementById('navbar-settings-btn');
    const btnTestSupabase = document.getElementById('btn-test-supabase');
    const btnSyncSupabase = document.getElementById('btn-sync-supabase');

    navBtn?.addEventListener('click', () => this.openSettingsModal());
    closeBtn?.addEventListener('click', () => modal.classList.add('hidden'));
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });

    // Test Supabase Connection
    btnTestSupabase?.addEventListener('click', async () => {
      const supabaseUrl = document.getElementById('settings-supabase-url').value.trim();
      const supabaseKey = document.getElementById('settings-supabase-key').value.trim();

      btnTestSupabase.disabled = true;
      btnTestSupabase.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Testing...`;

      try {
        const res = await fetch('/api/supabase/test', {
          method: 'POST',
          headers: window.hermesAI.getHeaders(),
          body: JSON.stringify({ supabaseUrl, supabaseKey })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          this.showToast('✅ Supabase Connected Successfully!', 'success');
          const pill = document.getElementById('supabase-status-pill');
          if (pill) {
            pill.textContent = '🟢 Cloud Connected';
            pill.style.color = '#34d399';
          }
        } else {
          this.showToast(`Supabase Error: ${data.error}`, 'error');
        }
      } catch (err) {
        this.showToast(`Connection failed: ${err.message}`, 'error');
      } finally {
        btnTestSupabase.disabled = false;
        btnTestSupabase.innerHTML = `<i class="ph ph-plugs-connected"></i> Test Connection`;
      }
    });

    // Sync Local Database to Supabase Cloud
    btnSyncSupabase?.addEventListener('click', async () => {
      btnSyncSupabase.disabled = true;
      btnSyncSupabase.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Syncing Database...`;

      try {
        const res = await fetch('/api/supabase/sync', {
          method: 'POST',
          headers: window.hermesAI.getHeaders()
        });
        const data = await res.json();
        if (res.ok && data.success) {
          this.showToast(`☁️ ${data.message}`, 'success');
        } else {
          this.showToast(`Sync Error: ${data.error}`, 'error');
        }
      } catch (err) {
        this.showToast(`Sync failed: ${err.message}`, 'error');
      } finally {
        btnSyncSupabase.disabled = false;
        btnSyncSupabase.innerHTML = `<i class="ph ph-cloud-arrow-up"></i> Sync to Supabase`;
      }
    });

    // Save All Settings Submit
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const provider = document.getElementById('settings-provider-select').value;
      const geminiKey = document.getElementById('settings-gemini-key').value;
      const claudeKey = document.getElementById('settings-claude-key').value;
      const openaiKey = document.getElementById('settings-openai-key').value;
      const supabaseUrl = document.getElementById('settings-supabase-url').value.trim();
      const supabaseKey = document.getElementById('settings-supabase-key').value.trim();

      try {
        const payload = { provider };
        if (geminiKey) payload.geminiApiKey = geminiKey;
        if (claudeKey) payload.claudeApiKey = claudeKey;
        if (openaiKey) payload.openaiApiKey = openaiKey;
        if (supabaseUrl !== undefined) payload.supabaseUrl = supabaseUrl;
        if (supabaseKey) payload.supabaseKey = supabaseKey;

        await fetch('/api/config', {
          method: 'POST',
          headers: window.hermesAI.getHeaders(),
          body: JSON.stringify(payload)
        });

        modal.classList.add('hidden');
        this.showToast('✅ All settings & database credentials saved!', 'success');
      } catch (err) {
        this.showToast(`Error saving settings: ${err.message}`, 'error');
      }
    });
  }

  async openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    try {
      const res = await fetch('/api/config');
      const cfg = await res.json();
      
      const providerSelect = modal.querySelector('#settings-provider-select');
      if (providerSelect) providerSelect.value = cfg.provider || 'offline';

      const supabaseUrlInput = modal.querySelector('#settings-supabase-url');
      if (supabaseUrlInput && cfg.supabaseUrl) supabaseUrlInput.value = cfg.supabaseUrl;

      const supabasePill = modal.querySelector('#supabase-status-pill');
      if (supabasePill) {
        if (cfg.hasSupabase) {
          supabasePill.textContent = '🟢 Cloud Connected';
          supabasePill.style.color = '#34d399';
        } else {
          supabasePill.textContent = 'Local JSON Storage';
          supabasePill.style.color = 'var(--text-muted)';
        }
      }

      modal.classList.remove('hidden');
    } catch (e) {
      console.error(e);
      modal.classList.remove('hidden');
    }
  }

  // Theme Management (Dark / Light)
  initTheme() {
    const toggle = document.getElementById('theme-toggle-btn');
    const saved = localStorage.getItem('hermes_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeIcon(saved);

    toggle?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('hermes_theme', next);
      this.updateThemeIcon(next);
    });
  }

  updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle-btn i');
    if (icon) {
      icon.className = theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
    }
  }

  // Toast Notification System
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'warning-circle';
    if (type === 'warning') iconName = 'warning';

    toast.innerHTML = `
      <i class="ph ph-${iconName}"></i>
      <span>${this.escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Global bootstrap
document.addEventListener('DOMContentLoaded', () => {
  window.hermesApp = new HermesApp();
});
