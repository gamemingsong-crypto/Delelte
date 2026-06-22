import 'dotenv/config';
import express from 'express';
import { 
    Client, 
    GatewayIntentBits, 
    PermissionsBitField,
    ActivityType
} from 'discord.js';
// ==========================================
// 🌐 สร้าง Web Server เพื่อให้ Cron-job.org วิ่งมาสะกิดได้
// ==========================================
const app = express();
app.get('/', (req, res) => res.send('Auto Delete Bot is Alive!'));
app.listen(process.env.PORT || 3000, () => {
    console.log('🌐 Web Server สำหรับบอทลบข้อความพร้อมทำงานแล้ว!');
});

// ==========================================
// 🤖 ตั้งค่าบอท DISCORD
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 📌 ดึง TOKEN จากไฟล์ .env หรือตั้งค่า Environment บน Host (ปลอดภัยกว่า)
const TOKEN = process.env.DISCORD_TOKEN; 
const TARGET_CHANNEL_ID = "1511625751609479220";

// ✨ แก้ไขจาก clientReady เป็น ready ให้ถูกต้องตามหลัก
client.once("ready", () => {
    console.log(`🚀 ${client.user.tag} ออนไลน์และพร้อมลบข้อความแล้วครับ!`);
client.user.setActivity('จัดระเบียบห้อง | ลบแชทอัตโนมัติ', { 
        type: ActivityType.Watching 
    });
});

client.on("messageCreate", async (message) => {
    // 1. กันบอทลูปตัวเอง
    if (message.author.bot) return;

    // 2. ถ้าพิมพ์ !delroom ให้ไปทำฟังก์ชันลบห้อง
    if (message.content.startsWith("!delroom")) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("พี่ไม่มีสิทธิ์สั่งลบห้องนะครับ!");
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply("บอทไม่มีสิทธิ์ Manage Channels ครับพี่!");
        }

        await message.reply("กำลังทำลายห้องนี้ใน 3 วินาที... 💣");
        setTimeout(async () => {
            try { await message.channel.delete(); } 
            catch (err) { console.error("ลบห้องไม่ได้:", err); }
        }, 3000);
        return; // จบการทำงานตรงนี้ ไม่ต้องไปเช็คการลบแชทต่อ
    }

    // 3. ถ้าไม่ใช่ !delroom ให้มาเช็คการลบแชทอัตโนมัติ (โค้ดเดิมของพี่)
    if (message.channel.id === TARGET_CHANNEL_ID) {
        if (message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        if (message.attachments.size > 0) return;

        setTimeout(async () => {
            try { await message.delete(); } 
            catch (err) { console.error("ลบข้อความไม่ได้:", err); }
        }, 3000);
    }
});

client.login(TOKEN);
