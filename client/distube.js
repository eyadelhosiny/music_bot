const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Events,
	EmbedBuilder,
	StringSelectMenuBuilder,
	StringSelectBuilder,
} = require("discord.js");
const client = require("../index");
const config = require("../config.json");
const { DisTube, Song, SearchResultVideo } = require("distube");
const { DeezerPlugin } = require("@distube/deezer");
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const wait = require('node:timers/promises').setTimeout;
const { YouTubePlugin } = require("@distube/youtube");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const { FilePlugin } = require("@distube/file");
const { DirectLinkPlugin } = require("@distube/direct-link");
const fs = require("fs");
const { Utils } = require("devtools-ts");
const utilites = new Utils();
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { red } = require("colors");
const PlayerMap = new Map();
const { createShortUrl, decodeURL } = require('shortlnk');

let spotifyoptions = {
	parallel: true,
	emitEventsAfterFetching: false,
};
if (config.spotify_api.enabled) {
	spotifyoptions.api = {
		clientId: config.spotify_api.clientId,
		clientSecret: config.spotify_api.clientSecret,
	};
}

let ytdlOptions = {
	highWaterMark: 1024 * 1024 * 64,
	quality: "highestaudio",
	format: "audioonly",
	cookies: fs.readFileSync("/home/imgnvps/DiscordBots/cookies.txt"),
	playerClients: ["IOS", "WEB_CREATOR", "WEB", "MWEB", "ANDROID"],
	liveBuffer: 60000,
	dlChunkSize: 1024 * 1024 * 4,
}

const distube = new DisTube(client, {
	emitNewSongOnly: true,
	savePreviousSongs: true,
	emitAddSongWhenCreatingQueue: true,
	emitAddListWhenCreatingQueue: true,
	nsfw: false,
	plugins: [
		new SpotifyPlugin({ api: {
            clientId: config.spotify_api.clientId, 
            clientSecret: config.spotify_api.clientSecret
        }}),
		new YouTubePlugin({ ytdlOptions: ytdlOptions , cookies: JSON.parse(fs.readFileSync("/home/imgnvps/DiscordBots/cookies.json")) }),
		new YtDlpPlugin(ytdlOptions),
		new SoundCloudPlugin(),
		new DeezerPlugin(),
		new DirectLinkPlugin(),
      	new FilePlugin(),
	],
});


const status = (queue) => {
	try {
		`Volume: \`${queue.volume}%\` | Loop: \`${queue.repeatMode
			? queue.repeatMode === 2
				? "All Queue"
				: "This Song"
			: "Off"
			}\` | Autoplay: \`${queue.autoplay ? "On" : "Off"}\` | Filter: \`${queue.filters.join(", ") || "Off"
			}\``;
	} catch (err) {
		console.log(err);
	}
};

// require(`../handlers/distube-events`)(distube)

distube.on("initQueue", (queue) => {
	queue.autoplay = false;
	queue.volume = 100;
});

