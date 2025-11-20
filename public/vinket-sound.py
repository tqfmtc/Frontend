import sounddevice as sd
import numpy as np
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import time

# Email settings
SENDER_EMAIL = "22071a6762@vnrvjiet.in"
SENDER_PASSWORD = "jnncjtafbnbudjuo"  # Use an App Password, not your real password
RECEIVER_EMAIL = "rosireddy.j1312@gmail.com"

# Sound threshold and duration
THRESHOLD = 0.3  # Adjust based on your mic sensitivity
DURATION = 2  # seconds to record

def send_email_alert(volume):
    """Send email when loud sound is detected."""
    try:
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = RECEIVER_EMAIL
        msg["Subject"] = "⚠️ Loud Sound Detected Alert"

        body = f"Loud sound detected!\n\nSound intensity: {volume:.2f}\nTime: {time.ctime()}"
        msg.attach(MIMEText(body, "plain"))

        # Send email via Gmail SMTP
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()

        print("✅ Email alert sent to caretaker.")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

def monitor_sound():
    """Continuously monitor microphone input."""
    print("🎧 Monitoring for loud sounds... Press Ctrl+C to stop.")
    while True:
        recording = sd.rec(int(DURATION * 44100), samplerate=44100, channels=1, dtype="float64")
        sd.wait()
        volume = np.max(np.abs(recording))
        
        print(f"Detected volume: {volume:.2f}")
        if volume > THRESHOLD:
            print("🚨 Loud sound detected! Sending alert...")
            send_email_alert(volume)
            time.sleep(10)  # avoid sending multiple alerts for same sound

if __name__ == "__main__":
    monitor_sound()
