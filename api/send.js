import { Client, LocalAuth } from 'whatsapp-web.js';

let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth(),
});

// Evento de autenticação concluída
client.on('ready', () => {
  console.log('Cliente WhatsApp está pronto.');
  isReady = true; // Atualiza o estado do cliente
});

// Inicializa o cliente
client.initialize();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { numbers, message } = req.body;

  if (!isReady) {
    return res.status(400).json({ error: 'WhatsApp não está conectado.' });
  }

  if (!numbers || !message) {
    return res.status(400).json({ error: 'Números e mensagem são obrigatórios.' });
  }

  try {
    const phoneNumbers = numbers.split(',').map((num) => num.trim()); // Divide os números por vírgula
    const invalidNumbers = [];

    for (const number of phoneNumbers) {
      try {
        const formattedNumber = `${number}@c.us`; // Formato esperado pelo WhatsApp
        await client.sendMessage(formattedNumber, message);
        console.log(`Mensagem enviada para ${number}`);
      } catch (err) {
        console.error(`Erro ao enviar mensagem para ${number}:`, err);
        invalidNumbers.push(number);
      }
    }

    if (invalidNumbers.length) {
      return res.status(207).json({
        message: 'Algumas mensagens não foram enviadas.',
        invalidNumbers,
      });
    }

    res.status(200).json({ message: 'Mensagens enviadas com sucesso!' });
  } catch (error) {
    console.error('Erro ao enviar mensagens:', error);
    res.status(500).json({ error: 'Erro interno ao enviar mensagens.' });
  }
}
