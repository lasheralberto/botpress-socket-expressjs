// fetchLogic.js
const axios = require('axios'); // Importar Axios para las solicitudes HTTP
const Constants = require('./constants'); // Reemplaza con la ubicación de tu archivo de constantes

// Función para obtener lista de bots
async function getListBots() {
  try {
    const botApiUrl = Constants.botUrl;
    console.log("Constants in getListBots()" + Constants.wkid);
    const headers = {
      'accept': 'application/json',
      //'x-bot-id': Constants.botIdHeader,
      'x-workspace-id': Constants.wkid,
      'authorization': Constants.authBearer
    };

    const response = await axios.get(botApiUrl, { headers });

    if (response.status === 200) {
      const bots = response.data.bots.map(bot => ({
        name: bot.name,
        id: bot.id,
      }));

      // Optionally add an empty entry
      bots.push({ name: '', id: '' });

      return bots;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching bots:', error.message);
    return [];
  }
}

// Función para eliminar archivo
async function deleteFile(fileId) {
  try {
    const fileUrl = `${Constants.baseUrlFiles}/${fileId}`;

    const headers = {
      'accept': 'application/json',
      'x-bot-id': Constants.botIdHeader,
      'x-workspace-id': Constants.workspaceIdHeader,
      'authorization': Constants.authorizationHeader
    };

    const response = await axios.delete(fileUrl, { headers });

    return response.status === 200;
  } catch (error) {
    console.error('Error eliminando archivo:', error.message);
    return false;
  }
}

// Función para subir archivo
async function uploadFile(file) {
  try {
    const fileSize = file.size;
    const fileSizeMax = 13000000; // 13 MB

    if (fileSize > fileSizeMax) {
      throw new Error(`Tamaño máximo de archivo son ${fileSizeMax / 1000000} MB`);
    }

    const dateTimeId = `f${new Date().toISOString().replace(/[-:.TZ]/g, '')}`;

    const payload = {
      key: file.originalname,
      size: fileSize,
      index: true,
      accessPolicies: ['public_content'],
      tags: {
        datetime: dateTimeId,
        source: 'knowledge-base',
        kbId: Constants.kbId
      },
    };

    const headers = {
      'accept': 'application/json',
      'x-bot-id': Constants.botIdHeader,
      'x-workspace-id': Constants.workspaceIdHeader,
      'content-type': 'application/json',
      'authorization': Constants.authorizationHeader
    };

    const response1 = await axios.put(Constants.baseUrlFiles, payload, { headers });

    if (response1.status === 200) {
      const uploadUrl = response1.data.file.uploadUrl;

      // Subir el archivo
      const response2 = await axios.put(uploadUrl, file.buffer, {
        headers: {
          'Content-Length': file.buffer.length,
        }
      });

      if (response2.status === 200) {
        return { success: true, message: 'El archivo se subió correctamente.' };
      } else {
        throw new Error(`Error al subir el archivo: ${response2.status}`);
      }
    } else {
      throw new Error(`Error al obtener la URL de carga: ${response1.status}`);
    }
  } catch (error) {
    console.error('Error al subir el archivo:', error.message);
    throw new Error(`Error al realizar la solicitud: ${error.message}`);
  }
}

// Función para obtener archivos en streaming
async function fetchFiles(botid) {
  try {
    
    const headers = {
      'accept': 'application/json',
      'authorization': Constants.authBearer,
      'x-bot-id': botid,
      'x-workspace-id': Constants.wkid,
    };
 

    const response = await axios.get(Constants.baseUrlFiles, { headers });

    if (response.status === 200) {
      return response.data.files;
    } else {
      throw new Error(`Request failed with status: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
}

module.exports = {
  getListBots,
  deleteFile,
  uploadFile,
  fetchFiles,
};
