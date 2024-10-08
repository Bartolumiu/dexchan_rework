const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const translateAttribute = require('../../functions/handlers/translateAttribute');
const fs = require('fs');

module.exports = {
    global: true,
    data: async () => {
        const localizations = {
            description: await translateAttribute('settings', 'description'),
            subcommand_groups: [
                { // Locale
                    description: await translateAttribute('settings', 'subcommand_groups[0].description'),
                    subcommands: [
                        { // Set locale
                            description: await translateAttribute('settings', 'subcommand_groups[0].subcommands[0].description'),
                            options: [
                                {
                                    description: await translateAttribute('settings', 'subcommand_groups[0].subcommands[0].options[0].description')
                                }
                            ]
                        },
                        { // Reset locale
                            description: await translateAttribute('settings', 'subcommand_groups[0].subcommands[1].description')
                        }
                    ]
                },
                { // View settings
                    description: await translateAttribute('settings', 'subcommand_groups[1].description')
                }
            ]
        }
        return new SlashCommandBuilder()
            .setName('settings')
            .setDescription('Change your settings')
            .setDescriptionLocalizations(localizations.description)
            .addSubcommandGroup(group =>
                group.setName('locale')
                    .setDescription('Your preferred locale')
                    .setDescriptionLocalizations(localizations.subcommand_groups[0].description)
                    .addSubcommand(command =>
                        command.setName('set')
                            .setDescription('Set your preferred locale')
                            .setDescriptionLocalizations(localizations.subcommand_groups[0].subcommands[0].description)
                            .addStringOption(option =>
                                option.setName('locale')
                                    .setDescription('The language you want to set as your preferred language')
                                    .setDescriptionLocalizations(localizations.subcommand_groups[0].subcommands[0].options[0].description)
                                    .setAutocomplete(true)
                                    .setRequired(true)
                            )
                    )
                    .addSubcommand(command =>
                        command.setName('reset')
                            .setDescription('Reset your preferred locale')
                            .setDescriptionLocalizations(localizations.subcommand_groups[0].subcommands[1].description)
                    ),
            )
            .addSubcommand(command =>
                command.setName('view')
                    .setDescription('View your settings')
                    .setDescriptionLocalizations(localizations.subcommand_groups[1].description)
            );
    },
    async execute(interaction, client) {
        const userProfile = await client.getMongoUserData(interaction.user);
        const embed = new EmbedBuilder();
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        if (subcommandGroup === 'locale') await localeSettings(interaction, client, userProfile, embed);
        else if (subcommand === 'view') await viewSettings(interaction, client, userProfile, embed);

        embed.setFooter({ text: await client.translate((userProfile.preferredLocale || interaction.locale), 'commands', 'settings.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username }), iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
        interaction.reply({ embeds: [embed], ephemeral: true });
    },
    async autocomplete(interaction) {
        const subcommandGroup = interaction.options.getSubcommandGroup().toLowerCase();
        const subcommand = interaction.options.getSubcommand().toLowerCase();

        if (subcommandGroup === 'locale' && subcommand === 'set') {
            const locales = await getLocaleList(interaction);
            return interaction.respond(locales);
        }
    }
}

async function getLocaleList(interaction) {
    // Current working directory for fs
    //process.chdir('./src');
    console.log(process.cwd());
    // Get locale files
    const files = fs.readdirSync(__dirname+'/../../locales').filter(file => file.endsWith('.json'));
    const locales = files.map(file => file.split('.')[0]);
    // Read locale files and get the locale name
    const localeList = locales.map(locale => {
        const localeData = require(__dirname+`/../../locales/${locale}.json`);
        return {
            name: `${localeData.locale.name} (${localeData.locale.code})`,
            value: localeData.locale.code
        }
    });

    return localeList;
}

/**
 * Handles locale settings for a user profile based on the interaction subcommand.
 *
 * @param {Object} interaction - The interaction object from the Discord API.
 * @param {Object} client - The Discord client instance.
 * @param {Object} userProfile - The user profile object containing user settings.
 * @param {Object} embed - The embed object used to send responses.
 */
async function localeSettings(interaction, client, userProfile, embed) {
    switch (interaction.options.getSubcommand()) {
        case 'set':
            try {
                const locale = interaction.options.getString('locale');
                userProfile.preferredLocale = locale; // Set the user's preferred locale
                await userProfile.save();
                embed.setTitle(await client.translate(userProfile.preferredLocale, 'commands', 'settings.subcommand_groups[0].subcommands[0].response.title.success'));
                embed.setDescription(await client.translate(userProfile.preferredLocale, 'commands', 'settings.subcommand_groups[0].subcommands[0].response.description.success', { locale: locale }));
                embed.setColor(Colors.Green);
            } catch (e) {
                embed.setTitle(await client.translate(userProfile.preferredLocale, 'commands', 'settings.subcommand_groups[0].subcommands[0].response.title.error'));
                embed.setDescription(await client.translate(userProfile.preferredLocale, 'commands', 'settings.subcommand_groups[0].subcommands[0].response.description.error'));
                embed.setColor(Colors.Red);
            }
            break;
        case 'reset':
            try {
                userProfile.preferredLocale = null;
                await userProfile.save();
                embed.setTitle(await client.translate(interaction.locale, 'commands', 'settings.subcommand_groups[0].subcommands[1].response.title.success'));
                embed.setDescription(await client.translate(interaction.locale, 'commands', 'settings.subcommand_groups[0].subcommands[1].response.description.success'));
                embed.setColor(Colors.Green);
            } catch (e) {
                if (userProfile.preferredLocale) {
                    embed.setTitle(await client.translate(userProfile.preferredLocale, 'commands', 'settings.subcommand_groups[0].subcommands[1].response.title.error'));
                    embed.setDescription(await client.translate(userProfile.preferredLocale, 'commands', 'settings.subcommand_groups[0].subcommands[1].response.description.error'));
                } else {
                    embed.setTitle(await client.translate(interaction.locale, 'commands', 'settings.subcommand_groups[0].subcommands[1].response.title.error'));
                    embed.setDescription(await client.translate(interaction.locale, 'commands', 'settings.subcommand_groups[0].subcommands[1].response.description.error'));
                }
                embed.setColor(Colors.Red);
            }
            break;
        default:
            break;
    }
}

/**
 * Displays the user settings in an embedded message.
 *
 * @param {Object} interaction - The interaction object from the Discord API.
 * @param {Object} client - The Discord client instance.
 * @param {Object} userProfile - The user's profile containing their settings.
 * @param {Object} embed - The embed object to format the message.
 */
async function viewSettings(interaction, client, userProfile, embed) {
    const locale = userProfile.preferredLocale || interaction.locale;
    embed.setTitle(await client.translate(locale, 'commands', 'settings.subcommands[0].response.title'));
    embed.setDescription(await client.translate(locale, 'commands', 'settings.subcommands[0].response.description', { locale: locale }));
    embed.addFields(
        {
            name: await client.translate(locale, 'commands', 'settings.subcommands[0].response.fields[0].name'),
            value: await client.translate(locale, 'commands', 'settings.subcommands[0].response.fields[0].value', { locale: locale }),
            inline: true
        }
    )
    embed.setColor(Colors.Blue);
}