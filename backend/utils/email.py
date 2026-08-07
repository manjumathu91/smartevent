from flask_mail import Message
from flask import current_app

from extensions import mail


def send_verification_email(email, token):

    verification_link = f"http://localhost:5000/api/verify-email/{token}"

    subject = "Verify Your Email"

    body = f"""
Hello,

Welcome to Smart Event Management System.

Click the link below to verify your email.

{verification_link}

Thank You.
"""

    msg = Message(
        subject=subject,
        recipients=[email],
        body=body
    )

    mail.send(msg)


def send_reset_password_email(email, token):

    reset_link = f"http://localhost:5000/reset-password?token={token}"

    subject = "Reset Password"

    body = f"""
Hello,

Click the link below to reset your password.

{reset_link}

If you did not request this, ignore this email.

Thank You.
"""

    msg = Message(
        subject=subject,
        recipients=[email],
        body=body
    )

    mail.send(msg)