module.exports = {
    pattern: 'ban',
    alias: ['бан', 'рем', 'rem'],
    desc: 'забанить пользователя',
    category: ['группа'],
    users: true,
    botAdmins: true,
    isAdmin: true,
    isGroup: true,
    async execute(Void, citel, { users }) {
        try {
        await Void.groupParticipantsUpdate(citel.chat, [users], 'remove');
        citel.react('✔')
        } catch (error) {
            console.error(error)
        }
    }
};
