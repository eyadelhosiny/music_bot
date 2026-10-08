const { ActivityType } = require('discord.js');
const Discord = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { prefixes } = require('../config.json');
const { joinVoiceChannel } = require('@discordjs/voice');
const distube = require('../client/distube');
const { Utils } = require("devtools-ts");
const utilites = new Utils();

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    try {
      const activities = [
        { name: `Potter Members`, type: 2 }, // LISTENING
        { name: `Master Of Death`, type: 0 }, // PLAYING
        { name: `Potter's House`, type: 3 }, // WATCHING
        { name: `Potter's House Elf`, type: 4 } // COMPETING
      ];
      console.log((`Logged in as ${client.user.tag}`).red);
      console.log((`Servers: ${client.guilds.cache.size}`).magenta, (`Users: ${client.guilds.cache
        .reduce((a, b) => a + b.memberCount, 0)
        .toLocaleString()}`).yellow, (`Commands: ${client.commands.size}`).green);
      client.user.setStatus("idle")
      let i = 0;
      setInterval(() => {
        if (i >= activities.length) i = 0
        client.user.setActivity(activities[i])
        i++;
      }, 5000);

      
      setInterval(async () => {
        client.guilds.cache.forEach(async g => {
          let vch = await db.get(`24_7_${g.id}`)
          if (vch == null) return;
          let ch = client.channels.cache.get(vch);
          if (ch == null) return db.delete(`24_7_${g.id}`)
          const clientMember = g.members.cache.get(client.user.id);
          const checkJoined = clientMember?.voice?.channelId == ch.id;
          if (!checkJoined) {
            console.log(checkJoined)
            try {
              await distube.voices.join(ch)
            } catch (e) {
              console.log("connection", e);
            }
          }
        })
      }, 7000)
    } catch (err) {
      console.log(err)
    }
  }
};