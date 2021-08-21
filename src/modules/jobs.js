import rssToJson from 'rss-to-json';
import crypto from 'crypto';
import { MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { registerCommandModule } from '../utils/commands.js';

const { parse } = rssToJson;

const jobs = {};

const fetchJobsFeedForQuery = async (query) => {
  try {
    const rss = await parse(`https://rss.indeed.com/rss?q=${query}`);
    const results = rss.items.reduce((accumulator, current) => {
      const hash = crypto.createHash('md5').update(current.title).digest('hex');
      accumulator[hash] = current;
      return accumulator;
    }, {});
    jobs[query] = results;
  } catch (e) { }
};

const hasJobsForQuery = (query) => {
  return jobs[query] && Object.keys(jobs[query]).length > 0;
};

const jobsCommand = new SlashCommandBuilder()
  .setDescription('List and how job result for your query')
  .addStringOption(option => option.setName('query').setDescription('the job title to search for').setRequired(true))
  .addIntegerOption(option => option.setName('page').setDescription('The page number to display'));

const jobsCommandHandler = async (interaction) => {
  const query = interaction.options.getString('query');
  const page = interaction.options.getInteger('page') ?? 1;

  if (!hasJobsForQuery(query)) {
    await fetchJobsFeedForQuery(query);
  }
  const start = (page - 1) * 5;
  const end = (page - 1) * 5 + 5;
  const totalPages = Math.ceil(Object.keys(jobs[query]).length / 5);

  const jobsForQuery = Object.values(jobs[query]).slice(start, end);
  const content = `Results for Query: ${query} - Page ${page} of ${totalPages}`;

  const embeds = [];
  jobsForQuery.forEach(job => {
    const link = job.link.replaceAll('&amp;', '&');
    const throwAwayStart = job.description.indexOf('&lt;br>');
    const description = job.description.slice(0, throwAwayStart);
    embeds.push(new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(job.title)
      .setURL(link)
      .setDescription(decodeURI(description)));
  });
  await interaction.reply({ content, embeds, ephemeral: true });
};

registerCommandModule('jobs', jobsCommand, jobsCommandHandler);
