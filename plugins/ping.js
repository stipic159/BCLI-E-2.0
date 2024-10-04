module.exports = {
    pattern: 'ping',
    alias: ['пинг'],
    desc: 'Проверка скорости работы бота',
    category: ['базовые команды'],
    async execute(Void, citel) {
        let initial = new Date().getTime();
        const { key } = await Void.sendMessage(citel.chat, { text: '_*Пинг*_' }, { quoted: citel });
        let final = new Date().getTime();
        const ping = final - initial;
        await Void.sendMessage(citel.chat, { text: `Время отклика: ${ping} мс`, edit: key })
    }
};
