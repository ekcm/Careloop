import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  return (
    <div className="mb-4 flex flex-row items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">Good morning! 👋</h2>
        <p className="text-xs text-muted-foreground">Let's take care of Grandma today</p>
      </div>
      <LanguageSwitcher />
    </div>
  );
}
