## Node.js WebSocket Server for Bot Integrations

This server built with **Express** and **WebSocket** allows interaction with **Botpress** by fetching and managing bot integrations, conversations, and file uploads. It handles real-time messaging via WebSocket and offers several endpoints for managing bots and files.

### Features:
- **Real-time communication**: WebSocket is used to send and receive bot conversations and group them by integration.
- **Bot integration management**: Retrieve bot integrations, and group messages by conversations and integrations from the Botpress API.
- **File upload/download**: Supports file uploads using Multer and manages files related to bots via custom endpoints.
- **Streaming data**: Provides real-time streaming of files, allowing updates every 10 seconds.

### Key Endpoints:
- `GET /`: Returns a welcome message.
- `GET /bots`: Fetches a list of bots from Botpress.
- `DELETE /file/:fileId`: Deletes a specific file by its ID.
- `POST /upload-file`: Uploads a file to the Botpress server.
- `POST /files`: Streams bot files, updating every 10 seconds.

### WebSocket Interaction:
The WebSocket server listens for messages from the client and:
1. Retrieves bot integrations via `getBotIntegrations`.
2. Groups messages by integration using `groupMessagesByIntegration`.
3. Sends back the grouped conversations to the client.

### fetchLogic.js Functions:
- **getListBots**: Fetches the list of bots from the Botpress API.
- **deleteFile**: Deletes a specific file using its file ID.
- **uploadFile**: Uploads a file to the Botpress platform, ensuring size limitations are respected.
- **fetchFiles**: Retrieves and streams files related to a bot.

This setup is ideal for managing bot conversations and files with Botpress, providing both real-time interaction and static file management.

