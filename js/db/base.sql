CREATE DATABASE bingoDB;

CREATE TABLE Usuarios (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    rol SMALLINT DEFAULT 1 CHECK (rol IN (0, 1)),
    creditos INT DEFAULT 0,
    img_id VARCHAR(255),
    email VARCHAR(100) UNIQUE
);


CREATE TABLE Cartones (
    id_carton SERIAL PRIMARY KEY,
    carton JSON NOT NULL
);

CREATE TABLE Partidas (
    id_partida VARCHAR(20) PRIMARY KEY,
    numeros_llamados JSON DEFAULT '[]',
    estado INT DEFAULT 0, 
    host INT NOT NULL REFERENCES Usuarios(id_usuario),
    ganador INT REFERENCES Usuarios(id_usuario),
     -- COLUMNA AGREGADA DIRECTAMENTE A CREATE TABLE
    patron_ganador JSONB DEFAULT '[
        ["0", "0", "0", "0", "0"],
        ["0", "0", "0", "0", "0"],
        ["0", "0", "1", "0", "0"],
        ["0", "0", "0", "0", "0"],
        ["0", "0", "0", "0", "0"]
    ]' -- Matriz 5x5 corregida
);

CREATE TABLE partida_usuario (
    id_partida_usuario SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES Usuarios(id_usuario),
    id_partida VARCHAR(20) NOT NULL REFERENCES Partidas(id_partida)
);
ALTER TABLE partida_usuario ADD COLUMN id_cartones JSON DEFAULT '[]';

CREATE TABLE carton_usuario (
    id_carton_usuario SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES Usuarios(id_usuario),
    id_carton INT NOT NULL REFERENCES Cartones(id_carton)
);

CREATE TABLE password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);