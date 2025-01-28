const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const cors = require('cors');


const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

let qrCode = null;
let isReady = false;

// Instância do cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
});

// Evento para gerar QR Code
client.on('qr', (qr) => {
  console.log('QR Code recebido. Escaneie para fazer login.');
  qrCode = qr; // Atualiza a variável com o QR Code recebido
});

// Evento de autenticação concluída
client.on('ready', () => {
  console.log('Cliente WhatsApp está pronto.');
  isReady = true; // Atualiza o estado do cliente
  qrCode = null; // Reseta o QR Code após login
});

// Evento de erro
client.on('auth_failure', (msg) => {
  console.error('Falha na autenticação:', msg);
});

// Inicializa o cliente
client.initialize();

// Rota para obter o QR Code
app.get('/api/qrcode', async (req, res) => {
  if (qrCode) {
    try {
      const qrCodeUrl = await QRCode.toDataURL(qrCode); // Converte o QR Code em Base64
      res.json({ qrCodeUrl });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      res.status(500).json({ error: 'Erro ao processar QR Code.' });
    }
  } else if (isReady) {
    res.status(200).json({ message: 'Cliente já está conectado.' });
  } else {
    res.status(400).json({ error: 'QR Code não disponível no momento.' });
  }
});

// Rota para enviar mensagens
app.post('/api/send', async (req, res) => {
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
});

// Inicializa o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
