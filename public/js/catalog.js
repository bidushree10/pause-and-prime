/**
 * Pause & Prime - Catalog & Explore Directory Controller
 * Implements Acceptance Criteria #2 (Debounced 200ms Search & Instant Filtering)
 * and #3 (Direct Card Launch with Pre-Filled Modal).
 */

export class CatalogController {
  constructor({ containerId, onSelectExperience }) {
    this.container = document.getElementById(containerId);
    this.onSelectExperience = onSelectExperience;

    this.allSites = [];
    this.activeCategory = 'all';
    this.activeMaxDuration = null; // null or number (3, 5, 10)
    this.searchQuery = '';
    this.debounceTimer = null;
  }

  async loadCatalog() {
    try {
      const res = await fetch('/api/catalog');
      const data = await res.json();
      if (data.success && Array.isArray(data.sites)) {
        this.allSites = data.sites;
        this.render();
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
      this.container.innerHTML = `
        <div class="empty-state">
          <h3>Unable to load experience directory</h3>
          <p>Please check your connection or restart the server.</p>
        </div>
      `;
    }
  }

  setCategory(category) {
    this.activeCategory = category;
    this.render();
  }

  setMaxDuration(minutes) {
    this.activeMaxDuration = minutes ? parseInt(minutes, 10) : null;
    this.render();
  }

  // Acceptance Criterion #2: Debounced at 200ms without full page reload
  setSearchQueryDebounced(query) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.searchQuery = query.trim().toLowerCase();
      this.render();
    }, 200);
  }

  getFilteredSites() {
    return this.allSites.filter(site => {
      // Category filter
      if (this.activeCategory !== 'all' && site.category.toLowerCase() !== this.activeCategory.toLowerCase()) {
        return false;
      }

      // Max duration filter
      if (this.activeMaxDuration && site.maxDurationMinutes > this.activeMaxDuration) {
        return false;
      }

      // Real-time search filter
      if (this.searchQuery.length > 0) {
        const inTitle = site.title.toLowerCase().includes(this.searchQuery);
        const inDesc = site.description.toLowerCase().includes(this.searchQuery);
        const inCat = (site.categoryLabel || '').toLowerCase().includes(this.searchQuery);
        const inTags = Array.isArray(site.tags) && site.tags.some(t => t.toLowerCase().includes(this.searchQuery));
        if (!inTitle && !inDesc && !inCat && !inTags) {
          return false;
        }
      }

      return true;
    });
  }

  render() {
    const sites = this.getFilteredSites();

    if (sites.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h3>No matching micro-breaks found</h3>
          <p>Try clearing your search query or selecting a different category tab.</p>
          <button id="btnClearFilters" class="dur-filter-btn" style="margin-top: 1rem; padding: 0.5rem 1rem;">Reset Filters</button>
        </div>
      `;

      const resetBtn = this.container.querySelector('#btnClearFilters');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.activeCategory = 'all';
          this.activeMaxDuration = null;
          this.searchQuery = '';
          const searchInput = document.getElementById('catalogSearchInput');
          if (searchInput) searchInput.value = '';
          // Reset UI tabs
          document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === 'all'));
          document.querySelectorAll('.dur-filter-btn').forEach(b => b.classList.toggle('active', !b.dataset.dur));
          this.render();
        });
      }
      return;
    }

    this.container.innerHTML = sites.map(site => {
      const tagsHtml = Array.isArray(site.tags)
        ? site.tags.map(t => `<span class="card-tag">#${t}</span>`).join('')
        : '';

      return `
        <div class="catalog-card" data-site-id="${site.id}">
          <div class="card-header">
            <span class="card-badge">${site.badgeText || site.categoryLabel}</span>
            <span class="card-duration-pill">⏱️ ≤ ${site.maxDurationMinutes}m</span>
          </div>

          <h3 class="card-title">${site.title}</h3>
          <p class="card-desc">${site.description}</p>

          <div class="card-tags">
            ${tagsHtml}
          </div>

          <div class="card-actions">
            <!-- Acceptance Criterion #3: Direct Card Launch -->
            <button class="btn-start-card" data-action="launch" data-site-id="${site.id}">
              <span>Start Bounded Break</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
            <a href="${site.targetUrl}" target="_blank" rel="noopener noreferrer" class="btn-preview-link" title="Open external preview in new tab">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners for Acceptance Criterion #3
    this.container.querySelectorAll('[data-action="launch"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const siteId = btn.dataset.siteId;
        const site = this.allSites.find(s => s.id === siteId);
        if (site && typeof this.onSelectExperience === 'function') {
          this.onSelectExperience(site);
        }
      });
    });
  }
}
