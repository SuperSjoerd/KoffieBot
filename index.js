require('dotenv').config();

const { rejects } = require('assert');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const { resolve } = require('path');

const fsPromise = fs.promises;

const productUrl = process.env.PRODUCT_URL;
const priceSelector = '#corePrice_desktop > div > table > tbody > tr:nth-child(1) > td.a-span12 > span.a-price.a-text-price.a-size-medium.apexPriceToPay > span.a-offscreen';

const botToken = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(botToken);

const fetchCoffee = () => {
    return new Promise(async (resolve, reject) => {
        try {
        
            const response = await axios.get(productUrl);
            const html = response.data;
            const $ = cheerio.load(html);
            const price = $(priceSelector);
            console.log('Found product with price: '+price.text());
    
            resolve(price.text());
    
        } catch (error) {
            reject(error);
        }
    })
}

const isPriceDifferent = (price) => {
    return new Promise(async (resolve, reject) => {
        let previousPrice = '';
        try {
            previousPrice = await fsPromise.readFile('./current_price.txt', 'utf-8');
        } catch (error) {
            await fsPromise.writeFile('./current_price.txt', '');
        }
        
        console.log('Previous price: '+previousPrice);
        if (price !== previousPrice) {
            await fsPromise.writeFile('./current_price.txt', price);
        }
        resolve(price !== previousPrice);
    });
}


const runBot = async () => {
    const currentPrice = await fetchCoffee();
    const isDifferent = await isPriceDifferent(currentPrice);
    if (isDifferent) {
        bot.sendMessage(process.env.TELEGRAM_CHAT_ID, 'Koffie prijs is veranderd naar '+currentPrice+'\n'+productUrl);
    }
}
runBot();