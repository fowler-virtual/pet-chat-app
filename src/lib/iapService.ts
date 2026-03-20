/**
 * IAP Service — アプリ内課金を管理
 *
 * 本番環境では react-native-iap v14 を使用。
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

let purchaseResolve: ((result: PurchaseResult) => void) | null = null;
let listenersSetup = false;

/**
 * IAP の初期化。アプリ起動時に1回呼ぶ。
 */
export async function initializeIAP(): Promise<void> {
  if (!USE_REAL_IAP) return;

  try {
    const RNIap = await import('react-native-iap');
    await RNIap.initConnection();

    if (!listenersSetup) {
      listenersSetup = true;

      RNIap.purchaseUpdatedListener((purchase: any) => {
        const token = purchase?.purchaseToken ?? purchase?.transactionReceipt;
        const productId = purchase?.productId ?? '';
        if (purchaseResolve && token) {
          purchaseResolve({ success: true, productId, receipt: token });
          purchaseResolve = null;
        }
      });

      RNIap.purchaseErrorListener((error: any) => {
        if (purchaseResolve) {
          if (error?.code === 'E_USER_CANCELLED') {
            purchaseResolve({ success: false, reason: 'cancelled' });
          } else {
            purchaseResolve({ success: false, reason: error?.message ?? 'purchase_error' });
          }
          purchaseResolve = null;
        }
      });
    }
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

  return realPurchase(PRODUCT_IDS.plus_monthly, 'subs');
}

/**
 * アイテムを購入
 */
export async function purchaseItem(itemType: ItemType): Promise<PurchaseResult> {
  const productId = PRODUCT_IDS[`item_${itemType}`];
  if (!USE_REAL_IAP) {
    return mockPurchase(productId);
  }

  return realPurchase(productId, 'inapp');
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
    const plusPurchase = Array.isArray(purchases)
      ? purchases.find((p: any) => p.productId === PRODUCT_IDS.plus_monthly)
      : undefined;
    return {
      active: Boolean(plusPurchase),
      plan: plusPurchase ? 'plus' : 'free',
      receipt: (plusPurchase as any)?.purchaseToken ?? (plusPurchase as any)?.transactionReceipt,
    };
  } catch {
    return { active: false, plan: 'free' };
  }
}

async function mockPurchase(productId: string): Promise<PurchaseResult> {
  await new Promise<void>((resolve) => setTimeout(resolve, 300));
  return { success: true, productId, receipt: 'mock-receipt' };
}

async function realPurchase(productId: string, type: 'subs' | 'inapp'): Promise<PurchaseResult> {
  try {
    const RNIap = await import('react-native-iap');

    // 商品情報を取得
    const products = await RNIap.fetchProducts({ skus: [productId], type });
    const product = Array.isArray(products) ? products[0] : undefined;

    if (!product) {
      return { success: false, reason: 'product_not_found' };
    }

    // サブスクリプションの場合は offerToken が必要
    let offerToken: string | undefined;
    if (type === 'subs') {
      const offers = (product as any).subscriptionOffers ?? (product as any).subscriptionOfferDetailsAndroid;
      offerToken = offers?.[0]?.offerTokenAndroid ?? offers?.[0]?.offerToken;
    }

    // リスナーで結果を受け取る Promise を作成
    const resultPromise = new Promise<PurchaseResult>((resolve) => {
      purchaseResolve = resolve;
      // 60秒でタイムアウト
      setTimeout(() => {
        if (purchaseResolve === resolve) {
          purchaseResolve = null;
          resolve({ success: false, reason: 'timeout' });
        }
      }, 60000);
    });

    // 購入リクエストを発行（結果はリスナーで受け取る）
    RNIap.requestPurchase({
      type,
      request: {
        android: {
          skus: [productId],
          ...(offerToken ? { offerToken } : {}),
        },
      },
    }).catch(() => {
      // エラーは purchaseErrorListener で処理される
    });

    return await resultPromise;
  } catch (error: any) {
    if (error?.code === 'E_USER_CANCELLED') {
      return { success: false, reason: 'cancelled' };
    }
    return { success: false, reason: error instanceof Error ? error.message : 'unknown_error' };
  }
}
