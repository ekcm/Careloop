import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function TranslatePage() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
        Elijah: I'm working on this page now.
      </div>
    </div>
  );
}
