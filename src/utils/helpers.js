export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
};

export const formatCurrency = (amount) => {
  // Handles both number and BigDecimal (serialised as number by Jackson)
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount ?? 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const getSeatColor = (available, max) => {
  if (max === 0) return 'bg-gray-500';
  const pct = (available / max) * 100;
  if (pct > 50) return 'bg-emerald-500';
  if (pct > 20) return 'bg-amber-500';
  return 'bg-red-500';
};

export const getSeatFillColor = (fillPct) => {
  if (fillPct < 50) return 'bg-emerald-500';
  if (fillPct < 80) return 'bg-amber-500';
  return 'bg-red-500';
};

export const getPaymentBadgeClass = (status) => {
  switch (status) {
    case 'PAID': return 'badge-paid';
    case 'FAILED': return 'badge-failed';
    case 'PENDING': return 'badge-pending';
    default: return 'badge-pending';
  }
};

export const getDepartmentIcon = (name) => {
  const icons = {
    // New 8 departments
    'CSE':           '💻',
    'AIML':          '🤖',
    'AIDS':          '📊',
    'Cybersecurity': '🔐',
    'Data Science':  '📈',
    'ECE':           '📡',
    'EEE':           '⚡',
    'Civil':         '🏗️',
    // Legacy names kept for backward compat
    'Computer Science': '💻',
    'Mechanical':       '⚙️',
    'English & Arts':   '📚',
    'AI & Data Science':'🤖',
    'Business':         '💼',
  };
  return icons[name] || '🎓';
};
