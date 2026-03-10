// @expo/vector-icons — expo の内部依存のため型宣言が必要な場合がある
declare module '@expo/vector-icons' {
  import type { ComponentType } from 'react';
  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }
  export const Feather: ComponentType<IconProps>;
  export const MaterialCommunityIcons: ComponentType<IconProps> & {
    glyphMap: Record<string, number>;
  };
}

// 未インストールのSDKの型宣言（本番化時にインストールすれば不要になる）
declare module 'react-native-google-mobile-ads' {
  export const RewardedAd: {
    createForAdRequest(adUnitId: string): {
      addAdEventListener(type: string, listener: (...args: any[]) => void): () => void;
      load(): void;
      show(): void;
    };
  };
  export const RewardedAdEventType: {
    LOADED: string;
    EARNED_REWARD: string;
  };
  export const AdEventType: {
    CLOSED: string;
    ERROR: string;
  };
}

declare module 'expo-in-app-purchases' {
  export function connectAsync(): Promise<void>;
  export function getProductsAsync(itemList: string[]): Promise<void>;
  export function purchaseItemAsync(productId: string): Promise<{ responseCode: number }>;
  export function getPurchaseHistoryAsync(): Promise<{
    results?: Array<{ productId: string; acknowledged: boolean }>;
  }>;
  export const IAPResponseCode: {
    OK: number;
    USER_CANCELED: number;
  };
}
