const { getContentType } = require("@whiskeysockets/baileys");
const fs = require('fs');
const path = require('path');
const { sck1 } = require("../index");

async function updateMessageCounter(userId, chatId, name, sck1) {
    try {
        const currentDate = new Date();
        const user = await sck1.findOne({ id: userId })
        sck1.updateOne({ id: userId }, { $set: { name: name, lastSendMsg: currentDate }, $inc: { msg: 1, allMsg: 1 } }, { upsert: true, new: true }
        );

        const levelUpdatePromise = updateLevel(user, sck1);
        await Promise.all([levelUpdatePromise]);
        console.log(`Данные для пользователя ${userId} в чате ${chatId} обновлены`);
    } catch (error) {
        console.error('Ошибка при обновлении счетчика сообщений:', error);
}}

const updateLevel = async (user, sck1) => {
    const maxLevel = 50;
    const messagesPerLevel = user.level * 350;

    if (user.allMsg >= messagesPerLevel && user.level < maxLevel) {
        const nextLevel = user.level + 1;

        if (nextLevel > maxLevel) {
            console.log(`Пользователь c id - ${user.id} уже достиг максимального уровня (${maxLevel}).`);
            return;
        }

        await sck1.updateOne({ id: user.id }, { $set: { level: nextLevel, allMsg: 0 } });
        console.log(`Уровень пользователя c id - ${user.id}, обновлен до ${nextLevel}`);
    }
}

function loadCommands(dir) {
    const commandMap = new Map();

    function loadFromDir(dir) {
        fs.readdirSync(dir).forEach(file => {
            const fullPath = path.join(dir, file);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                loadFromDir(fullPath);
            } else if (file.endsWith('.js')) {
                const cmd = require(fullPath);
                if (cmd.pattern) {
                    commandMap.set(cmd.pattern, cmd);
                }
            }
        });
    }

    loadFromDir(dir);
    return commandMap;
}

const smsg = async (conn, citel, store) => {
    if (!citel) return null;
  
    // Обработка ключевых данных сообщения
    const { key, message } = citel;
    if (key) {
      const { remoteJid, fromMe, participant, id } = key;
  
      citel.id = id;
      citel.isBot = fromMe;
      citel.isBaileys = fromMe;
      citel.chat = remoteJid;
      citel.fromMe = fromMe;
      citel.isGroup = citel.chat.endsWith('@g.us');
      citel.sender = citel.fromMe ? (conn.user?.jid || 'unknown') : participant || citel.chat;
      citel.isCreator = citel.sender === '79284470237@s.whatsapp.net' ? true : false
      citel.react = (emoji) => conn.sendMessage(citel.chat, { react: { text: emoji, key: citel.key } });
      citel.reply = async (content, type = "text") => {
        switch (type.toLowerCase()) {
            case "text": {
                return await conn.sendMessage(citel.chat, { text: content }, { quoted: citel });
            }
                break;
      }}
  
      if (citel.isGroup && !citel.participant) {
        citel.participant = conn.user?.jid || 'unknown';
      }
    }
  
    if (message) {
      citel.mtype = getContentType(message);
      citel.msg = citel.mtype === 'viewOnceMessage' 
        ? message[citel.mtype].message[getContentType(message[citel.mtype].message)] 
        : message[citel.mtype];
  
      try {
        citel.body = getBodyText(citel);
      } catch {
        citel.body = false;
      }
      citel.text = (citel && citel.msg) ? (citel.msg.text || citel.msg.caption || citel.message.conversation || citel.msg.contentText || citel.msg.selectedDisplayText || citel.msg.title || '') : ''
  
      // Работа с цитированным сообщением
      handleQuotedMessage(citel, store, conn);
    }
  
    return citel;
  };
  
  // Функция для получения основного текста сообщения
  const getBodyText = (citel) => {
    const { mtype, message } = citel;
    if (mtype === 'conversation') return message.conversation;
  
    const typesWithCaption = ['imageMessage', 'videoMessage'];
    const captions = typesWithCaption.includes(mtype) 
      ? message[mtype].caption 
      : '';
  
    return captions || getExtendedText(citel);
  };
  
  // Функция для обработки расширенных текстовых сообщений
  const getExtendedText = (citel) => {
    const { mtype, message } = citel;
    switch (mtype) {
      case 'extendedTextMessage': return message.extendedTextMessage.text;
      case 'buttonsResponseMessage': return message.buttonsResponseMessage.selectedButtonId;
      case 'listResponseMessage': return message.listResponseMessage.singleSelectReply.selectedRowId;
      case 'templateButtonReplyMessage': return message.templateButtonReplyMessage.selectedId;
      case 'messageContextInfo': return message.buttonsResponseMessage?.selectedButtonId || message.listResponseMessage?.singleSelectReply.selectedRowId || message.text;
      default: return '';
    }
  };
  
  // Функция обработки цитат
  const handleQuotedMessage = (citel, store, conn) => {
    const contextInfo = citel.msg?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
  
    citel.quoted = quotedMessage ? quotedMessage : null;
    citel.mentionedJid = contextInfo?.mentionedJid || [];
  
    if (citel.quoted) {
      let type = getContentType(citel.quoted);
      citel.quoted = citel.quoted[type];
  
      if (['productMessage'].includes(type)) {
        type = getContentType(citel.quoted);
        citel.quoted = citel.quoted[type];
      }
  
      formatQuotedMessage(citel, store, conn);
    }
  };
  
  // Функция для форматирования цитированных сообщений
  const formatQuotedMessage = (citel, store, conn) => {
    const { quoted } = citel;
    const contextInfo = citel.msg.contextInfo;
  
    if (typeof quoted === 'string') {
      citel.quoted = { text: quoted };
    }
  
    if (!quoted.viewOnceMessageV2) {
      citel.quoted.mtype = getContentType(quoted);
      citel.quoted.id = contextInfo.stanzaId;
      citel.quoted.chat = contextInfo.remoteJid || citel.chat;
      citel.quoted.sender = contextInfo.participant;
      citel.quoted.fromMe = citel.quoted.sender === (conn.user && conn.user.id);
      citel.quoted.text = quoted.text || quoted.caption || quoted.conversation || quoted.contentText || quoted.selectedDisplayText || quoted.title || '';
      citel.quoted.mentionedJid = contextInfo?.mentionedJid || [];
  
      // Методы для цитат
      citel.getQuotedObj = citel.getQuotedMessage = async () => {
        if (!citel.quoted.id) return false;
        const q = await store.loadMessage(citel.chat, citel.quoted.id, conn);
        return smsg(conn, q, store);
      };
  
      const key = {
        remoteJid: citel.chat,
        fromMe: false,
        id: citel.quoted.id,
        participant: citel.quoted.sender,
      };
      citel.quoted.key = key
      citel.quoted.delete = async () => await conn.sendMessage(citel.chat, { delete: key });
      citel.quoted.download = () => conn.downloadMediaMessage(citel.quoted);
    }
  }

function findCommandByAlias(commandMap, commandKey) {
for (let [key, cmd] of commandMap) {
    if (cmd.alias && cmd.alias.includes(commandKey)) {
        return cmd;
    }
}
return null;
}

const getAdmin = async (Void, citel) => {
    var adminn = await Void.groupMetadata(citel.chat);
    a = [];
    for (let i of adminn.participants) {
        if (i.admin == null) continue;
        a.push(i.id);
    }
    return a;
}

module.exports = { smsg, loadCommands, findCommandByAlias, getAdmin, updateMessageCounter } 