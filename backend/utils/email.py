from flask_mail import Mail, Message
from flask import current_app, url_for
import os

mail = Mail()

def send_verification_email(to_email, nombre, token):
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    verify_link = f"{frontend_url}/verificar-email?token={token}"
    
    msg = Message(
        subject="Autopoiesis - Verifica tu correo electrónico",
        sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@autopoiesis.com'),
        recipients=[to_email]
    )
    
    msg.html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #5d3fd3; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">Academia Autopoiesis</h2>
        </div>
        <div style="padding: 30px; color: #333;">
            <p>Hola <strong>{nombre}</strong>,</p>
            <p>Gracias por registrarte en nuestra plataforma académica. Para asegurar la integridad de nuestros certificados, te pedimos que verifiques tu correo electrónico haciendo clic en el siguiente enlace:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verify_link}" style="background-color: #5d3fd3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verificar mi correo</a>
            </div>
            
            <p style="font-size: 0.9em; color: #666;">Si no creaste esta cuenta, puedes ignorar este correo de forma segura.</p>
            <p style="font-size: 0.9em; color: #666;">Enlace directo: <a href="{verify_link}">{verify_link}</a></p>
        </div>
    </div>
    """
    mail.send(msg)

def send_reset_password_email(to_email, nombre, token):
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    msg = Message(
        subject="Autopoiesis - Recuperación de Contraseña",
        sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@autopoiesis.com'),
        recipients=[to_email]
    )
    
    msg.html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #5d3fd3; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">Academia Autopoiesis</h2>
        </div>
        <div style="padding: 30px; color: #333;">
            <p>Hola <strong>{nombre}</strong>,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para elegir una nueva contraseña:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background-color: #5d3fd3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
            </div>
            
            <p style="font-size: 0.9em; color: #666;">Este enlace expirará en 1 hora. Si no solicitaste un cambio de contraseña, ignora este correo y tu cuenta seguirá segura.</p>
        </div>
    </div>
    """
    mail.send(msg)
