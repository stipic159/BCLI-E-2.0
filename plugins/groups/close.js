module.exports = {
    pattern: 'close',
    alias: ['закрыть'],
    desc: 'закрыть чат',
    category: ['группа'],
    botAdmins: true,
    isAdmin: true,
    isGroup: true,
    async execute(Void, citel) {
        await Void.groupSettingUpdate(citel.chat, "announcement")
        citel.react('✔')
}}