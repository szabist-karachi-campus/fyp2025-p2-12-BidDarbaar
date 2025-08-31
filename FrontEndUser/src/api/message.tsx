import Client from '../../client/index';

export async function startThreadOrSendMessage(values: startMessageRequest) {
  const data = await Client.post('/send-message', values, {
    headers: {
      Authorization: `Bearer ${values.token}`,
      'Content-Type': 'application/json',
    },
  });
  return data.data;
}

export async function getUserAdminThread(userId: string, superAdminId: string) {
  const response = await Client.get('/get-messages', {
    headers: {
      userid: userId,
      superadminid: superAdminId,
    },
  });
  return response.data;
}

export async function getChats(token: string) {
  const response = await Client.get('/threads', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function getChat(values: getChatRequest) {
  const response = await Client.get(
    `thread/${values.itemId}?with=${values.context}`,
    {
      headers: {
        Authorization: `Bearer ${values.token}`,
      },
    },
  );
  return response.data;
}
