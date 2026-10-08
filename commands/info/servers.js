const { EmbedBuilder } = require("discord.js");
const { MessageEmbed } = require('discord.js');
const { devs } = require('../../config.json');


module.exports = {
    name: "servers",
    description: "Nothing command",
    async execute(client, message, args) {
        try {
            if (devs.includes(message.author.id)) {
                client.guilds.cache.forEach(async (guild) => {
                    const guilds = [];
                    var embed = new EmbedBuilder().setAuthor({ name: `${guild.name}` })
                    if (guild.iconURL() !== null) {
                        embed.setThumbnail(`${guild.iconURL({ dynamic: true })}`)

                    } else {
                        embed.setThumbnail(`https://cdn.discordapp.com/attachments/1169018854098337915/1175583112609144852/remix-901752b3-7833-4496-814a-289d97f25b22.png?ex=656bc217&is=65594d17&hm=0424867c9693d1ec2e463a29c66775e3d3ae243bf2da225f75a4c359fb32f52d&`)
                    }
                    embed.setDescription(`Guild ID : ${guild.id}`)
                    embed.addFields({
                        name: `Guild Description`,
                        value: `${guild.description}`,
                        inline: true,
                    })
                    .addFields({
                        name: `Join Date`,
                        value: `${guild.joinedAt}`,
                        inline: true,
                    })
                    .addFields({
                        name: `Member Count`,
                        value: `${guild.memberCount}`,
                        inline: true,
                    })
                    .addFields({
                        name: `Owner`,
                        value: `${guild.ownerId}`,
                        inline: true,
                    })
                    .addFields({
                        name: `Invite`,
                        value: `[Invite](${guild.invites.fetch()})`,
                        inline: true,
                    })
                    .addFields({
                        name: `Invite 2`,
                        value: `[Invite](${guild.vanityURLCode})`,
                        inline: true,
                    })

                    message.reply({ embeds: [embed] });
                });


            } else {
              message.reply({ content: `:x: Only Developers Can Use This Command` });
            }
        } catch (err) {
            console.error(err);
        }
    },
};