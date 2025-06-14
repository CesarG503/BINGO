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
    id_partida SERIAL PRIMARY KEY,
    numeros_llamados JSON DEFAULT '[]',
    estado VARCHAR(20) DEFAULT 'esperando', 
    host INT NOT NULL REFERENCES Usuarios(id_usuario),
    ganador INT REFERENCES Usuarios(id_usuario)
);

CREATE TABLE partida_usuario (
    id_partida_usuario SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES Usuarios(id_usuario),
    id_partida INT NOT NULL REFERENCES Partidas(id_partida)
);

CREATE TABLE carton_usuario (
    id_carton_usuario SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES Usuarios(id_usuario),
    id_carton INT NOT NULL REFERENCES Cartones(id_carton)
);