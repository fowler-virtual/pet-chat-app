/**
 * IAP Service — アプリ内課金を管理
 *
 * 本番環境では react-native-iap を使用。
 * 開発環境では mock モードで即座に購入成功を返す。
 *
 * 本番化する際の手順:
 * 1. `npm install react-native-iap`
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
  snack: '¥160',
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
    const RNIap = await import('react-native-iap');
    await RNIap.initConnection();
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

  return realSubscriptionPurchase(PRODUCT_IDS.plus_monthly);
}

/**
 * アイテムを購入
 */
export async function purchaseItem(itemType: ItemType): Promise<PurchaseResult> {
  const productId = PRODUCT_IDS[`item_${itemType}`];
  if (!USE_REAL_IAP) {
    return mockPurchase(productId);
  }

  return realProductPurchase(productId);
}

/**
 * サブスクリプションの有効状態を確認
 */
export async function checkSubscriptionStatus(): Promise<{ active: boolean; plan: SubscriptionPlan; receipt?: string }> {
  if (!USE_REAL_IAP) {
    return { active: false, plan: 'free' };
  }

  try {
    const RNIap = await import('react-native-iap');
    const purchases = await RNIap.getAvailablePurchases();
    const plusPurchase = purchases.find(
      (p) => p.productId === PRODUCT_IDS.plus_monthly,
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

async function realSubscriptionPurchase(productId: string): Promise<PurchaseResult> {
  try {
    const RNIap = await import('react-native-iap');
    await RNIap.getSubscriptions({ skus: [productId] });
    const purchase = await RNIap.requestSubscription({ sku: productId });
    const result = Array.isArray(purchase) ? purchase[0] : purchase;
    if (result?.transactionReceipt) {
      return { success: true, productId, receipt: result.purchaseToken ?? result.transactionReceipt };
    }
    return { success: false, reason: 'no_receipt' };
  } catch (error: any) {
    if (error?.code === 'E_USER_CANCELLED') {
      return { success: false, reason: 'cancelled' };
    }
    return { success: false, reason: error instanceof Error ? error.message : 'unknown_error' };
  }
}

async function realProductPurchase(productId: string): Promise<PurchaseResult> {
  try {
    const RNIap = await import('react-native-iap');
    await RNIap.getProducts({ skus: [productId] });
    const purchase = await RNIap.requestPurchase({ skus: [productId] });
    const result = Array.isArray(purchase) ? purchase[0] : purchase;
    if (result?.transactionReceipt) {
      return { success: true, productId, receipt: result.purchaseToken ?? result.transactionReceipt };
    }
    return { success: false, reason: 'no_receipt' };
  } catch (error: any) {
    if (error?.code === 'E_USER_CANCELLED') {
      return { success: false, reason: 'cancelled' };
    }
    return { success: false, reason: error instanceof Error ? error.message : 'unknown_error' };
  }
}
