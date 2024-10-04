const { proto } = require("@whiskeysockets/baileys")

module.exports = {
    pattern: 'pin',
    alias: ['закреп'],
    desc: 'закрепить сообщение',
    category: ['группа'],
    botAdmins: true,
    isAdmin: true,
    isGroup: true,
    async execute(Void, citel) {
        const key = {
            remoteJid: citel.chat,
            fromMe: false,
            id: citel.quoted ? citel.quoted.id : citel.key.id,
            particiant: citel.quoted ? citel.quoted.sender : citel.sender
        }
        await Void.sendMessage(citel.chat, { pin: key, type: proto.PinInChat.Type.PIN_FOR_ALL, time: 86400 })
        citel.react('✔')
}}