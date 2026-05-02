import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

const DEPT_ICONS = {
  CSE:           '💻',
  AIML:          '🤖',
  AIDS:          '📊',
  Cybersecurity: '🔐',
  'Data Science':'📈',
  ECE:           '📡',
  EEE:           '⚡',
  Civil:         '🏗️',
};

/**
 * Horizontally-scrollable department filter bar.
 * Props:
 *   departments  — array of { id, name, colorTag }
 *   selected     — currently selected dept name (or null for "All")
 *   onSelect     — (deptName | null) => void
 */
const DepartmentFilterBar = ({ departments, selected, onSelect }) => {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Left arrow */}
      <button
        onClick={() => scroll(-1)}
        className="flex-shrink-0 w-8 h-8 rounded-full glass flex items-center justify-center
                   text-white/60 hover:text-white hover:bg-white/10 transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Scrollable list */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth flex-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* "All" chip */}
        <DeptChip
          label="All"
          icon={<LayoutGrid className="w-3.5 h-3.5" />}
          color="#6366f1"
          active={!selected}
          onClick={() => onSelect(null)}
        />

        {departments.map(dept => (
          <DeptChip
            key={dept.id}
            label={dept.name}
            icon={<span className="text-sm">{DEPT_ICONS[dept.name] || '🎓'}</span>}
            color={dept.colorTag}
            active={selected === dept.name}
            onClick={() => onSelect(selected === dept.name ? null : dept.name)}
          />
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll(1)}
        className="flex-shrink-0 w-8 h-8 rounded-full glass flex items-center justify-center
                   text-white/60 hover:text-white hover:bg-white/10 transition-all"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const DeptChip = ({ label, icon, color, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-200 border whitespace-nowrap
                ${active
                  ? 'text-white shadow-lg scale-105'
                  : 'glass text-white/70 hover:text-white hover:scale-105 border-white/10'
                }`}
    style={active ? {
      backgroundColor: `${color}33`,
      borderColor: `${color}88`,
      color: color,
      boxShadow: `0 0 12px ${color}44`,
    } : {}}
  >
    {icon}
    {label}
  </button>
);

export default DepartmentFilterBar;
