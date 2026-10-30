import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const FINANCE_EMOJIS = [
  // Money & Finance
  "💰", "💵", "💴", "💶", "💷", "💳", "💎", "🏦", "📈", "📉",
  // Shopping & Retail
  "🛒", "🛍️", "🏪", "🏬", "🛎️",
  // Food & Dining
  "🍕", "🍔", "🍜", "🍱", "☕", "🍺", "🥗", "🍳", "🛒",
  // Transportation
  "🚗", "🚕", "🚌", "✈️", "🚇", "⛽", "🚲", "🛵",
  // Home & Utilities
  "🏠", "🏡", "🔌", "💡", "🚿", "📺", "🛋️", "🔧",
  // Health & Fitness
  "🏥", "💊", "🏋️", "🧘", "🦷", "👓", "❤️",
  // Entertainment
  "🎬", "🎮", "🎵", "📚", "🎭", "🎯", "🎪", "🎨",
  // Education
  "🎓", "📖", "✏️", "💻", "🔬", "📐",
  // Travel
  "🏖️", "🏔️", "⛷️", "🏕️", "🗺️",
  // Other
  "📱", "🐕", "🐈", "🎁", "💼", "📦", "🧾", "📋",
];

interface EmojiPickerProps {
  value?: string;
  onChange: (emoji: string) => void;
}

const EmojiPicker = ({ value, onChange }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-16 h-10 text-2xl"
          type="button"
        >
          {value || "📁"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="grid grid-cols-8 gap-1">
          {FINANCE_EMOJIS.map((emoji, index) => (
            <Button
              key={index}
              variant="ghost"
              className="h-8 w-8 p-0 text-xl hover:bg-muted"
              type="button"
              onClick={() => handleSelect(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
