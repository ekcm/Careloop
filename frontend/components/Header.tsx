import LanguageSwitcher from './LanguageSwitcher';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning! 👋';
  if (hour < 18) return 'Good afternoon! 👋';
  return 'Good evening! 👋';
}

export default function Header() {
  return (
    <div className="mb-4 flex flex-row items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">{getGreeting()}</h2>
        <p className="text-xs text-muted-foreground">
          Let&apos;s take care of Grandma today
        </p>
      </div>
      <LanguageSwitcher />
    </div>
  );
}
