module.exports = {
    pattern: 'prom',
    alias: ['повысить'],
    desc: 'повысить человека',
    category: ['группа'],
    users: true,
    botAdmins: true,
    isAdmin: true,
    isGroup: true,
    async execute(Void, citel, { users }) {
        await Void.groupParticipantsUpdate(citel.chat, [users], "promote");
        citel.react('✔')
}}