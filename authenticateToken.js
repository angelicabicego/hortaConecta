import jwt from 'jsonwebtoken';
import config from './config.js';
import { getAccessToken } from './routes/login.js';


function authenticateToken(req, res, next) {
  // Token no Header da interface: authorization [token]
  const token = req.headers.authorization;
  
  if (token) {
    const receivedToken = token.replace('Bearer ', '');
    
    //Token recebido de login.js
    const accessToken = getAccessToken();

    if (token === accessToken) {
      
      try {
        // Verificar e decodifica o token
        const decoded = jwt.verify(token, config.secret);
        req.user = decoded;
        next();
        
      } catch (error) {
        console.error('Erro na verificação do token:', error);
        return res.status(401).json({ message: 'Token inválido' });
      }

    } else {
      console.log('Tokens diferentes');
      return res.status(401).json({ message: 'Token inválido' });
    }

  } else {
    console.log('Token não fornecido');
    return res.status(401).json({ message: 'Token não fornecido' });
  }
}

export default authenticateToken;
