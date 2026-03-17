/**
 * IAP Service — アプリ内課金を管理
 *
 * 本番環境では expo-in-app-purchases または react-native-iap を使用。
 * 開発環境では mock モードで即座に購入成功を返す。
 *
 * 本番化する際の手順:
 * 1. `npx expo install expo-in-app-purchases`
 * 2. App Store Connect / Google Play Console で以下を登録:
 *    - サブスクリプション: "plus_monthly" (480円/月)
 *    - 消耗型アイテム: "item_snack", "item_meal", "item_feast"
 * 3. 環境変数 EXPO_PUBLIC_IAP_ENABLED=true を設定
 * 4. EAS Build でビルド（Expo Go では IAP は動作しません）
 */

import type { ItemType, SubscriptionPlan } from '../types';

const USE_REAL_IAP = process.env.EXPO_PUBLIC_IAP_ENABLED === 'true';

// ストアに登録する商品ID
export const PRODUCT_IDS = {
  plus_monthly: 'plus_monthly',
  item_snack: 'item_snack',
  item_meal: 'item_meal',
  item_feast: 'item_feast',
} as const;

export const ITEM_PRICES: Record<ItemType, string> = {
  snack: '¥120',
  meal: '¥250',
  feast: '¥480',
};

export type PurchaseResult =
  | { success: true; productId: string; receipt: string }
  | { success: false; reason: string };

/**
 * IAP の初期化。アプリ起動時に1回呼ぶ。
 */
export async function initializeIAP(): Promise<void> {
  if (!USE_REAL_IAP) return;

  try {
    const IAP = await import('expo-in-app-purchases');
    await IAP.connectAsync();
  } catch {
    // IAP SDK 未インストールまたは初期化失敗
  }
}

/**
 * Plus プランのサブスクリプションを購入
 */
export async function purchaseSubscription(): Promise<PurchaseResult> {
  if (!USE_REAL_IAP) {
    return mockPurchase(PRODUCT_IDS.plus_monthly);
  }

  return realPurchase(PRODUCT_IDS.plus_monthly);
}

/**
 * アイテムを購入
 */
export async function purchaseItem(itemType: ItemType): Promise<PurchaseResult> {
  const productId = PRODUCT_IDS[`item_${itemType}`];
  if (!USE_REAL_IAP) {
    return mockPurchase(productId);
  }

  return realPurchase(productId);
}

/**
 * サブスクリプションの有効状態を確認
 */
export async function checkSubscriptionStatus(): Promise<{ active: boolean; plan: SubscriptionPlan; receipt?: string }> {
  if (!USE_REAL_IAP) {
    return { active: false, plan: 'free' };
  }

  try {
    const IAP = await import('expo-in-app-purchases');
    const history = await IAP.getPurchaseHistoryAsync();
    const results = (history as any).results as Array<{ productId: string; acknowledged: boolean; transactionReceipt?: string }> | undefined;
    const plusPurchase = results?.find(
      (p) => p.productId === PRODUCT_IDS.plus_monthly && p.acknowledged,
    );
    return {
      active: Boolean(plusPurchase),
      plan: plusPurchase ? 'plus' : 'free',
      receipt: plusPurchase?.transactionReceipt,
    };
  } catch {
    return { active: false, plan: 'free' };
  }
}

async function mockPurchase(productId: string): Promise<PurchaseResult> {
  await new Promise<void>((resolve) => setTimeout(resolve, 300));
  return { success: true, productId, receipt: 'mock-receipt' };
}

async function realPurchase(productId: string): Promise<PurchaseResult> {
  try {
    const IAP = await import('expo-in-app-purchases');
    await IAP.getProductsAsync([productId]);
    const purchaseResult = await IAP.purchaseItemAsync(productId);
    const responseCode = (purchaseResult as any).responseCode as number;
    const results = (purchaseResult as any).results as Array<{ transactionReceipt?: string }> | undefined;

    if (responseCode === IAP.IAPResponseCode.OK) {
      const receipt = results?.[0]?.transactionReceipt ?? '';
      return { success: true, productId, receipt };
    }
    if (responseCode === IAP.IAPResponseCode.USER_CANCELED) {
      return { success: false, reason: 'cancelled' };
    }
    return { success: false, reason: `purchase_failed_${responseCode}` };
  } catch (error) {
    return { success: false, reason: error instanceof Error ? error.message : 'unknown_error' };
  }
}
