import axios from "axios";
import { Client, Intents } from "discord.js";
import * as cron from "node-cron";
import "dotenv/config";

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

/**
 * Fetch the Bitcoin confidence data from https://cbbi.info
 */
const fetchBitcoinConfidence = async () => {
  try {
    const { data } = await axios.get(process.env.API_URL);
    console.info(`Data fetched for Bitcoin confidence!`);
    const { Confidence, Price } = data;

    if (data) {
      // We only want the data for Confidence and Price
      return { Confidence, Price };
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * Get the latest value based on the last key-value pair in the object
 *
 * @param data
 */
const getLatestData = (data) => {
  const keys = Object.keys(data);
  return data[keys[keys.length - 1]];
};

/**
 * Manipulate and show the relevant info in the Discord bot
 *
 * @param data
 */
const showIndexAndPrice = async (data) => {
  const { Confidence, Price } = data;

  const latestConfidenceData = getLatestData(Confidence);
  const latestPriceData = getLatestData(Price);

  const formattedBitcoinBullIndex = (latestConfidenceData * 100).toFixed(0);
  const formattedBitcoinPrice = latestPriceData.toFixed(2);

  const guilds = await client.guilds.cache;
  guilds.forEach((guild) => {
    guild.me.setNickname(`BBI: ${formattedBitcoinBullIndex}`);
  });

  client.user.setPresence({
    status: "online",
    activities: [
      {
        name: `Bitcoin $${formattedBitcoinPrice}`,
        type: "WATCHING",
      },
    ],
  });
};

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const bbi = {
    data: {},
    set setIndexAndPriceData(data) {
      this.data = data;
      showIndexAndPrice(data);
    },
  };

  bbi.setIndexAndPriceData = await fetchBitcoinConfidence();

  // Set a cron job to fetch new data at a certain time on UTC
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.info(`Time now: ${Date.now()}`);
      bbi.setIndexAndPriceData = await fetchBitcoinConfidence();
    },
    { timezone: "UTC" }
  );
});

client.login(process.env.DISCORD_BOT_API_TOKEN);
