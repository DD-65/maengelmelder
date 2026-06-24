import EmojiPicker, { Theme } from 'emoji-picker-react';

interface EmojiPickerPanelProps {
  theme: 'auto' | 'light' | 'dark';
  onEmojiClick: (emoji: string) => void;
}

const themes = {
  auto: Theme.AUTO,
  light: Theme.LIGHT,
  dark: Theme.DARK,
} as const;

export function EmojiPickerPanel({ theme, onEmojiClick }: EmojiPickerPanelProps) {
  return (
    <EmojiPicker
      theme={themes[theme]}
      lazyLoadEmojis
      onEmojiClick={({ emoji }) => onEmojiClick(emoji)}
    />
  );
}
