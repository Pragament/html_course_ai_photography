# Google Analytics Tracking Events Documentation

This document describes all analytics events tracked in the Course Viewer application. All events are sent to Google Analytics (Measurement ID: `G-JFXX752KWJ`).

## Event Categories

### 1. User Engagement Events

#### `course_click`
Triggered when a user clicks on a course card to view its details.

**Scenario:** User browses homepage and clicks on a course
**Parameters:**
- `course_id` - Unique course identifier
- `course_title` - Course title
- `category` - Course category (e.g., "Technology", "Assessment")
- `level` - Course level (Beginner, Intermediate, Advanced)
- `source_page` - Page where the click originated (e.g., "homepage")

#### `course_search`
Triggered when a user searches for courses using the search input.

**Scenario:** User types in the search bar to find specific courses
**Parameters:**
- `search_query` - The search term entered by user
- `filter_category` - Active category filter or "(none)"
- `filter_class` - Active class filter or "(none)"
- `filter_subject` - Active subject filter or "(none)"
- `filter_tag` - Active tag filter or "(none)"
- `results_count` - Number of matching courses (when used in search input listener)

#### `filter_courses`
Triggered when a user applies filters or clears all filters.

**Scenarios:**
- User selects a category, class, subject, or tag filter
- User clears all filters

**Parameters:**
- `filter_type` - Type of filter applied (category, class, subject, tag, or "clear_all")
- `filter_value` - Value of the filter applied
- `filter_category` - Active category filter (when filtering)
- `filter_class` - Active class filter (when filtering)
- `filter_subject` - Active subject filter (when filtering)
- `filter_tag` - Active tag filter (when filtering)

#### `view_category`
Triggered after filters are applied to view courses in a specific category.

**Scenario:** User filters and views courses by category
**Parameters:**
- `category` - Category name or "all" for no filter
- `course_count` - Number of courses in selected category
- `filters_applied` - "yes" if any filters applied, "no" otherwise

---

### 2. Learning Progress Events

#### `view_course`
Triggered when a user views a course for the first time or navigates to view course content.

**Scenarios:**
- User clicks "Start Course" or views course details
- User opens a specific chapter
- User navigates to course overview

**Parameters:**
- `course_id` - Unique course identifier
- `course_title` - Course title
- `category` - Course category
- `level` - Course difficulty level
- `estimated_time` - Estimated completion time
- `chapter_id` - Chapter ID (when viewing specific chapter)
- `chapter_title` - Chapter title (when viewing specific chapter)
- `content_type` - Type of content ("course" or "chapter")

#### `start_course`
Triggered when a user officially starts taking a course.

**Scenario:** User navigates to a course and begins learning
**Parameters:**
- `course_id` - Unique course identifier
- `estimated_time` - Estimated completion time (e.g., "15 hours")
- `level` - Course level (Beginner, Intermediate, Advanced)

#### `complete_class`
Triggered when a user completes or interacts with a topic/section within a course.

**Scenario:** User clicks on a topic in the course sidebar
**Parameters:**
- `course_id` - Unique course identifier
- `class_id` - Class/chapter ID
- `class_order` - Position in course structure
- `topic_id` - Topic identifier within chapter

#### `complete_course`
Triggered when a user scrolls through 75% or more of a chapter's content.

**Scenario:** User scrolls down and reads most of the chapter material
**Parameters:**
- `course_id` - Unique course identifier
- `chapter_id` - Chapter identifier
- `completion_percentage` - Percentage of content scrolled (rounded)

---

### 3. Assessment Events

#### `start_assessment`
Triggered when a user opens an assessment course (talent test or worksheet).

**Scenario:** User opens Class 1 Talent Test or CBSE Class 10 Worksheets
**Parameters:**
- `course_id` - Unique course identifier
- `course_title` - Course title
- `classes` - Comma-separated list of applicable class levels

#### `submit_assessment`
Reserved for future implementation - triggers when user submits assessment answers.

**Parameters (future):**
- `course_id` - Unique course identifier
- `score` - User's score
- `time_spent` - Time spent on assessment

---

### 4. System Events

#### `app_initialized`
Triggered when the application first loads.

**Scenario:** Page loads and CourseViewer initializes
**Parameters:**
- `initial_course` - Course ID from URL parameter, or "(none)"

#### `courses_loaded`
Triggered after the courses.json file is successfully loaded.

**Scenario:** Application retrieves course list
**Parameters:**
- `courses_count` - Total number of courses loaded

#### `error`
Triggered when errors occur during application operation.

**Scenarios:**
- Failed to load courses
- Course not found
- Network errors

**Parameters:**
- `error_type` - Type of error (e.g., "courses_load_failed", "course_not_found")
- `error_message` - Error description
- `course_id` - Course ID (if applicable)

#### `navigation_via_history`
Triggered when user uses browser history navigation.

**Scenario:** User uses browser back/forward buttons
**Parameters:**
- `chapter_id` - Chapter ID being navigated to, or "(none)"
- `course_id` - Course ID being navigated to, or "(none)"

---

## Event Flow Examples

### Scenario 1: User discovers and enrolls in a course
1. `app_initialized` - Page loads
2. `courses_loaded` - Course list retrieved
3. `view_category` - User views courses (homepage)
4. `course_search` - User searches for "JavaScript"
5. `filter_courses` - User filters by category
6. `course_click` - User clicks on a course card
7. `view_course` - Course details page loads
8. `start_course` - User begins course

### Scenario 2: User completes a course chapter
1. `view_course` - User navigates to course
2. `complete_class` - User clicks on chapter topic
3. `complete_course` - User scrolls to 75%+ of content

### Scenario 3: User takes an assessment
1. `view_course` - Assessment course opens
2. `start_assessment` - Assessment test starts
3. `complete_class` - User interacts with questions
4. `submit_assessment` - User submits answers (future feature)

---

## Google Analytics Dashboard Recommendations

### Key Metrics to Monitor
- **User Engagement:** course_click, course_search, filter_courses
- **Learning Progress:** start_course, view_course, complete_course
- **Assessment Activity:** start_assessment, submit_assessment
- **Funnel Analysis:** app_initialized → courses_loaded → course_click → start_course
- **Error Tracking:** Monitor "error" events for issues

### Recommended Reports
1. **Course Popularity** - Sort by course_click and view_course events
2. **Search Terms** - Analyze search_query parameter
3. **Completion Rate** - Compare start_course vs complete_course events
4. **User Flow** - Track navigation path through courses
5. **Assessment Engagement** - Monitor assessment-specific events

---

## Implementation Notes

- All events use the existing Google Analytics tracking function: `this.trackEvent(eventName, eventData)`
- Events include console logging for debugging: `console.log('Analytics Event:', eventName, eventData)`
- Google Analytics tag fires asynchronously; events are queued if not loaded
- Event parameters are customizable based on specific business metrics needed

---

## Future Enhancements

- [ ] Implement `submit_assessment` with score tracking
- [ ] Add video engagement tracking (if video content added)
- [ ] Track time spent per chapter
- [ ] Implement A/B testing for course layouts
- [ ] Add custom user segments based on learning patterns
- [ ] Track certificate/badge achievements
