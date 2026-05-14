# IPTV-SAM Enhanced — Quick Start

## Step 1: Setup Backend
1. Open a terminal/cmd
2. Navigate to backend folder:
   ```
   cd backend
   ```
3. Create your `.env` file (copy `.env.example` and rename to `.env`):
   ```
   XTREAM_URL=http://your-provider-url.com
   XTREAM_USER=your_username
   XTREAM_PASS=your_password
   ```
4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
5. Start the backend:
   ```
   python server.py
   ```
   ✅ Runs on http://localhost:8000

## Step 2: Setup Frontend
1. Open a **new** terminal/cmd
2. Navigate to frontend folder:
   ```
   cd frontend
   ```
3. Create your `.env` file (copy `.env.example` and rename to `.env`):
   ```
   REACT_APP_BACKEND_URL=http://localhost:8000
   ```
4. Install dependencies:
   ```
   npm install
   ```
5. Start the frontend:
   ```
   npm start
   ```
   ✅ Opens at http://localhost:3000

## Notes
- You need valid Xtream Codes credentials from your IPTV provider
- Both backend AND frontend must be running at the same time
- Keep both terminal windows open while using the app
