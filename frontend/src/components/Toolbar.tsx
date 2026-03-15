import { PaintRoller, Eraser, Trash2, Undo } from 'lucide-react';
import clsx from 'clsx';
import { socket } from '../store/gameStore';

const COLORS = [
  '#000000', '#ffffff', '#c1c1c1', '#4c4c4c', '#ef130b', '#740b07',
  '#ff7100', '#c23800', '#ffe400', '#e8a200', '#00cc00', '#005510',
  '#00b2ff', '#00569e', '#231fd3', '#0e0865', '#a300ba', '#550069',
  '#d37caa', '#a75574', '#a0522d', '#63300d'
];

const SIZES = [
  { value: 2, label: 'Small' },
  { value: 6, label: 'Medium' },
  { value: 12, label: 'Large' },
  { value: 24, label: 'Extra Large' },
];

export interface DrawSettings {
  color: string;
  size: number;
  tool: 'brush' | 'eraser';
}

interface ToolbarProps {
  settings: DrawSettings;
  setSettings: (settings: DrawSettings) => void;
  onClear: () => void;
  onUndo: () => void;
}

export default function Toolbar({ settings, setSettings, onClear, onUndo }: ToolbarProps) {
  
  const handleClear = () => {
    socket.emit('canvas_clear');
    onClear();
  };

  return (
    <div className="flex flex-col bg-neutral-900 border-r border-white/5 w-16 items-center py-4 gap-6 shrink-0 z-10">
      
      {/* Tools Section */}
      <div className="flex flex-col gap-3 w-full px-2">
        <button
          onClick={() => setSettings({ ...settings, tool: 'brush' })}
          className={clsx(
            "p-2.5 rounded-xl w-full flex items-center justify-center transition-all",
            settings.tool === 'brush' ? "bg-indigo-500 text-white shadow-inner shadow-black/20" : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
          )}
          title="Brush"
        >
          <PaintRoller size={20} />
        </button>
        <button
          onClick={() => setSettings({ ...settings, tool: 'eraser' })}
          className={clsx(
            "p-2.5 rounded-xl w-full flex items-center justify-center transition-all",
            settings.tool === 'eraser' ? "bg-indigo-500 text-white shadow-inner shadow-black/20" : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
          )}
          title="Eraser"
        >
          <Eraser size={20} />
        </button>
      </div>

      <div className="w-8 h-px bg-white/10" />
      
      {/* Size Selection */}
      <div className="flex flex-col gap-2 w-full px-2">
         {SIZES.map(s => (
             <button
                key={s.value}
                onClick={() => setSettings({ ...settings, size: s.value })}
                className={clsx(
                   "w-full h-8 flex items-center justify-center rounded-lg transition-colors",
                   settings.size === s.value ? "bg-white/10 border-white/20 border" : "hover:bg-neutral-800 border border-transparent"
                )}
                title={s.label}
             >
                <div 
                  className={clsx("rounded-full", settings.size === s.value ? "bg-white" : "bg-neutral-500")} 
                  style={{ width: Math.min(s.value, 16), height: Math.min(s.value, 16) }}
                />
             </button>
         ))}
      </div>

      <div className="w-8 h-px bg-white/10" />

      {/* Action Section */}
      <div className="flex flex-col gap-3 w-full px-2 mt-auto">
        <button
          onClick={onUndo}
          className="p-2.5 rounded-xl w-full flex items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all active:scale-95"
          title="Undo"
        >
          <Undo size={20} />
        </button>
        <button
          onClick={handleClear}
          className="p-2.5 rounded-xl w-full flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer active:scale-95 border border-transparent hover:border-red-500/30"
          title="Clear Canvas"
        >
          <Trash2 size={20} />
        </button>
      </div>
      
    </div>
  );
}

// Separate component for the horizontal color palette
export function ColorPalette({ current, onChange }: { current: string, onChange: (color: string) => void }) {
    return (
        <div className="h-14 bg-neutral-900 border-t border-white/5 flex items-center px-4 gap-1 overflow-x-auto shrink-0 z-10">
            {COLORS.map(c => (
                <button
                    key={c}
                    onClick={() => onChange(c)}
                    className={clsx(
                        "w-8 h-8 rounded-full shrink-0 border-2 transition-transform",
                        current === c ? "border-white scale-110 z-10 shadow-lg" : "border-black/50 hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                />
            ))}
        </div>
    );
}
