module.exports = {
    pattern: 'open',
    alias: ['открыть'],
    desc: 'открыть чат',
    category: ['группа'],
    botAdmins: true,
    isAdmin: true,
    isGroup: true,
    async execute(Void, citel) {
        await Void.groupSettingUpdate(citel.chat, "not_announcement")
        citel.react('✔')
}}