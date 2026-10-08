const { EmbedBuilder } = require("discord.js");
const { Utils } = require("devtools-ts");
const utilites = new Utils();
const moment = require("moment");
require("moment-duration-format");



module.exports = {
    name: "info",
    description: `All the Info Of The Bot`,
    cooldown: 5000,
    async execute(client, message, args) {
        try {
			const duration = moment.duration(client.uptime).format(" D [days], H [hrs], m [mins], s [secs]");
			var embed = new EmbedBuilder()
			.setAuthor({ name: `Potter's House Elf`, iconURL: `${client.user.displayAvatarURL()}` })
			.setColor('#dfdb5e')
			.setThumbnail(`${client.user.displayAvatarURL({ dynamic: true })}`)
			.setFooter({ text: 'Potter - The Royal Family'})
			.addFields({ name: "Servers:", value: `${client.guilds.cache.size}`})
			.addFields({ name: "Members:", value: `${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0).toLocaleString()}`})
			.addFields({ name: "Latency:", value: `${client.ws.ping} ms`})
			.addFields({ name: "Uptime:", value: `${duration}`})
            message.reply({ embeds: [embed] })
        } catch (err) {
            console.log(err)
        }
    },
};