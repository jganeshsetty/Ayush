import os
import smtplib
import ssl
from email.message import EmailMessage
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from backend.database import get_db
from backend.models import TestEmailRequest, TestEmailResponse
from backend.auth import get_current_user, get_current_caretaker

router = APIRouter()


def get_smtp_config() -> tuple:
    """Get SMTP configuration from environment."""
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")
    if not smtp_email or not smtp_password:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SMTP not configured. Set SMTP_EMAIL and SMTP_PASSWORD environment variables."
        )
    return smtp_email, smtp_password


def create_email_html(subject: str, body: str, is_test: bool = False) -> str:
    """Create HTML email with terracotta/sage palette (NO red/blue)."""
    # Terracotta/sage palette colors
    TERRACOTTA = "#8C4A2F"
    TERRACOTTA_LIGHT = "#C88132"
    SAGE = "#8F9B7D"
    SAGE_LIGHT = "#E8EDDF"
    CREAM = "#FCFAF6"
    WARM_ESSENTIAL = "#241B18"
    WARM_STONE = "#EADECE"

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: {CREAM}; color: {WARM_ESSENTIAL};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: {CREAM};">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 24px; border: 1.5px solid {WARM_STONE}; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: {TERRACOTTA}; padding: 32px 24px; text-align: center;">
                            <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #FFFFFF; letter-spacing: -0.01em;">Ayush</h1>
                            <p style="margin: 8px 0 0; font-size: 16px; color: #FFC9B5;">Care Notification</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px 24px;">
                            <h2 style="margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: {WARM_ESSENTIAL}; line-height: 1.3;">{subject}</h2>
                            <div style="font-size: 18px; line-height: 1.6; color: {WARM_ESSENTIAL};">
                                {body}
                            </div>

                            {"<p style='margin: 24px 0 0; padding: 16px; background-color: " + SAGE_LIGHT + "; border-radius: 12px; border-left: 4px solid " + SAGE + "; font-size: 14px; color: #5D6B4A;'><strong>Test Email</strong> — This is a test notification from Ayush. No action required.</p>" if is_test else ""}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px; background-color: {CREAM}; border-top: 1px solid {WARM_STONE}; text-align: center;">
                            <p style="margin: 0 0 8px; font-size: 14px; color: #635752;">Ayush — Elderly Care Platform</p>
                            <p style="margin: 0; font-size: 12px; color: #86736C;">This is an automated message. Please do not reply.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""


async def send_email(to_email: str, subject: str, body: str, is_test: bool = False) -> str:
    """Send email via SMTP."""
    smtp_email, smtp_password = get_smtp_config()

    msg = EmailMessage()
    msg["From"] = f"Ayush <{smtp_email}>"
    msg["To"] = to_email
    msg["Subject"] = subject

    # Plain text version
    msg.set_content(body)

    # HTML version
    html_content = create_email_html(subject, body, is_test)
    msg.add_alternative(html_content, subtype="html")

    # Send via SMTP
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(smtp_email, smtp_password)
        server.send_message(msg)

    return msg["Message-ID"]


@router.post("/notifications/test-email", response_model=TestEmailResponse)
async def test_email(
    request: TestEmailRequest,
    current_user = Depends(get_current_caretaker),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Send a test email via SMTP. Requires caretaker role."""
    # Default to caretaker's email if not specified
    to_email = request.to or current_user.email

    subject = "Ayush Test Email"
    body = f"""Hello {current_user.display_name},

This is a test email from Ayush to verify your SMTP configuration is working correctly.

If you received this email, your notification settings are properly configured.

Time sent: {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")} UTC

— The Ayush Team"""

    try:
        message_id = await send_email(to_email, subject, body, is_test=True)
        return TestEmailResponse(sent=True, message_id=message_id)
    except Exception as e:
        return TestEmailResponse(sent=False, error=str(e))


# Internal function for scheduler to send notifications
async def send_notification_email(
    db: AsyncIOMotorDatabase,
    profile_id: str,
    notification_type: str,
    subject: str,
    body: str,
    recipients: list
) -> list:
    """Send notification emails to multiple recipients."""
    sent_results = []

    for recipient_email in recipients:
        try:
            message_id = await send_email(recipient_email, subject, body)
            sent_results.append({
                "recipient": recipient_email,
                "status": "sent",
                "message_id": message_id
            })

            # Log notification in database
            notifications = db.notifications
            await notifications.insert_one({
                "profile_id": ObjectId(profile_id),
                "type": notification_type,
                "channel": "email",
                "recipient": recipient_email,
                "subject": subject,
                "body": body,
                "sent_at": datetime.utcnow(),
                "status": "sent",
                "created_at": datetime.utcnow()
            })
        except Exception as e:
            sent_results.append({
                "recipient": recipient_email,
                "status": "failed",
                "error": str(e)
            })

            # Log failed notification
            notifications = db.notifications
            await notifications.insert_one({
                "profile_id": ObjectId(profile_id),
                "type": notification_type,
                "channel": "email",
                "recipient": recipient_email,
                "subject": subject,
                "body": body,
                "sent_at": None,
                "status": "failed",
                "created_at": datetime.utcnow()
            })

    return sent_results