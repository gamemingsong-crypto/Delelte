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
    if (message.author.bot) return;

    // เช็คว่าใช่ห้องที่กำหนดไว้ไหม
    if (message.channel.id !== TARGET_CHANNEL_ID) return;

    // เช็คว่าเป็นแอดมินไหม (ถ้าใช่แอดมิน บอทจะไม่ลบข้อความ)
    if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return;
    }

    // ถ้ามีไฟล์แนบหรือมีรูปภาพส่งมา บอทจะไม่ลบ
    if (message.attachments.size > 0) return;

    // หน่วงเวลา 3 วินาทีแล้วสั่งลบข้อความดิบ
    setTimeout(async () => {
        try {
            await message.delete();
        } catch (err) {
            console.error("ลบข้อความไม่ได้ เนื่องจากสิทธิ์บอทไม่พอ:", err);
        }
    }, 3000);
});

client.login(TOKEN);
