import LanguageSwitcher from './LanguageSwitcher';
import { useT } from '@/hooks/useTranslation';

export default function Header() {
  // Move all translation hooks inside the component
  const morningGreeting = useT('Good morning! 👋');
  const afternoonGreeting = useT('Good afternoon! 👋');
  const eveningGreeting = useT('Good evening! 👋');
  const careText = useT("Let's take care of Grandma today");

  // Create a function that uses the translated strings
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return morningGreeting;
    if (hour < 18) return afternoonGreeting;
    return eveningGreeting;
  };

  return (
    <div className="mb-4 flex flex-row items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">{getGreeting()}</h2>
        <p className="text-xs text-muted-foreground">{careText}</p>
      </div>
      <LanguageSwitcher />
    </div>
  );
}
