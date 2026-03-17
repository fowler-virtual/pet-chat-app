/**
 * Ad Service — リワード広告の表示を管理
 *
 * 本番環境では react-native-google-mobile-ads を使用。
 * 開発環境では mock モードで即座にリワードを返す。
 *
 * 本番化する際の手順:
 * 1. `npx expo install react-native-google-mobile-ads`
 * 2. app.json に AdMob の app ID を追加:
 *    "react-native-google-mobile-ads": {
 *      "android_app_id": "ca-app-pub-xxxxxxxx~yyyyyyyy",
 *      "ios_app_id": "ca-app-pub-xxxxxxxx~yyyyyyyy"
 *    }
 * 3. 環境変数 EXPO_PUBLIC_ADMOB_REWARDED_ID にリワード広告ユニットIDを設定
 * 4. USE_REAL_ADS を true に変更（または環境変数で制御）
 * 5. EAS Build でビルド（Expo Go では AdMob は動作しません）
 */

const USE_REAL_ADS = process.env.EXPO_PUBLIC_ADMOB_ENABLED === 'true';

const REWARDED_AD_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID ?? 'ca-app-pub-3940256099942544/5224354917'; // テスト用ID

export type AdResult = { success: true } | { success: false; reason: string };

/**
 * リワード広告を表示し、視聴完了でリワードを付与する
 */
export async function showRewardedAd(): Promise<AdResult> {
  if (!USE_REAL_ADS) {
    return mockRewardedAd();
  }

  return realRewardedAd();
}

async function mockRewardedAd(): Promise<AdResult> {
  // 開発用: 500ms の遅延でリワードをシミュレート
  await new Promise<void>((resolve) => setTimeout(resolve, 500));
  return { success: true };
}

const AD_LOAD_TIMEOUT_MS = 15_000;

async function realRewardedAd(): Promise<AdResult> {
  try {
    const { RewardedAd, RewardedAdEventType, AdEventType } = await import('react-native-google-mobile-ads');

    return new Promise<AdResult>((resolve) => {
      const rewarded = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID);

      let earned = false;
      let settled = false;

      function settle(result: AdResult) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        resolve(result);
      }

      const timer = setTimeout(() => {
        settle({ success: false, reason: 'ad_timeout' });
      }, AD_LOAD_TIMEOUT_MS);

      const unsubLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewarded.show();
      });

      const unsubEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      });

      const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        settle(earned ? { success: true } : { success: false, reason: 'not_completed' });
      });

      const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, (error: { message?: string }) => {
        settle({ success: false, reason: error?.message ?? 'ad_error' });
      });

      function cleanup() {
        unsubLoaded();
        unsubEarned();
        unsubClosed();
        unsubError();
      }

      rewarded.load();
    });
  } catch {
    return { success: false, reason: 'ad_sdk_unavailable' };
  }
}
