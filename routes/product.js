import express from 'express';
import pool from '../pool.js';
import authenticateToken from '../authenticateToken.js';
import {getUserAndHortasDistance} from './maps.js';

const productRoutes = express.Router();

// Middleware para verificar o token JWT em todas as rotas
productRoutes.use(authenticateToken);

// GET - Obter todos os produtos
productRoutes.get('/products', async (req, res) => {
    try {
      const sql = 'SELECT * FROM product';
      const [results] = await pool.promise().query(sql);
  
      res.status(200).json(results);
    } catch (error) {
      console.error('Ocorreu um erro ao obter os produtos:', error);
      res.status(500).json({ message: 'Ocorreu um erro ao obter os produtos.' });
    }
});

// GET - Obter lista de todos os produtos e informações da horta
productRoutes.get('/products/hortas', async (req, res) => {
  try {
    const sql = `
      SELECT p.id, p.category, p.name, p.quantity, p.unity, p.description, p.validateDate,
             h.id AS horta_id, h.address, u.name AS user_name
      FROM product p
      JOIN horta h ON p.id_horta = h.id
      JOIN user u ON h.id_user = u.id
    `;
    const [results] = await pool.promise().query(sql);

    const productsWithHortaInfo = [];
    for (const row of results) {
      const { id, category, name, quantity, unity, description, validateDate, horta_id, address, user_name } = row;
      const distance = await calculatedDistance(req.userAddress, address);
      productsWithHortaInfo.push({
        id,
        category,
        name,
        quantity,
        unity,
        description,
        validateDate,
        horta: {
          id: horta_id,
          address,
          user_name,
          distance,
        },
      });
    }

    res.status(200).json(productsWithHortaInfo);
  } catch (error) {
    console.error('Ocorreu um erro ao obter os produtos:', error);
    res.status(500).json({ message: 'Ocorreu um erro ao obter os produtos.' });
  }
});
  // POST - Criar um novo produto
productRoutes.post('/products', async (req, res) => {
  const { category, name, quantity, unity, description, validateDate, price } = req.body;
  const id_user = req.user.id;

  try {
    // Verificar se o usuário possui uma horta cadastrada
    const checkHortaSql = 'SELECT id FROM horta WHERE id_user = ?';
    const [result] = await pool.promise().query(checkHortaSql, [id_user]);

    if (result.length === 0) {
      return res.status(400).json({ message: 'Usuário não possui uma horta cadastrada' });
    }

    const id_horta = result[0].id;

    const sql = 'INSERT INTO product (category, name, quantity, unity, description, validateDate, price, id_horta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [insertResult] = await pool.promise().query(sql, [category, name, quantity, unity, description, validateDate, price, id_horta]);

    res.status(200).json({ message: 'Produto criado com sucesso.' });
  } catch (error) {
    console.error('Ocorreu um erro ao criar o produto:', error);
    res.status(500).json({ message: 'Ocorreu um erro ao criar o produto.' });
  }
});

  
  
// PUT - Atualizar informações de um produto específico
productRoutes.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { category, name, quantity, unity, description, validateDate, active, price } = req.body;
    const id_user = req.user.id;
  
    try {
      // Verificar se o usuário possui a horta que contém o produto
      const checkProductSql = 'SELECT p.id FROM product p INNER JOIN horta h ON p.id_horta = h.id WHERE p.id = ? AND h.id_user = ?';
      const [result] = await pool.promise().query(checkProductSql, [id, id_user]);
  
      if (result.length === 0) {
        return res.status(404).json({ message: 'Produto não encontrado ou não pertence à horta do usuário.' });
      }
  
      const sql = 'UPDATE product SET category = ?, name = ?, quantity = ?, unity = ?, description = ?, validateDate = ?, active = ?, price = ? WHERE id = ?';
      const [updateResult] = await pool.promise().query(sql, [category, name, quantity, unity, description, validateDate, active, price, id]);
  
      if (updateResult.affectedRows > 0) {
        res.status(200).json({ message: 'Produto atualizado com sucesso.' });
      } else {
        res.status(404).json({ message: 'Produto não encontrado.' });
      }
    } catch (error) {
      console.error('Ocorreu um erro durante a atualização do produto:', error);
      res.status(500).json({ message: 'Ocorreu um erro durante a atualização do produto.' });
    }
  });
  
  
// DELETE - Excluir um produto específico
productRoutes.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const sql = 'DELETE FROM product WHERE id = ?';
      const [result] = await pool.promise().query(sql, [id]);
  
      if (result.affectedRows > 0) {
        res.status(200).json({ message: 'Produto excluído com sucesso.' });
      } else {
        res.status(404).json({ message: 'Produto não encontrado.' });
      }
    } catch (error) {
      console.error('Ocorreu um erro durante a exclusão do produto:', error);
      res.status(500).json({ message: 'Ocorreu um erro durante a exclusão do produto.' });
    }
});
  
export default productRoutes;
  