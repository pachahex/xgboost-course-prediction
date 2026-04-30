-- Script de migración para Fase 6: Seguridad 2FA y Marketing

-- 1. Crear tabla independiente para suscriptores (leads/marketing)
CREATE TABLE IF NOT EXISTS suscriptores (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    correo VARCHAR(150) NOT NULL UNIQUE,
    fecha_suscripcion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- 2. Alterar tabla usuarios para añadir columnas de autenticación 2FA
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(50);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false;
