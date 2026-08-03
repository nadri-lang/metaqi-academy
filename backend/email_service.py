import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('SMTP_FROM_EMAIL', 'noreply@metaqi.com')
        self.from_name = os.getenv('SMTP_FROM_NAME', 'MetaQi Academy')
        self.enabled = bool(self.smtp_user and self.smtp_password)
        
        if not self.enabled:
            logger.warning("Email service not configured - SMTP credentials missing")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None
    ) -> bool:
        """Send an email via SMTP"""
        if not self.enabled:
            logger.error(f"Cannot send email to {to_email} - Email service not configured")
            return False
        
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{self.from_name} <{self.from_email}>"
            message['To'] = to_email
            
            # Add plain text part if provided
            if plain_content:
                part1 = MIMEText(plain_content, 'plain', 'utf-8')
                message.attach(part1)
            
            # Add HTML part
            part2 = MIMEText(html_content, 'html', 'utf-8')
            message.attach(part2)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    async def send_password_reset_email(
        self,
        to_email: str,
        reset_token: str,
        user_name: str,
        language: str = 'es'
    ) -> bool:
        """Send password reset email with token link"""
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:8081')
        reset_link = f"{frontend_url}/reset-password?token={reset_token}"
        
        # Spanish content
        if language == 'es':
            subject = "Restablece tu contraseña - MetaQi Academy"
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #1A1A2E; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .logo {{ color: #C8A24A; font-size: 24px; font-weight: bold; }}
                    .content {{ background: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; }}
                    .button {{ display: inline-block; padding: 14px 32px; background: #C8A24A; color: #1A1A2E; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }}
                    .footer {{ text-align: center; padding: 20px; color: #666666; font-size: 12px; }}
                    .warning {{ background: #FFF3CD; border-left: 4px solid #FFC107; padding: 12px; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">✨ MetaQi Academy</div>
                    </div>
                    <div class="content">
                        <h2 style="color: #1A1A2E;">Hola {user_name},</h2>
                        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
                        <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
                        <div style="text-align: center;">
                            <a href="{reset_link}" class="button">Restablecer Contraseña</a>
                        </div>
                        <div class="warning">
                            <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por razones de seguridad.
                        </div>
                        <p style="font-size: 14px; color: #666666;">
                            Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña no cambiará hasta que accedas al enlace y establezcas una nueva.
                        </p>
                        <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999999;">
                            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                            <a href="{reset_link}" style="color: #C8A24A; word-break: break-all;">{reset_link}</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>MetaQi Academy - Academia de Metafísica China</p>
                        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            plain_content = f"""
            Hola {user_name},
            
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
            
            Para crear una nueva contraseña, visita el siguiente enlace:
            {reset_link}
            
            Este enlace expirará en 1 hora.
            
            Si no solicitaste este cambio, puedes ignorar este correo.
            
            ---
            MetaQi Academy
            """
        else:
            # English content
            subject = "Reset Your Password - MetaQi Academy"
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #1A1A2E; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .logo {{ color: #C8A24A; font-size: 24px; font-weight: bold; }}
                    .content {{ background: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; }}
                    .button {{ display: inline-block; padding: 14px 32px; background: #C8A24A; color: #1A1A2E; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }}
                    .footer {{ text-align: center; padding: 20px; color: #666666; font-size: 12px; }}
                    .warning {{ background: #FFF3CD; border-left: 4px solid #FFC107; padding: 12px; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">✨ MetaQi Academy</div>
                    </div>
                    <div class="content">
                        <h2 style="color: #1A1A2E;">Hi {user_name},</h2>
                        <p>We received a request to reset your account password.</p>
                        <p>Click the button below to create a new password:</p>
                        <div style="text-align: center;">
                            <a href="{reset_link}" class="button">Reset Password</a>
                        </div>
                        <div class="warning">
                            <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
                        </div>
                        <p style="font-size: 14px; color: #666666;">
                            If you didn't request this change, you can safely ignore this email. Your password won't change until you access the link and create a new one.
                        </p>
                        <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999999;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="{reset_link}" style="color: #C8A24A; word-break: break-all;">{reset_link}</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>MetaQi Academy - Chinese Metaphysics Academy</p>
                        <p>This is an automated email, please do not reply to this message.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            plain_content = f"""
            Hi {user_name},
            
            We received a request to reset your account password.
            
            To create a new password, visit this link:
            {reset_link}
            
            This link will expire in 1 hour.
            
            If you didn't request this change, you can safely ignore this email.
            
            ---
            MetaQi Academy
            """
        
        return await self.send_email(to_email, subject, html_content, plain_content)

# Singleton instance
email_service = EmailService()
