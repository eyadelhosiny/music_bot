const { EmbedBuilder } = require("discord.js");
const { Utils } = require("devtools-ts");
const utilites = new Utils();

module.exports = {
    name: "test",
    description: `Test the bot`,
    async execute(client, message, args) {
        try {
            message.reply({ content: `:white_check_mark: All is Well ` })
        } catch (err) {
            console.log(err)
        }
    },
};