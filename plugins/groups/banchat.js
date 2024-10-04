module.exports = {
    pattern: 'banchat',
    alias: ['банчат'],
    desc: 'забанить чат',
    category: ['admin'],
    async execute(Void, citel, { sck }) {
        const group = sck.findOne({ id: citel.chat })
        sck.updateOne( { id: citel.chat }, { $set: { banChat: true } } )
        citel.react('✔')
    }
};
