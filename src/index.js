// configure enviroment variables before anything else
require('dotenv').config();

const client = require('./discord-client');

client.on('ready', () => {
  console.log('client connected and ready');
});

client.on('messageCreate', message => {
  if (!message.author.bot && message.content.toLowerCase().includes('hello')) {
    message.reply('G`Day Mate!');
  }
});
