// server.js
const express = require("express");
const { createServer } = require("http");
const WebSocket = require("ws"); // Importar la librería ws
const cors = require("cors");
const Conversations = require("./Conversations"); // Importar la clase Conversations
const multer = require('multer'); // Importar multer para manejar la subida de archivos

// Importar funciones de fetch desde fetchLogic.js
const { getListBots, deleteFile, uploadFile, fetchFiles } = require('./fetchbotpress');

const app = express(); 
const hostname = "0.0.0.0";
const port = 5000;

// Configuración de middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración para subir archivos
const upload = multer();

// Endpoint de ejemplo
app.get("/", (req, res) => {
  res.status(200).send({
    success: true,
    message: "welcome to the beginning of greatness",
  });
});

// Endpoint para obtener lista de bots
app.get('/bots', async (req, res) => {
  const bots = await getListBots();
  res.json(bots);
  console.log(bots);
});

// Endpoint para eliminar archivo
app.delete('/file/:fileId', async (req, res) => {
  const { fileId } = req.params;
  const success = await deleteFile(fileId);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, message: 'No se pudo borrar el archivo.' });
  }
});

// Endpoint para subir archivo
app.post('/upload-file', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const result = await uploadFile(file);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint para obtener archivos en streaming utilizando POST
// Endpoint para obtener archivos en streaming utilizando POST
app.post('/files', async (req, res) => {
  const { botId } = req.body;

  if (!botId) {
    res.status(400).send({ error: 'botId is required' });
    return;
  }

  console.log("Recibida solicitud con botId:", botId);

  try {
    // Llamar inmediatamente a fetchFiles() para obtener los archivos
    const initialFiles = await fetchFiles(botId); 
    console.log("Archivos iniciales:", initialFiles);
    res.write(`data: ${JSON.stringify(initialFiles)}\n\n`);

    // Intervalo para seguir obteniendo los archivos
    const intervalId = setInterval(async () => {
      console.log("Ejecutando fetchFiles() para botId:", botId);
      const updatedFiles = await fetchFiles(botId); 
      console.log("Archivos actualizados:", updatedFiles);
      res.write(`data: ${JSON.stringify(updatedFiles)}\n\n`);
    }, 10000);

    req.on('close', () => {
      clearInterval(intervalId);
      res.end();
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});



const httpServer = createServer(app);

// Crear un servidor WebSocket usando la librería ws
const wss = new WebSocket.Server({ server: httpServer });

const conversations = new Conversations();

wss.on("connection", (ws) => {
  console.log("We are live and connected");

  ws.on("message", async (data) => {
    console.log("Message received from client");
    console.log("Data message received:" + data );
    try {
      const botdata = JSON.parse(data);
      console.log("Entering getBotIntegrations() - server.js")
      const integrations = await conversations.getBotIntegrations(botdata);
      console.log("Entering groupMessagesByIntegration() - server.js")
      const groupedDataIntegration = await conversations.groupMessagesByIntegration(botdata, integrations);
      console.log("Entering groupMessagesByConversation() - server.js")
      const dataGrouped = conversations.groupMessagesByConversation(groupedDataIntegration);

      // Enviar los datos agrupados al cliente
      ws.send(JSON.stringify({
        event: "conversation_data",
        data: dataGrouped,
      }));
    } catch (error) {
      console.error("Error processing message:", error.message);
      ws.send(JSON.stringify({ event: "error", message: error.message })); // Enviar mensaje de error al cliente
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

httpServer.listen(port, hostname, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
