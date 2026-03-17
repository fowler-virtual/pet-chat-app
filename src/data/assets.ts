import type { ImageSourcePropType } from 'react-native';
import type { ItemType } from '../types';

/* eslint-disable @typescript-eslint/no-require-imports */
export const ITEM_ICON_SOURCE: Record<ItemType, ImageSourcePropType> = {
  snack: require('../../assets/ui/icon_snack.png'),
  meal: require('../../assets/ui/icon_meal.png'),
  feast: require('../../assets/ui/icon_feast.png'),
};
/* eslint-enable @typescript-eslint/no-require-imports */
