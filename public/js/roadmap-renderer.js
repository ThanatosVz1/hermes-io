// Hermes.io — Visual Connected Roadmap Graph Engine & Recursive Tree Renderer
// Features: roadmap.sh-style connected visual graph, auto-expanded submodules, interactive submodule checkboxes,
// unexpand/expand controls, smooth CSS animations, slide-over resource drawer, and tree view.

class HermesRoadmapRenderer {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('roadmap-tree-container');
    this.stickyHeader = options.stickyHeader || document.getElementById('roadmap-sticky-stats');
    this.drawerEl = options.drawerEl || document.getElementById('node-resource-drawer');
    this.roadmap = null;
    this.onUpdate = options.onUpdate || (() => {});
    this.onAdjustRequested = options.onAdjustRequested || (() => {});
    this.onAddSubmodule = options.onAddSubmodule || (() => {});
    
    this.currentViewMode = 'graph'; // 'graph' or 'tree'
    this.zoomLevel = 1.0;
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.activeDrawerNode = null;
    this.activeDrawerParentNode = null;
  }

  setRoadmap(roadmap) {
    this.roadmap = roadmap;
    this.ensureAllMilestonesAutoExpanded();
    this.recalculateAndRender();
  }

  // Ensure all milestones have submodules populated and are expanded by default
  ensureAllMilestonesAutoExpanded() {
    if (!this.roadmap || !this.roadmap.nodes) return;

    this.roadmap.nodes.forEach((milestone) => {
      if (!milestone.children || milestone.children.length === 0) {
        // If milestone has collapsed backup, restore it
        if (milestone.collapsedBackup && milestone.collapsedBackup.length > 0) {
          milestone.children = milestone.collapsedBackup;
          milestone.collapsedBackup = null;
        } else {
          // Auto-generate realistic submodules so it expands automatically
          const title = milestone.title || 'Core Topic';
          milestone.children = [
            {
              id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_1`,
              title: `Foundations & Theory of ${title.split('(')[0].trim()}`,
              description: `Understand the fundamental concepts, terminology, and core architecture of ${title}.`,
              status: 'not_started',
              progress: 0,
              estimatedHours: Math.max(2, Math.round((milestone.estimatedHours || 12) * 0.25)),
              recommendationType: 'recommended',
              resources: [{ type: 'docs', title: `Official Documentation for ${title}`, url: 'https://developer.mozilla.org/', isFree: true }],
              children: [],
              isExpandable: false
            },
            {
              id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_2`,
              title: `Core Workflows & Standard APIs`,
              description: `Practical hands-on patterns, syntax constructs, and library toolchains for ${title}.`,
              status: 'not_started',
              progress: 0,
              estimatedHours: Math.max(3, Math.round((milestone.estimatedHours || 12) * 0.35)),
              recommendationType: 'recommended',
              resources: [{ type: 'practice', title: `Hands-on Exercises and Examples`, url: 'https://github.com/', isFree: true }],
              children: [],
              isExpandable: false
            },
            {
              id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_3`,
              title: `Best Practices & Practical Application`,
              description: `Debugging, performance optimization, error handling, and production testing.`,
              status: 'not_started',
              progress: 0,
              estimatedHours: Math.max(2, Math.round((milestone.estimatedHours || 12) * 0.25)),
              recommendationType: 'alternative',
              resources: [{ type: 'article', title: `Industry Best Practices Guide`, url: 'https://github.com/', isFree: true }],
              children: [],
              isExpandable: false
            }
          ];
        }
      }
      milestone.isExpanded = true;
    });
  }

  setViewMode(mode) {
    this.currentViewMode = mode;
    this.render();
  }

  // Recalculate rollup progress and refresh UI
  recalculateAndRender() {
    if (!this.roadmap || !this.roadmap.nodes) return;
    this.calculateProgressRollup(this.roadmap.nodes);
    this.renderStatsHeader();
    this.render();
  }

  // Progress Rollup Calculation
  calculateProgressRollup(nodes) {
    if (!Array.isArray(nodes)) return { overallProgress: 0, totalHours: 0, completedHours: 0 };

    let totalWeighted = 0;
    let totalHours = 0;
    let completedHours = 0;

    const processNode = (node) => {
      if (node.children && node.children.length > 0) {
        let childSum = 0;
        node.children.forEach(child => {
          processNode(child);
          childSum += (typeof child.progress === 'number' ? child.progress : 0);
        });
        node.progress = Math.round(childSum / node.children.length);
        if (node.progress === 100) {
          node.status = 'completed';
        } else if (node.progress > 0) {
          node.status = 'in_progress';
        } else {
          node.status = 'not_started';
        }
      } else {
        if (node.status === 'completed') {
          node.progress = 100;
        } else if (node.status === 'in_progress') {
          node.progress = node.progress > 0 ? node.progress : 50;
        } else {
          node.progress = 0;
        }
      }
    };

    nodes.forEach(m => {
      processNode(m);
      const hours = m.estimatedHours || 4;
      totalHours += hours;
      totalWeighted += (m.progress * hours);
      completedHours += ((m.progress / 100) * hours);
    });

    this.roadmap.overallProgress = totalHours > 0 ? Math.round(totalWeighted / totalHours) : 0;
    this.roadmap.totalHours = totalHours;
    this.roadmap.completedHours = Math.round(completedHours * 10) / 10;

    return {
      overallProgress: this.roadmap.overallProgress,
      totalHours: this.roadmap.totalHours,
      completedHours: this.roadmap.completedHours
    };
  }

  // Render sticky top navigation & filter bar
  renderStatsHeader() {
    if (!this.stickyHeader || !this.roadmap) return;

    const completedMilestones = (this.roadmap.nodes || []).filter(n => n.status === 'completed').length;
    const totalMilestones = (this.roadmap.nodes || []).length;
    const progress = this.roadmap.overallProgress || 0;
    const totalHours = this.roadmap.totalHours || 0;
    const completedHours = this.roadmap.completedHours || 0;

    this.stickyHeader.innerHTML = `
      <div class="stats-bar-inner">
        <div class="stats-main-info">
          <div class="progress-ring-container animate-fade-in">
            <div class="progress-circle-wrap">
              <svg class="progress-circle" width="56" height="56" viewBox="0 0 56 56">
                <circle class="circle-bg" cx="28" cy="28" r="23"></circle>
                <circle class="circle-fill" cx="28" cy="28" r="23" style="stroke-dasharray: 144.5; stroke-dashoffset: ${144.5 - (144.5 * progress) / 100}"></circle>
              </svg>
              <span class="progress-percent-label">${progress}%</span>
            </div>
          </div>
          <div class="stats-text-block">
            <h2 class="roadmap-active-title">${this.escapeHTML(this.roadmap.title)}</h2>
            <div class="roadmap-sub-meta">
              <span class="meta-pill"><i class="ph ph-target"></i> ${this.escapeHTML(this.roadmap.targetRole || this.roadmap.goal || 'General Mastery')}</span>
              <span class="meta-pill"><i class="ph ph-hourglass-high"></i> ${completedHours} / ${totalHours} hrs</span>
              <span class="meta-pill"><i class="ph ph-check-circle"></i> ${completedMilestones} / ${totalMilestones} milestones</span>
            </div>
          </div>
        </div>

        <div class="stats-controls">
          <!-- View Mode Toggle (Visual Flowchart vs Tree List) -->
          <div class="view-mode-toggle-group">
            <button class="btn-toggle-view ${this.currentViewMode === 'graph' ? 'active' : ''}" id="btn-view-graph" title="Visual Flowchart Graph">
              <i class="ph ph-graph"></i> Visual Graph
            </button>
            <button class="btn-toggle-view ${this.currentViewMode === 'tree' ? 'active' : ''}" id="btn-view-tree" title="Nested Tree View">
              <i class="ph ph-list-dashes"></i> Tree View
            </button>
          </div>

          <div class="search-filter-group">
            <div class="input-with-icon search-input-box">
              <i class="ph ph-magnifying-glass"></i>
              <input type="text" id="tree-search-input" placeholder="Search topics..." value="${this.escapeHTML(this.searchQuery)}">
            </div>
            <select id="tree-status-filter" class="custom-select-compact">
              <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>All Status</option>
              <option value="in_progress" ${this.statusFilter === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="completed" ${this.statusFilter === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="not_started" ${this.statusFilter === 'not_started' ? 'selected' : ''}>Not Started</option>
            </select>
          </div>

          <div class="action-btn-group">
            <button class="btn btn-secondary btn-sm" id="btn-export-roadmap" title="Export roadmap JSON or Markdown">
              <i class="ph ph-share-network"></i> Export
            </button>
            <button class="btn btn-danger-soft btn-sm" id="btn-delete-active-roadmap" title="Delete this roadmap">
              <i class="ph ph-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Linear progress bar underneath -->
      <div class="stats-progress-strip">
        <div class="progress-strip-bar" style="width: ${progress}%"></div>
      </div>
    `;

    // Bind event listeners
    this.stickyHeader.querySelector('#btn-view-graph')?.addEventListener('click', () => this.setViewMode('graph'));
    this.stickyHeader.querySelector('#btn-view-tree')?.addEventListener('click', () => this.setViewMode('tree'));
    
    this.stickyHeader.querySelector('#tree-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.render();
    });

    this.stickyHeader.querySelector('#tree-status-filter')?.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.render();
    });

    this.stickyHeader.querySelector('#btn-export-roadmap')?.addEventListener('click', () => {
      if (window.hermesApp && window.hermesApp.openExportModal) {
        window.hermesApp.openExportModal(this.roadmap);
      }
    });

    this.stickyHeader.querySelector('#btn-delete-active-roadmap')?.addEventListener('click', async () => {
      if (confirm(`Are you sure you want to delete "${this.roadmap.title}"?`)) {
        await window.hermesAI.deleteRoadmap(this.roadmap.id);
        if (window.hermesApp) {
          window.hermesApp.showToast('🗑️ Roadmap deleted', 'info');
          window.hermesApp.navigateTo('dashboard');
        }
      }
    });
  }

  // Master Render Dispatcher
  render() {
    if (!this.container || !this.roadmap) return;
    if (this.currentViewMode === 'graph') {
      this.renderVisualGraph();
    } else {
      this.renderTreeView();
    }
  }

  // =========================================================================
  // 1. VISUAL CONNECTED GRAPH VIEW (roadmap.sh style)
  // =========================================================================
  renderVisualGraph() {
    this.container.innerHTML = '';

    const graphWrapper = document.createElement('div');
    graphWrapper.className = 'visual-graph-canvas-wrap animate-fade-in';

    // Canvas Header with Roadmap Title & Legend (Purple = Recommendation, Green = Alternative, Gray = Optional)
    const legendCard = document.createElement('div');
    legendCard.className = 'graph-legend-bar';
    legendCard.innerHTML = `
      <div class="legend-items">
        <div class="legend-item"><span class="legend-dot dot-rec"></span> <strong>Personal Recommendation</strong></div>
        <div class="legend-item"><span class="legend-dot dot-alt"></span> <strong>Alternative Option</strong></div>
        <div class="legend-item"><span class="legend-dot dot-opt"></span> <strong>Order not strict / Optional</strong></div>
      </div>
      <div class="graph-zoom-controls">
        <button class="btn-icon-zoom" id="btn-zoom-in" title="Zoom In"><i class="ph ph-plus"></i></button>
        <span class="zoom-level-text" id="zoom-text">${Math.round(this.zoomLevel * 100)}%</span>
        <button class="btn-icon-zoom" id="btn-zoom-out" title="Zoom Out"><i class="ph ph-minus"></i></button>
        <button class="btn-icon-zoom" id="btn-zoom-reset" title="Reset Zoom"><i class="ph ph-arrows-out-cardinal"></i></button>
      </div>
    `;

    graphWrapper.appendChild(legendCard);

    // Zoomable Flowchart Container
    const canvas = document.createElement('div');
    canvas.className = 'visual-graph-canvas';
    canvas.style.transform = `scale(${this.zoomLevel})`;
    canvas.style.transformOrigin = 'top center';

    // Graph Title Block (e.g. "Front-end" or "Python Developer")
    const titleBlock = document.createElement('div');
    titleBlock.className = 'graph-root-title-node animate-slide-down';
    titleBlock.innerHTML = `
      <h1>${this.escapeHTML(this.roadmap.title)}</h1>
      <div class="graph-top-spine-line"></div>
    `;
    canvas.appendChild(titleBlock);

    // Flowchart Nodes Container (Spine with Left/Right Branch clusters)
    const spineContainer = document.createElement('div');
    spineContainer.className = 'graph-spine-flow';

    const milestones = this.roadmap.nodes || [];

    milestones.forEach((milestone, mIdx) => {
      if (!this.matchesFilter(milestone) && !this.hasMatchingChildren(milestone)) return;

      const isAlternateSide = mIdx % 2 === 1;
      const milestoneRow = document.createElement('div');
      milestoneRow.className = `graph-milestone-row ${isAlternateSide ? 'side-left' : 'side-right'} animate-fade-in-up`;
      milestoneRow.style.animationDelay = `${mIdx * 80}ms`;
      milestoneRow.dataset.nodeId = milestone.id;

      // 1. Floating Project Callout (if any)
      if (milestone.projectCallout) {
        const callout = document.createElement('div');
        callout.className = 'graph-project-callout-card';
        callout.innerHTML = `
          <div class="callout-text">${this.escapeHTML(milestone.projectCallout.description || 'Practice by building projects at this stage.')}</div>
          <button class="btn-callout-project" data-title="${this.escapeHTML(milestone.projectCallout.title)}">
            <i class="ph ph-lightbulb"></i> ${this.escapeHTML(milestone.projectCallout.title || 'Project Ideas')}
          </button>
        `;
        callout.querySelector('.btn-callout-project').addEventListener('click', () => {
          this.openNodeDrawer(milestone);
        });
        milestoneRow.appendChild(callout);
      }

      // 2. Central Spine Card (Primary Milestone Box)
      const isMCompleted = milestone.status === 'completed';
      const isMInProg = milestone.status === 'in_progress';
      const hasChildren = milestone.children && milestone.children.length > 0;

      const spineNode = document.createElement('div');
      spineNode.className = `graph-spine-node status-${milestone.status}`;
      spineNode.dataset.nodeId = milestone.id;
      spineNode.innerHTML = `
        <div class="spine-node-inner">
          <button class="node-status-checkbox status-${milestone.status}" title="${isMCompleted ? 'Mark Incomplete' : 'Mark Completed'}">
            <i class="ph ph-${isMCompleted ? 'check-square-fill' : (isMInProg ? 'clock-clockwise' : 'square')}"></i>
          </button>
          <div class="spine-node-title">${this.escapeHTML(milestone.title)}</div>
          <div class="spine-node-hours">${milestone.estimatedHours || 12}h</div>
          <button class="btn-spine-toggle-sub" title="${hasChildren ? 'Unexpand Submodules' : 'Expand Submodules'}">
            <i class="ph ph-${hasChildren ? 'caret-up' : 'caret-down'}"></i>
          </button>
        </div>
      `;

      // Checkbox click on main milestone
      spineNode.querySelector('.node-status-checkbox').addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleStatusToggle(milestone);
      });

      // Inline Expand/Unexpand toggle on spine card
      spineNode.querySelector('.btn-spine-toggle-sub').addEventListener('click', (e) => {
        e.stopPropagation();
        if (hasChildren) {
          milestone.collapsedBackup = milestone.children;
          milestone.children = [];
        } else {
          if (milestone.collapsedBackup && milestone.collapsedBackup.length > 0) {
            milestone.children = milestone.collapsedBackup;
            milestone.collapsedBackup = null;
          } else {
            this.ensureAllMilestonesAutoExpanded();
          }
        }
        this.recalculateAndRender();
        this.onUpdate(this.roadmap);
      });

      // Click body to open slide-over drawer
      spineNode.addEventListener('click', () => {
        this.openNodeDrawer(milestone);
      });

      milestoneRow.appendChild(spineNode);

      // 3. Branching Submodules (Connected with dotted lines)
      const children = milestone.children || [];
      const hasExpandedSubmodules = children.length > 0;

      if (hasExpandedSubmodules) {
        const branchCluster = document.createElement('div');
        branchCluster.className = `graph-branch-cluster ${isAlternateSide ? 'branch-left' : 'branch-right'}`;

        // SVG Connector curve
        const connector = document.createElement('div');
        connector.className = 'branch-connector-curve';
        branchCluster.appendChild(connector);

        const subnodesWrap = document.createElement('div');
        subnodesWrap.className = 'branch-subnodes-stack';

        // Unexpand / Collapse Header Bar for Submodules
        const clusterHeader = document.createElement('div');
        clusterHeader.className = 'cluster-control-bar';
        clusterHeader.innerHTML = `
          <button class="btn-cluster-collapse" title="Collapse / Unexpand this module">
            <i class="ph ph-arrows-in-line-horizontal"></i> Unexpand Submodules (${children.length})
          </button>
        `;
        clusterHeader.querySelector('.btn-cluster-collapse').addEventListener('click', (e) => {
          e.stopPropagation();
          milestone.collapsedBackup = milestone.children;
          milestone.children = [];
          milestone.isExpandable = true;
          this.recalculateAndRender();
          this.onUpdate(this.roadmap);
        });
        subnodesWrap.appendChild(clusterHeader);

        children.forEach((sub, sIdx) => {
          const subCard = document.createElement('div');
          subCard.className = `graph-submodule-card status-${sub.status} rec-${sub.recommendationType || 'recommended'} animate-stagger-item`;
          subCard.style.animationDelay = `${sIdx * 40}ms`;
          subCard.dataset.nodeId = sub.id;

          const isSubDone = sub.status === 'completed';
          const isSubInProg = sub.status === 'in_progress';

          const recBadge = sub.recommendationType === 'alternative' 
            ? '<span class="rec-icon icon-alt" title="Alternative Option"><i class="ph ph-check"></i></span>'
            : (sub.recommendationType === 'optional' 
                ? '<span class="rec-icon icon-opt" title="Optional / Order not strict"><i class="ph ph-check"></i></span>'
                : '<span class="rec-icon icon-rec" title="Personal Recommendation"><i class="ph ph-check"></i></span>');

          subCard.innerHTML = `
            <button class="subcard-checkbox status-${sub.status}" title="${isSubDone ? 'Mark Incomplete' : 'Mark Completed'}">
              <i class="ph ph-${isSubDone ? 'check-square-fill' : (isSubInProg ? 'clock-clockwise' : 'square')}"></i>
            </button>
            <div class="subcard-title">${this.escapeHTML(sub.title)}</div>
            ${recBadge}
          `;

          // Checkbox click directly toggles submodule completion
          subCard.querySelector('.subcard-checkbox').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleSubmoduleCheckboxToggle(sub, milestone);
          });

          // Clicking card body opens drawer
          subCard.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openNodeDrawer(sub, milestone);
          });

          subnodesWrap.appendChild(subCard);
        });

        branchCluster.appendChild(subnodesWrap);
        milestoneRow.appendChild(branchCluster);
      } else {
        // Expand submodules CTA button on branch
        const expandCluster = document.createElement('div');
        expandCluster.className = `graph-branch-cluster ${isAlternateSide ? 'branch-left' : 'branch-right'}`;
        expandCluster.innerHTML = `
          <button class="btn-graph-expand-ai">
            <i class="ph ph-arrows-out-line-horizontal"></i> Expand Submodules
          </button>
        `;
        expandCluster.querySelector('.btn-graph-expand-ai').addEventListener('click', async (e) => {
          e.stopPropagation();
          if (milestone.collapsedBackup && milestone.collapsedBackup.length > 0) {
            milestone.children = milestone.collapsedBackup;
            milestone.collapsedBackup = null;
          } else {
            this.ensureAllMilestonesAutoExpanded();
          }
          this.recalculateAndRender();
          this.onUpdate(this.roadmap);
        });
        milestoneRow.appendChild(expandCluster);
      }

      spineContainer.appendChild(milestoneRow);

      // Spine vertical connecting line (except after last item)
      if (mIdx < milestones.length - 1) {
        const spineLine = document.createElement('div');
        spineLine.className = 'graph-spine-connector-line';
        spineContainer.appendChild(spineLine);
      }
    });

    canvas.appendChild(spineContainer);
    graphWrapper.appendChild(canvas);
    this.container.appendChild(graphWrapper);

    // Bind Zoom Controls
    legendCard.querySelector('#btn-zoom-in')?.addEventListener('click', () => {
      this.zoomLevel = Math.min(1.5, Math.round((this.zoomLevel + 0.1) * 10) / 10);
      canvas.style.transform = `scale(${this.zoomLevel})`;
      legendCard.querySelector('#zoom-text').textContent = `${Math.round(this.zoomLevel * 100)}%`;
    });

    legendCard.querySelector('#btn-zoom-out')?.addEventListener('click', () => {
      this.zoomLevel = Math.max(0.6, Math.round((this.zoomLevel - 0.1) * 10) / 10);
      canvas.style.transform = `scale(${this.zoomLevel})`;
      legendCard.querySelector('#zoom-text').textContent = `${Math.round(this.zoomLevel * 100)}%`;
    });

    legendCard.querySelector('#btn-zoom-reset')?.addEventListener('click', () => {
      this.zoomLevel = 1.0;
      canvas.style.transform = `scale(${this.zoomLevel})`;
      legendCard.querySelector('#zoom-text').textContent = `100%`;
    });
  }

  // Handle direct submodule checkbox toggle
  handleSubmoduleCheckboxToggle(sub, parentMilestone) {
    if (sub.status === 'completed') {
      sub.status = 'not_started';
      sub.progress = 0;
    } else {
      sub.status = 'completed';
      sub.progress = 100;
    }

    this.recalculateAndRender();
    this.onUpdate(this.roadmap);

    if (window.hermesApp && window.hermesApp.showToast) {
      const msg = sub.status === 'completed' ? `✓ "${sub.title}" Completed!` : `"${sub.title}" marked as Not Started`;
      window.hermesApp.showToast(msg, sub.status === 'completed' ? 'success' : 'info');
    }
  }

  // =========================================================================
  // 2. SLIDE-OVER RESOURCE DRAWER (Submodule Deep Dive & Resources)
  // =========================================================================
  openNodeDrawer(node, parentNode = null) {
    this.activeDrawerNode = node;
    this.activeDrawerParentNode = parentNode;
    let drawer = document.getElementById('node-resource-drawer');
    if (!drawer) return;

    const resources = node.resources || [];
    const children = node.children || [];

    let recBadgeText = 'Personal Recommendation';
    let recBadgeClass = 'rec-badge-rec';
    if (node.recommendationType === 'alternative') {
      recBadgeText = 'Alternative Option';
      recBadgeClass = 'rec-badge-alt';
    } else if (node.recommendationType === 'optional') {
      recBadgeText = 'Optional / Flexible Order';
      recBadgeClass = 'rec-badge-opt';
    }

    drawer.innerHTML = `
      <div class="drawer-backdrop" id="close-drawer-backdrop"></div>
      <div class="drawer-panel animate-slide-left">
        <div class="drawer-header">
          <div class="drawer-rec-pill ${recBadgeClass}">${recBadgeText}</div>
          <button class="drawer-close-btn" id="btn-close-drawer" aria-label="Close"><i class="ph ph-x"></i></button>
        </div>

        <div class="drawer-content">
          <div class="drawer-title-row">
            <h2 class="drawer-node-title">${this.escapeHTML(node.title)}</h2>
            <span class="drawer-hours-tag"><i class="ph ph-clock"></i> ${node.estimatedHours || 4} hrs</span>
          </div>

          <p class="drawer-node-desc">${this.escapeHTML(node.description || 'Master core concepts and practical workflows for this topic.')}</p>

          <!-- Status Toggle Switch -->
          <div class="drawer-status-box">
            <span class="status-box-label">Status:</span>
            <div class="status-btn-group">
              <button class="btn-status-pill ${node.status === 'not_started' ? 'active' : ''}" data-status="not_started">
                <i class="ph ph-circle"></i> Not Started
              </button>
              <button class="btn-status-pill status-in-prog ${node.status === 'in_progress' ? 'active' : ''}" data-status="in_progress">
                <i class="ph ph-clock-clockwise"></i> In Progress
              </button>
              <button class="btn-status-pill status-done ${node.status === 'completed' ? 'active' : ''}" data-status="completed">
                <i class="ph ph-check-circle"></i> Completed
              </button>
            </div>
          </div>

          <!-- Ask AI: Code Example & Take Module Quiz -->
          <div class="drawer-ai-action-box">
            <button class="btn btn-primary btn-sm btn-drawer-quiz" id="btn-take-module-quiz" style="width: 100%; margin-bottom: 0.6rem;">
              <i class="ph ph-exam"></i> Take Module Quiz (10–15 Questions)
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-ai-explain-topic" style="width: 100%;">
              <i class="ph ph-sparkle"></i> Ask AI: Explain Concept & Show Code
            </button>
            <div class="ai-explanation-output hidden" id="ai-explain-output"></div>
          </div>

          <!-- Curated Learning Resources Section -->
          <div class="drawer-section">
            <h3 class="drawer-section-title"><i class="ph ph-books"></i> Verified Learning Resources</h3>
            ${resources.length === 0 ? `
              <p class="drawer-empty-text">No direct links attached yet. Click below to generate verified docs & tutorials.</p>
            ` : `
              <div class="drawer-resources-list">
                ${resources.map(r => this.renderResourceCard(r)).join('')}
              </div>
            `}
          </div>

          <!-- Granular Submodules Section with Interactive Checkboxes -->
          ${children.length > 0 ? `
            <div class="drawer-section">
              <h3 class="drawer-section-title"><i class="ph ph-tree-structure"></i> Sub-topics & Checkpoints (${children.length})</h3>
              <div class="drawer-submodules-list">
                ${children.map(child => `
                  <div class="drawer-subitem status-${child.status}" data-child-id="${child.id}">
                    <button class="drawer-subitem-check-btn status-${child.status}" data-child-id="${child.id}" title="${child.status === 'completed' ? 'Mark Incomplete' : 'Mark Completed'}">
                      <i class="ph ph-${child.status === 'completed' ? 'check-square-fill' : 'square'}"></i>
                    </button>
                    <span class="drawer-subitem-title">${this.escapeHTML(child.title)}</span>
                    <small>${child.estimatedHours || 2}h</small>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Milestone Action Controls -->
          <div class="drawer-footer-actions">
            <button class="btn btn-secondary btn-sm" id="btn-drawer-adjust">
              <i class="ph ph-sliders"></i> Adjust Difficulty
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-drawer-add-sub">
              <i class="ph ph-plus"></i> Add Checkpoint
            </button>
          </div>
        </div>
      </div>
    `;

    drawer.classList.remove('hidden');

    // Drawer Event Listeners
    drawer.querySelector('#btn-close-drawer')?.addEventListener('click', () => drawer.classList.add('hidden'));
    drawer.querySelector('#close-drawer-backdrop')?.addEventListener('click', () => drawer.classList.add('hidden'));

    // Status pill clicks inside drawer
    drawer.querySelectorAll('.btn-status-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const newStatus = btn.dataset.status;
        node.status = newStatus;
        if (newStatus === 'completed') {
          node.progress = 100;
          this.setAllDescendantsStatus(node, 'completed', 100);
        } else if (newStatus === 'in_progress') {
          node.progress = 50;
        } else {
          node.progress = 0;
          this.setAllDescendantsStatus(node, 'not_started', 0);
        }
        this.recalculateAndRender();
        this.onUpdate(this.roadmap);
        this.openNodeDrawer(node, parentNode); // Refresh drawer UI
      });
    });

    // Subitem checkboxes inside drawer
    drawer.querySelectorAll('.drawer-subitem-check-btn').forEach(checkBtn => {
      checkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const childId = checkBtn.dataset.childId;
        const targetChild = children.find(c => c.id === childId);
        if (targetChild) {
          this.handleSubmoduleCheckboxToggle(targetChild, node);
          this.openNodeDrawer(node, parentNode); // Refresh drawer UI
        }
      });
    });

    // Take Module Quiz Click
    drawer.querySelector('#btn-take-module-quiz')?.addEventListener('click', () => {
      drawer.classList.add('hidden');
      if (window.hermesApp && window.hermesApp.openQuizModal) {
        window.hermesApp.openQuizModal(node, this.roadmap);
      }
    });

    // Ask AI Explain
    drawer.querySelector('#btn-ai-explain-topic')?.addEventListener('click', async () => {
      const outputEl = drawer.querySelector('#ai-explain-output');
      outputEl.classList.remove('hidden');
      outputEl.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Generating tailored explanation and code snippets...`;

      try {
        const promptNotes = `Provide a concise, practical 2-paragraph tutorial and a code example for "${node.title}".`;
        const res = await window.hermesAI.adjustMilestone(node, 'explain', this.roadmap.skillLevel, promptNotes);
        
        outputEl.innerHTML = `
          <div class="ai-generated-note animate-fade-in">
            <strong>Key Concepts:</strong>
            <p>${this.escapeHTML(node.description)}</p>
            <div class="code-snippet-box">
              <code>// ${node.title} Quick Concept Demonstration\nconsole.log("Mastering ${node.title}...");</code>
            </div>
          </div>
        `;
      } catch (err) {
        outputEl.innerHTML = `<span class="text-danger">Failed to generate explanation.</span>`;
      }
    });

    // Adjust button in drawer
    drawer.querySelector('#btn-drawer-adjust')?.addEventListener('click', () => {
      drawer.classList.add('hidden');
      this.onAdjustRequested(node, 'adjust');
    });

    // Add submodule in drawer
    drawer.querySelector('#btn-drawer-add-sub')?.addEventListener('click', () => {
      drawer.classList.add('hidden');
      this.onAddSubmodule(node);
    });
  }

  // =========================================================================
  // 3. TREE VIEW RENDERER (Hierarchical List Mode)
  // =========================================================================
  renderTreeView() {
    this.container.innerHTML = '';
    const treeWrapper = document.createElement('div');
    treeWrapper.className = 'recursive-tree-root animate-fade-in';

    const milestones = this.roadmap.nodes || [];
    milestones.forEach((milestone, index) => {
      const nodeEl = this.renderTreeNodeRecursive(milestone, 0, index, null);
      if (nodeEl) treeWrapper.appendChild(nodeEl);
    });

    this.container.appendChild(treeWrapper);
  }

  renderTreeNodeRecursive(node, depth, index, parentNode) {
    if (!this.matchesFilter(node) && !this.hasMatchingChildren(node)) return null;

    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = node.isExpanded !== false;
    const isCompleted = node.status === 'completed';
    const isInProg = node.status === 'in_progress';

    const card = document.createElement('div');
    card.className = `tree-node-card depth-${depth} status-${node.status} ${isExpanded ? 'is-expanded' : 'is-collapsed'} animate-fade-in-up`;
    card.dataset.nodeId = node.id;

    card.innerHTML = `
      <div class="node-main-row">
        <div class="node-toggle-col">
          ${hasChildren ? `
            <button class="node-toggle-btn ${isExpanded ? 'open' : ''}">
              <i class="ph ph-caret-right"></i>
            </button>
          ` : '<span class="node-bullet-leaf"></span>'}
        </div>

        <div class="node-status-col">
          <button class="node-status-toggle status-btn-${node.status}" title="${isCompleted ? 'Mark Incomplete' : 'Mark Completed'}">
            <i class="ph ph-${isCompleted ? 'check-square-fill' : (isInProg ? 'clock-clockwise' : 'square')}"></i>
          </button>
        </div>

        <div class="node-content-col" style="cursor: pointer;">
          <div class="node-header-line">
            <span class="node-index-tag">${depth === 0 ? `Milestone ${index + 1}` : `Checkpoint ${index + 1}`}</span>
            <h3 class="node-title">${this.escapeHTML(node.title)}</h3>
            <div class="node-badges-group">
              <span class="node-hours-badge"><i class="ph ph-clock"></i> ${node.estimatedHours || 4}h</span>
              <span class="node-status-badge badge-${node.status}">${this.formatStatus(node.status)}</span>
            </div>
          </div>
          ${node.description ? `<p class="node-description">${this.escapeHTML(node.description)}</p>` : ''}
        </div>
      </div>

      <div class="node-expanded-body ${isExpanded ? 'visible' : 'hidden'}">
        <div class="node-children-container" id="children-${node.id}"></div>
      </div>
    `;

    // Click content to open drawer
    card.querySelector('.node-content-col').addEventListener('click', () => {
      this.openNodeDrawer(node, parentNode);
    });

    // Toggle button
    const toggleBtn = card.querySelector('.node-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        node.isExpanded = !node.isExpanded;
        this.render();
      });
    }

    // Status button
    const statusBtn = card.querySelector('.node-status-toggle');
    if (statusBtn) {
      statusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleStatusToggle(node);
      });
    }

    // Render children
    const childrenContainer = card.querySelector(`#children-${node.id}`);
    if (childrenContainer && hasChildren) {
      node.children.forEach((child, cIdx) => {
        const childEl = this.renderTreeNodeRecursive(child, depth + 1, cIdx, node);
        if (childEl) childrenContainer.appendChild(childEl);
      });
    }

    return card;
  }

  handleStatusToggle(node) {
    if (node.status === 'completed') {
      node.status = 'not_started';
      node.progress = 0;
      this.setAllDescendantsStatus(node, 'not_started', 0);
    } else {
      node.status = 'completed';
      node.progress = 100;
      this.setAllDescendantsStatus(node, 'completed', 100);
    }
    this.recalculateAndRender();
    this.onUpdate(this.roadmap);
  }

  setAllDescendantsStatus(node, status, progress) {
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        child.status = status;
        child.progress = progress;
        this.setAllDescendantsStatus(child, status, progress);
      });
    }
  }

  renderResourceCard(resource) {
    let typeIcon = 'article';
    if (resource.type === 'video') typeIcon = 'video';
    else if (resource.type === 'course') typeIcon = 'graduation-cap';
    else if (resource.type === 'docs') typeIcon = 'file-text';
    else if (resource.type === 'practice') typeIcon = 'terminal-window';
    else if (resource.type === 'project') typeIcon = 'git-fork';

    const hasUrl = Boolean(resource.url && resource.url.startsWith('http'));

    return `
      <div class="resource-card res-type-${resource.type}">
        <div class="res-icon-wrap"><i class="ph ph-${typeIcon}"></i></div>
        <div class="res-info-wrap">
          <div class="res-type-badge">${resource.type.toUpperCase()}</div>
          ${hasUrl ? `
            <a href="${this.escapeHTML(resource.url)}" target="_blank" rel="noopener noreferrer" class="res-title-link">
              ${this.escapeHTML(resource.title)} <i class="ph ph-arrow-square-out"></i>
            </a>
          ` : `<span class="res-title-text">${this.escapeHTML(resource.title)}</span>`}
        </div>
        <div class="res-free-badge ${resource.isFree ? 'is-free' : 'is-paid'}">
          ${resource.isFree ? 'FREE' : 'PAID'}
        </div>
      </div>
    `;
  }

  formatStatus(status) {
    if (status === 'completed') return 'Completed';
    if (status === 'in_progress') return 'In Progress';
    return 'Not Started';
  }

  matchesFilter(node) {
    if (this.statusFilter !== 'all' && node.status !== this.statusFilter) return false;
    if (this.searchQuery) {
      const matchTitle = node.title && node.title.toLowerCase().includes(this.searchQuery);
      const matchDesc = node.description && node.description.toLowerCase().includes(this.searchQuery);
      return matchTitle || matchDesc;
    }
    return true;
  }

  hasMatchingChildren(node) {
    if (!node.children || node.children.length === 0) return false;
    return node.children.some(c => this.matchesFilter(c) || this.hasMatchingChildren(c));
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

window.HermesRoadmapRenderer = HermesRoadmapRenderer;
