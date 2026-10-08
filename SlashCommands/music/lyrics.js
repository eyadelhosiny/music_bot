const { EmbedBuilder, channelLink } = require("discord.js");
const { escapeMarkdown } = require("discord.js");
const distube = require('../../client/distube')
const lyricsFinder = require("@jeve/lyrics-finder");
const { Utils } = require("devtools-ts");
const utilites = new Utils();
const Genius = require("genius-lyrics");

module.exports = {
    name: "lyrics",
    description: "Display lyrics of a song",
    cooldown: 5000,
    async execute(client, interaction) {
        if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
            if (!interaction.member.voice.channel)
                return interaction.reply({ content: ":no_entry_sign: You must join a voice channel to use that!", ephemeral: true })
            const queue = distube.getQueue(interaction)
            if (!queue) return interaction.reply({ content: `:no_entry_sign: There must be music playing to use that!` })
            const Psong = queue.songs[0]
            try {
                const search = await genius.songs.search(Psong.name);

                var song = search.find(song => song.artist.name.toLowerCase() === Psong.uploader.name.toLowerCase());
				const fsong = search[0];
				if (!song) {
					const fsong = search[0];
					let song = fsong
                }
                if (!fsong) return interaction.reply({ content: `No lyrics found for ${Psong.name}... try again ? ❌`, ephemeral: false });
				
				
                const lyrics = await fsong.lyrics()
                const embeds = [];
                for (let i = 0; i < lyrics.length; i += 4096) {
                    const toSend = lyrics.substring(i, Math.min(lyrics.length, i + 4096));
                    embeds.push(new EmbedBuilder()
                        .setTitle(`Lyrics for ${Psong.name}`)
                        .setDescription(toSend)
						.setThumbnail(`https://img.youtube.com/vi/${Psong.id}/mqdefault.jpg`)
                        .setColor('#511752')
                        .setTimestamp()
                        .setFooter({ text: 'IMGN Sound - Encricle the World', iconURL: interaction.member.avatarURL({ dynamic: false }) })
                    );
                }
                return interaction.reply({ embeds: embeds, ephemeral: false });
            } catch (error) {
				interaction.reply({ content: `Error! Please contact <@1018114834463727686> | ❌`, ephemeral: true });
				ErrChannel = client.channels.fetch('1178626840089337886')
				ErrEmbed = new EmbedBuilder()
                        .setTitle(`Lyrics Error`)
                        .setDescription(error)
						.setThumbnail(`https://img.youtube.com/vi/${Psong.id}/mqdefault.jpg`)
                        .setColor('RED')
                        .setTimestamp()
                        .setFooter({ text: 'IMGN Sound - Encricle the World'})
				ErrChannel.send({content : '<@&1164791854328451092>', embeds: ErrEmbed })
                
            }
        }
}