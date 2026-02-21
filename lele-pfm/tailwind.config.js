/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                darkBg: '#0F1014',
                darkCard: '#1A1C23',
                glassBorder: 'rgba(255, 255, 255, 0.1)',
                neonCyan: '#00F0FF',
                neonPurple: '#BD00FF',
                neonLime: '#CCFF00',
                textPrimary: '#FFFFFF',
                textSecondary: '#A1A1AA',
                textMuted: '#52525B',
            },
            fontFamily: {
                // Add custom fonts if needed, otherwise rely on system fonts
            }
        },
    },
    plugins: [],
}
