import { CropRatio, CropConfig } from '../types';

const ratioMap: Record<CropRatio, number> = {
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '1:1': 1,
  '4:3': 4 / 3,
  'free': 0,
};

export function getCropStyle(crop?: CropConfig): React.CSSProperties {
  if (!crop || crop.ratio === 'free') {
    return {};
  }
  const ratio = ratioMap[crop.ratio];
  return {
    aspectRatio: `${ratio}`,
  };
}

export function getImageStyle(crop?: CropConfig): React.CSSProperties {
  if (!crop) {
    return { objectFit: 'cover' as const };
  }
  return {
    objectFit: 'cover' as const,
    objectPosition: `${crop.positionX}% ${crop.positionY}%`,
  };
}

export const ratioList: { value: CropRatio; label: string }[] = [
  { value: '16:9', label: '横屏 16:9' },
  { value: '9:16', label: '竖屏 9:16' },
  { value: '1:1', label: '方形 1:1' },
  { value: '4:3', label: '4:3' },
  { value: 'free', label: '原始比例' },
];
