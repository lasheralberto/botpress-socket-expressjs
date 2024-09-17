const Conversations = require("/Conversations");
const conversations = new Conversations();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("We are live and connected");
    console.log("Socket ID:", socket.id);

    socket.on("message", async (data) => {
      console.log("Message received from client");
      try {
        const botdata = JSON.parse(data);

        // Obtener integraciones
        const integrations = await conversations.getBotIntegrations(botdata);

        // Agrupar datos por integración
        const groupedDataIntegration = await conversations.groupMessagesByIntegration(botdata, integrations);

        // Agrupar por conversación e integración
        const dataGrouped = conversations.groupMessagesByConversation(groupedDataIntegration);

        // Emitir los datos agrupados al cliente
        socket.emit("conversation_data", {
          event: "conversation_data",
          data: dataGrouped,
        });
      } catch (error) {
        console.error("Error processing message:", error.message);
        // Emitir mensaje de error en caso de excepción
        socket.emit("error", { event: "error", message: error.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client ${socket.id} disconnected`);
    });
  });
};
