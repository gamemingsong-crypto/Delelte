import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits, PermissionsBitField, ActivityType } from 'discord.js';

// 🌐 Web Server สำหรับป้องกันบอทหลับ (Render)
const app = express();
app.get('/', (req, res) => res.send('Auto Delete Bot is Alive!'));
app.listen(process.env.PORT || 3000);

// 🤖 ตั้งค่าบอท
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.DISCORD_TOKEN;

// 📌 ตั้งค่า ID ห้อง และ ID ยศที่ยกเว้น (แก้ตรงนี้ให้เป็นของพี่)
const TARGET_CHANNELS = ["1517238552545726556", "1518687612691550218"];
const PROTECTED_ROLES = ["1511072295320293546", "1508699693486575707"];

client.once("ready", () => {
    console.log(`🚀 ${client.user.tag} พร้อมลุย!`);
    client.user.setActivity('จัดระเบียบห้อง | !delete', { type: ActivityType.Watching });
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // 💣 คำสั่งลบข้อความ (ใช้ !delete จำนวน)
    if (message.content.startsWith("!delete")) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        
        const args = message.content.split(' ');
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount < 1 || amount > 100) return message.reply("ระบุจำนวน (1-100)");

        await message.channel.bulkDelete(amount + 1, true);
        const msg = await message.reply("ข้อความ");
        setTimeout(() => msg.delete(), 10000); // 👈 เพิ่มบรรทัดนี้ บอทจะลบตัวเองใน 10 วินาที
        return;
    }

    // 🧹 ลบข้อความออโต้ (เฝ้าหลายห้อง + เช็คยศ)
    if (TARGET_CHANNELS.includes(message.channel.id)) {
        const hasProtectedRole = message.member.roles.cache.some(r => PROTECTED_ROLES.includes(r.id));
        
        if (message.member.permissions.has(PermissionsBitField.Flags.Administrator) || 
            hasProtectedRole || 
            message.attachments.size > 0) return;

        setTimeout(async () => {
            try { await message.delete(); } 
            catch (err) { console.error("ลบข้อความไม่ได้:", err); }
        }, 10000); // 10 วินาที
    }
});

client.login(TOKEN);
