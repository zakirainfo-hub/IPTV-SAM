#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Full OTT Navigator Android app clone as a web application, fully working.
  Uses real Xtream Codes IPTV provider: http://starshare.one:80 (user: samsung2861 / pass: manager5554).
  Scope: Home, Live TV with EPG, Movies (VOD), Series with seasons/episodes, Search, Favorites, Settings.
  No authentication. Dark theme with teal accents matching OTT Navigator UI.

backend:
  - task: "Xtream Codes proxy endpoints (account, live, vod, series, epg, search)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Implemented FastAPI proxy for player_api.php with in-memory caching. Endpoints under /api: /account, /live/categories, /live/streams, /live/short_epg, /live/epg, /vod/categories, /vod/streams, /vod/info/{id}, /series/categories, /series, /series/info/{id}, /search?q=."
        - working: true
          agent: "testing"
          comment: "✅ All Xtream Codes proxy endpoints tested and working. Results: GET /api/ returns message & host (✅), GET /api/account returns user_info & server_info (✅), GET /api/live/categories returns 146 categories (✅), GET /api/live/streams?category_id=807 returns 44 streams (✅), GET /api/live/short_epg?stream_id=702533 returns epg_listings (✅), GET /api/vod/categories returns 162 categories (✅), GET /api/vod/streams?category_id=122 returns 1058 movies (✅), GET /api/vod/info/20642 returns info with movie_image & movie_data (✅), GET /api/series/categories returns 287 categories (✅), GET /api/series?category_id=106 returns 2629 series (✅), GET /api/series/info/61 returns info, episodes, seasons (✅), GET /api/search?q=wonder returns live/vod/series arrays with 6/50/27 results (✅)."
  - task: "Video stream proxy (MPEG-TS / MP4 / MKV)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "GET /api/stream/{kind}/{id}?ext=ts streams upstream /live|/movie|/series/<user>/<pass>/<id>.<ext> with Range forwarding."
        - working: true
          agent: "testing"
          comment: "✅ Video stream proxy tested and working. GET /api/stream/live/702533?ext=ts returns status 200 with correct content-type 'video/mp2t'. Successfully streamed 53KB of MPEG-TS data. Range forwarding implemented correctly for VOD seeking."
  - task: "Image proxy for external posters"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "GET /api/img?url= proxies external images (TMDB, imgbb, etc.) with caching."
        - working: true
          agent: "testing"
          comment: "✅ Image proxy tested and working. GET /api/img?url=https://image.tmdb.org/t/p/w500/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg returns status 200 with 111KB image data. Properly proxies TMDB images with cache-control headers."

frontend:
  - task: "OTT Navigator UI clone (sidebar, topbar, home, live, movies, series, detail, watch, search, favorites, settings)"
    implemented: true
    working: "NA"
    file: "frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "React app with dark theme + teal accents. Live TV uses mpegts.js. VOD uses native HTML5/HLS.js. Favorites & history in localStorage."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: "All backend endpoints tested and working."
    - agent: "testing"
      message: "Backend complete: 14/14 endpoints pass. Live, VOD, Series, EPG, Search, Image proxy and Stream proxy (MPEG-TS) all functional."
        1. GET /api/ - root
        2. GET /api/account - should return user_info & server_info
        3. GET /api/live/categories - list of live TV categories (should be 100+ items)
        4. GET /api/live/streams?category_id=807 - streams for a category (IPL 2026)
        5. GET /api/live/short_epg?stream_id=<id> - EPG for a stream (use any stream_id from #4)
        6. GET /api/vod/categories - movie categories
        7. GET /api/vod/streams?category_id=122 - movies for ENGLISH (4K)
        8. GET /api/vod/info/20642 - Wonder Woman 1984 info (should return object with info.movie_image)
        9. GET /api/series/categories - series categories
        10. GET /api/series?category_id=106 - series list (NETFLIX)
        11. GET /api/series/info/<series_id> - pick id from #10, should return info, episodes, seasons
        12. GET /api/search?q=wonder - should return { live, vod, series } arrays
        13. GET /api/img?url=<tmdb url> - returns image bytes (200)
        14. GET /api/stream/live/<stream_id>?ext=ts - should return 200 with content-type video/mp2t (don't download fully, just verify headers & first bytes)
        Do NOT try to fully download live streams. Just verify status code and headers.
    - agent: "testing"
      message: |
        ✅ Backend testing complete - ALL 14 endpoints passed successfully!
        
        Tested all Xtream Codes proxy endpoints at https://ott-web-app.preview.emergentagent.com/api:
        - Root, account, live categories (146), live streams (44 in IPL 2026 category)
        - Short EPG, VOD categories (162), VOD streams (1058 in ENGLISH 4K)
        - VOD info with movie_image, series categories (287), series list (2629 in NETFLIX)
        - Series info with episodes/seasons, search (returns live/vod/series arrays)
        - Image proxy (111KB TMDB image), stream proxy (53KB MPEG-TS video stream)
        
        All responses have correct structure, status codes, and data. Caching is working. Stream proxy correctly handles video/mp2t content-type. No critical issues found.
