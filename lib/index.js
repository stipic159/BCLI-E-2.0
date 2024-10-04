const {
    smsg,
    loadCommands,
    findCommandByAlias,
    getAdmin,
    updateMessageCounter
} = require('./func/imp-func')

const { sck1, sck } = require('./database/db-init')

module.exports = {
    smsg, 
    loadCommands, 
    findCommandByAlias, 
    getAdmin, 
    updateMessageCounter,
    sck1,
    sck
}