# Neura i18n (English / Persian): status

Default language is English. Users can switch to Persian (فارسی) from **Settings → Language**, or from the button on the login / sign-up pages. The choice is saved in localStorage (`language`).

## How it works

- Libraries: `i18next` + `react-i18next`.
- Setup: `neura-web/src/i18n/index.ts` (imported in `main.tsx`). Exports `LANGUAGES`, `setLanguage`, `applyLanguage`.
- Translations: `neura-web/src/i18n/locales/en.json` and `fa.json`. Keys are grouped by feature (`nav.*`, `header.*`, `settings.*`, `auth.*`).
- Changing language sets `<html lang>` and `<html dir>` (`rtl` for Persian). The sidebar moves to the right side in RTL.
- Persian font: Vazirmatn (Google Fonts link in `index.html`, `:lang(fa)` rule in `index.css`).
- Switchers: `features/settings/components/LanguageSection.tsx` and `components/shared/LanguageSwitcher.tsx` (auth pages).

### Pattern for translating a component

```tsx
import { useTranslation } from "react-i18next";

const { t } = useTranslation();
<span>{t("tasks.title")}</span>
```

1. Add the key to **both** `en.json` and `fa.json`.
2. For zod schemas, use the key as the message (`"auth.passwordMin"`) and render with `t(errors.x.message!)`.
3. For module-level constants (menus, option lists), store a key (`titleKey`) and call `t()` at render time.
4. Use logical Tailwind classes so RTL works: `ms-/me-`, `ps-/pe-`, `start-/end-`, `text-start` instead of `ml-/mr-`, `pl-/pr-`, `left-/right-`, `text-left`.

## Done

| Area | Files |
|---|---|
| i18n setup, locale files, RTL + font | `i18n/*`, `main.tsx`, `index.html`, `index.css` |
| Sidebar menu | `layouts/SidebarNav.tsx` |
| Header and user menu | `layouts/Header.tsx`, `layouts/UserProfileMenu.tsx` |
| Settings page: Appearance, Language, Calendar, Session | `features/settings/*`, `lib/weekStart.ts` (labels are now keys) |
| Auth: login, sign-up, layout, Google button, password input, divider | `features/auth/*` |

Type-check (`npx tsc -p tsconfig.app.json --noEmit`) shows no errors in these files. Not yet checked in a browser.

## Remaining (still English)

About 19,000 lines in 12 areas:

- [ ] Tasks and Calendar (~5,200 lines): tasks, lists, tags, subtasks, due time, calendar views
- [ ] Notes (~3,600 lines): editor, toolbar, folders, links
- [ ] Goals (~3,000 lines)
- [ ] Habits (~1,600 lines)
- [ ] Assistant (~1,400 lines): UI text and quick actions
- [ ] Focus (~1,250 lines)
- [ ] Brainstorms (~1,200 lines)
- [ ] Reminders (~1,200 lines)
- [ ] Search (~800 lines)
- [ ] Notifications (~830 lines): bell, toasts, Settings → Notifications
- [ ] Dashboard (~630 lines)
- [ ] Settings leftovers: `ProfileForm`, `AccountSection`, `ProfileAvatar`
- [ ] PWA install prompt (`features/pwa`)
- [ ] Shared components: `components/shared/*` (confirm dialog, empty state, etc.)
- [ ] Toast messages (`toast.success/error` calls in hooks)
- [ ] Zod validation messages in each feature's `schemas/`

## Known gaps and decisions needed

- **Dates:** month and weekday names come from date-fns (about 51 import sites) and are English. For Persian, pass the `fa` locale from `date-fns/locale` based on the current language (a shared `useDateLocale()` helper would avoid repeating it).
- **Shamsi (Jalali) calendar:** not included. Showing Persian-calendar dates is a separate, larger change.
- **Digits:** Persian digits (۱۲۳) are not applied automatically. Decide whether to format numbers with `Intl.NumberFormat("fa")`.
- **Server text:** API error messages, notification text sent by push, and AI assistant replies are not translated by this work. The assistant already answers in the user's language; push text would need the language stored in `NotificationSettings`.
- **RTL layout:** only the sidebar and the auth pages were reviewed. Other pages still use physical classes (`ml-`, `mr-`, `text-left`, `left-`, `right-`) and may look off in Persian until each is converted.
- **Rich-text editor:** each paragraph already uses `unicode-bidi: plaintext`, so mixed-direction notes should work. The toolbar layout under RTL is untested.
- **Language is per device**, not per account. Saving it on the user profile (`PATCH /users/me`) would sync it across devices.
- **Persian wording** was written without review. Have a native speaker check it, especially product terms such as "Brainstorms" (ایده‌ها) and "Focus Mode" (حالت تمرکز).

## Suggested order

1. Dashboard, Tasks, Calendar (most visible)
2. Date-fns locale helper
3. Habits, Goals, Reminders, Notes
4. Focus, Brainstorms, Search, Notifications, Assistant
5. Shared components, toasts, schemas
6. RTL pass over every page, then a full read-through of `fa.json`
