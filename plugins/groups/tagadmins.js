const { getAdmin } = require("../../lib/index");

module.exports = {
    pattern: 'tagadmins',
    alias: ['tad', 'админы'],
    desc: 'повысить человека',
    category: ['группа'],
    botAdmins: true,
    isGroup: true,
    async execute(Void, citel, { users, text }) {
        const groupAdmins = await getAdmin(Void, citel);
        let textt =         `══✪〘   *Внимание(Админы)*   〙✪══\n\n` +
                            `➲ *Сообщение :* ${text ? text : "Нет сообщения"}\n\n` +
                            `➲ *Автор:* ${citel.pushName} 🔖\n\n`;

                        for (let mem of groupAdmins) {
                            textt += `📍 @${mem.split("@")[0]}\n`;
                        }

        await Void.sendMessage(citel.chat, {
            text: textt,
            mentions: groupAdmins,
        }, {
            quoted: citel,
        });
}}