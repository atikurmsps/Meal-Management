/**
 * Utility functions for date formatting
 */

/**
 * Format a date string (YYYY-MM-DD) or Date object to "30 Dec 2025" format
 * @param dateInput - Date string in YYYY-MM-DD format or Date object
 * @param fullMonth - If true, returns "30 December 2025", otherwise "30 Dec 2025"
 * @returns Formatted date string
 */
export function formatDate(dateInput: string | Date, fullMonth: boolean = false): string {
    if (!dateInput) return '';
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return typeof dateInput === 'string' ? dateInput : ''; // Return original if invalid date
    
    const day = date.getDate();
    const monthNames = fullMonth 
        ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
}

/**
 * Format a month string (YYYY-MM) to "December 2025" format
 * @param monthString - Month string in YYYY-MM format
 * @returns Formatted month string
 */
export function formatMonth(monthString: string): string {
    if (!monthString) return '';
    
    const [year, month] = monthString.split('-');
    if (!year || !month) return monthString; // Return original if invalid format
    
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex < 0 || monthIndex > 11) return monthString; // Return original if invalid month
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[monthIndex];
    
    return `${monthName} ${year}`;
}

/**
 * Format a date to locale date string with custom format
 * @param date - Date object or date string
 * @param fullMonth - If true, uses full month name
 * @returns Formatted date string
 */
export function formatDateLocale(date: Date | string, fullMonth: boolean = false): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    return formatDate(dateObj.toISOString().slice(0, 10), fullMonth);
}

