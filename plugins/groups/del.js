module.exports = {
    pattern: 'del',
    alias: ['удалить'],
    desc: 'удалить смс',
    category: ['группа'],
    botAdmins: true,
    isAdmin: true,
    isGroup: true,
    async execute(Void, citel) {
        if (!citel.quoted.isBot) {
            const QKey = {
                remoteJid: citel.chat,
                fromMe: false,
                id: citel.quoted.id,
                participant: citel.quoted.sender
            };

            const SKey = {
                remoteJid: citel.chat,
                fromMe: false,
                id: citel.key.id,
                participant: citel.key.participant
            };

            try {
                await Void.sendMessage(citel.chat, { delete: QKey });
                await Void.sendMessage(citel.chat, { delete: SKey });
            } catch (error) {
                console.error("Error in del command:", error);
                await citel.react('❌');
            }
        } else {
            await citel.react('❌');
        }
}}