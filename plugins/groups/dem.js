module.exports = {
    pattern: 'dem',
    alias: ['понизить'],
    desc: 'понизить человека',
    category: ['группа'],
    users: true,
    botAdmins: true,
    isAdmin: true,
    isGroup: true,
    async execute(Void, citel, { users }) {
        await Void.groupParticipantsUpdate(citel.chat, [users], "demote");
        citel.react('✔')
}}