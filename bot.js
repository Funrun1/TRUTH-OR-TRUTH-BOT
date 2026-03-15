const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const OpenAI = require('openai');

// ─── CONFIG ───────────────────────────────────────────────
const DISCORD_TOKEN  = process.env.DISCORD_TOKEN;
const CLIENT_ID      = process.env.CLIENT_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// ──────────────────────────────────────────────────────────

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const openai  = new OpenAI({ apiKey: OPENAI_API_KEY });

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
          { name: 'Personal',   value: 'spicy' },
          { name: 'Deep',        value: 'deep' },
        )),

  new SlashCommandBuilder()
    .setName('tot')
    .setDescription('Truth or Truth — AI picks a random truth question for you!')
    .addStringOption(opt =>
      opt.setName('vibe')
        .setDescription('Choose the vibe')
        .addChoices(
          { name: 'Fun & clean', value: 'fun' },
          { name: 'Personal',   value: 'spicy'},
          { name: 'Deep',        value: 'deep' },
          { name: 'Random',      value: 'random' },
        )),
];

// Register slash commands on startup
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
    random: ['fun, light-hearted', 'flirty and spicy', 'deep and introspective'][Math.floor(Math.random() * 3)],
  };

  const vibeDesc = vibeDescriptions[vibe] || vibeDescriptions['fun'];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Generate ONE creative and interesting truth question for a "Truth or Truth" game. Vibe: ${vibeDesc}. Return only the question itself — no quotes, no numbering, no extra text.`
    }],
    max_tokens: 150,
    temperature: 0.95,
  });

  return response.choices[0].message.content.trim();
}

// ─── Event: ready ─────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
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

    const embed = new EmbedBuilder()
      .setColor(0x7F77DD)
      .setTitle('🤔 TRUTH')
      .setDescription(question)
      .setFooter({ text: `Asked to ${interaction.user.username} • Truth or Truth • vibe: ${vibe}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.error('Error generating question:', err);
    await interaction.editReply('❌ Something went wrong. Check your API keys and try again!');
  }
});

client.login(DISCORD_TOKEN);
