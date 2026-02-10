from flask import Flask, render_template, request, session, jsonify
import pandas as pd
import random
import time
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
import smtplib
from email.message import EmailMessage

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = os.getenv('FLASK_SECRET_KEY')

# Create Google genai client
client = genai.Client(api_key=os.getenv('GOOGLE_API_KEY'))

# Path to client data CSV
CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'Clients.csv')

def load_clients():
    """Reload CSV each time so changes are picked up without restarting the server."""
    return pd.read_csv(CSV_PATH, encoding='utf-8-sig')

# System prompt — Gemini finds BK info by itself via Google Search
BK_SYSTEM_PROMPT = """You are a helpful and professional Bank of Kigali (BK) customer service chatbot.
Use Google Search to find accurate, up-to-date information from bk.rw and other reliable sources.
Always cite your sources when you use web results.
Be polite, professional, and concise (2-5 sentences unless more detail is needed).
If the question is completely unrelated to banking or BK, politely redirect the user.
Respond in the same language the user writes in (English, French, or Kinyarwanda)."""


def send_otp_email(receiver_email, otp_code):
    """Send OTP via email."""
    sender_email = os.getenv('EMAIL_USER')
    sender_pass = os.getenv('EMAIL_PASS')
    msg = EmailMessage()
    msg.set_content(f"Your Bank of Kigali OTP code is: {otp_code}")
    msg['Subject'] = 'Your OTP Code - BK Chatbot'
    msg['From'] = sender_email
    msg['To'] = receiver_email
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(sender_email, sender_pass)
            smtp.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def ask_gemini_about_bk(user_question, conversation_history=""):
    """Ask Gemini a question about Bank of Kigali — it searches the web itself for accurate answers."""
    prompt = f"""{BK_SYSTEM_PROMPT}

CONVERSATION SO FAR:
{conversation_history}

USER QUESTION: {user_question}

Respond helpfully and accurately."""

    # Retry up to 3 times in case of rate limiting
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())]
                )
            )
            return response.text.strip()
        except Exception as e:
            error_msg = str(e)
            print(f"Gemini error (attempt {attempt + 1}/3): {error_msg}")
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                time.sleep(3 * (attempt + 1))
                continue
            else:
                return f"Error: {error_msg}\n\nType 'menu' to go back."
    
    return "You've hit the API rate limit. Please wait a moment and try again, or type 'menu'."


def get_menu_text():
    """Return the main menu options."""
    return (
        "How can I help you today? Please choose an option:\n\n"
        "1️⃣  Reset my PIN code\n"
        "2️⃣  Ask a question about Bank of Kigali\n"
        "3️⃣  Contact customer service\n\n"
        "Type the number or just describe what you need!"
    )


def detect_intent(user_input):
    """Detect user intent: 'pin_reset', 'general_query', 'contact', or 'unknown'."""
    lower = user_input.lower().strip()
    
    # Direct number choices
    if lower in ['1', '1.', '1️⃣']:
        return 'pin_reset'
    if lower in ['2', '2.', '2️⃣']:
        return 'general_query'
    if lower in ['3', '3.', '3️⃣']:
        return 'contact'
    
    # Keyword matching
    pin_keywords = ["pin", "reset", "forgot", "change pin", "new pin", "code", "password"]
    contact_keywords = ["contact", "call", "phone number", "email", "speak to", "human", "agent", "customer service"]
    menu_keywords = ["menu", "back", "start over", "home", "options"]
    
    if any(word in lower for word in menu_keywords):
        return 'menu'
    if any(word in lower for word in pin_keywords):
        return 'pin_reset'
    if any(word in lower for word in contact_keywords):
        return 'contact'
    
    # Default to general query (let Gemini handle it)
    return 'general_query'


@app.route('/')
def home():
    session.clear()
    welcome = "Hi! Welcome to Bank of Kigali Chatbot!"
    menu = get_menu_text()
    session['messages'] = [
        {"text": welcome, "sender": "bot"},
        {"text": menu, "sender": "bot"}
    ]
    session['step'] = 'menu'
    return render_template('index.html')


