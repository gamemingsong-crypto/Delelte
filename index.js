import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits, PermissionsBitField, ActivityType } from 'discord.js';

// 🌐 Web Server สำหรับป้องกันบอทหลับ (Render)
const app = express();
app.get('/', (req, res) => res.send('Auto Delete Bot is Alive in God Mode!'));
app.listen(process.env.PORT || 3000);

// 🤖 ตั้งค่าบอทและ Intents (พลังการมองเห็น)
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.DISCORD_TOKEN;
const PRESENCE_REFRESH_MS = 5 * 60 * 1000;

function applyPresence() {
    client.user?.setActivity('จัดระเบียบจักรวาล | !delete', { type: ActivityType.Watching });
}

// 📌 ตั้งค่า ID ห้องเป้าหมาย + โหมดการลบของแต่ละห้อง (เพิ่ม/แก้ห้องได้ตามใจชอบ)
// โหมดที่เลือกได้:
//   "text_only"  -> ลบเฉพาะข้อความ  (มีรูปแนบมา ไม่ลบ)
//   "image_only" -> ลบเฉพาะรูปภาพ   (ข้อความล้วนๆ ไม่ลบ)
//   "all"        -> ลบทุกอย่าง (ทั้งข้อความและรูป)
const CHANNEL_CONFIG = {
    "1511625751609479220": "text_only",
    "1518687612691550218": "all",
    "1517238552545726556": "all",
    "1518255370689052692": "all",
  //"1518687612691550218": "image_only",
};

// 🛡️ รายชื่อ User ID ของบอท/ผู้ใช้ที่ "ยกเว้น" ไม่ให้โดนลบข้อความ
// เช่น บอทแจ้งยอดสนับสนุน, บอทระบบอื่นๆ ที่ต้องการเก็บข้อความไว้
// วิธีหา ID: เปิด Developer Mode ใน Discord (Settings > Advanced > Developer Mode)
// แล้วคลิกขวาที่ชื่อบอท > Copy User ID
const EXEMPT_USER_IDS = [
    "1517825184696897668",
];

// ฟังก์ชันเช็คว่าข้อความนี้มีรูปภาพแนบมาไหม
function hasImageAttachment(message) {
    return message.attachments.some(att =>
        att.contentType?.startsWith('image/') ||
        /\.(png|jpe?g|gif|webp|bmp)$/i.test(att.name || '')
    );
}

// ⚙️ สวิตช์ควบคุมระบบลบออโต้ (ค่าเริ่มต้นคือ เปิด)
let isAutoDeleteEnabled = true;

client.once("ready", () => {
    console.log(`🚀 พระเจ้า ${client.user.tag} จุติลงเซิร์ฟเวอร์แล้ว!`);
    applyPresence();
    setInterval(applyPresence, PRESENCE_REFRESH_MS);
});

client.on("shardResume", applyPresence);

