const { 
  DisconnectReason, 
  useMultiFileAuthState, 
  makeInMemoryStore, 
  downloadContentFromMessage, 
  jidDecode 
} = require("@whiskeysockets/baileys");
const util = require('util');
const makeWASocket = require("@whiskeysockets/baileys").default;
const pino = require('pino');
const colors = require('colors');
const NodeCache = require('node-cache');
const { smsg, loadCommands, findCommandByAlias, sck1, updateMessageCounter, sck } = require('../index');
const path = require("path");
const commandDir = path.join(__dirname, '../../plugins');
const commandMap = loadCommands(commandDir);
const cooldowns = {};
let requestInProgress = new Set();
const groupMetadataCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Основная логика подключения
async function connectionLogic() {
  const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });
  const { state, saveCreds } = await useMultiFileAuthState("lib/system/auth_info_baileys");

  const Void = makeWASocket({
    printQRInTerminal: true,
    auth: state,
  });

  Void.decodeJid = (jid) => {
    if (!jid) return jid;
    const decode = jidDecode(jid);
    return decode?.user && decode?.server ? `${decode.user}@${decode.server}` : jid;
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

  Void.metadataGroup = async (chatId) => {
    if (chatId.endsWith('@g.us') && !requestInProgress.has(chatId)) {
      if (!groupMetadataCache.has(chatId)) {
        requestInProgress.add(chatId);
        const metadata = await Void.groupMetadata(chatId);
        const metadataCode = await Void.groupInviteCode(chatId).catch(() => undefined);
        metadata.inviteCode = metadataCode;
        groupMetadataCache.set(chatId, metadata);
        requestInProgress.delete(chatId);
      }
      return groupMetadataCache.get(chatId);
    }
    return 'privateChat';
  };

  Void.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update || {};
    if (qr) console.log(qr);
    if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
      connectionLogic();
    }
  });

  Void.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0];
      mek.message = mek.message?.ephemeralMessage?.message || mek.message;
      const citel = await smsg(Void, JSON.parse(JSON.stringify(mek)), store);
      citel.budy = typeof citel.text === "string" ? citel.text : false;
      let { body } = citel
      let group
      if (!citel.budy) return
      if (citel.isBaileys) return
      if (citel.isGroup) {
        group = sck.findOne({ id: citel.chat })
        if (!group) {
          sck.insertOne({
            id: citel.chat,
            banChat: false,
            level: 1,
            msg: 0,
            allmsg: 0,
            lastSendMsg: new Date()
          })
          console.log('Создана новая запись для групп')
        }
      }
      if (group.banChat && !(citel.budy === '.разбанчат' || citel.budy === '.unbanchat' )) return
      const user = sck1.findOne({ id: citel.sender })
      if (!user) {
        if ( citel.sender.endsWith('@s.whatsapp.net') ) {}
        else return
        sck1.insertOne({
          id: citel.sender,
          name: citel.pushName,
          level: 1, 
          msg: 0,
          lastSendMsg: new Date(),
          allMsg: 0
        });
        console.log('Создан новый пользователь')
      }
      await updateMessageCounter(citel.sender, citel.chat, citel.pushName, sck1)

      // Проверка на начало команды
      
      if ( citel.isCreator && citel.budy.startsWith('=') ) {
        try {
            const result = eval(citel.budy.slice(1).trim());
            await citel.reply(util.format(result));
        } catch (err) {
            await citel.reply(util.format(err));
        }
    }

    let text;
    try {
        text = body ? body.trim().split(/ +/).slice(1).join(" ") : null;
    } catch {
        text = false;
    }
    const users = citel.mentionedJid && citel.mentionedJid[0] || citel.quoted && citel.quoted.sender || (text && text.replace(/[^0-9]/g, '') + "@s.whatsapp.net") || false
    const args = body ? body.trim().split(/ +/).slice(1) : [];
    const params = {
        text, args, users,
        sck, sck1
    };

      if (!(citel.text.startsWith('/') || citel.text.startsWith('.'))) {
            console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
            console.log('Получено сообщение:');
            console.log(`Чат: ${citel.chat}`);
            console.log(`Отправитель: ${citel.sender}`);
            console.log(`Сообщение: ${citel.budy}`);
            console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n\n`);
          return;
      }

      // Обработка команды
      let cmdText = citel.text;
      const [cmdName] = cmdText.slice(1).trim().split(/ +/);
      const commandKey = cmdName.toLowerCase();
      const cmd = commandMap.get(commandKey) || findCommandByAlias(commandMap, commandKey);

      if (cmd) {
          const now = Date.now();
          const cooldownTime = cmd.cooldownTime || 0;
          const userCooldowns = cooldowns[citel.sender] || {};
          const lastUsage = userCooldowns[cmdName] || 0;

          if (now - lastUsage < cooldownTime) {
              const remainingTime = Math.ceil((cooldownTime - (now - lastUsage)) / 1000);
              return bot.sendMessage(chatId, `Пожалуйста, подождите ${remainingTime} секунд(ы) перед повторным использованием команды.`);
          }

          userCooldowns[cmdName] = now;
          cooldowns[citel.sender] = userCooldowns;

          console.log(`Выполнение команды: ${cmdName}`);
          if (cmd.isCreator && !citel.isCreator) {
              return citel.reply('Команда доступна только создателю.');
          }
          if (cmd.isGroup && !citel.isGroup) {
              return citel.reply('Эта команда доступна только в группах.');
          }
          if (cmd.isPrivate && citel.isGroup) {
              return citel.reply('Эта команда доступна только в личных сообщениях.');
          }
          if (cmd.isAdmins) {
            const adminList = await getAdmin(Void, citel)
            if (!adminList.includes(citel.sender)) {
                return citel.reply('Команда доступна только администраторам.');
            }
        }
        if (cmd.botAdmins) {
            const adminList = await getAdmin(Void, citel);
            const botJid = Void.decodeJid(Void.user.id); 
            if (!adminList.includes(botJid)) {
                return citel.reply('У меня нет админских прав.');
            }
        }
        if (cmd.users && !users) {
          return citel.reply('Отметь участника используя @, или же сообщение.')
        }
          await cmd.execute(Void, citel, params);
          console.log(colors.yellow(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~`))
          console.log(colors.yellow('Получена команда:'))
          console.log(colors.yellow(`Чат: ${citel.chat}`))
          console.log(colors.yellow(`Отправитель: ${citel.sender}`))
          console.log(colors.yellow(`Команда: ${cmdName}`))
          console.log(colors.yellow(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n\n`))
      }
    } catch (error) {
      console.error("Ошибка в обработке сообщения:", error);
    }
  });

  Void.ev.on("creds.update", saveCreds);
}
connectionLogic();

const getAdmin = async (Void, citel) => {
  var adminn = await Void.groupMetadata(citel.chat);
  a = [];
  for (let i of adminn.participants) {
      if (i.admin == null) continue;
      a.push(i.id);
  }
  return a;
}