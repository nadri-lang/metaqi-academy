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
  MetaQi Academy - Plataforma educativa de metafísica china con contenido gratuito y premium.
  Fase 1: Backend con JWT auth, energías diarias/lunares, sistema de usuarios
  Frontend: Diseño luxury minimal oriental, auth, home con energías

backend:
  - task: "User Authentication (Register/Login/JWT)"
    implemented: true
    working: true
    file: "/app/backend/server.py, /app/backend/auth.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Login and register endpoints implemented with JWT. Tested with curl successfully."
      - working: true
        agent: "testing"
        comment: "Comprehensive testing completed. All auth endpoints working: POST /api/auth/register (user creation), POST /api/auth/login (admin & test user), GET /api/auth/me (valid & invalid token). JWT authentication working correctly."
  
  - task: "Daily Energy API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "GET /api/energy/daily endpoint implemented and tested with curl"
      - working: true
        agent: "testing"
        comment: "GET /api/energy/daily tested successfully. Returns today's energy data with date, title, content, and recommendations. No authentication required."
  
  - task: "Moon Energy API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "GET /api/energy/moon/current endpoint implemented, needs testing"
      - working: true
        agent: "testing"
        comment: "GET /api/energy/moon/current tested successfully. Returns current month's moon energy with month, year, title, content, and premium status."
  
  - task: "Categories API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "CRUD endpoints for categories implemented, needs testing"
      - working: true
        agent: "testing"
        comment: "GET /api/categories tested successfully. Returns 7 categories with name, slug, icon, color, and order. Categories include Qi Men Dun Jia, BaZi, Feng Shui, etc."
  
  - task: "Articles API"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "CRUD endpoints for articles implemented, needs testing"
  
  - task: "Courses API"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "CRUD endpoints for courses, chapters, lessons implemented, needs testing"
  
  - task: "Favorites API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Favorites CRUD endpoints implemented, needs testing"
      - working: true
        agent: "testing"
        comment: "Favorites endpoints tested successfully. POST /api/favorites adds favorites (requires auth), GET /api/favorites retrieves user favorites (requires auth). Authentication properly enforced."
  
  - task: "Custom Services API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Custom services and service requests endpoints implemented, needs testing"
      - working: true
        agent: "testing"
        comment: "GET /api/services tested successfully. Returns 4 active custom services with title, description, price, and form fields. Services include BaZi readings, Qi Men readings, and personalized rituals."
  
  - task: "Payments API"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Manual payment system endpoints implemented (Revolut, Bizum, Bank Transfer), needs testing"
  
  - task: "Database Seed Script"
    implemented: true
    working: true
    file: "/app/backend/seed.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Seed script creates admin user, categories, daily/moon energy, services, info pages. Executed successfully."

frontend:
  - task: "Authentication UI (Login/Register)"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(auth)/login.tsx, /app/frontend/app/(auth)/register.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Login and register screens with luxury minimal design implemented, needs testing"
  
  - task: "Navigation with Tabs"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(tabs)/_layout.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Tab navigation with 5 tabs (Home, Articles, Courses, Services, Profile) implemented"
  
  - task: "Home Screen with Daily/Moon Energy"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(tabs)/home.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Home screen displays daily and moon energy with luxury minimal design, pull-to-refresh, premium lock for moon energy"
  
  - task: "Profile Screen"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(tabs)/profile.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Profile screen with user info, menu options, logout functionality"
  
  - task: "Design System (Colors, Typography, Components)"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/constants/"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Luxury minimal oriental design system with navy/gold color scheme, Cormorant Garamond + Inter fonts"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Articles API"
    - "Courses API"
    - "Payments API"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Phase 1 MVP implemented with:
      - Backend: Full API with JWT auth, all models and endpoints for energy, articles, courses, services, payments
      - Frontend: Luxury minimal design with auth screens, tab navigation, home screen with energies
      - Database seeded with admin user (admin@metaqi.com / admin123), categories, sample energy data, services
      
      Ready for backend testing. Frontend testing should wait for user approval.
      
      Priority endpoints to test:
      1. POST /api/auth/register
      2. POST /api/auth/login
      3. GET /api/auth/me
      4. GET /api/energy/daily
      5. GET /api/energy/moon/current
  - agent: "testing"
    message: |
      Backend API testing completed successfully - 11/11 tests passed (100% success rate).
      
      ✅ TESTED AND WORKING:
      1. User Authentication (Register/Login/JWT) - All auth flows working correctly
      2. Daily Energy API - Returns today's energy data
      3. Moon Energy API - Returns current month moon energy
      4. Categories API - Returns 7 categories
      5. Custom Services API - Returns 4 active services
      6. Favorites API - Add/Get favorites with proper auth
      
      ⏳ NOT YET TESTED (Medium Priority):
      - Articles API (CRUD endpoints)
      - Courses API (CRUD endpoints with chapters/lessons)
      - Payments API (Manual payment system)
      
      All tested endpoints are working correctly with proper authentication and data validation.
      Test credentials working: admin@metaqi.com / admin123 and user@test.com / user123