import express from 'express';
import pool from '../pool.js';
import authenticateToken from '../authenticateToken.js';
import {geocodeAddress, getUserAndHortasDistance} from './maps.js';

const hortaRoutes = express.Router();

// Middleware para verificar o token JWT em todas as rotas
hortaRoutes.use(authenticateToken);

// GET - Obter lista de todos as hortas
hortaRoutes.get('/hortas', async (req, res) => {
  try {
    const sql = 'SELECT id, category, address FROM horta';
    const [results] = await pool.promise().query(sql);

    if (results.length > 0) {
      const usersAndHortasDistance = await getUserAndHortasDistance(req.userAddress);
      const hortasWithDistance = usersAndHortasDistance.map(({ id, category, address, distance }) => ({
        id,
        category,
        address,
        distance
      }));
      res.status(200).json(hortasWithDistance);
    } else {
      mensageHorta(res, 404, null, 'Não há hortas cadastradas');
    }
  } catch (error) {
    console.error('Ocorreu um erro durante a consulta das hortas:', error);
    mensageHorta(res, 500, error, 'Ocorreu um erro durante a consulta das hortas');
  }
});


// GET - Obter lista de todas as hortas e seus produtos cadastrados
hortaRoutes.get('/hortas/products', async (req, res) => {
  try {
    const sql = `
      SELECT h.id, h.category, h.address, p.category AS product_category, p.name AS product_name,
             p.quantity AS product_quantity, p.unity AS product_unity, p.description AS product_description,
             p.validateDate AS product_validateDate, p.price AS product_price
      FROM horta h LEFT JOIN product p ON h.id = p.id_horta
    `;

    const [results] = await pool.promise().query(sql);

    if (results.length > 0) {
      const hortas = [];
      let currentHortaId = null;
      let currentHortaIndex = -1;

      for (const row of results) {
        if (row.id !== currentHortaId) {
          // Nova horta encontrada
          currentHortaId = row.id;
          currentHortaIndex++;
          hortas[currentHortaIndex] = {
            id: row.id,
            category: row.category,
            address: row.address,
            products: []
          };
        }

        if (row.product_name) {
          // Produto encontrado
          hortas[currentHortaIndex].products.push({
            category: row.product_category,
            name: row.product_name,
            quantity : row.product_quantity,
            unity: row.product_unity,
            description: row.product_description,
            validateDate: row.product_validateDate,
            price: row.product_price
          });
        }
      }

      res.status(200).json(hortas);

    } else {
      res.status(404).json({ message: 'Não há hortas cadastradas' });
    }
  } catch (error) {
    console.error('Ocorreu um erro durante a consulta das hortas:', error);
    res.status(500).json({ message: 'Ocorreu um erro durante a consulta das hortas' });
  }
});

// GET - Obter informações de uma horta específica
hortaRoutes.get('/hortas/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const sql = 'SELECT id, category, address FROM horta WHERE id = ?';
    const [results] = await pool.promise().query(sql, [id]);

    if (results.length > 0) {
      const horta = results[0];
      const userAddress = req.userAddress;
      const distance = await getUserAndHortasDistance(userAddress, horta.address);

      const hortaWithDistance = {
        id: horta.id,
        category: horta.category,
        address: horta.address,
        distance
      };
      res.status(200).json(hortaWithDistance);
    } else {
      mensageHorta(res, 404, 'Horta não encontrada');
    }
  } catch (error) {
    console.error('Ocorreu um erro durante a consulta da horta:', error);
    mensageHorta(res, 500, 'Ocorreu um erro durante a consulta da horta');
  }
});

