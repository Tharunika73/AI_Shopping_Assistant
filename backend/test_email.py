# test_email.py

import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

# --- Important: Make sure this script is in the same folder as your .env file ---
print("Attempting to load .env file...")
load_dotenv()
print(".env file loaded.")

# 1. --- Configuration ---
SENDER_EMAIL = os.environ.get("MAIL_USERNAME")
SENDER_PASSWORD = os.environ.get("MAIL_PASSWORD")
RECIPIENT_EMAIL = "projectfeedbackform@gmail.com"

print(f"Sender Email Found: {'Yes' if SENDER_EMAIL else 'No'}")
print(f"Sender Password Found: {'Yes' if SENDER_PASSWORD else 'No'}")


# 2. --- Check if credentials are loaded ---
if not SENDER_EMAIL or not SENDER_PASSWORD:
    print("\n--- ERROR ---")
    print("Could not find MAIL_USERNAME or MAIL_PASSWORD in your .env file.")
    print("Please check that the file is saved correctly and in the same directory.")
else:
    try:
        # 3. --- Construct the Email ---
        print("\nConstructing email...")
        msg = EmailMessage()
        msg['Subject'] = "Test Email from Python Script"
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECIPIENT_EMAIL
        msg.set_content("This is a test email. If you received this, the credentials and code are working correctly.")
        print("Email constructed.")

        # 4. --- Send the Email ---
        print("Connecting to Gmail's SMTP server...")
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            print("Server connected. Attempting to log in...")
            smtp.login(SENDER_EMAIL, SENDER_PASSWORD)
            print("Login successful!")
            
            print("Sending email...")
            smtp.send_message(msg)
            print("Email sent.")

        print("\n--- SUCCESS! ---")
        print("The test email was sent successfully. Please check the inbox of projectfeedbackform@gmail.com")

    except Exception as e:
        print("\n--- AN ERROR OCCURRED ---")
        print("The script failed to send the email. Here is the exact error:")
        print(f"\nERROR DETAILS: {e}\n")