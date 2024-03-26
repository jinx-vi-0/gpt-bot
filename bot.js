require("dotenv/config");
const { Client } = require("discord.js");
const { OpenAI } = require("openai");

const client = new Client({
  intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent"],
});

client.on("ready", () => {
  console.log("The bot is online");
});

const openai = new OpenAI({
  apiKey: process.env.OpenAI_kEY,
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.mentions.users.has(client.user.id)) return;

  await message.channel.sendTyping();

  const sendTypingInterval = setInterval(() => {
    message.channel.sendTyping();
  }, 5000);

  let conversation = [];
  conversation.push({
    role: "system",
    content: "Ask Me Anything",
  });

  try {
    let prevMessages = await message.channel.messages.fetch({ limit: 10 });

    // Convert MessageManager to an array of Message objects
    prevMessages = prevMessages.map(msg => msg);

    prevMessages.reverse();

    prevMessages.forEach((msg) => {
      if (msg.author.bot && msg.author.id !== client.user.id) return;

      const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

      if (msg.author === client.user.id) {
        conversation.push({
          role: 'assistant',
          name: username,
          content: msg.content,
        });
        return;
      }

      conversation.push({
        role: 'user',
        name: username,
        content: msg.content,
      });
    });

    const response = await openai.chat.completions
      .create({
        model: "gpt-3.5-turbo",
        messages: conversation,
      });

    clearInterval(sendTypingInterval);

    if (!response) {
      message.reply("I'm facing some trouble with OpenAI, Try Again!");
      return;
    }

    const responseMessage = response.choices[0].message.content;
    const chunkSizeLimit = 2000;

    for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
      const chunk = responseMessage.substring(i, i + chunkSizeLimit);
      await message.reply(chunk);
    }
  } catch (error) {
    console.error(error);
    clearInterval(sendTypingInterval);
    message.reply("An error occurred. Please try again later.");
  }
});


client.login(process.env.TOKEN);
