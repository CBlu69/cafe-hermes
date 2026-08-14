// cafe hermes: تنظیمات ذخیره‌سازی روی سرور (Supabase)
// برای ذخیره مشترک بین همه گوشی‌ها، اول اسکریپت sql/menu-table.sql رو
// توی SQL Editor سوپابیس اجرا کن، بعد serverEnabled = true بذار.
var CAFE_CONFIG = {
    serverEnabled: true,
    supabaseUrl: 'https://ltczjrtqqrffdylbjuac.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Y3pqcnRxcXJmZmR5bGJqdWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDM3NjAsImV4cCI6MjEwMjI3OTc2MH0.Yu9hLTlmOd6FPfC17jTxi5MMznrYb3pJrus1IO23mHc',
    table: 'cafe_menu_items'
}
