const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const translateAttribute = require('../../functions/handlers/translateAttribute');

module.exports = {
    global: true,
    data: async () => {
        const localizations = {
            description: await translateAttribute('help', 'description')
        };
        return new SlashCommandBuilder()
            .setName('help')
            .setDescription('Get help with using the bot')
            .setDescriptionLocalizations(localizations.description);
    },
    async execute(interaction, client) {
        const userSettings = await client.getMongoUserData(interaction.user);
        const locale = userSettings.preferredLocale || interaction.locale;

        const title = client.translate(locale, 'commands', 'help.response.title');
        const description = client.translate(locale, 'commands', 'help.response.description');
        const fields = client.translate(locale, 'commands', 'help.response.fields');
        const footer = client.translate(locale, 'commands', 'help.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username });

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .addFields(fields)
            .setColor(Colors.Blurple)
            .setFooter({ text: footer, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}