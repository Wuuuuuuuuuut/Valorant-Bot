const { ApplicationCommandType, PermissionsBitField, ChannelType, ApplicationCommandOptionType, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, EmbedBuilder } = require("discord.js")
const config = require("../../Credentials/Config")
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const HenrikDevValorantAPI = require('unofficial-valorant-api');
const VAPI = new HenrikDevValorantAPI();

module.exports = {
    name: "rank",
    description: "Valorant profile checker.",
    options: [
        {
            name: "user",
            description: "Valorant username",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "tag",
            description: "Valorant tag",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "region",
            description: "Valorant region",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                {
                    name: "Brazil",
                    value: "br"
                },
                {
                    name: "Europe",
                    value: "eu"
                },
                {
                    name: "Korea",
                    value: "kr"
                },
                {
                    name: "Latin America",
                    value: "latam"
                },
                {
                    name: "North America",
                    value: "na"
                },
                {
                    name: "Southeast Asia/ Asia - Pacific",
                    value: "ap"
                }
            ],
        },
    ],
    run: async (DiscordClient, interaction) => {
        interaction.deferReply({ ephemeral: true })
        setTimeout(async () => {
            const user = interaction.options.getString('user')
            const tag = interaction.options.getString('tag')
            const region = interaction.options.getString('region')
            let text = '';
            let dmtext = '';
            const data = await VAPI.getMatches({ region: region, name: user, tag: tag, size: 5, filter: 'competitive' })
            const dmdata = await VAPI.getMatches({ region: region, name: user, tag: tag, size: 5, filter: 'deathmatch' })
            if (data.status == 404) return interaction.editReply({ content: "No player found with the given information." });
            let playerKills = 0; let playerDeaths = 0;
            for (let i = 0; i < data.data.length; i++) {
                for (let k = 0; k < data.data[i].players['all_players'].length; k++) {
                    if (data.data[i].players['all_players'][k].name == user && data.data[i].players['all_players'][k].tag == tag) {
                        text = text + `${data.data[i].players['all_players'][k].character}, ${data.data[i].players['all_players'][k].stats['kills']} Kills, ${data.data[i].players['all_players'][k].stats['deaths']} Deaths, ${data.data[i].players['all_players'][k].stats['assists']} Assists\n`
                    }
                }
                for (let j = 0; j < data.data[i].kills.length; j++) {
                    if (data.data[i].kills[j].killer_display_name == `${user}#${tag}`) {
                        playerKills += 1
                    }
                    if (data.data[i].kills[j].victim_display_name == `${user}#${tag}`) {
                        playerDeaths += 1
                    }
                }
            }
            let dmplayerKills = 0; let dmplayerDeaths = 0;
            for (let i = 0; i < dmdata.data.length; i++) {
                for (let k = 0; k < dmdata.data[i].players['all_players'].length; k++) {
                    if (dmdata.data[i].players['all_players'][k].name == user && dmdata.data[i].players['all_players'][k].tag == tag) {
                        dmtext = dmtext + `${dmdata.data[i].players['all_players'][k].character}, ${data.data[i].players['all_players'][k].stats['kills']} Kills, ${data.data[i].players['all_players'][k].stats['deaths']} Deaths, ${data.data[i].players['all_players'][k].stats['assists']} Assists\n`
                    }
                }
                for (let j = 0; j < dmdata.data[i].kills.length; j++) {
                    if (dmdata.data[i].kills[j].killer_display_name == `${user}#${tag}`) {
                        dmplayerKills += 1
                    }
                    if (dmdata.data[i].kills[j].victim_display_name == `${user}#${tag}`) {
                        dmplayerDeaths += 1
                    }
                }
            }
            let kd = playerKills / playerDeaths
            const MMR = await VAPI.getMMR({ version: 'v2', region: region, name: user, tag: tag })
            let highestrank = MMR.data.highest_rank.season.replace('e', 'Episode, ').replace('a', ' Act')
            const embed = new EmbedBuilder()
                .setThumbnail(MMR.data.current_data.images['small'])
                .setAuthor({ name: `${MMR.data.name}#${MMR.data.tag}'s Profile [EU]`, iconURL: interaction.guild.iconURL() })
                .setDescription(`Performance Overview

                Current Rank: **${MMR.data.current_data.currenttierpatched}** - *${MMR.data.current_data.ranking_in_tier} RR*
                --------------------------------------------------
                Highest Rank: **${MMR.data.highest_rank.patched_tier}** - *${highestrank}*

                **Stats the past 5 games**
                AVG. K/D: **${Number.parseFloat(kd).toFixed(2)}**
                Kills: **${playerKills}**
                Deaths: **${playerDeaths}**
                `)
                .addFields({ name: 'Past 5 Competitive Games', value: "```Agent, Kills, Deaths, Assists\n" + text + "```", inline: false })
                .addFields({ name: 'Past 5 Deathmatch Games', value: "```Agent, Kills, Deaths, Assists\n" + dmtext + "```", inline: false })
            interaction.editReply({ embeds: [embed] })
        }, 3000)
    }
}