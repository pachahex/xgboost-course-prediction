from flask_mail import Mail, Message
from flask import current_app, url_for
import os
import threading

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

def send_async_email(app, msg):
    with app.app_context():
        try:
            mail.send(msg)
            print(f"[MAILING] Correo enviado exitosamente a {len(msg.bcc)} destinatarios (BCC).")
        except Exception as e:
            print(f"[MAILING ERROR] Fallo al enviar correo masivo: {e}")

def send_mass_mailing(app, asunto, mensaje_html, destinatarios, filename=None, file_content=None, file_mimetype=None):
    if not destinatarios:
        return
        
    sender = app.config.get('MAIL_DEFAULT_SENDER', 'noreply@autopoiesis.com')
    
    msg = Message(
        subject=asunto,
        sender=sender,
        recipients=[sender], # Nos enviamos a nosotros mismos y ponemos al resto en CCO
        bcc=destinatarios
    )
    
    # Soporte para saltos de línea en HTML
    mensaje_formateado = mensaje_html.replace('\n', '<br>')
    
    msg.html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #5d3fd3; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">Academia Autopoiesis</h2>
        </div>
        <div style="padding: 30px; color: #333; line-height: 1.6;">
            {mensaje_formateado}
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 0.8em; color: #666;">
            <p>Has recibido este correo porque estás suscrito a nuestro boletín informativo.</p>
            <p>Puedes gestionar tus preferencias de suscripción desde tu Panel de Estudiante en la sección de Configuración.</p>
        </div>
    </div>
    """
    
    if filename and file_content and file_mimetype:
        msg.attach(filename, file_mimetype, file_content)
        
    # Enviar en un hilo separado para no bloquear la respuesta
    thread = threading.Thread(target=send_async_email, args=(app, msg))
    thread.start()
