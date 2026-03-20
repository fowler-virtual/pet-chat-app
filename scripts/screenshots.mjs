import { chromium } from 'playwright';
import { join } from 'path';
import { readFileSync } from 'fs';

const OUT = '/Users/yuta-ramone/Downloads/store-assets';
const APP_URL = 'http://localhost:8082';
const CAT_IMG = '/Users/yuta-ramone/Downloads/store-assets/cat-avatar.jpg';

const PHONE = { width: 390, height: 844, deviceScaleFactor: 3 };
const TABLET7 = { width: 600, height: 960, deviceScaleFactor: 2 };
const TABLET10 = { width: 1280, height: 800, deviceScaleFactor: 2 }; // landscape

// Convert cat image to data URI
const catBase64 = readFileSync(CAT_IMG).toString('base64');
const catDataUri = `data:image/jpeg;base64,${catBase64}`;

async function setupPet(page) {
  await page.evaluate((avatarUri) => {
    const state = {
      pets: [{
        id: 'pet-demo-1',
        name: 'たま',
        nickname: 'たま',
        species: '猫',
        gender: '女の子',
        personality: '気まぐれだけど甘えん坊',
        firstPerson: 'あたし',
        ownerCall: 'ご主人',
        tone: 'ため口',
        avatarUri: avatarUri,
        icon: 'cat',
        sessionKey: 'pet:pet-demo-1:main',
      }],
      selectedPetId: 'pet-demo-1',
      messagesByPetId: {
        'pet-demo-1': [
          { id: 'msg-1', sender: 'pet', text: 'おかえり〜。今日はどんな一日だった？', time: '10:00' },
          { id: 'msg-2', sender: 'owner', text: 'お仕事がんばったよ！', time: '10:01' },
          { id: 'msg-3', sender: 'pet', text: 'えらいじゃん。あたしはずっと窓のとこでお昼寝してたよ。ぽかぽかだった。', time: '10:01' },
          { id: 'msg-4', sender: 'owner', text: 'たまはいい子だね', time: '10:02' },
          { id: 'msg-5', sender: 'pet', text: 'まぁね。…でもご主人が帰ってきたのが一番うれしい。', time: '10:02' },
        ]
      },
      unreadCounts: {},
      userStats: { lastOpenDate: new Date().toLocaleDateString('sv-SE'), loginStreak: 5, totalMessagesSent: 20, firstOpenDate: '2026-03-01' },
      inventory: { snack: 2, meal: 1, feast: 0 },
      adReward: { date: new Date().toLocaleDateString('sv-SE'), viewCount: 0 },
      bonusMessages: 0,
      bonusDate: new Date().toLocaleDateString('sv-SE'),
      themeKey: 'beige',
    };
    localStorage.setItem('pet-chat-app-state', JSON.stringify(state));
  }, catDataUri);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
}

async function overridePetLine(page, text) {
  // Override the speech bubble text after page load
  await page.evaluate((newText) => {
    // Find the speech bubble text element
    const allTexts = document.querySelectorAll('[class*="bubbleText"], [data-testid="bubble-text"]');
    if (allTexts.length > 0) {
      allTexts[0].textContent = newText;
      return;
    }
    // Fallback: find by approximate content pattern
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      // The bubble text is typically longer than 10 chars and inside a specific area
      if (node.textContent && node.textContent.length > 10 &&
          node.parentElement &&
          node.parentElement.style &&
          node.textContent.includes('。')) {
        // Check if this is in the top area (bubble)
        const rect = node.parentElement.getBoundingClientRect();
        if (rect.top < 500 && rect.top > 100) {
          node.textContent = newText;
          return;
        }
      }
    }
  }, text);
}

async function main() {
  const { mkdirSync } = await import('fs');
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();

  // ===== Phone screenshots =====
  console.log('Taking phone screenshots...');
  const phoneCtx = await browser.newContext({
    viewport: { width: PHONE.width, height: PHONE.height },
    deviceScaleFactor: PHONE.deviceScaleFactor,
  });
  const phonePage = await phoneCtx.newPage();
  await phonePage.goto(APP_URL, { waitUntil: 'networkidle' });
  await setupPet(phonePage);

  // Override the pet line
  await overridePetLine(phonePage, 'ねぇ、今日はどんなことがあった？\nあたしに教えてよ。');
  await phonePage.waitForTimeout(500);

  // 1. Today screen
  await phonePage.screenshot({ path: join(OUT, 'phone-1-today.png') });
  console.log('  phone-1-today done');

  // 2. Talk screen
  try {
    const tabs = await phonePage.$$('text=おはなし');
    for (const tab of tabs) {
      const box = await tab.boundingBox();
      if (box && box.y > 700) {
        await tab.click();
        break;
      }
    }
    await phonePage.waitForTimeout(2000);
    await phonePage.screenshot({ path: join(OUT, 'phone-2-talk.png') });
    console.log('  phone-2-talk done');
  } catch (e) {
    console.log('  Talk tab click failed:', e.message);
  }

  await phoneCtx.close();

  // ===== Tablet 7" =====
  console.log('Taking 7-inch tablet screenshots...');
  const tab7Ctx = await browser.newContext({
    viewport: { width: TABLET7.width, height: TABLET7.height },
    deviceScaleFactor: TABLET7.deviceScaleFactor,
  });
  const tab7Page = await tab7Ctx.newPage();
  await tab7Page.goto(APP_URL, { waitUntil: 'networkidle' });
  await setupPet(tab7Page);
  await overridePetLine(tab7Page, 'ねぇ、今日はどんなことがあった？\nあたしに教えてよ。');
  await tab7Page.waitForTimeout(500);
  await tab7Page.screenshot({ path: join(OUT, 'tablet7-1-today.png') });
  console.log('  tablet7 done');
  await tab7Ctx.close();

  // ===== Tablet 10" (landscape) =====
  console.log('Taking 10-inch tablet screenshots...');
  const tab10Ctx = await browser.newContext({
    viewport: { width: TABLET10.width, height: TABLET10.height },
    deviceScaleFactor: TABLET10.deviceScaleFactor,
  });
  const tab10Page = await tab10Ctx.newPage();
  await tab10Page.goto(APP_URL, { waitUntil: 'networkidle' });
  await setupPet(tab10Page);
  await overridePetLine(tab10Page, 'ねぇ、今日はどんなことがあった？あたしに教えてよ。');
  await tab10Page.waitForTimeout(500);
  await tab10Page.screenshot({ path: join(OUT, 'tablet10-1-today.png') });
  console.log('  tablet10 done');
  await tab10Ctx.close();

  // ===== Feature graphic =====
  console.log('Creating feature graphic...');
  const fgCtx = await browser.newContext({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  const fgPage = await fgCtx.newPage();
  await fgPage.setContent(`
    <html>
    <body style="margin:0; width:1024px; height:500px; background: linear-gradient(135deg, #FFF8F0 0%, #FFE8D6 50%, #F5D5B8 100%); display:flex; align-items:center; justify-content:center; font-family:-apple-system,sans-serif;">
      <div style="text-align:center;">
        <div style="font-size:64px; font-weight:800; color:#8B6040; margin-bottom:16px;">かいぬしとおはなし</div>
        <div style="font-size:28px; color:#A0785C; font-weight:500;">あなたのペットが、しゃべりだす。</div>
      </div>
    </body>
    </html>
  `);
  await fgPage.screenshot({ path: join(OUT, 'feature-graphic.png') });
  await fgCtx.close();

  await browser.close();
  console.log(`Done! Assets saved to ${OUT}`);
}

main().catch(console.error);
