const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const db = require('./app/controllers/DatabaseConnections')


const sessions = new Map();


function getMessages(apelido) {

    let query = "SELECT * FROM mensagens WHERE apelido = ?";
    db.query(query, [apelido], (err, results) => {

        if (err) {
            console.error("Erro em getMessages:", err);
        }

        if (results.length > 0) {

            console.log(results);

        }
    });
}


getMessages("mensagem-padrao");


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
    const mensagemPadrao = "Olá, eu sou o bot de atendimento!\n\nEscolha uma opção:\n\n1 - Finanças (fatura, pagamento, subsídio)\n2 - Suporte técnico (internet lenta, sem sinal, roteador)";
    const msg = message.body.toLowerCase().trim();

    let sender = message.from; 

    // Comando para cancelar qualquer operação
    if(msg.includes("cancelar")) {
        sessions.delete(sender);
        await message.reply("Operação cancelada. Digite qualquer mensagem para iniciar um novo atendimento.");
        return;
    }

    // Sem sessão criada
    if(!sessions.has(sender)) {

        switch(msg) {

            case 'ping':
                await message.reply('Pong');
                break;

            case 'teste':
                await message.reply("Testando com sucesso!");
                break;

            default:
                sessions.set(sender, {
                    aguardandoOpcao: true,
                    opcaoFinancas: false,
                    opcaoSuporte: false
                });
                await message.reply(mensagemPadrao);
                break;
        }

    }

    // Sessão já criada
    else {
        let session = sessions.get(sender);

        // Aguardando escolha da opção principal
        if(session.aguardandoOpcao) {
            if(msg === "1" || msg.includes("financ") || msg.includes("fatura") || msg.includes("pagamento") || msg.includes("subsidio")) {
                session.aguardandoOpcao = false;
                session.opcaoFinancas = true;
                await message.reply("Você selecionou *Finanças*. Como posso ajudar?\n\n- Fatura\n- Pagamento\n- Subsídio");
            }
            else if(msg === "2" || msg.includes("suporte") || msg.includes("tecnico") || msg.includes("internet") || msg.includes("sinal") || msg.includes("roteador")) {
                session.aguardandoOpcao = false;
                session.opcaoSuporte = true;
                await message.reply("Você selecionou *Suporte Técnico*. Como posso ajudar?\n\n- Internet lenta\n- Sem sinal\n- Problemas com roteador");
            }
            else {
                await message.reply("Opção inválida. " + mensagemPadrao);
            }
        }
        // Processando opção de Finanças
        else if(session.opcaoFinancas) {
            let resposta = "";
            
            if(msg.includes("fatura")) {
                resposta = "Para consultar sua fatura, acesse nosso site ou aplicativo. Você também pode solicitar o envio por e-mail ou WhatsApp.";
            }
            else if(msg.includes("pagamento")) {
                resposta = "Oferecemos diversas opções de pagamento: boleto bancário, cartão de crédito, débito automático ou PIX.";
            }
            else if(msg.includes("subsidio")) {
                resposta = "Para informações sobre subsídios disponíveis, entre em contato com nossa central de atendimento pelo telefone 0800-123-4567.";
            }
            else {
                resposta = "Não entendi sua solicitação sobre finanças. Por favor, especifique se deseja informações sobre fatura, pagamento ou subsídio.";
            }
            
            await message.reply(resposta + "\n\nPrecisa de mais alguma ajuda? Digite qualquer mensagem para voltar ao menu principal ou 'cancelar' para encerrar o atendimento.");
            sessions.delete(sender);
        }
        // Processando opção de Suporte Técnico
        else if(session.opcaoSuporte) {
            let resposta = "";
            
            if(msg.includes("lenta") || msg.includes("velocidade")) {
                resposta = "Para problemas de internet lenta, recomendamos: 1) Reiniciar o roteador; 2) Verificar se há muitos dispositivos conectados; 3) Realizar um teste de velocidade em speedtest.net.";
            }
            else if(msg.includes("sem sinal") || msg.includes("sinal")) {
                resposta = "Para problemas de falta de sinal: 1) Verifique se os cabos estão conectados corretamente; 2) Reinicie o roteador; 3) Verifique se há problemas na sua região através do nosso site.";
            }
            else if(msg.includes("roteador")) {
                resposta = "Para problemas com o roteador: 1) Reinicie o equipamento; 2) Verifique se as luzes indicadoras estão acesas; 3) Tente posicionar o roteador em um local mais central da casa.";
            }
            else {
                resposta = "Não entendi sua solicitação sobre suporte técnico. Por favor, especifique se o problema é relacionado à internet lenta, falta de sinal ou roteador.";
            }
            
            await message.reply(resposta + "\n\nPrecisa de mais alguma ajuda? Digite qualquer mensagem para voltar ao menu principal ou 'cancelar' para encerrar o atendimento.");
            sessions.delete(sender);
        }
        // Caso padrão (não deveria chegar aqui)
        else {
            sessions.delete(sender);
            await client.sendMessage(sender, mensagemPadrao);
        }
    }
});

client.initialize();