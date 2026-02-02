class CourseViewer {
    constructor() {
        this.courses = [];
        this.currentCourse = null;
        this.currentChapter = null;
        this.courseStructure = null;
        this.allContent = new Map(); // Cache loaded chapters
        
        // Get course ID from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        this.courseId = urlParams.get('course-id');
        
        // Track app initialization
        this.trackEvent('app_initialized', {
            'initial_course': this.courseId || '(none)'
        });
        
        this.init();
    }
    
    async init() {
        // Load courses list
        await this.loadCourses();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // If course ID specified in URL, load it, otherwise show homepage
        if (this.courseId) {
            await this.loadCourse(this.courseId);
        } else {
            this.renderHomepage();
        }
    }
    
    async loadCourses() {
        try {
            const response = await fetch('courses.json');
            const data = await response.json();
            this.courses = data.courses;
            //this.courses = data.courses.filter(course => course.status === true);
            
            // Track courses loaded
            this.trackEvent('courses_loaded', {
                'courses_count': this.courses.length
            });
            
            // Populate course selector
            const courseSelect = document.getElementById('courseSelect');
            this.courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.title;
                courseSelect.appendChild(option);
            });
            
            // Select course if specified in URL
            if (this.courseId) {
                courseSelect.value = this.courseId;
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            this.trackEvent('error', {
                'error_type': 'courses_load_failed',
                'error_message': error.message
            });
            this.showError('Failed to load courses list');
        }
    }
    
    async loadCourse(courseId) {
        try {
            this.showLoading(true);
            
            // Track course view event
            const course = this.courses.find(c => c.id === courseId);
            this.trackEvent('view_course', {
                'course_id': courseId,
                'course_title': course?.title || '',
                'category': course?.category || '',
                'level': course?.level || '',
                'estimated_time': course?.estimatedTime || ''
            });
            
            // Also track start_course event
            this.trackEvent('start_course', {
                'course_id': courseId,
                'estimated_time': course?.estimatedTime || '',
                'level': course?.level || ''
            });
            
            // Track if this is an assessment course
            if (course?.category === 'Assessment' || course?.tags?.includes('assessment')) {
                this.trackEvent('start_assessment', {
                    'course_id': courseId,
                    'course_title': course?.title || '',
                    'classes': (course?.classes || []).join(',')
                });
            }
            
            // Find course
            this.currentCourse = this.courses.find(c => c.id === courseId);
            if (!this.currentCourse) {
                this.showError('Course not found');
                this.trackEvent('error', {
                    'error_type': 'course_not_found',
                    'course_id': courseId
                });
                return;
            }
            
            // Load course structure
            const response = await fetch(`${courseId}/structure.json`);
            this.courseStructure = await response.json();
            
            // Render course structure
            this.renderCourseStructure();
            // Load chapter if specified in URL, otherwise load first chapter
            const urlParams = new URLSearchParams(window.location.search);
            const chapterId = urlParams.get('chapter');

            if (chapterId) {
                await this.loadChapter(chapterId);
            } else if (this.courseStructure.chapters.length > 0) {
                await this.loadChapter(this.courseStructure.chapters[0].id);
            } else {
                this.goToCourseOverview();
            }
            
        } catch (error) {
            console.error('Error loading course:', error);
            this.trackEvent('error', {
                'error_type': 'course_load_failed',
                'course_id': courseId,
                'error_message': error.message
            });
            this.showError('Failed to load course structure');
        } finally {
            this.showLoading(false);
        }
    }
    
    async loadChapter(chapterId) {
        try {
            this.showLoading(true, 'Loading chapter content...');
            
            // Track chapter view
            this.trackEvent('chapter_view', {
                'course_id': this.currentCourse?.id,
                'chapter_id': chapterId
            });
            
            // Update URL without reloading page
            const url = new URL(window.location);
            url.searchParams.set('chapter', chapterId);
            window.history.pushState({}, '', url);
            
            // Check if chapter is already cached
            if (!this.allContent.has(chapterId)) {
                // Load chapter content
                const response = await fetch(`${this.currentCourse.id}/chapters/${chapterId}.json`);
                const chapterData = await response.json();
                
                // Cache the content
                this.allContent.set(chapterId, chapterData);
            }
            
            this.currentChapter = this.allContent.get(chapterId);
            
            // Render chapter content
            this.renderChapterContent();
            
            // Update active states in sidebar
            this.updateActiveStates(chapterId);
            
        } catch (error) {
            console.error('Error loading chapter:', error);
            this.trackEvent('error', {
                'error_type': 'chapter_load_failed',
                'chapter_id': chapterId,
                'error_message': error.message
            });
            this.showError('Failed to load chapter content');
        } finally {
            this.showLoading(false);
        }
    }
    
    renderCourseStructure() {
        const chaptersList = document.getElementById('chaptersList');
        chaptersList.innerHTML = '';
        console.log('Rendering course structure:', this.courseStructure);
        
        this.courseStructure.chapters.forEach((chapter, index) => {
            const chapterItem = document.createElement('div');
            chapterItem.className = 'chapter-item';
            chapterItem.dataset.chapterId = chapter.id;
            
            chapterItem.innerHTML = `
                <div class="chapter-header">
                    <span>${index + 1}. ${chapter.title}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="topics-list">
                    ${chapter.topics.map(topic => `
                        <div class="topic-item" data-topic-id="${topic.id}">
                            <i class="fas fa-circle"></i>
                            <span>${topic.title}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            // Add click event to chapter header
            const header = chapterItem.querySelector('.chapter-header');
            header.addEventListener('click', () => {
                chapterItem.classList.toggle('active');
                // Track chapter expansion
                this.trackEvent('chapter_expanded', {
                    'course_id': this.currentCourse?.id,
                    'chapter_id': chapter.id,
                    'expanded': chapterItem.classList.contains('active')
                });
            });
            
            // Add click events to topics
            const topicItems = chapterItem.querySelectorAll('.topic-item');
            topicItems.forEach(topic => {
                topic.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const topicId = topic.dataset.topicId;
                    
                    // Track topic click
                    this.trackEvent('topic_clicked', {
                        'course_id': this.currentCourse?.id,
                        'chapter_id': chapter.id,
                        'topic_id': topicId
                    });
                    
                    await this.loadChapter(chapter.id);
                    
                    // Scroll to specific topic
                    const subtopicElement = document.querySelector(`[data-subtopic-id="${topicId}"]`);
                    if (subtopicElement) {
                        subtopicElement.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
            
            chaptersList.appendChild(chapterItem);
        });
    }

    // ------------------ Homepage rendering and filtering ------------------
    renderHomepage() {
        // Show courses grid and hide other areas
        document.getElementById('coursesGrid').style.display = 'block';
        //document.getElementById('courseContent').style.display = 'none';
        document.getElementById('searchResults').classList.remove('active');

        // Populate filter selects with unique values
        const categories = new Set();
        const classes = new Set();
        const subjects = new Set();
        const tags = new Set();

        this.courses.filter(course => course.status === true).forEach(c => {
            if (c.category) categories.add(c.category);
            if (Array.isArray(c.classes)) c.classes.forEach(cl => classes.add(cl));
            if (Array.isArray(c.subjects)) c.subjects.forEach(s => subjects.add(s));
            if (Array.isArray(c.tags)) c.tags.forEach(t => tags.add(t));
        });

        const catSel = document.getElementById('homepageCategory');
        const classSel = document.getElementById('homepageClass');
        const subjSel = document.getElementById('homepageSubject');
        const tagSel = document.getElementById('homepageTag');

        // helper to fill
        const fill = (sel, values) => {
            sel.innerHTML = '<option value="">All</option>' +
                Array.from(values).sort().map(v => `<option value="${v}">${v}</option>`).join('');
        };

        fill(catSel, categories);
        fill(classSel, classes);
        fill(subjSel, subjects);
        fill(tagSel, tags);

        // Render all courses initially
        this.renderCourseCards(this.courses.filter(course => course.status === true));

        // Attach event listeners for filters/search
        document.getElementById('homepageSearch').addEventListener('input', (e) => {
            this.applyHomepageFilters();
        });

        [catSel, classSel, subjSel, tagSel].forEach(sel => {
            sel.addEventListener('change', () => this.applyHomepageFilters());
        });

        document.getElementById('homepageClear').addEventListener('click', () => {
            document.getElementById('homepageSearch').value = '';
            catSel.value = '';
            classSel.value = '';
            subjSel.value = '';
            tagSel.value = '';
            this.renderCourseCards(this.courses);
        });
    }

    renderCourseCards(list) {
        const container = document.getElementById('coursesGridList');
        if (!container) return;

        if (!list || list.length === 0) {
            container.innerHTML = '<p style="color:#666;">No courses match the filters</p>';
            return;
        }

        container.innerHTML = list.map(c => `
            <div class="course-card" data-course-id="${c.id}">
                <h3>${this.escapeHtml(c.title)}</h3>
                <div class="course-meta">${this.escapeHtml(c.description || '')}</div>
                <div class="course-meta">Category: ${this.escapeHtml(c.category || '—')}</div>
                <div class="course-meta">Subjects: ${(c.subjects || []).join(', ')}</div>
                <div class="hidden" style="margin-top:8px; color:#2a5298; font-weight:600;">Estimated: ${this.escapeHtml(c.estimatedTime || '—')}</div>
            </div>
        `).join('');

        // Attach click handlers
        container.querySelectorAll('.course-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const id = card.dataset.courseId;
                if (id) {
                    // Find course data for tracking
                    const course = this.courses.find(c => c.id === id);
                    
                    // Track course card click
                    this.trackEvent('course_click', {
                        'course_id': id,
                        'course_title': course?.title || '',
                        'category': course?.category || '',
                        'level': course?.level || '',
                        'source_page': 'homepage'
                    });
                    
                    // Navigate to separate course detail page
                    window.location.href = `course.html?course-id=${encodeURIComponent(id)}`;
                }
            });
        });
    }

    applyHomepageFilters() {
        const q = (document.getElementById('homepageSearch').value || '').toLowerCase().trim();
        const cat = document.getElementById('homepageCategory').value;
        const cls = document.getElementById('homepageClass').value;
        const subj = document.getElementById('homepageSubject').value;
        const tag = document.getElementById('homepageTag').value;

        // Track search event if query exists
        if (q) {
            this.trackEvent('course_search', {
                'search_query': q,
                'filter_category': cat || '(none)',
                'filter_class': cls || '(none)',
                'filter_subject': subj || '(none)',
                'filter_tag': tag || '(none)'
            });
        }

        // Track filter events
        if (cat || cls || subj || tag) {
            this.trackEvent('filter_courses', {
                'filter_category': cat || '(none)',
                'filter_class': cls || '(none)',
                'filter_subject': subj || '(none)',
                'filter_tag': tag || '(none)'
            });
        }

        const results = this.courses.filter(c => {
            if (cat && c.category !== cat) return false;
            if (cls && !(Array.isArray(c.classes) && c.classes.includes(cls))) return false;
            if (subj && !(Array.isArray(c.subjects) && c.subjects.includes(subj))) return false;
            if (tag && !(Array.isArray(c.tags) && c.tags.includes(tag))) return false;

            if (q) {
                const hay = `${c.title} ${c.description || ''} ${(c.subjects||[]).join(' ')} ${(c.tags||[]).join(' ')}`.toLowerCase();
                return hay.includes(q);
            }

            return true;
        });

        this.renderCourseCards(results);
    }
    
    renderChapterContent() {
        if (!this.currentChapter) return;
        
        const contentArea = document.getElementById('courseContent');
        
        contentArea.innerHTML = `
            <div class="breadcrumb" id="breadcrumb">
                <span onclick="courseViewer.goToCourseOverview()">${this.currentCourse.title}</span>
                <i class="fas fa-chevron-right"></i>
                <span>${this.currentChapter.title}</span>
            </div>
            
            <div class="chapter-content active">
                <h1 class="chapter-title">${this.currentChapter.title}</h1>
                <p class="course-description">${this.currentChapter.description || ''}</p>
                
                <div class="subtopics-list">
                    ${this.currentChapter.subtopics.map(subtopic => `
                        <div class="subtopic-item" data-subtopic-id="${subtopic.id}">
                            <h3 class="subtopic-title">
                                <i class="fas fa-bookmark"></i>
                                ${subtopic.title}
                            </h3>
                            ${subtopic.content ? `
                                <div class="subtopic-content">
                                    ${this.formatContent(subtopic.content)}
                                </div>
                            ` : ''}
                            
                            ${subtopic.codeExample ? `
                                <div class="code-block">
                                    <pre>${this.formatContent(subtopic.codeExample)}</pre>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Show content area
        document.getElementById('initialLoading').style.display = 'none';
        contentArea.style.display = 'block';
    }
    
    formatContent(content) {
        // Configure options (optional)
        marked.setOptions({
            breaks: true,
            gfm: true,
            highlight: function(code, lang) {
                if (lang && hljs) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return code;
            }
        });
        return marked.parse(content);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    updateActiveStates(chapterId) {
        // Update active chapter in sidebar
        document.querySelectorAll('.chapter-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeChapter = document.querySelector(`[data-chapter-id="${chapterId}"]`);
        if (activeChapter) {
            activeChapter.classList.add('active');
        }
    }
    
    async searchContent(query) {
        if (!query.trim()) {
            document.getElementById('searchResults').classList.remove('active');
            return;
        }
        
        try {
            // Track search
            this.trackEvent('search_performed', {
                'search_query': query,
                'course_id': this.currentCourse?.id
            });
            
            // Search in loaded chapters
            const results = [];
            const searchLower = query.toLowerCase();
            
            for (const [chapterId, chapter] of this.allContent) {
                // Search in chapter title
                if (chapter.title.toLowerCase().includes(searchLower)) {
                    results.push({
                        type: 'chapter',
                        title: chapter.title,
                        content: `Chapter: ${chapter.title}`,
                        chapterId: chapterId,
                        subtopicId: null
                    });
                }
                
                // Search in subtopics
                chapter.subtopics.forEach(subtopic => {
                    if (subtopic.title.toLowerCase().includes(searchLower) || 
                        (subtopic.content && subtopic.content.toLowerCase().includes(searchLower))) {
                        results.push({
                            type: 'subtopic',
                            title: subtopic.title,
                            content: subtopic.content ? 
                                subtopic.content.substring(0, 150) + '...' : 
                                'No content',
                            chapterId: chapterId,
                            subtopicId: subtopic.id
                        });
                    }
                });
            }
            
            // Track search results
            this.trackEvent('search_results', {
                'search_query': query,
                'results_count': results.length,
                'course_id': this.currentCourse?.id
            });
            
            // Display results
            this.displaySearchResults(results, query);
            
        } catch (error) {
            console.error('Search error:', error);
            this.trackEvent('error', {
                'error_type': 'search_failed',
                'error_message': error.message
            });
        }
    }
    
    displaySearchResults(results, query) {
        const searchResults = document.getElementById('searchResults');
        const resultsList = document.getElementById('searchResultsList');
        
        if (results.length === 0) {
            resultsList.innerHTML = '<p>No results found</p>';
        } else {
            resultsList.innerHTML = results.map(result => `
                <div class="search-result-item" 
                     onclick="courseViewer.navigateToSearchResult('${result.chapterId}', '${result.subtopicId}')">
                    <h4>${this.highlightText(result.title, query)}</h4>
                    <p>${this.highlightText(result.content, query)}</p>
                    <small>Type: ${result.type}</small>
                </div>
            `).join('');
        }
        
        searchResults.classList.add('active');
        //document.getElementById('courseContent').style.display = 'none';
        document.getElementById('initialLoading').style.display = 'none';
    }
    
    highlightText(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }
    
    navigateToSearchResult(chapterId, subtopicId) {
        // Track search result click
        this.trackEvent('search_result_clicked', {
            'course_id': this.currentCourse?.id,
            'chapter_id': chapterId,
            'subtopic_id': subtopicId || '(none)'
        });
        
        this.loadChapter(chapterId).then(() => {
            document.getElementById('searchResults').classList.remove('active');
            document.getElementById('courseContent').style.display = 'block';
            
            if (subtopicId) {
                const element = document.querySelector(`[data-subtopic-id="${subtopicId}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    element.style.animation = 'pulse 0.5s';
                    setTimeout(() => {
                        element.style.animation = '';
                    }, 500);
                }
            }
        });
    }
    
    goToCourseOverview() {
        // Track course overview view
        this.trackEvent('course_overview_viewed', {
            'course_id': this.currentCourse?.id
        });
        
        document.getElementById('courseContent').innerHTML = `
            <div class="course-overview">
                <h1 class="course-title">${this.currentCourse.title}</h1>
                <p class="course-description">${this.currentCourse.description}</p>
                <div class="course-stats">
                    <p><i class="fas fa-book"></i> ${this.courseStructure.chapters.length} Chapters</p>
                    <p><i class="fas fa-clock"></i> Estimated time: ${this.currentCourse.estimatedTime || '10 hours'}</p>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Course selection
        document.getElementById('courseSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                // Track course selection
                this.trackEvent('course_selected', {
                    'course_id': e.target.value,
                    'course_name': this.courses.find(c => c.id === e.target.value)?.title
                });
                
                const url = new URL(window.location);
                url.searchParams.set('course-id', e.target.value);
                window.location.href = url.toString();
            }
        });
        
        // Search input
        let searchTimeout;
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchContent(e.target.value);
            }, 300);
        });
        
        // Mobile menu
        document.getElementById('mobileMenuBtn').addEventListener('click', () => {
            const isActive = document.getElementById('sidebar').classList.toggle('active');
            // Track mobile menu toggle
            this.trackEvent('mobile_menu_toggled', {
                'menu_opened': isActive
            });
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const chapterId = urlParams.get('chapter');
            const courseId = urlParams.get('course-id');
            
            // Track navigation event
            this.trackEvent('navigation_via_history', {
                'chapter_id': chapterId || '(none)',
                'course_id': courseId || '(none)'
            });
            
            if (courseId && courseId !== this.currentCourse?.id) {
                this.loadCourse(courseId);
            } else if (chapterId && chapterId !== this.currentChapter?.id) {
                this.loadChapter(chapterId);
            }
        });
    }
    
    showLoading(show, message = 'Loading...') {
        const loadingElement = document.getElementById('initialLoading');
        if (loadingElement) {
            loadingElement.innerHTML = show ? 
                `<i class="fas fa-spinner"></i> ${message}` : 
                'Select a chapter to start learning';
            loadingElement.style.display = show ? 'flex' : 'none';
        }
    }
    
    showError(message) {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #666;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 20px;"></i>
                <h2>Oops! Something went wrong</h2>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Try Again
                </button>
            </div>
        `;
    }
    
    /**
     * Track events in Google Analytics
     * @param {string} eventName - Name of the event
     * @param {Object} eventData - Event parameters
     */
    trackEvent(eventName, eventData = {}) {
        if (window.gtag) {
            try {
                gtag('event', eventName, eventData);
                console.log(`Analytics Event: ${eventName}`, eventData);
            } catch (error) {
                console.error('Error tracking event:', error);
            }
        } else {
            console.warn('Google Analytics not loaded. Event not tracked:', eventName, eventData);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.courseViewer = new CourseViewer();
});
