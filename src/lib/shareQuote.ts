import { Platform } from 'react-native';
import type { RefObject } from 'react';
import type { View } from 'react-native';

type CaptureRef = RefObject<View | null>;

export async function shareQuoteAsImage(
  cardRef: CaptureRef,
  petName: string,
  quoteText: string,
): Promise<void> {
  // react-native-view-shot and expo-sharing are optional on web
  if (Platform.OS === 'web') {
    const { Share } = await import('react-native');
    await Share.share({
      message: `${petName}からのひとこと\n「${quoteText}」\n\n#うちの子語録`,
      title: `${petName}からのひとこと`,
    });
    return;
  }

  const { captureRef } = await import('react-native-view-shot');
  const Sharing = await import('expo-sharing');

  const uri = await captureRef(cardRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: `${petName}からのひとこと`,
    UTI: 'public.png',
  });
}
