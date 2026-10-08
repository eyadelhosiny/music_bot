const execSync = require('child_process').execSync;

execSync('npm uninstall ffmpeg-static', { encoding: 'utf-8' });
execSync('rm -rf ./node_modules/ffmpeg-static', { encoding: 'utf-8' });

const { Client, Collection, Partials, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, EmbedBuilder } = require('discord.js');

const config = require("./config.json");
const { glob } = require("glob");
const { promisify } = require("util");
const { joinVoiceChannel } = require('@discordjs/voice');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');
const db = require('quick.db');
const colors = require("colors");
const Genius = require("genius-lyrics");

async function sendErrorToChannel(error, origin = 'Unknown') {
  const channelId = '1178626840089337886'; // replace with your channel ID
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(`⚠️ $Error from: {origin}`)
    .setColor(0xFF0000)
    .addFields(
      { name: 'Message', value: error.message || String(error) },
      { name: 'Stack', value: error.stack?.slice(0, 1024) || 'No stack trace.' }
    )
    .setTimestamp();

  channel.send({ embeds: [embed] }).catch(console.error);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Reaction,
    Partials.GuildScheduledEvent,
    Partials.User,
    Partials.ThreadMember
  ],
  shards: "auto",
  allowedMentions: {
    parse: [],
    repliedUser: false
  },
})
global.genius = new Genius.Client();


client.setMaxListeners(45);
require('events').defaultMaxListeners = 45;

const { createLogger, transports, format } = require('winston');
const path = require('path');

const logger = createLogger({
  level: 'error',
  format: format.combine(
    format.timestamp(),
    format.json(),
  ),
  transports: [
    new transports.File({ filename: path.join(__dirname, 'Logs', 'Errors.json') }),
  ],
});

client.on('error', error => {
  console.error('Discord.js error:', error);
  sendErrorToChannel(reason, 'Discord.js error:');
  logger.error('Discord.js error:', error);
});

client.on('warn', warning => {
  console.warn('Discord.js warning:', warning);
});

let antiCrashLogged = false;

process.on('unhandledRejection', (reason, p) => {
  if (!antiCrashLogged) {
    console.error('[antiCrash] :: Unhandled Rejection/Catch');
    console.error(reason, p);
    sendErrorToChannel(reason, 'unhandledRejection');
    logger.error('[antiCrash] :: Unhandled Rejection/Catch', { reason, p });
    antiCrashLogged = true;
  }
});

process.on('uncaughtException', (err, origin) => {
  if (!antiCrashLogged) {
    console.error('[antiCrash] :: Uncaught Exception/Catch');
    console.error(err, origin);
    sendErrorToChannel(reason, 'uncaughtException');
    logger.error('[antiCrash] :: Uncaught Exception/Catch', { err, origin });
    antiCrashLogged = true;
  }
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
  if (!antiCrashLogged) {
    console.error('[antiCrash] :: Uncaught Exception/Catch (MONITOR)');
    console.error(err, origin);
    sendErrorToChannel(reason, 'uncaughtExceptionMonitor');
    logger.error('[antiCrash] :: Uncaught Exception/Catch (MONITOR)', { err, origin });
    antiCrashLogged = true;
  }
});


module.exports = client;
client.commands = new Collection();
client.events = new Collection();
client.slashCommands = new Collection();
['commands', 'events', 'slash'].forEach(handler => {
  require(`./handlers/${handler}`)(client);
})

const commands = client.slashCommands.map(({ execute, ...data }) => data);

// Register slash commands
const rest = new REST({ version: '9' }).setToken(process.argv[2] || config.token);
rest.put(
  Routes.applicationGuildCommands(config.clientID, config.guildID),
  { body: commands },
).then(() => console.log('Successfully registered application commands.'))
  .catch(console.error)


setTimeout(() => {
  if (!client || !client.user) {
    console.log("Client Not Login, Process Kill")
    process.kill(1);
  } else {
    console.log("Client Login")
  }
}, 5 * 1000 * 60);

client.login(process.argv[2] || config.token).catch((err) => {
  console.log(err.message)
})

