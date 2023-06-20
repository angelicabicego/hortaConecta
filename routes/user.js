import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../pool.js';
import authenticateToken from '../authenticateToken.js';

const userRoutes = express.Router();

// Middleware para verificar o token JWT em todas as rotas
userRoutes.use(authenticateToken);

// GET - Obter lista de todos os usuários
userRoutes.get('/users', async (req, res) => {
    try {
      const sql = 'SELECT * FROM user';
      const [results] = await pool.promise().query(sql);
  
      if (results.length > 0) {
        res.status(200).json(results);
      } else {
        mensageHorta(res, 404, 'Não há usuários cadastrados');
      }
    } catch (error) {
      console.error('Ocorreu um erro durante a consulta dos usuários:', error);
      mensageHorta(res, 500, 'Ocorreu um erro durante a consulta dos usuários');
    }
});

// GET - Obter informações de um usuário específico
userRoutes.get('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const [results] = await pool.promise().query(sql, [id]);

    if (results.length > 0) {
      res.status(200).json(results[0]);
    } else {
      mensageHorta(res, 404, 'Usuário não encontrado');
    }
  } catch (error) {
    console.error('Ocorreu um erro durante a consulta do usuário:', error);
    mensageHorta(res, 500, 'Ocorreu um erro durante a consulta do usuário');
  }
});

// PUT - Atualizar informações de um usuário específico
userRoutes.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { user, name, email, password, address } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'UPDATE users SET user = ?, name = ?, email = ?, password = ?, address = ? WHERE id = ?';
    const [result] = await pool.promise().query(sql, [user, name, email, hashedPassword, address, id]);

    if (result.affectedRows > 0) {
      mensageHorta(res, 200, 'Usuário atualizado com sucesso');
    } else {
      mensageHorta(res, 404, 'Usuário não encontrado');
    }
  } catch (error) {
    console.error('Ocorreu um erro durante a atualização do usuário:', error);
    mensageHorta(res, 500, 'Ocorreu um erro durante a atualização do usuário');
  }
});

// DELETE - Remover um usuário específico
userRoutes.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const sql = 'DELETE FROM users WHERE id = ?';
    const [result] = await pool.promise().query(sql, [id]);

    if (result.affectedRows > 0) {
      mensageHorta(res, 200, 'Usuário removido com sucesso');
    } else {
      mensageHorta(res, 404, 'Usuário não encontrado');
    }
  } catch (error) {
    console.error('Ocorreu um erro durante a remoção do usuário:', error);
    mensageHorta(res, 500, 'Ocorreu um erro durante a remoção do usuário');
  }
});

// Função para enviar uma resposta padronizada ao usuário
function mensageHorta(res, status, message, success = true) {
    const response = {
      success,
      message
    };
}

export default userRoutes;
