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
        
        this.init();
    }
    
    async init() {
        // Load courses list
        await this.loadCourses();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // If course ID specified in URL, load it
        if (this.courseId) {
            await this.loadCourse(this.courseId);
        }
    }
    
    async loadCourses() {
        try {
            const response = await fetch('courses.json');
            const data = await response.json();
            this.courses = data.courses;
            
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
            this.showError('Failed to load courses list');
        }
    }
    
    async loadCourse(courseId) {
        try {
            this.showLoading(true);
            
            // Find course
            this.currentCourse = this.courses.find(c => c.id === courseId);
            if (!this.currentCourse) {
                this.showError('Course not found');
                return;
            }
            
            // Load course structure
            const response = await fetch(`${courseId}/structure.json`);
            this.courseStructure = await response.json();
            
            // Render course structure
            this.renderCourseStructure();
            
            // Load first chapter if specified in URL
            const urlParams = new URLSearchParams(window.location.search);
            const chapterId = urlParams.get('chapter');
            
            if (chapterId) {
                await this.loadChapter(chapterId);
            } else if (this.courseStructure.chapters.length > 0) {
                await this.loadChapter(this.courseStructure.chapters[0].id);
            }
            
        } catch (error) {
            console.error('Error loading course:', error);
            this.showError('Failed to load course structure');
        } finally {
            this.showLoading(false);
        }
    }
    
    async loadChapter(chapterId) {
        try {
            this.showLoading(true, 'Loading chapter content...');
            
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
            this.showError('Failed to load chapter content');
        } finally {
            this.showLoading(false);
        }
    }
    
    renderCourseStructure() {
        const chaptersList = document.getElementById('chaptersList');
        chaptersList.innerHTML = '';
        
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
            });
            
            // Add click events to topics
            const topicItems = chapterItem.querySelectorAll('.topic-item');
            topicItems.forEach(topic => {
                topic.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const topicId = topic.dataset.topicId;
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
                                    <pre><code>${this.escapeHtml(subtopic.codeExample)}</code></pre>
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
        // Simple markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
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
            
            // Display results
            this.displaySearchResults(results, query);
            
        } catch (error) {
            console.error('Search error:', error);
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
        document.getElementById('courseContent').style.display = 'none';
        document.getElementById('initialLoading').style.display = 'none';
    }
    
    highlightText(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }
    
    navigateToSearchResult(chapterId, subtopicId) {
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
            document.getElementById('sidebar').classList.toggle('active');
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const chapterId = urlParams.get('chapter');
            const courseId = urlParams.get('course-id');
            
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.courseViewer = new CourseViewer();
});
