import pandas as pd
import random
from google import genai
# create Genai client
client = genai.Client(
    api_key= "AIzaSyA2YAc6QgLY9kzZidn1YLMs1cZyqMXGw_g",
    http_options = {'api_version': 'v1'}) 
#Load client data
df = pd.read_csv('clients.csv')
df.head()
print("Hi! Welcome to Bank of Kigali Chatbot! I will help you reset your PIN code.")
# user_name = input("What's your name? Please enter your name here: ")
print("How can I assist you today?")
issue = input("Please describe your issue:").lower()
try:
    response = client.models.generate_content(
        model = "gemini-1.5-flash",
        contents = f"""
        Analyze the intent of the user. 
        The user input: {issue}. 
        If the user mentions anything related to forgetting, changing, or needing help with 
their access codes, numbers, or security credentials, the intent is a PIN RESET. 
        Final Answer: Answer only 'Yes' or 'No'.
        """
    )
    ai_reply = response.text.strip().upper()
    print(f"{ai_reply}")
except Exception as e:
    ai_reply = "UNKOWN"
# list of all words that mean PIN reset
keywords = ["pin", "code", "password", "pass", "pwd", "psswd", "reset", "forgot", "change" ]
responses = ["I understand, you need help with your PIN code, right?", 
             "Sure, I can help you reset your PIN code.", 
             "No worries, let's get your PIN code reset.", 
             "I'm here to assist you with resetting your PIN code."]

if "YES" in ai_reply or any(word in issue for word in keywords):
    # randomly select a response
    print(f"\n[Bot]: {random.choice(responses)}")
else:
    print("I'm sorry, I'm not sure I understood.")

# ask for confirmation
confirm = input(" Just to be sure, do you want to reset your PIN? (Yes/No): ").lower()
if "yes" in confirm or "y" in confirm:
    print("Great! To proceed with resetting your PIN, I need to verify your identity.")
    print("Please provide your details below.")

    
    name_input = input("Your name:").strip().lower()
    account_number = input("Your account number (eg., 040-xxxxxxx-xx): ").strip()
    dte_birth = input("Your date of birth (MM-DD-YYYY): ").strip()
    phone_number = input("Your phone number (e.g., 2507xxxxxxxx):").strip()

        # --- DEBUG SECTION ---

        #print("\n--- DEBUGGING TRUTH TEST ---")
# This assumes we are checking against the FIRST row of your CSV for the test
        #print(f"Name:    Typed: '{name_input}' | DB: '{df['Name'].iloc[1].lower().strip()}'")
        #print(f"Account: Typed: '{account_number}' | DB: '{df['Account number'].astype(str).iloc[1].strip()}'")
        #print(f"DOB:     Typed: '{dte_birth}' | DB: '{df['Date of birth'].astype(str).iloc[1].strip()}'")
        #print(f"Phone:   Typed: '{phone_number}' | DB: '{df['Phone number'].astype(str).iloc[1].strip()}'")
        #print("----------------------------\n")

        
# verify user details
    user_row = df[
            (df['Name'].str.lower() == name_input) & 
            (df['Account number'].astype(str) == account_number) & 
            (df['Date of birth'].astype(str).str.replace('/', '-').str.lstrip('0').str.replace('-0', '-') == dte_birth.replace('/', '-').lstrip('0').replace('-0', '-')) & 
            (df['Phone number'].astype(str).str.strip() == phone_number)
    ]
# check if user exists
    if not user_row.empty:
        user_name = user_row['Name'].values[0]
        # look up and mask phone number
        phone_val = str(user_row['Phone number'].values[0])
        masked_phone = "250******" + (phone_val[-2:])
        print(f"Identity Verified! Welcome {user_name}.")
        # display OTP message
        stored_otp = str(user_row['OTP'].values[0])
        print( f"An OTP has been sent to {masked_phone}")
        attempts = 3
        while attempts > 0:
                entered_otp = input(f"Please enter the OTP {attempts} attempts left: ").strip()
                if entered_otp == stored_otp:
                    print("OTP verified successfully!")
                    new_pin = input(" Please enter your new PIN code: ").strip()
                    confirm_pin = input("Please confirm your new PIN code: ").strip()
                    if new_pin == confirm_pin:
                        print ("Your PIN has been reset successfully!")
                        print("Thank you for using BK chatbot service. Have a great day.")
                        break
                    else:
                        print("The PIN codes do not match. Please start the process again.")
                        break
                else:
                    attempts -= 1
                    print(f"Incorrect OTP. Please try again. {attempts} attempts left.")
                    if attempts == 0:
                        print("You have exhausted all attempts. Session closed for security reasons.")
        else:
            print("The details you provided do not match our records. Please try again.")
            print("Please check the formats and ensure all the details are correct.")
else:
    print("Okay, if you need any further assistance, feel free to reach out our customer service. Have a great day!")