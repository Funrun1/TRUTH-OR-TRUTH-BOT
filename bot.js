require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Groq = require('groq-sdk');

// ─── CONFIG ───────────────────────────────────────────────
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID     = process.env.CLIENT_ID;
const GROQ_API_KEY  = process.env.GROQ_API_KEY;
// ──────────────────────────────────────────────────────────

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const groq = new Groq({ apiKey: GROQ_API_KEY });

// ─── Slash commands ───────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName('truth')
    .setDescription('Get an AI-generated truth question')
    .addStringOption(opt =>
      opt.setName('vibe')
        .setDescription('Choose the vibe')
        .addChoices(
          { name: 'Fun & clean', value: 'fun' },
          { name: 'Spicy', value: 'spicy' },
          { name: 'Deep', value: 'deep' },
        )),

  new SlashCommandBuilder()
    .setName('tot')
    .setDescription('Truth or Truth — AI picks a random truth question for you!')
    .addStringOption(opt =>
      opt.setName('vibe')
        .setDescription('Choose the vibe')
        .addChoices(
          { name: 'Fun & clean', value: 'fun' },
          { name: 'Spicy', value: 'spicy' },
          { name: 'Deep', value: 'deep' },
          { name: 'Random', value: 'random' },
        )),
];

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  try {
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(c => c.toJSON()) });
    console.log('Slash commands registered!');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
}

// ─── AI prompt helper ─────────────────────────────────────
async function getTruthQuestion(vibe) {
  const vibeDescriptions = {
    fun:    'fun, light-hearted, and suitable for a friend group of any age',
    spicy:  'flirty and a little spicy — for adults, suggestive but not explicit',
    deep:   'deep, thoughtful, and introspective — makes people really reflect',
    random: ['fun and light-hearted', 'flirty and spicy', 'deep and introspective'][Math.floor(Math.random() * 3)],
  };

  const vibeDesc = vibeDescriptions[vibe] || vibeDescriptions['fun'];

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `Generate ONE creative and interesting truth question for a "Truth or Truth" game. Vibe: ${vibeDesc}. Return only the question itself — no quotes, no numbering, no extra text.`
    }],
    max_tokens: 150,
    temperature: 0.95,
  });

  return response.choices[0].message.content.trim();
}

// ─── Build embed + button ─────────────────────────────────
function buildEmbed(question, username, vibe) {
  return new EmbedBuilder()
    .setColor(0x7F77DD)
    .setTitle('TRUTH')
    .setDescription(question)
    .setFooter({ text: `Asked to ${username} • Truth or Truth • vibe: ${vibe}` })
    .setTimestamp();
}

function buildButton(vibe) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`next_${vibe}`)
      .setLabel('Next Question')
      .setStyle(ButtonStyle.Primary)
  );
}

// ─── Attach a collector to a message ─────────────────────
function attachCollector(message, embed, vibe) {
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    max: 1, // fires once then stops — no timeout
  });

  collector.on('collect', async (btn) => {
    await btn.deferUpdate();

    // Remove button from clicked message
    await btn.editReply({ embeds: [embed], components: [] });

    try {
      const nextQuestion = await getTruthQuestion(vibe);
      const nextEmbed = buildEmbed(nextQuestion, btn.user.username, vibe);
      const nextButton = buildButton(vibe);
      const nextMsg = await btn.followUp({ embeds: [nextEmbed], components: [nextButton] });
      attachCollector(nextMsg, nextEmbed, vibe);
    } catch (err) {
      console.error('Error generating next question:', err);
    }
  });
}

// ─── Event: ready ─────────────────────────────────────────
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  registerCommands();
});

// ─── Event: interaction ───────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  if (!['truth', 'tot'].includes(commandName)) return;

  await interaction.deferReply();

  try {
    const vibe = interaction.options.getString('vibe') || (commandName === 'tot' ? 'random' : 'fun');
    const question = await getTruthQuestion(vibe);
    const embed = buildEmbed(question, interaction.user.username, vibe);
    const button = buildButton(vibe);
    const msg = await interaction.editReply({ embeds: [embed], components: [button] });
    attachCollector(msg, embed, vibe);
  } catch (err) {
    console.error('Error generating question:', err);
    await interaction.editReply('Couldn\'t generate a question — please try again!');
  }
});

client.login(DISCORD_TOKEN);
