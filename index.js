require("dotenv").config();
const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const { commands } = require("./commands");
const connectDB = require("./config/database");

// Connect to MongoDB
connectDB();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = "h!";

// Function to remove all slash commands
async function removeSlashCommands() {
  try {
    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN
    );

    console.log("Started removing slash commands...");

    // Remove global commands
    await rest.put(Routes.applicationCommands(client.user.id), { body: [] });

    console.log("Successfully removed all slash commands.");
  } catch (error) {
    console.error("Error removing slash commands:", error);
  }
}

client.once("ready", async () => {
  console.log("Bot is ready!");
  console.log("Loaded commands:", commands.map((cmd) => cmd.name).join(", "));

  // Remove slash commands when bot starts
  await removeSlashCommands();
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    console.log(`Command received: ${commandName}, Args:`, args); // Debug log

    const command = commands.find((cmd) => cmd.name === commandName);
    if (!command) {
      console.log(`Command not found: ${commandName}`); // Debug log
      return;
    }

    console.log(`Executing command: ${command.name}`); // Debug log
    await command.execute(message, args);
  } catch (error) {
    console.error("Error handling message:", error);
    message.channel
      .send("Có lỗi xảy ra khi thực hiện lệnh!")
      .catch(console.error);
  }
});

client.login(process.env.DISCORD_TOKEN);
