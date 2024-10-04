module.exports = {
    pattern: 'unbanchat',
    alias: ['разбанчат'],
    desc: 'разбанить чат',
    category: ['admin'],
    async execute(Void, citel, { sck }) {
        const group = sck.findOne({ id: citel.chat })
        sck.updateOne( { id: citel.chat }, { $set: { banChat: false } } )
        citel.react('✔')
    }
};