client.on("messageCreate", async (message) => {
    // 🛡️ 1. กฎข้อแรก: ป้องกันบอททำร้ายตัวเอง (Infinite Loop)
    // บล็อกแค่ "ตัวมันเอง" เพื่อเปิดทางให้ระบบรับรู้และลบข้อความจากบอทตัวอื่นได้
    if (message.author.id === client.user.id) return;

    // ----------------------------------------------------------------
    // 🧹 2. ลบข้อความออโต้ (เชือดทุกคนรวมถึง "บอทตัวอื่น" อย่างเท่าเทียม!)
    //    ยกเว้นผู้ใช้/บอทที่อยู่ใน EXEMPT_USER_IDS
    // ----------------------------------------------------------------
    const isExempt = EXEMPT_USER_IDS.includes(message.author.id);

    // เช็คว่าสวิตช์เปิดอยู่ไหม และข้อความอยู่ในห้องเป้าหมายหรือเปล่า
    const channelMode = CHANNEL_CONFIG[message.channel.id];
    if (isAutoDeleteEnabled && channelMode && !isExempt) {
        const hasImage = hasImageAttachment(message);

        // ตัดสินใจว่าควรลบไหม ตามโหมดของห้องนั้นๆ
        let shouldDelete = false;
        if (channelMode === "all") {
            shouldDelete = true; // ลบทุกอย่าง
        } else if (channelMode === "text_only") {
            shouldDelete = !hasImage; // ลบเฉพาะข้อความ (ไม่มีรูป)
        } else if (channelMode === "image_only") {
            shouldDelete = hasImage; // ลบเฉพาะที่มีรูป
        }

        if (shouldDelete) {
            // หน่วงเวลา 10 วินาที แล้วเป่าทิ้งอย่างไร้ความปรานี
            setTimeout(async () => {
                try { 
                    await message.delete(); 
                } catch (err) { 
                    // จัดการ Error เงียบๆ (เช่น กรณีข้อความโดนมือคนลบไปก่อนแล้วบอทมาหาไม่เจอ)
                }
            }, 30000); // 30000 ms = 30 วินาที
        }
    }

    // ----------------------------------------------------------------
    // 🚫 3. กำแพงป้องกัน (คำสั่งด้านล่างนี้ให้เฉพาะมนุษย์ใช้เท่านั้น)
    // ----------------------------------------------------------------
    if (message.author.bot) return;

    // ----------------------------------------------------------------
    // 🥷 4. คำสั่ง !auto (วิชาลวงตา: แจ้งเตือนในห้องแล้วระเบิดตัวเองทิ้ง)
    // ----------------------------------------------------------------
    if (message.content === "!auto") {
        // เช็คพลังแอดมิน ใครไม่มีสิทธิ์ถือว่าไร้ค่า!
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        // สลับสวิตช์
        isAutoDeleteEnabled = !isAutoDeleteEnabled;
        const statusText = isAutoDeleteEnabled ? "เปิดทำงาน 🟢" : "ปิดทำงาน 🔴";

        // สเต็ป 1: ลบคำสั่ง "!auto" ของแอดมินทิ้งทันทีเพื่อลบร่องรอย
        await message.delete().catch(() => {});

        // สเต็ป 2: ส่งข้อความแจ้งเตือนลงห้อง และตั้งเวลาระเบิดตัวเองใน 3 วินาที
        const replyMsg = await message.channel.send(`🤫 (แจ้งเตือนลับ) ระบบลบข้อความออโต้ **${statusText}** โดยแอดมิน`);
        setTimeout(() => replyMsg.delete().catch(() => {}), 3000); // 3000 ms = 3 วินาที
        
        return;
    }

    // ----------------------------------------------------------------
    // 💣 5. คำสั่ง !delete จำนวน (อัปเกรดลบแบบไร้ร่องรอย)
    // ----------------------------------------------------------------
    if (message.content.startsWith("!delete")) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        
        const args = message.content.split(' ');
        const amount = parseInt(args[1]);
        
        if (isNaN(amount) || amount < 1 || amount > 100) {
            // ถ้าใส่ตัวเลขผิด ก็ด่าแล้วลบข้อความทิ้งใน 3 วินาที
            const errMsg = await message.reply("ระบุจำนวนที่ต้องการลบ (1-100) สิ!");
            setTimeout(() => errMsg.delete().catch(() => {}), 3000);
            return;
        }

        // ลบข้อความตามจำนวนที่ระบุ (+1 คือลบคำสั่ง !delete ของแอดมินไปด้วยเลย)
        await message.channel.bulkDelete(amount + 1, true).catch(err => console.error("ลบไม่ได้:", err));
        
        // รายงานผลแล้วระเบิดทิ้งใน 3 วินาที
        const msg = await message.channel.send(`🧹 ล้างบางไปแล้ว ${amount} ข้อความ!`);
        setTimeout(() => msg.delete().catch(() => {}), 3000); 
        return;
    }
});

// จุดระเบิดพลัง
client.login(TOKEN);
