const { EmbedBuilder } = require("discord.js");
const distube = require('../../client/distube')
const { prefixes } = require('../../config.json');
const { Utils } = require("devtools-ts");
const utilites = new Utils();

module.exports = {
    name: "seek",
    description: "Seeks to a certain point in the current track.",
    cooldown: 5000,
    aliases: ['تقديم', "goto"],
    async execute(client, message, args) {
        try {
          
            const queue = distube.getQueue(message)
            const song = queue.songs[0]
            let seektime = queue.currentTime + Number(args[0]);
            if (seektime >= queue.songs[0].duration)
              seektime = song.duration - 1;
            await queue.seek(Number(seektime));
			message.reply(`✅ Done!`)
            return distube.seek(message, Number(args[0]));
        } catch (err) {
            console.log(err)
        }
    },
};