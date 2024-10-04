module.exports = {
    pattern: 'link',
    alias: ['ссылка'],
    desc: 'ссылка на человека',
    category: ['группа'],
    botAdmins: true,
    isAdmin: true,
    isGroup: true,
    async execute(Void, citel, { users }) {
        const meta = await Void.metadataGroup(citel.chat)
        const inviteLink = `https://chat.whatsapp.com/${meta.inviteCode}`
        citel.reply(`${inviteLink}`)
}}