
import axios from 'axios';
import config from '../config.js';
import pool from '../pool.js';

export async function geocodeAddress(address) {
  const apiKey = config.googleMapsApiKey;
  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === 'OK') {
      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    } else if (data.status === 'ZERO_RESULTS') {
      throw new Error('Endereço não encontrado');
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Limite de consulta excedido');
    } else if (data.status === 'REQUEST_DENIED') {
      throw new Error('Acesso negado à chave de API do Google Maps');
    } else if (data.status === 'INVALID_REQUEST') {
      throw new Error('Solicitação inválida');
    } else {
      throw new Error('Erro desconhecido');
    }
  } catch (error) {
    throw new Error(`Erro ao geocodificar o endereço: ${error.message}`);
  }
};

export async function getUserAndHortasDistance(userAddress) {
  try {
    const hortas = await getAllHortas();

    const hortasWithDistance = [];
    for (const horta of hortas) {
      const hortaAddress = horta.address;
      const userId = horta.id_user;
      const userAddressFromDB = await getUserAddress(userId);
      const distance = await calculatedDistance(userAddressFromDB, hortaAddress);
      hortasWithDistance.push({ ...horta, distance });
    }

    return hortasWithDistance;
  } catch (error) {
    console.error('Ocorreu um erro ao obter as hortas com distância:', error);
    throw error;
  }
};


const getAllHortas = async () => {
  try {
    const sql = 'SELECT * FROM horta';
    const [hortas] = await pool.promise().query(sql);
    return hortas;
  } catch (error) {
    console.error('Ocorreu um erro ao obter as hortas:', error);
    throw error;
  }
};

const getUserAddress = async (userId) => {
  try {
    const sql = 'SELECT address FROM user WHERE id = ?';
    const [results] = await pool.promise().query(sql, [userId]);

    const userAddress = results[0].address;
    return userAddress;
  } catch (error) {
    console.error('Ocorreu um erro ao obter o endereço do usuário:', error);
    throw error;
  }
};


async function calculatedDistance(originAddress, destinationAddress) {
  const url = 'https://maps.googleapis.com/maps/api/directions/json';
  const params = {
    origin: originAddress,
    destination: destinationAddress,
    key: config.googleMapsApiKey,
  };

  try {
    const response = await axios.get(url, { params });
    const distance = response.data.routes[0].legs[0].distance.text;
    return distance;
  } catch (error) {
    console.error('Erro na obtenção da distância:', error);
    throw error;
  }
}