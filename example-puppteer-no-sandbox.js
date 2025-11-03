const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    puppeteer: {
        authStrategy: new LocalAuth(),
        headless: false, // 👈 para debug visual
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('🔍 Escaneie o QR Code acima com o WhatsApp (válido por 30s)');
});

client.on('ready', () => {
    console.log('✅ Client is ready!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
});

client.on('disconnected', (reason) => {
    console.log('🔌 Desconectado:', reason);
});

client.on('message', async (message) => {
    const msg = message.body.toLowerCase().trim();
    console.log("📩 Mensagem recebida:", msg);

    if (msg.includes("teste")) {
        if (msg.startsWith('teste ')) {
            const parametro = msg.slice(6).trim();
            await message.reply(`Exemplo de resposta para ${parametro}`);
        } else {
            await message.reply("Mensagem padrão");
        }
    } else {
        await message.reply("Mensagem padrão");
    }
});

client.initialize();