@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message', '').strip()
    messages = session.get('messages', [])
    step = session.get('step', 'menu')

    # Add user message to history
    messages.append({"text": user_input, "sender": "user"})

    # Build conversation history for AI context (last 10 messages)
    conversation_history = "\n".join(
        [f"{msg['sender'].upper()}: {msg['text']}" for msg in messages[-10:]]
    )

    # Check for "menu" / "back" command at any point
    if user_input.lower().strip() in ['menu', 'back', 'start', 'home', 'restart']:
        # Reset to menu but keep messages
        session['name'] = ''
        session['account'] = ''
        session['dob'] = ''
        session['phone'] = ''
        messages.append({"text": get_menu_text(), "sender": "bot"})
        session['step'] = 'menu'
        session['messages'] = messages
        return jsonify({'messages': messages, 'step': session['step']})

    # Get session data for PIN reset flow
    name = session.get('name', '')
    account = session.get('account', '')
    dob = session.get('dob', '')
    phone = session.get('phone', '')

    try:
        # ─── MAIN MENU ─────────────────────────────────────────
        if step == 'menu':
            intent = detect_intent(user_input)

            if intent == 'pin_reset':
                messages.append({
                    "text": "Sure! I'll help you reset your PIN. \nFirst, what is your full name?",
                    "sender": "bot"
                })
                session['step'] = 'identity_verify'

            elif intent == 'contact':
                messages.append({
                    "text": (
                        "You can reach Bank of Kigali customer service through:\n\n"
                        "• Call: (+250) 788 143 000\n"
                        "• Email: info@bk.rw\n"
                        "• Website: https://www.bk.rw\n"
                        "• Visit any BK branch (Mon-Fri 8AM-5PM, Sat 8AM-12PM)\n\n"
                        "Type 'menu' to go back to the main menu."
                    ),
                    "sender": "bot"
                })
                session['step'] = 'general_query'

            elif intent == 'general_query':
                # If user just typed "2", ask what they want to know
                if user_input.strip() in ['2', '2.', '2️⃣']:
                    messages.append({
                        "text": "Sure! What would you like to know about Bank of Kigali?",
                        "sender": "bot"
                    })
                else:
                    # Use Gemini + Google Search to answer
                    reply = ask_gemini_about_bk(user_input, conversation_history)
                    reply += "\n\nType 'menu' to see options or keep asking questions!"
                    messages.append({"text": reply, "sender": "bot"})
                session['step'] = 'general_query'

            else:
                messages.append({"text": get_menu_text(), "sender": "bot"})
                session['step'] = 'menu'

        # ─── GENERAL Q&A MODE ──────────────────────────────────
        elif step == 'general_query':
            intent = detect_intent(user_input)

            if intent == 'pin_reset':
                messages.append({
                    "text": "Sure! Let's switch to PIN reset. \nWhat is your full name?",
                    "sender": "bot"
                })
                session['step'] = 'identity_verify'
            elif intent == 'menu':
                messages.append({"text": get_menu_text(), "sender": "bot"})
                session['step'] = 'menu'
            else:
                # Continue answering BK questions
                reply = ask_gemini_about_bk(user_input, conversation_history)
                reply += "\n\n Type 'menu' to see options or keep asking questions!"
                messages.append({"text": reply, "sender": "bot"})
                session['step'] = 'general_query'

        # ─── PIN RESET: IDENTITY VERIFICATION ──────────────────
        elif step == 'identity_verify':
            if not name:
                # Accept the name directly — it will be verified against the CSV later
                session['name'] = user_input
                messages.append({
                    "text": f"Thank you, {user_input}. Now, what is your account number? (e.g., 040-xxxxxxx-xx)",
                    "sender": "bot"
                })

            elif not account:
                session['account'] = user_input
                messages.append({
                    "text": "Got it. What is your date of birth? (MM-DD-YYYY)",
                    "sender": "bot"
                })

            elif not dob:
                session['dob'] = user_input
                messages.append({
                    "text": "And finally, what is your phone number? (e.g., 2507xxxxxxxx)",
                    "sender": "bot"
                })

            elif not phone:
                session['phone'] = user_input

                # Verify all details against CSV (reloads CSV each time)
                df = load_clients()
                name_input = session['name'].strip().lower()
                account_number = session['account'].strip()
                dte_birth = session['dob'].strip()
                phone_number = session['phone'].strip()

                user_row = df[
                    (df['Name'].astype(str).str.strip().str.lower() == name_input) &
                    (df['Account number'].astype(str).str.strip() == account_number) &
                    (df['Date of birth'].astype(str).str.strip().str.replace('/', '-').str.lstrip('0').str.replace('-0', '-') ==
                     dte_birth.replace('/', '-').lstrip('0').replace('-0', '-')) &
                    (df['Phone number'].astype(str).str.strip() == phone_number)
                ]

                if not user_row.empty:
                    user_name = user_row['Name'].values[0]
                    session['user_email'] = user_row['Email'].values[0]
                    session['otp'] = str(user_row['OTP'].values[0])
                    session['attempts'] = 3

                    messages.append({
                        "text": (
                            f" Identity verified! Welcome {user_name}.\n\n"
                            "How would you like to receive your OTP?\n"
                            "1️⃣ SMS\n"
                            "2️⃣ Email"
                        ),
                        "sender": "bot"
                    })
                    session['step'] = 'otp_method'
                else:
                    messages.append({
                        "text": " The details you provided don't match our records. Please check and try again.\n\nType 'menu' to go back to the main menu.",
                        "sender": "bot"
                    })
                    session['step'] = 'general_query'

        # ─── PIN RESET: OTP METHOD ─────────────────────────────
        elif step == 'otp_method':
            if "2" in user_input or "email" in user_input.lower():
                messages.append({
                    "text": "Please enter your email address:",
                    "sender": "bot"
                })
                session['step'] = 'verify_email'
            else:
                messages.append({
                    "text": "OTP sent via SMS to your registered phone number. Please enter the code.",
                    "sender": "bot"
                })
                session['step'] = 'verify_otp'

        # ─── PIN RESET: VERIFY EMAIL & SEND OTP ──────────────
        elif step == 'verify_email':
            entered_email = user_input.strip().lower()
            stored_email = session.get('user_email', '').strip().lower()

            if entered_email == stored_email:
                otp = session.get('otp')
                if send_otp_email(session.get('user_email'), otp):
                    messages.append({
                        "text": f"Email verified! OTP sent to {session.get('user_email')}. Please enter the code.",
                        "sender": "bot"
                    })
                else:
                    messages.append({
                        "text": "Error sending email. Please try again or type 'menu'.",
                        "sender": "bot"
                    })
                session['step'] = 'verify_otp'
            else:
                messages.append({
                    "text": "The email you entered does not match our records. Please try again:",
                    "sender": "bot"
                })
                session['step'] = 'verify_email'

        # ─── PIN RESET: VERIFY OTP ─────────────────────────────
        elif step == 'verify_otp':
            stored_otp = session.get('otp')
            attempts = session.get('attempts', 3)

            if user_input.strip() == stored_otp:
                messages.append({
                    "text": " OTP verified! Now, please enter your new 4-digit PIN code.\nAvoid using repeated digits (e.g., 0000) or consecutive numbers (e.g., 1234).",
                    "sender": "bot"
                })
                session['step'] = 'new_pin'
            else:
                attempts -= 1
                session['attempts'] = attempts
                if attempts > 0:
                    messages.append({
                        "text": f" Incorrect OTP. You have {attempts} attempt(s) left.",
                        "sender": "bot"
                    })
                else:
                    messages.append({
                        "text": "Too many failed attempts. Session closed for security.\n\nType 'menu' to start over.",
                        "sender": "bot"
                    })
                    session['step'] = 'general_query'

        # ─── PIN RESET: NEW PIN ─────────────────────────────────
        elif step == 'new_pin':
            pin = user_input.strip()
            
            # Must be exactly 4 digits
            if not pin.isdigit() or len(pin) != 4:
                messages.append({
                    "text": "Your PIN must be exactly 4 digits. Please try again:",
                    "sender": "bot"
                })
            # No repeated digits (0000, 1111, 9999, etc.)
            elif len(set(pin)) == 1:
                messages.append({
                    "text": "Your PIN cannot be all the same digit (e.g., 0000, 1111). Please choose a stronger PIN:",
                    "sender": "bot"
                })
            # No consecutive sequences (1234, 2345, 3210, etc.)
            elif pin in ['0123', '1234', '2345', '3456', '4567', '5678', '6789',
                         '9876', '8765', '7654', '6543', '5432', '4321', '3210']:
                messages.append({
                    "text": "Your PIN cannot be consecutive numbers (e.g., 1234, 4321). Please choose a stronger PIN:",
                    "sender": "bot"
                })
            else:
                session['new_pin'] = pin
                messages.append({
                    "text": "Please confirm your new PIN code.",
                    "sender": "bot"
                })
                session['step'] = 'confirm_pin'

        # ─── PIN RESET: CONFIRM PIN ────────────────────────────
        elif step == 'confirm_pin':
            if user_input.strip() == session.get('new_pin'):
                messages.append({
                    "text": (
                        "Your PIN has been reset successfully!\n"
                        "Thank you for using Bank of Kigali chatbot service.\n\n"
                        "Type 'menu' if you need anything else."
                    ),
                    "sender": "bot"
                })
                session['step'] = 'general_query'
            else:
                messages.append({
                    "text": "PIN codes don't match. Let's try again.\nPlease enter your new PIN code.",
                    "sender": "bot"
                })
                session['step'] = 'new_pin'

        else:
            messages.append({
                "text": get_menu_text(),
                "sender": "bot"
            })
            session['step'] = 'menu'

    except Exception as e:
        print(f"Error: {e}")
        messages.append({
            "text": "Sorry, I encountered an error. Please try again or type 'menu'.",
            "sender": "bot"
        })

    session['messages'] = messages
    return jsonify({'messages': messages, 'step': session['step']})


if __name__ == '__main__':
    app.run(debug=True)
