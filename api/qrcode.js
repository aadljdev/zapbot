import QRCode from 'qrcode';
import { Client, LocalAuth } from 'whatsapp-web.js';

let qrCode = null;
let isReady = false;

// Usando a variável de ambiente para o caminho da sessão
const sessionPath = process.env.WHATSAPP_SESSION_PATH || './whatsapp_sessions';

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "whatsapp",  // você pode personalizar esse clientId
    dataPath: sessionPath   // Define o caminho para as sessões
  }),
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

// Inicializa o cliente
client.initialize();

export default async function handler(req, res) {
  if (qrCode) {
    try {
      const qrCodeUrl = await QRCode.toDataURL(qrCode); // Converte o QR Code em Base64
      res.status(200).json({ qrCodeUrl });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      res.status(500).json({ error: 'Erro ao processar QR Code.' });
    }
  } else if (isReady) {
    res.status(200).json({ message: 'Cliente já está conectado.' });
  } else {
    res.status(400).json({ error: 'QR Code não disponível no momento.' });
  }
}
