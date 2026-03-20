const { google } = require('googleapis');

let authClient = null;

function getAuthClient() {
  if (authClient) return authClient;

  const scopes = ['https://www.googleapis.com/auth/androidpublisher'];
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (keyJson) {
    // Render 等: 環境変数に JSON 文字列を直接設定
    const credentials = JSON.parse(keyJson);
    authClient = new google.auth.GoogleAuth({ credentials, scopes });
  } else if (keyFile) {
    // ローカル: ファイルパスを指定
    authClient = new google.auth.GoogleAuth({ keyFile, scopes });
  } else {
    return null;
  }

  return authClient;
}

/**
 * Google Play の購入を検証する。
 *
 * @param {string} productId - 商品ID (plus_monthly, item_snack 等)
 * @param {string} purchaseToken - クライアントから送られた purchaseToken
 * @returns {Promise<{valid: boolean, isSubscription: boolean} | null>}
 *   null = 認証情報未設定（モックモード）
 */
async function verifyGooglePlayPurchase(productId, purchaseToken) {
  const auth = getAuthClient();
  if (!auth) return null;

  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME;
  const androidPublisher = google.androidpublisher({ version: 'v3', auth });
  const isSubscription = productId === 'plus_monthly';

  if (isSubscription) {
    const res = await androidPublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId: productId,
      token: purchaseToken,
    });
    const data = res.data;
    // paymentState: 0=pending, 1=received, 2=free_trial, 3=deferred
    return {
      valid: !data.cancelReason && [1, 2].includes(data.paymentState),
      isSubscription: true,
      expiryTimeMillis: data.expiryTimeMillis,
    };
  }

  // 消耗品 (item_snack, item_meal, item_feast)
  const res = await androidPublisher.purchases.products.get({
    packageName,
    productId,
    token: purchaseToken,
  });
  const data = res.data;
  // purchaseState: 0=purchased, 1=canceled, 2=pending
  const valid = data.purchaseState === 0;

  // 未 acknowledge なら acknowledge する（3日以内に必要）
  if (valid && data.acknowledgementState === 0) {
    await androidPublisher.purchases.products.acknowledge({
      packageName,
      productId,
      token: purchaseToken,
    });
  }

  return { valid, isSubscription: false };
}

module.exports = { verifyGooglePlayPurchase };
