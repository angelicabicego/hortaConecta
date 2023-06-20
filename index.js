import express from "express";

//Módulos do programa
import loginRoutes from "./routes/login.js";
import userRoutes from "./routes/user.js";
import hortaRoutes from "./routes/horta.js";
import productRoutes from "./routes/product.js";

const app = express();
app.use(express.json());
app.use(loginRoutes);
app.use(userRoutes);
app.use(hortaRoutes);
app.use(productRoutes);

const port = 3002;
app.listen(port, () => {
    console.log("Servidor ativo na porta", port)
})