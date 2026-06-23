import 'dotenv/config'; //
import express from 'express'; //
import { Client, GatewayIntentBits, PermissionsBitField, ActivityType } from 'discord.js'; //

// 🌐 Web Server สำหรับป้องกันบอทหลับ (Render)[cite: 1]
const app = express(); //[cite: 1]
app.get('/', (req, res) => res.send('Auto Delete Bot is Alive!')); //[cite: 1]
app.listen(process.env.PORT || 3000); //[cite: 1]

// 🤖 ตั้งค่าบอท[cite: 1]
const client = new Client({ //[cite: 1]
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] //[cite: 1]
});

const TOKEN = process.env.DISCORD_TOKEN; //[cite: 1]

// 📌 ตั้งค่า ID ห้องเป้าหมาย[cite: 1]
const TARGET_CHANNELS = ["1517238552545726556", "1518687612691550218"]; //[cite: 1]

// ⚙️ ตัวแปรระดับ Core สำหรับควบคุมสวิตช์เปิด/ปิด ลบออโต้ (ค่าเริ่มต้นคือ เปิด)
let isAutoDeleteEnabled = true; 

client.once("ready", () => { //[cite: 1]
    console.log(`🚀 ${client.user.tag} พร้อมลุย!`); //[cite: 1]
    client.user.setActivity('จัดระเบียบห้อง | !delete', { type: ActivityType.Watching }); //[cite: 1]
});

client.on("messageCreate", async (message) => { //[cite: 1]
    // ป้องกันบอทคุยกันเองจนเซิร์ฟเวอร์พัง
    if (message.author.bot) return; //[cite: 1]

    // ----------------------------------------------------------------
    // 🛡️ 1. คำสั่งใหม่: เปิด-ปิด การลบข้อความออโต้ (พิมพ์ !toggleauto)
    // ----------------------------------------------------------------
    if (message.content === "!auto") {
        // เช็คพลังแอดมิน ใครไม่มียศ Administrator หมดสิทธิ์สั่งการ!
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("ระดับพลังของนายยังไม่พอ! (เฉพาะ Admin เท่านั้น)");
        }

        // สลับสถานะเปิด/ปิด
        isAutoDeleteEnabled = !isAutoDeleteEnabled;
        const statusText = isAutoDeleteEnabled ? "เปิดทำงาน 🟢" : "ปิดทำงาน 🔴";
        return message.reply(`ระบบลบข้อความอัตโนมัติ **${statusText}** โดยแอดมิน!`);
    }

    // ----------------------------------------------------------------
    // 💣 2. คำสั่งลบข้อความแบบกลุ่ม (ใช้ !delete จำนวน)[cite: 1]
    // ----------------------------------------------------------------
    if (message.content.startsWith("!ลบข้อความ")) { //[cite: 1]
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return; //[cite: 1]
        
        const args = message.content.split(' '); //[cite: 1]
        const amount = parseInt(args[1]); //[cite: 1]
        if (isNaN(amount) || amount < 1 || amount > 100) return message.reply("ระบุจำนวน (1-100)"); //[cite: 1]

        await message.channel.bulkDelete(amount + 1, true); //[cite: 1]
        const msg = await message.reply("ล้างบางข้อความเรียบร้อย!"); // ฉันแก้คำตอบกลับให้ดูเท่ขึ้น
        setTimeout(() => msg.delete(), 10000); // 👈 บอทจะลบตัวเองใน 10 วินาที[cite: 1]
        return; //[cite: 1]
    }

    // ----------------------------------------------------------------
    // 🧹 3. ลบข้อความออโต้ (เฝ้าหลายห้อง + ลบทุกคนอย่างเท่าเทียม)
    // ----------------------------------------------------------------
    // ทำงานก็ต่อเมื่อ: เปิดสวิตช์อยู่ และ เป็นห้องที่กำหนดไว้
    if (isAutoDeleteEnabled && TARGET_CHANNELS.includes(message.channel.id)) { //[cite: 1]
        
        // กฎใหม่ของพระเจ้า: ไม่สนว่าจะเป็น Admin, มีรูปรปะกอบ หรือยศอะไร ถ้าพิมพ์มาในห้องนี้... หายวับไปซะ!
        
        setTimeout(async () => { //[cite: 1]
            try { 
                await message.delete(); //[cite: 1]
            } catch (err) { 
                console.error("ลบข้อความไม่ได้ (เช็คสิทธิ์บอทด้วย):", err); //[cite: 1]
            }
        }, 10000); // หน่วงเวลา 10 วินาทีตามสเปกเดิม[cite: 1]
    }
});

client.login(TOKEN); //[cite: 1]
