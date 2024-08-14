const { SlashCommandBuilder, EmbedBuilder } = require("@discordjs/builders");
const { Colors, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot\'s latency')
        .setDefaultMemberPermissions(PermissionFlagsBits.AttachFiles),
    global: true,
    async execute(interaction, client) {
        // Get user's locale
        const locale = interaction.locale;

        const content = client.translate(locale, 'commands', 'ping.response.ping');
        const message = await interaction.deferReply({ content: content, fetchReply: true });

        // Calculate the latency
        const ping = message.createdTimestamp - interaction.createdTimestamp;

        // Fetch other translations (if not found, use English as default)
        const title = client.translate(locale, 'commands', 'ping.response.title');
        const field1name = client.translate(locale, 'commands', 'ping.response.fields[0].name');
        const field2name = client.translate(locale, 'commands', 'ping.response.fields[1].name');
        const field1value = client.translate(locale, 'commands', 'ping.response.fields[0].value', { ping: ping });
        const field2value = client.translate(locale, 'commands', 'ping.response.fields[1].value', { apiPing: client.ws.ping });
        const footer = client.translate(locale, 'commands', 'ping.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username });

        // Build and send the embed
        const embed = new EmbedBuilder()
            .setTitle(title)
            .addFields(
                {
                    name: field1name,
                    value: field1value,
                    inline: true
                },
                {
                    name: field2name,
                    value: field2value,
                    inline: true
                }
            )
            .setFooter({ text: footer, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setColor(Colors.Blurple)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
}