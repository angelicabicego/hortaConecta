import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../pool.js';
import validateUserCredentials from './validateUserCredentials.js';
import authenticateToken from '../authenticateToken.js';
import config from '../config.js';
import {geocodeAddress} from './maps.js';

const loginRoutes = express.Router();
let accessToken = '';

// GET - Conferir credenciais de login (email e senha)
loginRoutes.get('/login', async (req, res) => {
  const { email, password } = req.headers;

  if (await validateUserCredentials(req.path, email, password)) {
    try {
      const sql = 'SELECT * FROM user';
      const results = await pool.promise().query(sql);

      const token = await gerarToken(email);
      res.status(200).json({ token });
      
    } catch (error) {
      console.error('Ocorreu um erro durante o processo de login:', error);
      res.status(500).end();
    }
  } else {
    console.log('Credencial incorreta');
    res.status(401).end();
  }
});

// POST - Registrar usuário
loginRoutes.post('/register', async (req, res) => {
    const { id, user, name, email, password, address } = req.body;
  
    // Verificar se o usuário já está registrado
    try {
      const checkUserSql = 'SELECT * FROM user WHERE email = ?';
      const [existingUsers] = await pool.promise().query(checkUserSql, [email]);
  
      if (existingUsers.length > 0) {
        // Usuário já registrado
        res.status(400).json({ message: 'Usuário já está registrado.' });
        return;
      }
  
      // Criptografar a senha usando bcrypt
      const hashedPassword = bcrypt.hashSync(password);
    
      //Obtendo informações de latitude e longitude/
      const { latitude, longitude } = await geocodeAddress(address);

      const createUserSql =
      'INSERT INTO user (id, user, name, email, password, address, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      await pool.promise().query(createUserSql, [
        id,
        user,
        name,
        email,
        hashedPassword,
        address,
        latitude,
        longitude,
      ]);

      
      const token = await gerarToken(email);
      res.status(200).json({ message: 'Registro realizado com sucesso. Seu token de acesso é:', token });
  
    } catch (error) {
      console.error('Ocorreu um erro durante o registro:', error);
      res.status(500).json({ message: 'Ocorreu um erro durante o registro.' });
    }
  });
  

loginRoutes.get('/logout', authenticateToken, (req, res) => {
  //Futuras operações para o logout do usuário, como invalidar a sessão ou remover o token de autenticação.
  res.status(200).json({ message: 'Logout realizado com sucesso.' });
});

async function gerarToken(email){

  try{
    const sql = 'SELECT * FROM user WHERE email = ?';
    const [results] = await pool.promise().query(sql, [email]);

    // Login válido, gerar o token e salvar para usar em outras rotas
    const { id } = results[0]; // Obter o ID do usuário
    const tokenPayload = { id, email }; // Adicionar o ID do usuário ao payload do token
    const token = jwt.sign(tokenPayload, config.secret);
    setAccessToken(token);
    return token;
    
  } catch (error) {
    console.error('Ocorreu um erro ao gerar o token:', error);
    throw error;
  }

}

//Define o valor do token, que será exportado
export function setAccessToken(token) {
    accessToken = token;
}  

//Obtem o valor do token
export function getAccessToken() {
    return accessToken;
}

export default loginRoutes;