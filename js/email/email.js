function Email(user, resetUrl) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4481eb, #04befe); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #4481eb; color:rgb(255, 255, 255); padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 BINGO Game</h1>
                    <h2>Recuperación de Contraseña</h2>
                </div>
                <div class="content">
                    <p>Hola <strong>${user.username}</strong>,</p>
                    
                    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de BINGO.</p>
                    
                    <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                    
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="button">Cambiar Contraseña</a>
                    </div>
                    
                    <p>O copia y pega este enlace en tu navegador:</p>
                    <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;">
                        ${resetUrl}
                    </p>
                    
                    <div class="warning">
                        <strong>⚠️ Importante:</strong>
                        <ul>
                            <li>Este enlace expirará en <strong>24 horas</strong></li>
                            <li>Solo puede ser usado una vez</li>
                            <li>Si no solicitaste este cambio, ignora este email</li>
                        </ul>
                    </div>
                </div>
                <div class="footer">
                    <p>Este es un email automático, por favor no respondas a este mensaje.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

module.exports = { Email };