// POST - Criar horta
hortaRoutes.post('/horta', async (req, res) => {

  const { address, category } = req.body;
  // Obter o ID do usuário pelo token de autenticação
  const id_user = req.user.id;
  
  try {
    // Verificar se o usuário já possui uma horta
    const checkHortaSql = 'SELECT * FROM horta WHERE id_user = ?';
    const [results] = await pool.promise().query(checkHortaSql, [id_user]);

    if (results.length > 0) {
      // Usuário já possui uma horta cadastrada
      return res.status(400).json({ message: 'Usuário já possui uma horta cadastrada' });
    }

    //Obtendo informações de latitude e longitude/
    const { latitude, longitude } = await geocodeAddress(address);

    // Inserir nova horta
    const createHortaSql = 'INSERT INTO horta (address, latitude, longitude, category, id_user) VALUES (?, ?, ?, ?, ?)';
    await pool.promise().query(createHortaSql, [
      address,
      latitude,
      longitude,
      category,
      id_user,
    ]);

    // Horta criada com sucesso
    res.status(200).json({ message: 'Horta criada com sucesso.' });

  } catch (error) {
    console.error('Ocorreu um erro ao criar a horta:', error);
    res.status(500).json({ message: 'Ocorreu um erro ao criar a horta.' });
  }
});

// PUT - Atualizar informações da horta do usuário específico
hortaRoutes.put('/horta/:id', async (req, res) => {
  const { address, category } = req.body;
  const id_user = req.user.id;

  try {
    // Atualize as informações da horta associada ao id_user
    const sql = 'UPDATE horta SET address = ?, category = ? WHERE id_user = ?';
    const [result] = await pool.promise().query(sql, [address, category, id_user]);

    if (result.affectedRows > 0) {
      mensageHorta(res, 200, 'Horta atualizada com sucesso');
    } else {
      mensageHorta(res, 404, 'Horta não encontrada');
    }
  } catch (error) {
    console.error('Ocorreu um erro durante a atualização da horta:', error);
    mensageHorta(res, 500, 'Ocorreu um erro durante a atualização da horta');
  }
});

// PUT - Atualizar informações de uma horta específica
hortaRoutes.put('/hortas/:id', async (req, res) => {
  const { id } = req.params;
  const { address, category } = req.body;

  try {
    const sql = 'UPDATE horta SET address = ?, category = ? WHERE id = ?';
    const [result] = await pool.promise().query(sql, [address, category, id]);

    if (result.affectedRows > 0) {
      mensageHorta(res, 200, 'Horta atualizada com sucesso');
    } else {
      mensageHorta(res, 404, 'Horta não encontrada');
    }
  } catch (error) {
    console.error('Ocorreu um erro durante a atualização da horta:', error);
    mensageHorta(res, 500, 'Ocorreu um erro durante a atualização da horta');
  }
});

// DELETE - Deletar horta própria
hortaRoutes.delete('/hortas', async (req, res) => {
  const id_user = req.user.id;

  try {
    const sql = 'DELETE FROM horta WHERE id_user = ?';
    const [result] = await pool.promise().query(sql, [id_user]);

    if (result.affectedRows > 0) {
      mensageHorta(res, 200, 'Horta removida com sucesso');
    } else {
      mensageHorta(res, 404, 'Horta não encontrada');
    }
  } catch (error) {
    console.error('Ocorreu um erro durante a remoção da horta:', error);
    mensageHorta(res, 500, 'Ocorreu um erro durante a remoção da horta');
  }
});

// DELETE - Deletar horta específica
hortaRoutes.delete('/hortas/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const sql = 'DELETE FROM horta WHERE id= ?';
    const [result] = await pool.promise().query(sql, [id]);

    if (result.affectedRows > 0) {
      mensageHorta(res, 200, 'Horta removida com sucesso');
    } else {
      mensageHorta(res, 404, 'Horta não encontrada');
    }
  } catch (error) {
    console.error('Ocorreu um erro durante a remoção da horta:', error);
    mensageHorta(res, 500, 'Ocorreu um erro durante a remoção da horta');
  }
});


function mensageHorta(res, statusCode, error, mensagem) {
  if (error) {
    console.log(error);
    res.status(statusCode).json({ msg: mensagem });
  } else {
    res.status(statusCode).json({ msg: mensagem });
  }
}

export default hortaRoutes;
