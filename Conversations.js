const axios = require("axios"); // Usando axios para realizar solicitudes HTTP

class Conversations {
  // Actualiza el objeto botdata con un nuevo ID de integración
  updateBotData(botdata, newIntegrationId) {
    console.log("Received botdata:", botdata);

    // Verifica si botdata es una cadena JSON y conviértela a objeto
    if (typeof botdata === "string") {
      try {
        botdata = JSON.parse(botdata);
      } catch (error) {
        console.error("Error parsing botdata:", error);
        throw error;
      }
    }

    console.log("Updating botdata with newIntegrationId:", newIntegrationId);

    // Asegúrate de que botdata sea un objeto
    if (typeof botdata === "object" && botdata !== null) {
      botdata["integration_id"] = newIntegrationId;
      console.log("Updated botdata:", botdata);
    } else {
      console.error("botdata is not an object:", botdata);
    }

    return botdata;
  }

  // Obtiene las integraciones del bot desde el API
  async getBotIntegrations(botdata) {
    console.log("Received botdata:", botdata);

    try {
      // Asegúrate de que botdata es un objeto
      let parsed;
      if (typeof botdata === "string") {
        console.log("Parsing botdata as JSON string.");
        parsed = JSON.parse(botdata);
      } else {
        parsed = botdata;
      }
      console.log("Parsed botdata:", parsed);

      // Verifica que las propiedades existen
      if (!parsed.bearer || !parsed.botid || !parsed.workspace_id) {
        console.error("Parsed object is missing required properties.");
      }

      const bearer = parsed.bearer;
      const botid = parsed.botid;
      const workspace_id = parsed.workspace_id;

      console.log("Parsed bearer:", bearer);
      console.log("Parsed botid:", botid);
      console.log("Parsed workspace_id:", workspace_id);

      const url = `https://api.botpress.cloud/v1/admin/bots/${botid}`;
      console.log("URL for bot integrations:", url);

      const headers = {
        Accept: "application/json",
        Authorization: bearer,
        "X-bot-id": botid,
        "X-workspace-id": workspace_id,
      };
      console.log("Headers for bot integrations request:", headers);

      try {
        const response = await axios.get(url, { headers });
        console.log("Response data for bot integrations:", response.data);
        return response.data.bot.integrations;
      } catch (error) {
        console.error("Error in getBotIntegrations:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error parsing botdata:", error);
      throw error;
    }
  }

  // Obtiene la integración del Webchat
  async getWebchatIntegration(authData) {
    const url = `https://api.botpress.cloud/v1/admin/hub/integrations/${authData.integration_id}`;
    console.log("URL for webchat integration:", url);

    const headers = {
      Accept: "application/json",
      Authorization: authData.bearer,
      "X-bot-id": authData.botid,
      "X-workspace-id": authData.workspace_id,
    };
    console.log("Headers for webchat integration request:", headers);

    try {
      const response = await axios.get(url, { headers });
      console.log("Response data for webchat integration:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in getWebchatIntegration:", error);
      throw error;
    }
  }

  // Lista las conversaciones del Webchat
  async listConversationsWebchat(authData) {
    const url = "https://api.botpress.cloud/v1/chat/conversations";
    console.log("URL for list conversations:", url);

    const headers = {
      Authorization: authData.bearer,
      Accept: "application/json",
      "X-integration-id": authData.integration_id,
      "X-bot-id": authData.botid,
    };
    console.log("Headers for list conversations request:", headers);

    try {
      const response = await axios.get(url, { headers });
      console.log("Response data for list conversations:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in listConversationsWebchat:", error);
      throw error;
    }
  }

  // Obtiene una conversación específica por ID
  async getConversation(conversationId, authData) {
    const url = `https://api.botpress.cloud/v1/chat/messages?conversationId=${conversationId}`;
    console.log("URL for get conversation:", url);

    const headers = {
      Authorization: authData.bearer,
      Accept: "application/json",
      "X-integration-id": authData.integration_id,
      "X-bot-id": authData.botid,
    };
    console.log("Headers for get conversation request:", headers);

    try {
      const response = await axios.get(url, { headers });
      console.log("Response data for get conversation:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in getConversation:", error);
      throw error;
    }
  }

  // Obtiene los mensajes de todas las conversaciones
  async getConversationMessages(authData) {
    try {
      console.log("Fetching list of conversations...");
      const conversations = await this.listConversationsWebchat(authData);
      console.log("Conversations data:", conversations);

      const conversationMap = {};
      const conversationsList = [];

      for (const conv of conversations.conversations) {
        console.log("Fetching messages for conversation ID:", conv.id);
        const conversation = await this.getConversation(conv.id, authData);
        console.log(
          "Messages for conversation ID:",
          conv.id,
          ":",
          conversation.messages
        );
        conversationMap[conv.id] = conversation.messages;
        conversationsList.push(conversationMap);
      }
      console.log("All conversations messages:", conversationsList);
      return conversationsList;
    } catch (error) {
      console.error("Error in getConversationMessages:", error);
      throw error;
    }
  }

  // Agrupa los mensajes por integración
  async groupMessagesByIntegration(botdata, integrations) {
    console.log("Grouping messages by integration...");
    const allMessages = [];

    for (const i in integrations) {
      console.log("Processing integration ID:", i);
      const integrationData = {
        name: integrations[i].name,
        id: i,
      };
      console.log("Integration data:" + integrationData.toString());

      const botd = this.updateBotData(botdata, i);
      console.log("Updated botdata for integration ID:", i, ":", botd);
      const conversationsMessages = await this.getConversationMessages(botd);
      console.log(
        "Messages for integration ID:",
        i,
        ":",
        conversationsMessages
      );
      integrationData.messages = conversationsMessages;
      allMessages.push(integrationData);
    }
    console.log("All messages grouped by integration:", allMessages);
    return allMessages;
  }

  // Agrupa los mensajes por conversación
  groupMessagesByConversation(dataGroupedByIntegration) {
    console.log("Grouping messages by conversation...");
    const sortedList = [];

    for (const integration of dataGroupedByIntegration) {
      const integrationName = integration.name;
      const integrationId = integration.id;
      console.log(
        "Processing integration:",
        integrationName,
        "with ID:",
        integrationId
      );

      for (const messageDict of integration.messages) {
        for (const conversationId in messageDict) {
          console.log(
            "Adding conversation ID:",
            conversationId,
            "to sorted list."
          );
          sortedList.push({
            conversation: conversationId,
            integration_name: integrationName,
            integration_id: integrationId,
            messages: messageDict[conversationId],
          });
        }
      }
    }
    console.log("Sorted list of messages by conversation:", sortedList);
    return sortedList;
  }
}

module.exports = Conversations;
