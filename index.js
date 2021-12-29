require('dotenv').config();

const { rejects } = require('assert');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const { resolve } = require('path');
const puppeteer = require('puppeteer');

const fsPromise = fs.promises;

const productUrl = process.env.PRODUCT_URL;
const tempFile = './current_price.txt';
const priceSelector = '#corePrice_desktop > div > table > tbody > tr:nth-child(1) > td.a-span12 > span.a-price.a-text-price.a-size-medium.apexPriceToPay > span.a-offscreen';

const botToken = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(botToken);

const _this = this;

const fetchCoffee = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.setViewport({
                width: 1920,
                height: 1080
            });
            await page.goto(productUrl);
            await page.screenshot({ path: './screenshot.png' });
            const content = await page.content();
            await fsPromise.writeFile('./output.html', content);
            const textContent = await page.evaluate(() => {
                return document.querySelector('span.a-price > span.a-offscreen').textContent
            });
            browser.close();
            console.log('Current price: '+textContent);
            resolve(textContent);
        } catch (error) {
            reject(error);
        }
    })
}

const isPriceDifferent = (price) => {
    return new Promise(async (resolve, reject) => {
        let previousPrice = '';
        try {
            previousPrice = await fsPromise.readFile(tempFile, 'utf-8');
        } catch (error) {
            await fsPromise.writeFile(tempFile, '');
        }
        
        console.log('Previous price: '+previousPrice);
        if (price !== previousPrice) {
            await fsPromise.writeFile(tempFile, price);
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