const {
    smsg,
    loadCommands,
    findCommandByAlias,
    getAdmin,
    updateMessageCounter
} = require('./func/imp-func')

const { sck1 } = require('./database/db-init')

module.exports = {
    smsg, 
    loadCommands, 
    findCommandByAlias, 
    getAdmin, 
    updateMessageCounter,
    sck1
}