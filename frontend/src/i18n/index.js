import { useSettings } from '../context/SettingsContext';
import es from './es';
import en from './en';

export default function useTranslation() {
  const { settings } = useSettings();
  return settings.language === 'en' ? en : es;
}
