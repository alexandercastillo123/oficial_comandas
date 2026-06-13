import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  const wp = (percentage) => {
    return (width * percentage) / 100;
  };

  const hp = (percentage) => {
    return (height * percentage) / 100;
  };

  const scale = (size) => {
    return isTablet ? size * 1.25 : size;
  };

  return {
    width,
    height,
    isTablet,
    wp,
    hp,
    scale
  };
}
