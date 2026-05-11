import { useSettings } from '../context/SettingsContext';
import { colors, darkColors } from './index';

export default function useTheme() {
  const { settings } = useSettings();
  return settings.theme === 'dark' ? darkColors : colors;
}
