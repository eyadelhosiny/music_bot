const { prefixes } = require('../config.json');
const { Collection } = require('discord.js');
const delay = new Collection();
const db = require('quick.db');
const ms = require('ms');
const axios = require("axios").default;
const { Utils } = require("devtools-ts");
const utilites = new Utils();


module.exports = {
name: 'messageCreate',
async execute(client, message) {

    try {
      const startsWithPrefix = prefixes.some(prefix => message.content.toLowerCase().startsWith(prefix.toLowerCase()))
      if (!startsWithPrefix || message.author.bot) return;
      const member = message.member || client.guilds.cache.get("1159925499661922375").members.cahce.get(message.author.id)
      if (!member) return;
      if (!(message.guild.id == '1105097952973824031' && message.channel.parentId == '1111792119225536583') && !member.roles?.cache.has('1053276167601401898')) return;
    

      const args = message.content.slice(prefixes[0].length).trim().split(/ +/);
      const command = args.shift().toLowerCase(); //p
      try {
        let commandFiles = client.commands.get(command) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command));
        if (!commandFiles) return;
        if (commandFiles) {
          if (commandFiles.cooldown) {

            if (delay.has(`${commandFiles.name}-${message.author.id}`)) return message.reply(`You can use this command again after **${ms(delay.get(`${commandFiles.name}-${message.author.id}`) - Date.now(), { long: true }).includes('ms') ? '0 second' : ms(delay.get(`${commandFiles.name}-${message.author.id}`) - Date.now(), { long: true })}**`);

            commandFiles.execute(client, message, args);

            delay.set(`${commandFiles.name}-${message.author.id}`, Date.now() + commandFiles.cooldown);
            setTimeout(() => {
              delay.delete(`${commandFiles.name}-${message.author.id}`);
            }, commandFiles.cooldown);
          } else {
            commandFiles.execute(client, message, args);
          }
        }
      } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
      }
    } catch (err) {
      console.log(err)
    }
  }
}
