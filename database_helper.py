import smtplib
import sqlite3
from flask import g
import string
import random
from email.mime.text import MIMEText

DATABASE_URI = "database.db"


def get_db():
    db = getattr(g, "db", None)
    if db is None:
        db = g.db = sqlite3.connect(DATABASE_URI)
    return db


def create_tables():
    conn = sqlite3.connect(DATABASE_URI)
    c = conn.cursor()
    with open("schema.sql", "r") as f:
        sql = f.read()
        c.executescript(sql)

    conn.commit()
    conn.close()


def store_token(email, access_token):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO tokens (email, access_token) VALUES (?,?)",
              (email, access_token))
    conn.commit()


def get_token_data(access_token):
    conn = get_db()
    c = conn.cursor()

    c.execute(
        "SELECT email, access_token FROM tokens WHERE access_token = ?", (access_token,))
    token_data = c.fetchone()

    if token_data:
        return {"email": token_data[0], "access_token": token_data[1]}

    return None


def get_email_data(access_token):
    conn = get_db()
    c = conn.cursor()
    token_data = get_token_data(access_token)
    if not token_data:
        return None

    email = token_data.get("email")
    if not email:
        return None

    c.execute(
        "SELECT * FROM users WHERE email=?", (email,)
    )
    user_data = c.fetchone()

    if user_data:
        return {"email": user_data[1], "password": user_data[2], "firstname": user_data[3], "familyname": user_data[4], "gender": user_data[5], "city": user_data[6], "country": user_data[7]}

    return None


def get_email_email_data(email):
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "SELECT * FROM users WHERE email=?", (email,)
    )
    user_data = c.fetchone()

    if user_data:
        return {"email": user_data[1], "password": user_data[2], "firstname": user_data[3], "familyname": user_data[4], "gender": user_data[5], "city": user_data[6], "country": user_data[7]}

    return None


def invalidate_token(access_token):
    conn = get_db()
    c = conn.cursor()

    c.execute("DELETE FROM tokens WHERE access_token = ?", (access_token,))
    conn.commit()

    if c.rowcount == 1:
        return True

    return False


def save_user(email, password, firstname, familyname, gender, city, country):
    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = c.fetchone()

    if user:
        return 400, "Email already exists"

    c.execute("INSERT INTO users (email, password, firstname, familyname, gender, city, country) VALUES (?, ?, ?, ?, ?, ?, ?)",
              (email, password, firstname, familyname, gender, city, country))
    conn.commit()

    return 200, "User signed up"


def check_user(email, password):
    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT email, password FROM users WHERE email = ?", (email,))
    user = c.fetchone()

    if user and user[1] == password:
        email, password = user
        return {"success": True, "email": email, "password": password}

    return {"success": False}


def update_password(email, newpassword):
    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT id FROM users WHERE email = ?", (email,))
    user = c.fetchone()
    if user is None:
        return 404, "User not to find"

    c.execute("UPDATE users SET password = ? WHERE email = ?",
              (newpassword, email))
    conn.commit()

    return 200, "Password updated!!!"


def save_message(sender_email, receiver_email, message):
    conn = get_db()
    c = conn.cursor()

    c.execute("INSERT INTO messages (sender_email, receiver_email, message) VALUES (?, ?, ?)",
              (sender_email, receiver_email, message))
    conn.commit()

    return 200, "Message was sent correctly"


def get_messages_by_email(email):
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "SELECT sender_email, receiver_email, message FROM messages WHERE receiver_email = ? ORDER BY id DESC", (email, ))
    messages = []
    for row in c.fetchall():
        messages.append({
            "sender_email": row[0],
            "receiver_email": row[1],
            "message": row[2],
        })
    return messages


def get_user_data_by_email(email):
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "SELECT * FROM users WHERE email=?", (email,)
    )
    user_data = c.fetchone()

    if user_data:
        return {"email": user_data[1], "password": user_data[2], "firstname": user_data[3], "familyname": user_data[4], "gender": user_data[5], "city": user_data[6], "country": user_data[7]}

    return None


def send_password_email(email, password):
    smtp_server = "mail.gmx.net"
    smtp_port = 587 
    smtp_username = "danbadea66@gmx.de"
    smtp_password = "Gicahagi0809+="

    subject = "Password Recovery"
    message = f"Your new password is: {password}"
    sender = "danbadea66@gmx.de"
    receiver = email

    email_message = MIMEText(message)
    email_message["Subject"] = subject
    email_message["From"] = sender
    email_message["To"] = receiver

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)

        server.sendmail(sender, receiver, email_message.as_string())

        server.quit()

        print("Password recovery email sent successfully.")
    except Exception as e:
        print(f"Failed to send the password recovery email: {e}")


def generate_password(length=8):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))
