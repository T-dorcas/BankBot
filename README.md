# BankBot

BankBot is a small Flask-based chatbot prototype for Bank of Kigali (BK). It demonstrates a simple web chat UI, a PIN-reset flow that verifies users from a CSV, and a web-enabled FAQ responder using Gemini (Google GenAI).

**What this repo contains**
- `Itshp Prjects_BK/2nd prjct_bk/bot.py`: Main Flask app and chatbot logic.
- `Itshp Prjects_BK/Clients.csv`: Customer data used to verify identity for PIN resets.
- `Itshp Prjects_BK/2nd prjct_bk/templates/` and `static/`: Frontend HTML, CSS and JS.

**What `bot.py` does (simple)**
- Runs a Flask web server that serves a chat interface.
- Shows a main menu with options: reset PIN, ask BK questions, or contact support.
- For PIN reset: it asks for name, account number, DOB, and phone, checks `Clients.csv`, sends an OTP (email or SMS flow simulated), and lets the user set a new 4-digit PIN.
- For general questions: it uses Google Gemini (via `google.genai`) with web search to get up-to-date answers and cites sources.

Quick start (Windows)
1. Install Python 3.10+ and create a virtual env (recommended):

```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

2. Install required packages:

```powershell
pip install flask pandas python-dotenv google-genai
```

3. Create a `.env` file in `Itshp Prjects_BK/2nd prjct_bk/` with these variables:

```
FLASK_SECRET_KEY=your-secret
GOOGLE_API_KEY=your-google-genai-key
EMAIL_USER=you@gmail.com
EMAIL_PASS=your-email-password
```

4. Make sure `Clients.csv` is at `Itshp Prjects_BK/Clients.csv` and contains columns: `Name`, `Account number`, `Date of birth`, `Phone number`, `Email`, `OTP`.

5. Run the bot:

```powershell
cd "Itshp Prjects_BK\2nd prjct_bk"
py bot.py
```

6. Open your browser at `http://127.0.0.1:5000` and start the chat.

Notes & safety
- Do not commit your `.env` file or real credentials to version control.
- This project is a prototype. Treat all sensitive flows (OTP, PIN storage) carefully before using in production.

Problems or questions
- Look at `Itshp Prjects_BK/2nd prjct_bk/bot.py` for implementation details and comments.
- Ask here if you want a `requirements.txt`, Dockerfile, or tests added.

---
Simple, clear, and ready to run locally.