distube.on(`playSong`, async (queue, track) => {
	try {
		var newQueue = distube.getQueue(queue.id);
		var newTrack = track;
		var data = receiveQueueData(newQueue, newTrack);
		const duration = track.stream.playFromSource ? track.duration : track.stream.song.duration || track.duration
		//Send message with buttons
		let currentSongPlayMsg = await queue.textChannel.send(data).then((msg) => {
			PlayerMap.set(`currentmsg`, msg.id);
			return msg;
		});

		let Allowed = [];
				client.guilds.cache.get("1053276167316193280").roles.cache.get('1053276167601401898').members.forEach((member) => {
			Allowed.push(member.id)
		});
		var collector = currentSongPlayMsg.createMessageComponentCollector({
			filter: (i) =>
				i.isButton() && i.user && Allowed.includes(i.user.id) && i.message.author.id == client.user.id,
			time: duration > duration * 1000 * 60,
		});
		let lastEdited = false;
		/**
		 * @INFORMATION - EDIT THE SONG MESSAGE EVERY 10 SECONDS!
		 */
		try {
			clearInterval(songEditInterval);
		} catch (e) { }
		songEditInterval = setInterval(async () => {
			if (!lastEdited) {
				try {
					var newQueue = distube.getQueue(queue.id);
					var newTrack = newQueue.songs[0];
					var data = receiveQueueData(newQueue, newTrack);
					await currentSongPlayMsg.edit(data).catch((e) => { });
				} catch (e) {
					clearInterval(songEditInterval);
				}
			}
		}, 7000);

		collector.on("collect", async (i) => {
			lastEdited = true;
			setTimeout(() => {
				lastEdited = false
			}, 7000)

			//pause/resume
			
			if (i.customId == `3`) {
				
				let { member } = i;

				const { channel } = member.voice;
				const originalComponents = i.message.components;
				const row = i.message.components[0];
				const row1 = i.message.components[1];
				const actionRow = ActionRowBuilder.from(row);
				const actionRow1 = ActionRowBuilder.from(row1);
				const componentButton = actionRow.components.find(b => b.customId === '3');
				const button = ButtonBuilder.from(componentButton)


				if (!channel)
					return i.reply({
						content: `:no_entry_sign: You must join a voice channel to use that!`,
						ephemeral: true,
					});

				if (channel.id !== newQueue.voiceChannel.id)
					return i.reply({
						content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
						ephemeral: true,
					});
				
				if (!newQueue.paused) {
					await distube.pause(i.guild.id);
					
					var data = receiveQueueData(
						distube.getQueue(queue.id),
						newQueue.songs[0]
					);
					currentSongPlayMsg.edit(data).catch((e) => {
						console.log(e);
					});
					
					
					i.reply({
						content: `:notes: Requests by **\`${member.user.tag}\`** - Paused!`
					});
					await wait(7000);
					await i.deleteReply()
				} else {
					//pause the player
					await distube.resume(i.guild.id);
					// button.setStyle("Secondary")
					var data = receiveQueueData(
						distube.getQueue(queue.id),
						newQueue.songs[0]
					);
					// data.components = [actionRow, actionRow1]
					currentSongPlayMsg.edit(data).catch((e) => {
						console.log(e);
					});

					
                    i.reply({
						content: `:notes: Requests by **\`${member.user.tag}\`** - Paused!`
                    });
					await wait(7000);
					await i.deleteReply()
				}
			}
			//Forward
			if (i.customId == `8`) {
				let { member } = i;

				const { channel } = member.voice;

				if (!channel)
					return i.reply({
						content: `:no_entry_sign: You must join a voice channel to use that!`,
						ephemeral: true,
					});

				if (channel.id !== newQueue.voiceChannel.id)
					return i.reply({
						content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
						ephemeral: true,
					});
				let seektime = newQueue.currentTime + 10;
				if (seektime >= newQueue.songs[0].duration)
					seektime = newQueue.songs[0].duration - 1;
				await newQueue.seek(Number(seektime));

				i.reply({
					content: `:notes: Requests by **\`${member.user.tag}\`** - Forwarded the song for \`10 Seconds\`!`
				});
				await wait(7000);
				await i.deleteReply()
				var data = receiveQueueData(
					distube.getQueue(queue.id),
					newQueue.songs[0]
				);
				currentSongPlayMsg.edit(data).catch((e) => {
					console.log(e);
				});
			}
			
			if (i.customId == `9`) {
				let { member } = i;

				const { channel } = member.voice;

				if (!channel)
					return i.reply({
						content: `:no_entry_sign: You must join a voice channel to use that!`,
						ephemeral: true,
					});

				if (channel.id !== newQueue.voiceChannel.id)
					return i.reply({
						content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
						ephemeral: true,
					});
				let seektime = newQueue.currentTime - 10;
				if (seektime < 0) seektime = 0;
				if (seektime >= newQueue.songs[0].duration - newQueue.currentTime)
					seektime = 0;
				await newQueue.seek(Number(seektime));
				i.reply({
					content: `:notes: Requests by **\`${member.user.tag}\`** - Rewinded the song for \`10 Seconds\`!`
				});
				await wait(7000);
				await i.deleteReply()
				var data = receiveQueueData(
					distube.getQueue(queue.id),
					newQueue.songs[0]
				);
				currentSongPlayMsg.edit(data).catch((e) => {
					console.log(e);
				});
			}
      // Skip
      if (i.customId == `10`) {
        let { member } = i;

        const { channel } = member.voice;

        if (!channel)
          return i.reply({
            content: `:no_entry_sign: You must join a voice channel to use that!`,
            ephemeral: true,
          });

        if (channel.id !== newQueue.voiceChannel.id)
          return i.reply({
            content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
            ephemeral: true,
          });
        if (!queue.autoplay && queue.songs.length <= 1)
          
          return i.reply({
            content: `:no_entry_sign:  this is last song in queue list`,
            ephemeral: true,
          });
		i.reply({
          content: `:notes: Skipped **${newQueue.songs[0].name}**`
        });
        await distube.skip(i.guild.id)
        
        

        await wait(7000);
        await i.deleteReply()
        
      }

      if (i.customId == `13`) {
        let { member } = i;

        const { channel } = member.voice;

        if (!channel)
          return i.reply({
            content: `:no_entry_sign: You must join a voice channel to use that!`,
            ephemeral: true,
          });

        if (channel.id !== newQueue.voiceChannel.id)
          return i.reply({
            content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
            ephemeral: true,
          });
        if (queue.previousSongs.length == 0) {
          i.reply({
            content: `:no_entry_sign: There is no previous song in this queue`,
            ephemeral: true,
          })
        } else {
        await distube.previous(i.guild.id);

        i.reply({
          content: `:notes: Song has been Previous`
        });
        }
        await wait(7000);
        await i.deleteReply()
        
      }


	if (i.customId == `shuffle`) {
        let { member } = i;

        const { channel } = member.voice;

        if (!channel) 
          return i.reply({
            content: `:no_entry_sign: You must join a voice channel to use that!`,
            ephemeral: true,
          });

        if (channel.id !== newQueue.voiceChannel.id)
          return i.reply({
            content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
            ephemeral: true,
          });
			distube.shuffle(i);
       		i.reply({
              content: `:white_check_mark: Song has been: \`Shuffle ${newQueue.songs.length - 1}\` by **\`${member.user.tag}\`** `
            });
            
        
        await wait(7000);
        await i.deleteReply()
        
      }

      
			//volume +10
			if (i.customId == `11`) {
				let { member } = i;
				const { channel } = member.voice;
				if (!channel)
					return i.reply({
						content: `:no_entry_sign: You must join a voice channel to use that!`,
						ephemeral: true,
					});
				if (channel.id !== newQueue.voiceChannel.id)
					return i.reply({
						content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
						ephemeral: true,
					});

				let newvolume = newQueue.volume + 10;
				let oldvolume = newQueue.volume;
				if (newvolume >= newQueue.songs[0].duration)
					newvolume = newQueue.songs[0].duration - 1;

				if (newvolume < 0 || newvolume > 150 || isNaN(newvolume))
					return i.reply({
						content:
							":no_entry_sign: **Volume must be a valid integer between 0 and 150!**",
						ephemeral: true,
					});
				if (newvolume < 0) newvolume = 0;
				if (newvolume > 150) newvolume = 150;

				await newQueue.setVolume(Number(newvolume));
				i.reply({
					content: `:loud_sound: Requests by **\`${member.user.tag}\`** - Volume changed from \`${oldvolume}\` to \`${newvolume}\``
				});
				await wait(7000);
				await i.deleteReply()
				var data = receiveQueueData(
					distube.getQueue(queue.id),
					newQueue.songs[0]
				);
				currentSongPlayMsg.edit(data).catch((e) => {
					console.log(e);
				});
			}
			//volume -10
			if (i.customId == `14`) {
				let { member } = i;
				const { channel } = member.voice;
				if (!channel)
					return i.reply({
						content: `:no_entry_sign: You must join a voice channel to use that!`,
						ephemeral: true,
					});
				if (channel.id !== newQueue.voiceChannel.id)
					return i.reply({
						content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
						ephemeral: true,
					});
					args = "1"
					await distube.setRepeatMode(i.guild.id, parseInt(args))
					i.reply({
					content: `:notes: **Repeat mode set to:** ${args.replace("0", "\`OFF\`").replace("1", "\`Repeat song\`").replace("2", "\`Repeat Queue\`")}`,
					ephemeral: true,
					});

					
					var data = receiveQueueData(
						distube.getQueue(queue.id),
						newQueue.songs[0]
						);
					currentSongPlayMsg.edit(data).catch((e) => {
						console.log(e);
					});
							
					await wait(7000);
					await i.deleteReply()
		}
						
			if (i.customId == `16`) {
				let { member } = i;
				const { channel } = member.voice;
				if (!channel)
				return i.reply({
					content: `:no_entry_sign: You must join a voice channel to use that!`,
					ephemeral: true,
				});
				if (channel.id !== newQueue.voiceChannel.id)
				return i.reply({
					content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
					ephemeral: true,
				});
				try {
					const search = await genius.songs.search(newQueue.songs[0].name);

					var song = search.find(song => song.artist.name.toLowerCase() === newQueue.songs[0].uploader.name.toLowerCase());
					const fsong = search[0];
					if (!song) {
						const fsong = search[0];
						let song = fsong
					}
					if (!fsong) return i.reply({ content: `No lyrics found for ${newQueue.songs[0].name}... try again ? ❌`, ephemeral: false });
					
					
					const lyrics = await fsong.lyrics()
					const embeds = [];
					for (let l = 0; l < lyrics.length; l += 4096) {
						const toSend = lyrics.substring(l, Math.min(lyrics.length, l + 4096));
						embeds.push(new EmbedBuilder()
							.setTitle(`Lyrics for ${newQueue.songs[0].name}`)
							.setDescription(toSend)
							.setThumbnail(`${newTrack.stream.playFromSource? `https://img.youtube.com/vi/${newQueue.songs[0].id}/mqdefault.jpg`: newTrack.stream.song.thumbnail}`)
							.setColor(`${config.Colour}`)
							.setTimestamp()
							.setFooter({ text: 'IMGN Sound - Encricle the World', iconURL: i.member.avatarURL({ dynamic: false }) })
						);
					}
					return i.reply({ embeds: embeds, ephemeral: false });
				} catch (error) {
					i.reply({ content: `Error! Please contact <@1018114834463727686> | ❌`, ephemeral: true });
					ErrChannel = client.channels.fetch('1178626840089337886')
					ErrEmbed = new EmbedBuilder()
							.setTitle(`Lyrics Error`)
							.setDescription(error)
							.setThumbnail(`${newTrack.stream.playFromSource? `https://img.youtube.com/vi/${newQueue.songs[0].id}/mqdefault.jpg`: newTrack.stream.song.thumbnail}`)
							.setColor('RED')
							.setTimestamp()
							.setFooter({ text: 'IMGN Sound - Encricle the World'})
					ErrChannel.send({content : '<@&1164791854328451092>', embeds: ErrEmbed })
					
				}
		}


		if (i.customId == `15`) {
			let { member } = i;
			const { channel } = member.voice;
			if (!channel)
			return i.reply({
				content: `:no_entry_sign: You must join a voice channel to use that!`,
				ephemeral: true,
			});
			if (channel.id !== newQueue.voiceChannel.id)
			return i.reply({
				content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
				ephemeral: true,
			});
			args = "2"
		
			await distube.setRepeatMode(i.guild.id, parseInt(args))
			i.reply({
			content: `:notes: **Repeat mode set to:** ${args.replace("0", "\`OFF\`").replace("1", "\`Repeat song\`").replace("2", "\`Repeat Queue\`")}`,
			ephemeral: true,
			});

			var data = receiveQueueData(
				distube.getQueue(queue.id),
				newQueue.songs[0]
			);
			currentSongPlayMsg.edit(data).catch((e) => {
				console.log(e);
			});

			await wait(7000);
			await i.deleteReply()
			
		}


		if (i.customId == `stop`) {
			let { member } = i;
			const { channel } = member.voice;
			if (!channel)
			return i.reply({
				content: `:no_entry_sign: You must join a voice channel to use that!`,
				ephemeral: true,
			});
			if (channel.id !== newQueue.voiceChannel.id)
			return i.reply({
				content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
				ephemeral: true,
			});
			i.reply({ content: `:notes: The player has stopped and the queue has been cleared.` })
			return distube.stop(i);


			await wait(7000);
			await i.deleteReply()
			
		}


		if (i.customId == `12`) {
			let { member } = i;
			const { channel } = member.voice;
			if (!channel)
			return i.reply({
				content: `:no_entry_sign: You must join a voice channel to use that!`,
				ephemeral: true,
			});
			if (channel.id !== newQueue.voiceChannel.id)
			return i.reply({
				content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
				ephemeral: true,
			});

			let newvolume = newQueue.volume - 10;
			let oldvolume = newQueue.volume;
			if (newvolume >= newQueue.songs[0].duration)
			newvolume = newQueue.songs[0].duration - 1;

			if (newvolume < 0 || newvolume > 150 || isNaN(newvolume))
			return i.reply({
				content:
				":no_entry_sign: **Volume must be a valid integer between 0 and 150!**",
				ephemeral: true,
			});
			if (newvolume < 0) newvolume = 0;
			if (newvolume > 150) newvolume = 150;

			await newQueue.setVolume(Number(newvolume));
			i.reply({
			content: `:loud_sound: Requests by **\`${member.user.tag}\`** - Volume changed from \`${oldvolume}\` to \`${newvolume}\``
			});
			await wait(7000);
			await i.deleteReply()
			var data = receiveQueueData(
			distube.getQueue(queue.id),
			newQueue.songs[0]
			);
			currentSongPlayMsg.edit(data).catch((e) => {
			console.log(e);
			});
		}
      
    });
    
  } catch (err) {
    console.log(err);
  }
});


distube.on("addSong", (queue, song) => {
	try {
		// console.log(song)
		queue.textChannel.send({
			embeds: [
				new EmbedBuilder()
					
					.setAuthor({ name: `Add song` })
					.setColor(`${config.Colour}`)
					.setThumbnail(`${song.stream.playFromSource? `https://img.youtube.com/vi/${song.id}/mqdefault.jpg` : song.thumbnail || song.stream.song.thumbnail}`)
					.setDescription(`**[${song.name}](${song.url})**`)
					.setFooter({
						text: `Added by ${song.user.username}   |  Duration: [${song.formattedDuration}]`,
						iconURL: song.user.avatarURL(),
					}),
			],
		},
			console.log(`addSong ${song.name}\nStreamUrl: ${song.stream.playFromSource? song.stream.url : song.stream.song}`, `${song.streamURL}`, `${song.stream}`)
		);
	} catch (err) {
		console.log(err);
	}
});

distube.on("playList", (message, queue, playlist, song) => {
	try {
		queue.textChannel.send(
			{
				embeds: [
					new EmbedBuilder()

						.setAuthor({ name: `Playling playlist` })
						.setThumbnail(`${song.stream.playFromSource? `https://img.youtube.com/vi/${newQueue.songs[0].id}/mqdefault.jpg`: song.thumbnail || song.stream.song.thumbnail}`)
						.setColor(`${config.Colour}`)
						.addFields(
							{
								name: "Playlist:",
								value: `\`${playlist.name}\`  -  \`${playlist.songs.length} songs\``,
								inline: true,
							},
							{
								name: "playing Song:",
								value: `\`${song.name}\`  -  \`${song.formattedDuration}\``,
								inline: true,
							}
						)
						.setFooter({
							text: `Added by  ${song.user.username}`,
							iconURL: song.user.avatarURL(),
						}),
				],
			},
			console.log(`playList ${playlist.name} - ${playlist.songs.length}`)
		);
	} catch (err) {
		console.log(err);
	}
});

distube.on("addList", (queue, playlist) => {
	try {
		queue.textChannel.send(
			{
				embeds: [
					new EmbedBuilder()

						.setAuthor({ name: `Add List` })
						.setThumbnail(`${queue.songs[0].stream.playFromSource? `https://img.youtube.com/vi/${queue.songs[0].id}/mqdefault.jpg`: queue.songs[0].thumbnail || queue.songs[0].stream.song.thumbnail}`)
						.setColor(`${config.Colour}`)
						.setDescription(`**Added [${playlist.name}](${playlist.url}) playlist (${playlist.songs.length}) songs**`)
						.setFooter({
							text: `Added by ${playlist.user.username}   |  Duration: [${playlist.formattedDuration}]`,
							iconURL: playlist.user.avatarURL(),
						}),
				],
			},
			console.log(`addList ${playlist.name} - ${playlist.songs.length - 1}`)
		);
	} catch (err) {
		console.log(err);
	}
});

distube.on("noRelated", (queue) => {
	try {
		console.log("Can't find related video to play.");
	} catch (err) {
		console.log(err);
	}
});

distube.on("error", (e, queue, song) => {
	try {
		var embed = new EmbedBuilder()
			.setAuthor({ name: `Error` })
			.setColor("#470000")
			.setDescription(e);
		queue.textChannel.send({ embeds: [embed] })
	} catch (err) {
		console.log(e);
	}
});

distube.on(`deleteQueue`, (queue) => {
	try {

		var embed = new EmbedBuilder()
			.setAuthor({ name: `Finish Queue` })
			.setColor(`${config.Colour}`)
			.setDescription(`There are no more songs to play.\nYou can activate \`/autoplay\` so that the queue never ends`)
		queue.textChannel.messages
			.fetch(PlayerMap.get(`currentmsg`))
			.then((currentSongPlayMsg) => {
				setTimeout(() => {
					if (queue.songs.length == 0) {
						currentSongPlayMsg.edit({ embeds: [embed], components: [] })
					}
				}, 1000)
			}).catch((e) => { }),
			console.log(`finish queue`);
	} catch (err) {
		console.log(err);
	}
});

distube.on("finish", (queue) => {
	try {
		queue.textChannel.messages
			.fetch(PlayerMap.get(`currentmsg`))
			.then((currentSongPlayMsg) => {
				setTimeout(() => {
					currentSongPlayMsg.edit({ components: [] })
				}, 1000)
			}).catch((e) => { }),
			console.log(`finish`);
	} catch (err) {
		console.log(err);
	}
});

distube.on(`finishSong`, (queue, song) => {
	try {
		var embed = new EmbedBuilder()
			.setAuthor({ name: `Finish Song` })
			.setThumbnail(`${song.stream.playFromSource? `https://img.youtube.com/vi/${song.id}/mqdefault.jpg`: song.thumbnail || song.stream.song.thumbnail}`)
			.setColor(`${config.Colour}`)
			.setDescription(`**[${song.name}](${song.url})**\n`)
			.setFooter({
				text: `Added by ${song.user.username}  |  Duration: [${song.formattedDuration}]`,
				iconURL: song.user.avatarURL(),
			});
		queue.textChannel.messages
			.fetch(PlayerMap.get(`currentmsg`))
			.then((currentSongPlayMsg) => {
				setTimeout(() => {
					currentSongPlayMsg?.edit({ embeds: [embed], components: [] })
				}, 1000)
			}).catch((e) => { }),

			console.log(queue.formattedCurrentTime, song.currentTime);
			console.log(`finishSong ${song.name}`);
	} catch (err) {
		console.log(err);
	}
});

distube.on("disconnect", (queue) => {
	try {
		queue.textChannel.messages
			.fetch(PlayerMap.get(`currentmsg`))
			.then((currentSongPlayMsg) => {
				setTimeout(() => {
					currentSongPlayMsg.edit({ components: [] })
				}, 1000)
			}).catch((e) => { }),
			console.log(`The voice channel is Disconnected! Leaving the voice channel!`);
	} catch (err) {
		console.log(err);
	}
});

distube.on("empty", (queue) => {
	try {
		queue.textChannel.messages
			.fetch(PlayerMap.get(`currentmsg`))
			.then((currentSongPlayMsg) => {
				setTimeout(() => {
					currentSongPlayMsg.edit({ components: [] })
				}, 1000)
			}).catch((e) => { }),
			console.log(`The voice channel is empty! Leaving the voice channel!`);
	} catch (err) {
		console.log(err);
	}
});

// DisTubeOptions.searchSongs > 1
distube.on("searchResult", (message, result) => {
	try {
		let i = 0;
		message.channel.send({
			embeds: [
				new EmbedBuilder()
					.setColor(`${config.Colour}`)
					.setDescription(
						`${result
							.map(
								(song) =>
									`**${++i}**. ${song.name} - \`${song.formattedDuration}\``
							)
							.join("\n")}`
					)
					.setFooter({
						text: `Enter anything else or wait 30 seconds to cancel`,
					}),
			],
			content: `Choose an option from below`,
		});
	} catch (err) {
		console.log(err);
	}
});

distube.on("searchCancel", (message) => {
	try {
		message.channel.send("Searching canceled");
	} catch (err) {
		console.log(err);
	}
});

distube.on("searchInvalidAnswer", (message) => {
	try {
		message.channel.send("Invalid number of result.");
	} catch (err) {
		console.log(err);
	}
});

distube.on("searchNoResult", (message) => {
	try {
		message.channel.send("No result found!");
	} catch (err) {
		console.log(err);
	}
});

distube.on("searchDone", () => { });

function receiveQueueData(newQueue, newTrack, pauseStyle, songRepeatStyle, queueRepeatStyle) {
	try {
		if (!newTrack) return textChannel.send({ content: `No song found!` });
		const streamURL = newTrack.stream.playFromSource ? newTrack.stream.url : newTrack.stream.song.stream.url
		var embed = new EmbedBuilder()

			.setAuthor({ name: `Now Playing` })
			.setColor(`${config.Colour}`)
			.setThumbnail(`${newTrack.stream.playFromSource? `https://img.youtube.com/vi/${newQueue.songs[0].id}/mqdefault.jpg`: newTrack.thumbnail || newTrack.stream.song.thumbnail}`)
			.setDescription(`**[${newTrack.name}](${newTrack.url})**`)
            embed.addFields({
				name: `Uploader Name`,
				value: `${newTrack.uploader.name}`,
				inline: true,
			 })
			/*
			.addFields({
				name: `Download Song`,
				value: `[Click here](${newTrack.streamURL})`,
				inline: true,
			})
			*/
			/*
			.addFields({
				name: `Uploader Name`,
				value: `${newTrack.uploader})`,
				inline: true,
			})
			*/
			embed.addFields({
				name: `Current Duration:`,
				value: `\`[${newQueue.formattedCurrentTime? newQueue.formattedCurrentTime : '01:00'}/${newTrack.formattedDuration}]\``,
				inline: true,
			})
			embed.setFooter({
				text: `Added by ${newTrack.user.username}  |  Queue length: ${newQueue.songs.length - 1} `,
				iconURL: newTrack.user.avatarURL(),
			});		

			let pause = new ButtonBuilder()
			.setStyle("Secondary")
			.setCustomId("3")
			.setEmoji("1031533069238292520");
		let forward = new ButtonBuilder()
			.setStyle("Secondary")
			.setCustomId("8")
			.setLabel(`+10`) //.setEmoji("1024997006382473288");
		 let rewind = new ButtonBuilder()
			 .setStyle("Secondary")
			 .setCustomId("9")
			 .setLabel(`-10`) //.setEmoji("1024997936196751430");
		let skip = new ButtonBuilder()
			.setStyle("Secondary")
			.setCustomId("10")
			.setEmoji("1172809520867704852"); 
		let previous = new ButtonBuilder()
			.setStyle("Secondary")
			.setCustomId("13")
			.setEmoji("1172809479528661062");
		let Loop = new ButtonBuilder()
			.setStyle("Secondary")
			.setCustomId("14")
			.setEmoji("1031534634850320464");
		let disLoop = new ButtonBuilder()
			.setStyle("Secondary")
			.setCustomId("15")
			.setEmoji("1172849381297360976");
		 let lyrics = new ButtonBuilder()
			.setEmoji("1176563340403822693") //.setLabel('lyrics')
			.setCustomId("16")
			.setStyle('Secondary')
		let stop = new ButtonBuilder()
			.setEmoji("1025005229848154112") //.setLabel('Stop')
			.setCustomId("stop")
			.setStyle('Secondary');
		let Shuffle = new ButtonBuilder()
			.setEmoji("1025002020043771934") //.setLabel('Stop')
			.setCustomId("shuffle")
			.setStyle('Secondary');
		
		if (newQueue.paused) pause.setStyle(ButtonStyle.Danger)
			else pause.setStyle(ButtonStyle.Secondary)
		if (newQueue.repeatMode == "1") {
			Loop.setStyle(ButtonStyle.Success)
			disLoop.setStyle(ButtonStyle.Secondary)
		} else if (newQueue.repeatMode == "2") {
			disLoop.setStyle(ButtonStyle.Success)
			Loop.setStyle(ButtonStyle.Secondary)
		} else {
			disLoop.setStyle(ButtonStyle.Secondary)
			Loop.setStyle(ButtonStyle.Secondary)
		}
		const row = new ActionRowBuilder().addComponents([
	  		Loop,
      		previous,
	  		pause,
      		skip,
      		disLoop,
		]);

		const row1 = new ActionRowBuilder().addComponents([
			rewind,
			forward,
			stop,
			lyrics,
			Shuffle,
		]);
   
    

		return {
			embeds: [embed],
			components: [row, row1],
		};
	} catch (err) {
		console.log(err);
	}
}

module.exports = distube;
