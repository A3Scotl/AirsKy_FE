/**
 * Theme-aware utility functions for consistent styling across the application
 */

/**
 * Get status badge classes that work with both light and dark themes
 * @param {string} status - The status value
 * @returns {string} - Tailwind classes for the badge
 */
export const getStatusBadgeClasses = (status) => {
  const variants = {
    // Success states
    completed:
      "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800",
    active:
      "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800",
    "on time":
      "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800",
    confirmed:
      "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800",

    // Warning states
    pending:
      "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    delayed:
      "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    boarding:
      "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800",

    // Error states
    failed:
      "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800",
    cancelled:
      "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800",
    suspended:
      "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800",

    // Info states
    refunded:
      "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    departed:
      "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    inactive:
      "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  };

  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, " ").trim();
  return (
    variants[normalizedStatus] ||
    "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"
  );
};

/**
 * Get role badge classes that work with both light and dark themes
 * @param {string} role - The role value
 * @returns {string} - Tailwind classes for the badge
 */
export const getRoleBadgeClasses = (role) => {
  const variants = {
    admin: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400",
    "super administrator":
      "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400",
    administrator:
      "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400",
    manager:
      "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400",
    staff:
      "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400",
    customer:
      "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400",
    premium:
      "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400",

    // Flight classes
    economy: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400",
    business:
      "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400",
    first:
      "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400",
  };

  const normalizedRole = role?.toLowerCase();
  return (
    variants[normalizedRole] ||
    "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
  );
};

/**
 * Get priority badge classes that work with both light and dark themes
 * @param {string} priority - The priority value
 * @returns {string} - Tailwind classes for the badge
 */
export const getPriorityBadgeClasses = (priority) => {
  const variants = {
    low: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400",
    medium:
      "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400",
    high: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400",
    urgent: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400",
  };

  const normalizedPriority = priority?.toLowerCase();
  return (
    variants[normalizedPriority] ||
    "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
  );
};

/**
 * Get theme-aware card background classes
 * @returns {string} - Tailwind classes for card background
 */
export const getCardClasses = () => {
  return "bg-card text-card-foreground border-border shadow-sm hover:shadow-md transition-shadow";
};

/**
 * Get theme-aware input classes
 * @returns {string} - Tailwind classes for inputs
 */
export const getInputClasses = () => {
  return "bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20";
};

/**
 * Get theme-aware button classes for specific variants
 * @param {string} variant - Button variant (primary, secondary, outline, ghost)
 * @returns {string} - Tailwind classes for buttons
 */
export const getButtonClasses = (variant = "default") => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline:
      "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };

  return variants[variant] || variants.default;
};

/**
 * Get theme-aware text color classes
 * @param {string} type - Text type (primary, secondary, muted, accent)
 * @returns {string} - Tailwind classes for text
 */
export const getTextClasses = (type = "primary") => {
  const variants = {
    primary: "text-foreground",
    secondary: "text-muted-foreground",
    muted: "text-muted-foreground",
    accent: "text-accent-foreground",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    error: "text-red-600 dark:text-red-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  return variants[type] || variants.primary;
};

/**
 * Get theme-aware background classes
 * @param {string} type - Background type (default, card, muted, accent)
 * @returns {string} - Tailwind classes for backgrounds
 */
export const getBackgroundClasses = (type = "default") => {
  const variants = {
    default: "bg-background",
    card: "bg-card",
    muted: "bg-muted",
    accent: "bg-accent",
    popover: "bg-popover",
    primary: "bg-primary",
    secondary: "bg-secondary",
  };

  return variants[type] || variants.default;
};
