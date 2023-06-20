import pool from "../pool.js";
import bcrypt from "bcryptjs";

async function validateUserCredentials(caminho, email, password) {
  try {
    const sql = "SELECT * FROM user WHERE email=?";
    const [results] = await pool.promise().query(sql, [email]);

    if (results.length > 0 && await bcrypt.compare(password, results[0].password)) {
      console.log("Credenciais válidas");
      return true;
    } else {
      console.log("Credenciais inválidas");
      return false;
    }
  } catch (error) {
    console.error("Erro na validação das Credenciais:", error);
    return false;
  }
}
export default validateUserCredentials;
