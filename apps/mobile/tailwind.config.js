/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                brand: {
                    bg: '#FAFAF7',
                    surface: '#FFFFFF',
                    primary: '#4CAF7D',
                    'primary-dark': '#3A9A6A',
                    'primary-light': '#E8F5EE',
                    secondary: '#F5A623',
                    'secondary-light': '#FEF5E7',
                    accent: '#1B4F72',
                    'accent-light': '#EAF2F8',
                    text: '#1C1C1E',
                    muted: '#6B7280',
                    border: '#EBEBEB',
                    danger: '#E74C3C',
                    'danger-light': '#FDEDEC',
                    dark: '#0F1117',
                },
            },
        },
    },
    plugins: [],
}
