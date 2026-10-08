const { EmbedBuilder } = require("discord.js");
const distube = require('../../client/distube'); // Check your path to ensure it's correct
const wait = require('node:timers/promises').setTimeout;
const { Utils } = require("devtools-ts");
const utilites = new Utils();

module.exports = {
    name: "insert",
    description: "Insert a song at the beginning of the queue.",
    aliases: ['i', 'ادخل'],
    async execute(client, message, args) {
        try {
            if (message.guild.members.me.voice?.channelId && message.member.voice.channelId !== message.guild.members.me?.voice?.channelId)
                return message.reply({ content: `:no_entry_sign: You must be listening in \`${message.guild.members.me?.voice?.channel.name}\` to use that!` });
            
            if (!message.member.voice.channel)
                return message.reply({ content: ":no_entry_sign: You must join a voice channel to use that!" });
            
            let player = args.join(' ');
            if (!player) return message.reply({ content: `:no_entry_sign: You should type song name or URL.` });

            const queue = distube.getQueue(message);
            const voiceChannel = message.member?.voice?.channel;

            if (voiceChannel) {
                await distube.play(voiceChannel, player, {
                    message,
                    textChannel: message.channel,
                    member: message.member,
                    position: 1
                });
            } else {
                message.reply('You must be in a voice channel to use that command.');
            }
        } catch (err) {
            console.error(err);
        }
    },
};
