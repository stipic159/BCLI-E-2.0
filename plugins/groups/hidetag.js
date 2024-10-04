module.exports = {
    pattern: 'hidetag',
    alias: ['скрытыйтег'],
    desc: 'отметить всех участников группы',
    category: ['группа'],
    botAdmins: true,
    isAdmin: true,
    isGroup: true,
    async execute(Void, citel, { text }) {
        const groupMetadata = citel.isGroup ? await Void.groupMetadata(citel.chat).catch((e) => { }) : "";
        const participants = citel.isGroup ? await groupMetadata.participants : "";
        await Void.sendMessage(citel.chat, { text: text ? text : "", mentions: participants.map((a) => a.id) }, {
            quoted: citel,
        });
}}