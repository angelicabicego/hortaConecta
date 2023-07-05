Projeto Horta Conecta
Avaliação 3
Sistemas Distribuídos e Mobile
Grupo Ânima - UNA 1/2023

Para rodar Local:

/config.js
Colocar uma chave válida em 
googleMapsApiKey: "[key_maps]",

/pool.js
Ajustar informações para conexão local


Query para criação do Data Base:

create database hortaConecta;

CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    address VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);


CREATE TABLE horta (
    id INT PRIMARY KEY AUTO_INCREMENT,
    address VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    category ENUM('Pessoal','Comunitária', 'Comercial') NOT NULL,
    id_user INT UNIQUE,
    FOREIGN KEY (id_user) REFERENCES user(id)
);

CREATE TABLE product (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category ENUM('Legumes', 'Verduras', 'Frutas', 'Grãos e cereais', 'Condimentos e temperos', 'Fertilizante', 'Outros') NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unity ENUM('g', 'Kg', 'L', 'unidade', 'bandeja', 'litro', 'pacote', 'ramalhete') NOT NULL,
    description TEXT NOT NULL,
    validateDate DATE NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	price DECIMAL(10, 2) NOT NULL,
    id_horta INT,
    FOREIGN KEY (id_horta) REFERENCES horta(id)
);
