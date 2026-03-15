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

// ─── Random helpers ───────────────────────────────────────
const topics = [
  'childhood memories', 'embarrassing moments', 'secret crushes', 'biggest fears',
  'family drama', 'friendship betrayals', 'romantic experiences', 'weird habits',
  'biggest regrets', 'unpopular opinions', 'guilty pleasures', 'biggest lies told',
  'awkward situations', 'dreams and ambitions', 'jealousy', 'insecurities',
  'first times', 'money and success', 'social media behavior', 'petty thoughts',
  'things you pretend to like', 'things you secretly judge people for',
  'most rebellious moments', 'strangest beliefs', 'biggest mistakes',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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
    fun:    'fun and light-hearted',
    spicy:  'flirty and a little spicy for adults',
    deep:   'deep and personal',
    random: pick(['fun and light-hearted', 'flirty and spicy', 'deep and personal']),
  };

  const vibeDesc = vibeDescriptions[vibe] || vibeDescriptions['fun'];
  const topic = pick(topics);

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `Write a single truth question for a Truth or Truth game.

Rules:
- MUST be a question (end with a ?)
- ONE sentence only, short and easy to read
- Thought provoking — makes the person pause and think honestly about themselves
- About: ${topic}
- Vibe: ${vibeDesc}
- No complicated words, no long sentences
- Do not start with "Have you ever" every time — vary the phrasing

Return only the question. Nothing else.`
    }],
    max_tokens: 60,
    temperature: 1.0,
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
    max: 1,
  });

  collector.on('collect', async (btn) => {
    await btn.deferUpdate();
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
