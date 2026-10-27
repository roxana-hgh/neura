# طراحی Goals و Reminders در Neura

> وضعیت: فازهای ۱، ۲ و ۳ و ویجت‌های داشبورد پیاده‌سازی شده‌اند. **اعلان‌ها، Web Push، Service Worker و cron (بخش‌های ۲.۵ و ۲.۶ و فاز ۴) به درخواست کنار گذاشته شدند.** یادآوری‌ها فقط به‌صورت لیست (Overdue / Today / Snoozed / Done) نمایش داده می‌شوند. · تاریخ: 2026-10-27
> این سند بر اساس ساختار فعلی کد نوشته شده: feature-based در `neura-web`، الگوی routes → controller → service در `neura-api`، Prisma + Postgres، و زبان بصری صفحه‌ی Habits.

---

## ۰. خلاصه‌ی تصمیم‌های کلیدی

| موضوع | تصمیم | دلیل |
|---|---|---|
| زیرهدف | همان مدل `Goal` با `parentId` (فقط یک سطح عمق) | محاسبه‌ی پیشرفت، وضعیت، تسک‌ها و یادآوری‌ها بدون کد تکراری برای زیرهدف هم کار می‌کند. اتصال یادآوری به Sub-goal هم خودبه‌خود همان `goalId` است. |
| انواع اندازه‌گیری | `numeric`، `milestone`، `task`، `manual` (کیفی) | پیشرفت هر نوع یک فرمول مشخص دارد (بخش ۱.۴). نوع پیش‌فرض `manual` است تا فرم سریع بدون تنظیمات کار کند. |
| پایان مهلت | هیچ وضعیت «شکست خورده‌ای» وجود ندارد. هدف فعالِ مهلت‌گذشته فقط برچسب **Needs review** می‌گیرد. | خواسته‌ی صریح: پایان مهلت به معنای شکست نیست. کاربر خودش تصمیم می‌گیرد: تکمیل، تمدید یا لغو. |
| آرشیو | فیلد جدای `archivedAt`، نه یک مقدار از `status` | آرشیو مستقل از نتیجه است. هدفِ تکمیل‌شده یا لغوشده را هم می‌شود آرشیو کرد. |
| یادآوری مستقل | `Reminder` موجودیت مستقل است. اتصال به Goal/Task/Note اختیاری است. | می‌شود بدون ساختن تسک یا هدف، یادآوری ثبت کرد. |
| هماهنگی با Goal | فیلد `origin` (`manual` / `goal_auto`) و فیلد `suspendedBy` | سیستم دقیقاً می‌داند کدام یادآوری را خودش ساخته، کدام را به‌خاطر هدف متوقف کرده، و کدام مستقل است. پس هرگز یادآوری مستقل حذف نمی‌شود. |
| اعلان‌ها | دو لایه: اعلان درون‌برنامه‌ای (polling) + Web Push با Service Worker | بدون مجوز اعلان هم یادآوری‌ها کار می‌کنند. Push فقط با رضایت کاربر و در زمان مناسب فعال می‌شود. |
| زمان‌بندی سمت سرور | endpoint داخلی `POST /internal/cron/reminders` که هر دقیقه با یک cron خارجی صدا زده می‌شود | سرویس Render ممکن است بخوابد. `setInterval` درون‌پردازه‌ای به‌تنهایی قابل اعتماد نیست. |

---

## ۱. اهداف (Goals)

### ۱.۱ مدل مفهومی

```
Goal (اصلی)
 ├─ معیار موفقیت، بازه، تاریخ شروع/پایان، دسته، رنگ
 ├─ نوع اندازه‌گیری + مقدار هدف
 ├─ Sub-goals (Goal با parentId) ─┬─ تسک‌های مرتبط
 │                                └─ یادآوری‌ها
 ├─ Tasks  (Task.goalId)
 ├─ Notes  (Note.goalId)
 ├─ Reminders (Reminder.goalId)
 └─ GoalLog (تاریخچه: پیشرفت، یادداشت کوتاه، تغییر وضعیت، تمدید)
```

### ۱.۲ بازه‌ها

| بازه | پر شدن خودکار تاریخ‌ها |
|---|---|
| `weekly` | هفته‌ی جاری بر اساس `weekStartsOn` کاربر (از `useWeekStartsOn()`، هرگز ثابت) |
| `monthly` | ماه جاری |
| `quarterly` (فصلی) | فصل جاری (Q1..Q4) |
| `half_year` (شش‌ماهه) | از امروز تا ۶ ماه بعد |
| `yearly` | سال جاری |
| `custom` | کاربر شروع و پایان را انتخاب می‌کند |

با انتخاب بازه تاریخ‌ها خودکار پر می‌شوند. یک سوییچ «این / بعدی» (مثلاً This month / Next month) هم وجود دارد. اگر کاربر تاریخ‌ها را دستی تغییر دهد، بازه خودبه‌خود `custom` می‌شود.

### ۱.۳ وضعیت‌ها و چرخه‌ی عمر

```
            ┌──────── pause ───────┐
            ▼                      │
  [active] ◄──── resume ───── [paused]
     │  ▲
     │  └──────── reopen ─────────┐
     ├── complete ──► [completed] ┤
     └── cancel ────► [cancelled] ┘

  archive / unarchive: روی هر وضعیتی، مستقل (archivedAt)
  extend: روی active / paused / needs-review → endDate جدید + ثبت در تاریخچه
```

**وضعیت‌های محاسبه‌شده** (در دیتابیس ذخیره نمی‌شوند و هنگام پاسخ محاسبه می‌شوند):

- `needsReview`: یعنی `status = active` و `endDate < today`.
  - روی کارت به‌جای رنگ قرمز، یک بج کهربایی «Needs review» نمایش داده می‌شود.
  - سه دکمه دارد: **Mark complete**، **Extend** و **Cancel**.
- `pace`: یکی از `ahead`، `on_track` یا `behind`.
  - `expected = elapsedDays / totalDays`.
  - اگر `progress ≥ expected − 0.1` باشد، وضعیت on track است.
  - برای `manual` فقط زمانی نمایش داده می‌شود که حداقل یک check-in وجود داشته باشد.

### ۱.۴ محاسبه‌ی پیشرفت (۰ تا ۱۰۰)

| نوع | ورودی کاربر | فرمول |
|---|---|---|
| `numeric` (عددی) | `startValue` (پیش‌فرض ۰)، `targetValue`، `unit` | `(current − start) / (target − start)`، محدود به ۰ تا ۱. هدف کاهشی هم پشتیبانی می‌شود، مثلاً وزن از ۸۰ به ۷۲. |
| `milestone` (مرحله‌ای) | زیرهدف‌ها، که هر کدام یک مرحله‌اند | میانگین پیشرفت زیرهدف‌ها. زیرهدف ساده (بدون نوع) فقط انجام‌شده/نشده است. |
| `task` (مبتنی بر تسک) | اتصال تسک‌ها | تسک‌های کامل‌شده ÷ همه‌ی تسک‌های متصل، شامل تسک‌های زیرهدف‌ها |
| `manual` (کیفی) | ارزیابی دستی در ۵ پله: 0 / 25 / 50 / 75 / 100 + یادداشت | مقدار آخرین check-in |

- اگر هدف هیچ زیرهدف یا تسکی نداشته باشد، پیشرفت `0` است و یک `EmptyState` کوچک با دکمه‌ی «Add milestone» یا «Link tasks» نمایش داده می‌شود.
- رسیدن به ۱۰۰٪ هدف را **خودکار تکمیل نمی‌کند**. فقط بنر «🎉 Target reached – Mark as complete?» نشان داده می‌شود، چون معیار موفقیت ممکن است چیزی فراتر از عدد باشد.
- نوع اندازه‌گیری را بعداً هم می‌شود عوض کرد. تاریخچه حفظ می‌شود و یک رویداد `metric_changed` ثبت می‌شود.

### ۱.۵ زیرهدف‌ها

- فیلدها: عنوان (اجباری)، توضیحات، تاریخ سررسید اختیاری (پیش‌فرض: `endDate` هدف والد)، نوع پیشرفت اختیاری، تسک‌ها و یادآوری‌ها.
- ساخت سریع: یک input درون‌خطی «+ Add sub-goal» در صفحه‌ی هدف. با Enter ثبت می‌شود و فوکوس روی ردیف بعدی می‌ماند، مثل یک چک‌لیست.
- مرتب‌سازی با `position`، با drag در دسکتاپ و منوی «Move up/down» در موبایل.
- عمق فقط یک سطح است. API برای `parentId` که خودش والد دارد `400` برمی‌گرداند.

---

## ۲. یادآوری‌ها (Reminders)

### ۲.۱ مدل مفهومی

یک Reminder یک **قاعده** است (زمان + تکرار) و یک **زمان رخداد بعدی** دارد (`nextAt`). برای یادآوری تکرارشونده، «انجام شد» یعنی همین رخداد انجام شده و سری به رخداد بعدی می‌رود.

| فیلد | توضیح |
|---|---|
| `scheduledAt` | زمان رسمی رخداد جاری، بدون در نظر گرفتن snooze |
| `nextAt` | زمان واقعی اعلان بعدی: `snoozedUntil ?? scheduledAt − leadMinutes` |
| `timeZone` | IANA، مثلاً `Asia/Tehran`. برای محاسبه‌ی «هر روز ساعت ۹» در منطقه‌ی زمانی کاربر لازم است. |
| `repeat` | `none`، `daily`، `weekly`، `monthly`، `yearly`، `custom` |
| `interval` | «هر N» روز، هفته یا ماه (برای custom) |
| `weekdays` | `Int[]` برای weekly/custom، مثلاً `[6,1,3]` |
| `repeatUntil` | پایان اختیاری سری |
| `status` | `active`، `paused`، `completed`، `cancelled` |

### ۲.۲ نمای کاربر (Tabs)

| تب | شرط |
|---|---|
| **Upcoming** | `status=active`، گروه‌بندی‌شده به: **Overdue** (رخداد گذشته و تأییدنشده) · Today · Tomorrow · This week · Later |
| **Snoozed** | `snoozedUntil > now` |
| **Done** | یادآوری‌های یک‌باره‌ی `completed` + رخدادهای انجام‌شده‌ی سری‌های تکرارشونده (از `ReminderLog`) |

### ۲.۳ تکرار

- انتخابگر تکرار به شکل یک Popover کوچک است:
  - گزینه‌ها: None · Daily · Weekdays · Weekly on {روز امروز} · Monthly on {N} · Yearly · Custom…
  - Custom یعنی «Every [N] [day|week|month]» با انتخاب روزهای هفته و پایان (Never / On date).
- اگر روز ماه بیشتر از تعداد روزهای ماه باشد (مثلاً ۳۱ در ماه ۳۰ روزه)، آخرین روز ماه در نظر گرفته می‌شود.
- تابع خالص `nextOccurrence(rule, after, timeZone)` در `reminders.utils.ts` قرار می‌گیرد، با `date-fns-tz`. این تابع تست واحد دارد، چون حساس‌ترین منطق سیستم است.
- رشته‌ی خوانا مثل «Every Mon & Wed at 09:00» در frontend با `describeRepeat()` ساخته می‌شود.

### ۲.۴ Snooze

- پیشنهادها: **10 min · 1 hour · This evening (18:00) · Tomorrow 09:00 · Pick time…**
- Snooze فقط `snoozedUntil` را تغییر می‌دهد و `scheduledAt` ثابت می‌ماند. پس تعویق یک رخداد، سری تکرار را جابه‌جا نمی‌کند.
- اگر رخداد بعدیِ یک سری برسد و رخداد قبلی هنوز تأیید نشده باشد، رخداد قبلی با action `missed` در لاگ ثبت می‌شود و فقط یک مورد Overdue باقی می‌ماند. بنابراین یادآوری روزانه‌ای که یک هفته باز نشده، ۷ مورد معوقه نمی‌سازد.

### ۲.۵ تنظیمات اعلان

- برای هر یادآوری: `notify` (روشن/خاموش) و `leadMinutes` (At time · 5 · 15 · 30 · 60 دقیقه قبل).
- سراسری (Settings → Notifications): وضعیت مجوز مرورگر، روشن/خاموش کردن Push روی این دستگاه، ساعات سکوت اختیاری (`quietStart` / `quietEnd` روی User)، و دکمه‌ی «Send test notification».

### ۲.۶ اعلان‌ها و مجوزها

**لایه‌ی ۱، درون‌برنامه‌ای** (بدون نیاز به هیچ مجوزی):
- `ReminderDueWatcher` در `AppLayout` قرار دارد.
- هر ۶۰ ثانیه و هنگام `visibilitychange` درخواست `GET /reminders/due` را می‌فرستد.
- برای هر مورد سررسیده یک toast پایدار نمایش می‌دهد که دکمه‌های **Done** و **Snooze ▾** دارد.
- آیکون زنگ در `Header` با شمارنده‌ی موارد Overdue نمایش داده می‌شود.

**لایه‌ی ۲، Web Push** (وقتی برنامه بسته است):
- `public/sw.js`: یک Service Worker ساده که `push` و `notificationclick` را مدیریت می‌کند. هنوز هیچ Service Workerی در پروژه وجود ندارد.
- کلیدهای VAPID به‌صورت `VAPID_PUBLIC_KEY`، `VAPID_PRIVATE_KEY` و `VAPID_SUBJECT` در `config/env.ts` اضافه می‌شوند.
- پکیج `web-push` اضافه می‌شود. `@types/web-push` باید در **dependencies** باشد، طبق قانون Render.
- اعلان دکمه‌های Done و Snooze 10m دارد. چون کوکی cross-origin در SW قابل اتکا نیست، هر payload یک **action token** امضاشده (HMAC، با اعتبار ۲۴ ساعت) دارد. SW آن را به `POST /api/reminders/actions` می‌فرستد. این مسیر بدون session است و فقط token را بررسی می‌کند.
- iOS فقط در حالت نصب‌شده به‌عنوان PWA از Push پشتیبانی می‌کند (iOS 16.4+). در iPhone، کارت مجوز به `InstallPrompt` موجود ارجاع می‌دهد.

**جریان درخواست مجوز** (هرگز هنگام بارگذاری صفحه درخواست نمی‌شود):
1. اولین باری که کاربر یادآوری با `notify=true` می‌سازد، بعد از ذخیره یک کارت نرم داخل صفحه نمایش داده می‌شود: «Get notified even when Neura is closed? [Enable] [Not now]».
2. فقط با کلیک روی Enable، `Notification.requestPermission()` صدا زده می‌شود و سپس subscribe انجام می‌شود.
3. اگر کاربر رد کند، برنامه بدون خطا روی لایه‌ی ۱ کار می‌کند. در Settings توضیح داده می‌شود که چطور می‌شود مجوز را از تنظیمات مرورگر فعال کرد.
4. «Not now» در localStorage ذخیره می‌شود و کارت تا ۱۴ روز دوباره نمایش داده نمی‌شود.

**ارسال سمت سرور:**
- `dispatchDueReminders()` موارد `nextAt ≤ now AND status=active AND notify AND firedAt IS DISTINCT FROM nextAt` را پیدا می‌کند.
- برای جلوگیری از ارسال تکراری، هر مورد با یک `updateMany` اتمی claim می‌شود (`firedAt = nextAt`).
- Push برای همه‌ی subscriptionهای کاربر ارسال می‌شود. subscription با پاسخ `410 Gone` حذف می‌شود.
- این تابع از `POST /internal/cron/reminders` صدا زده می‌شود، با هدر `x-cron-secret` برابر `CRON_SECRET`. این مسیر خارج از `requireAuth` mount می‌شود.
- زمان‌بندی: Render Cron Job یا cron-job.org هر دقیقه. یک `setInterval` درون‌پردازه‌ای هم نسخه‌ی پشتیبان است، برای وقتی که سرور بیدار است.

---

## ۳. ارتباط Goals ↔ Reminders

### ۳.۱ ساخت یادآوری از داخل هدف

در فرم هدف، بخش «Reminders» چند **chip پیش‌تنظیم** دارد که با یک کلیک روشن یا خاموش می‌شوند:

| Preset | قاعده | پیش‌فرض روشن برای |
|---|---|---|
| Weekly review | هر هفته، روز اول هفته‌ی کاربر، ساعت 20:00، تا `endDate` | بازه‌های monthly و طولانی‌تر |
| Monthly check-in | روز آخر هر ماه، ساعت 20:00 | quarterly و طولانی‌تر |
| Before deadline | ۳ روز قبل از `endDate`، ساعت 09:00 (برای weekly: ۱ روز قبل) | همه |
| Custom… | ReminderForm کامل با پیش‌اتصال به این هدف | — |

- presetها با `origin = goal_auto` و `autoKind` (`review` | `checkin` | `deadline`) ساخته می‌شوند. سیستم مالک آن‌هاست.
- یادآوری‌ای که کاربر با Custom یا از صفحه‌ی Reminders به هدف وصل می‌کند `origin = manual` دارد.
- در صفحه‌ی هدف، کنار هر زیرهدف یک آیکون 🔔 هست که «Remind me to finish this» را با `goalId = subGoal.id` می‌سازد.
- عنوان پیش‌فرض یادآوری‌های خودکار: «Review: {goal title}»، «Check in: {goal title}»، «{goal title} ends in 3 days».

### ۳.۲ قوانین هماهنگ‌سازی

اصل کلی: **فقط یادآوری‌هایی که `goalId` آن‌ها همین هدف یا یکی از زیرهدف‌هایش است، تحت تأثیر قرار می‌گیرند.** یادآوری مستقل (`goalId = null`) و یادآوری متصل به تسکِ این هدف هرگز دست نمی‌خورند.

| رویداد هدف | `goal_auto` | `manual` متصل به هدف |
|---|---|---|
| **Complete / Cancel** | ← `cancelled` | دیالوگ با لیست، که همه به‌صورت پیش‌فرض تیک «Turn off» دارند. موارد تیک‌خورده ← `paused` + `suspendedBy='goal'`. موارد بدون تیک فعال می‌مانند. در صورت نیاز گزینه‌ی «Keep as standalone» هم هست. |
| **Pause** | ← `paused` + `suspendedBy='goal'` | همین رفتار، بدون دیالوگ. یک toast خبر می‌دهد: «3 reminders paused» |
| **Resume / Reopen** | دوباره فعال می‌شوند. `scheduledAt` به اولین رخداد آینده می‌رود و رخدادهای گذشته پشت سر هم شلیک نمی‌شوند. | فقط مواردی که `suspendedBy='goal'` دارند دوباره فعال می‌شوند. چیزی که کاربر خودش خاموش کرده بود خاموش می‌ماند. |
| **Extend** (endDate جدید) | `deadline` بر اساس endDate جدید دوباره محاسبه می‌شود. `repeatUntil` برای review/checkin به endDate جدید تغییر می‌کند. | سری‌هایی که `repeatUntil == endDate قدیم` داشتند به endDate جدید منتقل می‌شوند. یادآوری‌های یک‌باره دست نمی‌خورند. |
| **Archive** | مثل Complete، ولی بدون دیالوگ، چون هدف قبلاً بسته شده | — |
| **Delete** | حذف | دیالوگ: «This goal has 2 linked reminders → Delete them / Keep as standalone» |
| **ویرایش عنوان** | عنوان یادآوری‌های خودکار به‌روز می‌شود، مگر اینکه کاربر آن‌ها را دستی ویرایش کرده باشد (`titleCustomized`) | — |

- همه‌ی این عملیات در یک `prisma.$transaction` داخل `goals.service` انجام می‌شوند و در `GoalLog` ثبت می‌شوند.
- Toast نتیجه همیشه دکمه‌ی **Undo** دارد (۸ ثانیه). Undo عملیات معکوس را صدا می‌زند.

### ۳.۳ نمایش در صفحه‌ی هدف

بخش **Reminders** در صفحه‌ی هدف از `ReminderList` در `features/reminders` استفاده می‌کند، با فیلتر `goalId` (شامل زیرهدف‌ها). این بخش نشان می‌دهد:
- یادآوری بعدی به‌صورت برجسته («Next: Sun 20:00 · Weekly review»)
- لیست همه‌ی یادآوری‌ها با toggle فعال/غیرفعال، snooze، ویرایش و حذف
- دکمه‌ی «+ Add reminder» که فرم را با `goalId` پیش‌پر شده باز می‌کند

---

## ۴. مدل داده (Prisma)

```prisma
enum GoalPeriod   { weekly monthly quarterly half_year yearly custom }
enum GoalMetric   { numeric milestone task manual }
enum GoalStatus   { active paused completed cancelled }
enum GoalLogType  { progress note status extended metric_changed created }

model Goal {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  parentId        String?
  parent          Goal?       @relation("SubGoals", fields: [parentId], references: [id], onDelete: Cascade)
  subGoals        Goal[]      @relation("SubGoals")
  position        Int         @default(0)

  title           String
  successCriteria String?
  description     String?
  category        String?
  color           String      @default("default")   // همان union `colors` در types/color.ts

  period          GoalPeriod  @default(monthly)
  startDate       DateTime                           // روز (00:00 UTC از "yyyy-MM-dd")
  endDate         DateTime

  metric          GoalMetric  @default(manual)
  startValue      Float       @default(0)
  targetValue     Float?
  currentValue    Float       @default(0)
  unit            String?

  status          GoalStatus  @default(active)
  completedAt     DateTime?
  archivedAt      DateTime?

  tasks           Task[]
  notes           Note[]
  reminders       Reminder[]
  logs            GoalLog[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([userId, status])
  @@index([parentId])
}

model GoalLog {
  id        String      @id @default(cuid())
  goalId    String
  goal      Goal        @relation(fields: [goalId], references: [id], onDelete: Cascade)
  type      GoalLogType
  value     Float?      // مقدار جدید (numeric/manual) یا درصد پیشرفت در لحظه
  note      String?
  meta      Json?       // { from, to } برای status/extended/metric_changed
  createdAt DateTime    @default(now())

  @@index([goalId, createdAt])
}

enum ReminderRepeat { none daily weekly monthly yearly custom }
enum ReminderStatus { active paused completed cancelled }
enum ReminderOrigin { manual goal_auto }
enum ReminderAction { done skipped snoozed missed }

model Reminder {
  id              String          @id @default(cuid())
  userId          String
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  title           String
  titleCustomized Boolean         @default(false)
  description     String?

  scheduledAt     DateTime        // رخداد جاری (UTC)
  snoozedUntil    DateTime?
  nextAt          DateTime?       // زمان اعلان بعدی؛ null وقتی غیرفعال است
  firedAt         DateTime?       // آخرین nextAt که اعلانش ارسال شد (idempotency)
  timeZone        String

  repeat          ReminderRepeat  @default(none)
  interval        Int             @default(1)
  weekdays        Int[]
  repeatUntil     DateTime?

  notify          Boolean         @default(true)
  leadMinutes     Int             @default(0)

  status          ReminderStatus  @default(active)
  suspendedBy     String?         // "goal" وقتی هدف آن را متوقف کرده
  completedAt     DateTime?

  origin          ReminderOrigin  @default(manual)
  autoKind        String?         // review | checkin | deadline

  goalId          String?
  goal            Goal?           @relation(fields: [goalId], references: [id], onDelete: Cascade)
  taskId          String?
  task            Task?           @relation(fields: [taskId], references: [id], onDelete: SetNull)
  noteId          String?
  note            Note?           @relation(fields: [noteId], references: [id], onDelete: SetNull)

  logs            ReminderLog[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([userId, status, nextAt])
  @@index([nextAt])
  @@index([goalId])
}

model ReminderLog {
  id          String         @id @default(cuid())
  reminderId  String
  reminder    Reminder       @relation(fields: [reminderId], references: [id], onDelete: Cascade)
  scheduledAt DateTime
  action      ReminderAction
  createdAt   DateTime       @default(now())

  @@index([reminderId, createdAt])
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint  String   @unique
  p256dh    String
  auth      String
  userAgent String?
  createdAt DateTime @default(now())
}

// تغییرات مدل‌های موجود
// Task: goalId String?, goal Goal? @relation(fields: [goalId], references: [id], onDelete: SetNull), reminders Reminder[]
// Note: goalId String?, goal Goal? @relation(... onDelete: SetNull), reminders Reminder[]
// User: goals Goal[], reminders Reminder[], pushSubscriptions PushSubscription[], quietStart String?, quietEnd String?
```

**توضیحات:**
- `goalId` روی Reminder به‌صورت `Cascade` تعریف شده، چون حذف هدف همیشه از سرویس عبور می‌کند. سرویس قبل از حذف، یادآوری‌هایی را که کاربر «Keep as standalone» انتخاب کرده با `goalId = null` جدا می‌کند. بنابراین یادآوری مستقل هرگز حذف نمی‌شود.
- اتصال به Task و Note به‌صورت `SetNull` است. اگر تسک حذف شود، یادآوری به‌صورت مستقل باقی می‌ماند.
- اتصال به Task در برابر Goal: در controller بررسی می‌شود که حداکثر یکی از `goalId`، `taskId` یا `noteId` مقدار داشته باشد. این کار UI را ساده نگه می‌دارد: هر یادآوری حداکثر یک chip اتصال دارد.

---

## ۵. API

همه‌ی مسیرها زیر `/api` هستند و `requireAuth` در سطح mount در `app.ts` اعمال می‌شود. مسیرهای ثابت قبل از `/:id` ثبت می‌شوند.

### `/api/goals` → `modules/goals/`

| Method | Path | توضیح |
|---|---|---|
| GET | `/` | `?status=active\|paused\|completed\|cancelled&archived=false&period=&q=`. فقط هدف‌های اصلی (`parentId=null`)، همراه با `progress`، `needsReview`، `pace` و `nextReminderAt` |
| GET | `/summary` | شمارش‌ها برای StatTileها و داشبورد |
| POST | `/` | `{ title, period?, start_date?, end_date?, metric?, target_value?, start_value?, unit?, success_criteria?, description?, category?, color?, parent_id?, reminder_presets?: ["review","deadline"] }` |
| GET | `/:id` | جزئیات کامل: subGoals (با progress)، tasks، notes، reminders، و ۲۰ لاگ آخر |
| PATCH | `/:id` | ویرایش فیلدها. اگر `title` یا `endDate` تغییر کند، یادآوری‌های خودکار همگام می‌شوند. |
| POST | `/:id/progress` | `{ value?, delta?, note? }` برای numeric/manual. یک `GoalLog` ثبت می‌شود. |
| POST | `/:id/notes` | یادداشت کوتاه در تاریخچه (`GoalLog type=note`) |
| PATCH | `/:id/status` | `{ status, reminders?: { turnOff: string[], detach: string[] } }` |
| POST | `/:id/extend` | `{ end_date, note? }` |
| POST | `/:id/archive`، `/:id/unarchive` | |
| PUT | `/:id/subgoals/order` | `{ ids: string[] }` |
| POST | `/:id/tasks` | `{ task_ids }` برای اتصال تسک‌های موجود. اتصال تسک جدید از `POST /tasks` با `goal_id` انجام می‌شود. |
| GET | `/:id/logs` | تاریخچه با صفحه‌بندی |
| DELETE | `/:id` | `?reminders=delete\|detach` |

زیرهدف همان `POST /goals` با `parent_id` است، و `PATCH`/`DELETE` آن هم همان مسیرهای `/goals/:id` هستند. سرویس همیشه با `where: { id, userId }` مالکیت را بررسی می‌کند.

**تغییر در tasks:** `toTaskData` فیلد `goal_id` → `goalId` را می‌پذیرد، با بررسی مالکیت هدف.

### `/api/reminders` → `modules/reminders/`

| Method | Path | توضیح |
|---|---|---|
| GET | `/` | `?view=upcoming\|snoozed\|done&goal_id=&task_id=&note_id=&from=&to=` |
| GET | `/due` | موارد سررسیده‌ی تأییدنشده، برای polling در `ReminderDueWatcher` |
| GET | `/counts` | `{ overdue, today, snoozed }` برای بج Header و Sidebar |
| POST | `/` | `{ title, description?, scheduled_at, time_zone, repeat?, interval?, weekdays?, repeat_until?, notify?, lead_minutes?, goal_id?\|task_id?\|note_id? }` |
| PATCH | `/:id` | ویرایش و تغییر زمان. `scheduledAt` و `nextAt` دوباره محاسبه می‌شوند و `snoozedUntil` پاک می‌شود. |
| POST | `/:id/complete` | `{ scope: "occurrence" \| "series" }`. یک‌باره ← `completed`. تکرارشونده ← لاگ `done` و رفتن به رخداد بعدی. |
| POST | `/:id/skip` | فقط برای سری: رد کردن این رخداد |
| POST | `/:id/snooze` | `{ minutes } \| { until }` |
| POST | `/:id/pause`، `/:id/resume` | |
| DELETE | `/:id` | |
| GET | `/push/public-key` | |
| POST / DELETE | `/push/subscription` | ثبت یا حذف subscription این دستگاه |
| POST | `/push/test` | |

**مسیرهای بدون session** (در `app.ts`، قبل از mountهای احراز هویت‌شده):
- `POST /api/reminders/actions`: `{ token, action: "done" | "snooze" }`، برای دکمه‌های اعلان.
- `POST /internal/cron/reminders`: با هدر `x-cron-secret`.

**متغیرهای env جدید:** `VAPID_PUBLIC_KEY`، `VAPID_PRIVATE_KEY`، `VAPID_SUBJECT`، `CRON_SECRET`، `REMINDER_ACTION_SECRET`. همه فقط از `config/env.ts` خوانده می‌شوند.

---

## ۶. ساختار Frontend

```
features/goals/
├── components/
│   ├── GoalCard.tsx               # کارت لیست: عنوان، دسته، progress bar، روزهای باقی‌مانده، بج وضعیت/needs-review
│   ├── GoalQuickAdd.tsx           # دیالوگ سریع: عنوان + chip بازه + «More options»
│   ├── GoalForm.tsx               # فرم کامل (ویرایش و More options)
│   ├── GoalProgressHero.tsx       # حلقه‌ی پیشرفت + pace + کنترل مخصوص هر نوع
│   ├── progress/                  # NumericProgressInput, ManualCheckIn, MilestoneSummary
│   ├── subgoals/                  # SubGoalList, SubGoalRow, SubGoalInlineAdd
│   ├── GoalTasksSection.tsx       # TaskListItem compact + «Link task» / «New task»
│   ├── GoalTimeline.tsx           # GoalLog به‌صورت تایم‌لاین
│   ├── GoalStatusActions.tsx      # منوی Pause / Extend / Cancel / Archive / Delete
│   ├── ExtendGoalDialog.tsx
│   └── GoalReminderSyncDialog.tsx # دیالوگ Complete/Cancel/Delete با لیست یادآوری‌ها
├── hooks/useGoals.ts              # useGoals, useGoal, useGoalSummary, mutations
├── lib/goalPeriod.ts              # periodRange(period, ref, weekStartsOn), formatDaysLeft
├── utils/goalProgress.ts          # برچسب‌ها و رنگ pace (محاسبه‌ی اصلی در API)
├── pages/GoalsPage.tsx, GoalDetailPage.tsx
├── schemas/goal.schema.ts
├── stores/goalsStore.ts           # فیلتر تب و جست‌وجو (فقط UI)
└── types/goal.ts

features/reminders/
├── components/
│   ├── ReminderQuickAdd.tsx       # نوار «Remind me to…» + chipهای زمان
│   ├── ReminderForm.tsx           # دیالوگ (دسکتاپ) / Drawer (موبایل)
│   ├── ReminderItem.tsx, ReminderList.tsx   # ReminderList با prop‌های goalId/taskId/noteId
│   ├── RepeatPicker.tsx, SnoozeMenu.tsx, WhenPicker.tsx
│   ├── ReminderLinkPicker.tsx     # Combobox جست‌وجو در Goals / Tasks / Notes
│   ├── ReminderPresetChips.tsx    # chipهای Weekly review / Before deadline (در GoalForm استفاده می‌شود)
│   ├── ReminderDueWatcher.tsx     # در AppLayout: polling + toast
│   ├── ReminderBell.tsx           # در Header
│   └── NotificationPermissionCard.tsx
├── hooks/useReminders.ts, useDueReminders.ts, usePushSubscription.ts
├── lib/recurrence.ts              # describeRepeat, presets زمان (This evening, …)
├── pages/RemindersPage.tsx
├── schemas/reminder.schema.ts
└── types/reminder.ts

public/sw.js                       # push + notificationclick
```

**Routes جدید:**
- `/goals` → `GoalsPage`
- `/goal/:id` → `GoalDetailPage`
- `/reminders` → `RemindersPage`

**Sidebar:**
- «Goals» با آیکون `Target`، بعد از Tasks.
- «Reminders» با آیکون `Bell` و شمارنده‌ی overdue.

**استثناهای جدید cross-feature** (باید به CLAUDE.md اضافه شوند):
- `goals` → `reminders`: کامپوننت‌های `ReminderList` و `ReminderPresetChips`.
- `goals` → `tasks`: `TaskListItem`، `AddNewTask`.
- `tasks/TaskDetail` و `notes/NoteEditorHeader` → `reminders/ReminderForm`، برای دکمه‌ی «Remind me».
- `layouts/Header` و `AppLayout` → `ReminderBell` و `ReminderDueWatcher`.

**Query keys:**
- `["goals", ...]`، `["goal", id]`، `["reminders", view, filters]`، `["reminders","due"]`، `["reminders","counts"]`.
- mutationهای هدف علاوه بر `["goals"]`، کلید `["reminders"]` را هم invalidate می‌کنند، چون همگام‌سازی آن‌ها را تغییر می‌دهد.
- toggle تسک کلید `["goals"]` را هم invalidate می‌کند، برای پیشرفت task-based.
- Complete و Snooze یادآوری optimistic هستند، مثل toggle در habits.

---

## ۷. طراحی تجربه‌ی کاربری

زبان بصری همان Habits است: `PageHeader`، ردیف `StatTile`، پنل‌های `rounded-xl border border-border bg-card`، `EmptyState`، و اسکلت‌های `animate-pulse`.

### ۷.۱ صفحه‌ی Goals

```
┌─────────────────────────────────────────────────────────────┐
│ PLAN                                                         │
│ Goals                                        [+ New goal]    │
│ What you're working toward this week, month and year.        │
├──────────┬──────────┬──────────────┬────────────────────────┤
│ Active 6 │ On track 4│ Needs review 1│ Completed this year 9 │
├─────────────────────────────────────────────────────────────┤
│ (Active) Paused  Completed  Archived          🔍 Search       │
│                                                              │
│ THIS MONTH                                                   │
│ ┌────────────────────────┐ ┌────────────────────────┐        │
│ │ ● Health               │ │ ● Career  ⚠ Needs review│        │
│ │ Run 50 km              │ │ Ship portfolio site     │        │
│ │ ▓▓▓▓▓▓▓░░░  32/50 km   │ │ ▓▓▓▓▓▓▓▓░░  80%         │        │
│ │ On track · 12 days left│ │ Ended Oct 20            │        │
│ │ 🔔 Sun 20:00           │ │ [Complete] [Extend] [··]│        │
│ └────────────────────────┘ └────────────────────────┘        │
│ THIS QUARTER                                                 │
│ …                                                            │
└─────────────────────────────────────────────────────────────┘
```

- گروه‌بندی بر اساس بازه است. اول Needs review، سپس بر اساس نزدیک‌ترین endDate.
- موبایل: کارت‌ها تک‌ستونه هستند و StatTileها در یک ردیف 2×2 قرار می‌گیرند.
- EmptyState: «Set your first goal», با دکمه‌ی New goal و سه نمونه‌ی کلیک‌شدنی (Read 4 books this quarter و غیره) که QuickAdd را پیش‌پر می‌کنند.

### ۷.۲ ساخت سریع هدف (یک مرحله، بدون wizard)

```
┌ New goal ─────────────────────────────────────┐
│ What do you want to achieve?                   │
│ [ Run 50 km                                  ] │
│                                                │
│ (Week) [Month] (Quarter) (6 months) (Year) (Custom)│
│ Oct 1 → Oct 31  · this ▾                       │
│                                                │
│ 🔔 [✓ Weekly review] [✓ 3 days before end] [+ ] │
│                                                │
│ ▸ More options                                 │
│                              [Cancel] [Create] │
└────────────────────────────────────────────────┘

▾ More options (باز شده)
│ Success looks like  [ Finished 50 km by month end ]│
│ Measure  [Manual] [Number] [Milestones] [Tasks]    │
│   Number → Start [0]  Target [50]  Unit [km]      │
│ Category [Health ▾]   Color ● ● ● ●               │
│ Description [                                  ]  │
```

- **فقط عنوان اجباری است.** Enter در فیلد عنوان مستقیماً Create می‌کند.
- بعد از ساخت، کاربر به صفحه‌ی هدف می‌رود و فوکوس روی «+ Add sub-goal» قرار می‌گیرد. این یک پیشنهاد است و اجباری نیست.
- وضعیت «More options» در localStorage به خاطر سپرده می‌شود.
- موبایل: دیالوگ به یک Drawer تمام‌عرض تبدیل می‌شود.

### ۷.۳ صفحه‌ی جزئیات هدف (`/goal/:id`)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Goals                                                      │
│ ● Health · Monthly                     [Update progress] [⋯] │
│ Run 50 km                                       Active ▾     │
│ Success: Finished 50 km by month end                         │
├───────────────────────────────────────┬─────────────────────┤
│  ◯ 64%   32 / 50 km                    │ DETAILS             │
│  On track (expected 58%)               │ Oct 1 → Oct 31      │
│  [ +5 ] [ Set value ]  + note          │ 12 days left        │
├───────────────────────────────────────┤ Measure: Number     │
│ SUB-GOALS                     2 / 4    │ [Edit]              │
│ ☑ Run 3×/week in week 1        🔔      ├─────────────────────┤
│ ☐ First 10 km run              🔔      │ REMINDERS     [+ ]  │
│ + Add sub-goal                         │ Next: Sun 20:00     │
├───────────────────────────────────────┤ ● Weekly review  ⏻  │
│ TASKS                        3 / 7     │ ● Ends in 3 days ⏻  │
│ ☐ Buy running shoes · Tomorrow         │ ● Stretch reminder  │
│ + New task   ⛓ Link existing           ├─────────────────────┤
├───────────────────────────────────────┤ HISTORY             │
│ NOTES                                  │ Oct 18 · 27 → 32 km │
│ 📝 Training plan                       │   "Good long run"   │
│ + New note  ⛓ Attach                   │ Oct 10 · Extended…  │
└───────────────────────────────────────┴─────────────────────┘
```

- **Update progress** بسته به نوع هدف یک popover کوچک باز می‌کند:
  - عدد: +/− یا مقدار مطلق
  - کیفی: ۵ پله
  - مرحله‌ای/تسک: اسکرول به بخش مربوط
  - در همه‌ی حالت‌ها یک یادداشت اختیاری هم می‌شود ثبت کرد.
- منوی ⋯: Edit · Pause/Resume · Extend deadline · Cancel goal · Archive · Delete.
- انتخابگر وضعیت (Active ▾) میان‌بُری برای همین عملیات است.
- **Needs review:** یک بنر کهربایی بالای صفحه نمایش داده می‌شود: «The deadline passed on Oct 31. How did it go? [Mark complete] [Extend] [Cancel goal]». بدون لحن شکست.
- **Extend:** دیالوگ با پیشنهادهای +1 week · +2 weeks · +1 month · Pick date و یادداشت اختیاری «why». پیش‌نمایش تأثیر هم نشان داده می‌شود: «Deadline reminder will move to Nov 27».
- موبایل: یک ستون. بخش‌های Details و Reminders بعد از Progress قرار می‌گیرند و History در انتها. هر بخش collapsible است.

### ۷.۴ دیالوگ همگام‌سازی هنگام Complete یا Cancel

```
┌ Complete "Run 50 km"? ─────────────────────────┐
│ 🎉 64% → you can still mark it complete.        │
│ Final note (optional) [                       ] │
│                                                 │
│ Linked reminders                                │
│ Automatic reminders will be turned off.         │
│ ☑ Stretch reminder · Daily 07:00                │
│   ☐ keep as standalone reminder                 │
│                                [Cancel] [Complete]│
└─────────────────────────────────────────────────┘
```

اگر یادآوری `manual` متصلی وجود نداشته باشد، دیالوگ فقط تأیید ساده است. در Pause دیالوگی نمایش داده نمی‌شود و فقط toast با Undo ظاهر می‌شود.

### ۷.۵ صفحه‌ی Reminders

```
┌─────────────────────────────────────────────────────────────┐
│ STAY ON TRACK                                                │
│ Reminders                                  [+ New reminder]  │
├──────────┬──────────┬──────────┬────────────────────────────┤
│ Overdue 1│ Today 3  │ Snoozed 1│ Done this week 8            │
├─────────────────────────────────────────────────────────────┤
│ 🔔 Remind me to… [ Call the bank                          ]  │
│    (In 1 hour) (This evening) (Tomorrow 9:00) (Pick…) ⟳ ⛓    │
├─────────────────────────────────────────────────────────────┤
│ (Upcoming 5)  Snoozed 1  Done                                │
│ OVERDUE                                                      │
│ ○ Pay electricity bill     Yesterday 18:00   [Snooze ▾]      │
│ TODAY                                                        │
│ ○ Weekly review            20:00 ⟳ Weekly  🎯 Run 50 km       │
│ ○ Take vitamins            21:00 ⟳ Daily                     │
│ TOMORROW                                                     │
│ ○ Follow up with Sara      09:00  ☑ Task: Send proposal      │
└─────────────────────────────────────────────────────────────┘
```

- **Quick add:** متن + یک chip زمان + Enter ← ثبت. پیش‌فرض بدون chip، «Tomorrow 9:00» است. ⟳ RepeatPicker را باز می‌کند و ⛓ LinkPicker را.
- **دایره ○:** Complete (optimistic، با Undo). برای سری‌ها یک منوی کوچک دارد: «Done for today» / «End series».
- **کلیک روی ردیف:** ReminderForm باز می‌شود که شامل ویرایش، تغییر زمان و حذف است.
- **chip اتصال** (🎯 Goal، ☑ Task، 📝 Note) به همان آیتم لینک می‌شود.
- **Swipe در موبایل:** به راست ← Done، به چپ ← Snooze.

### ۷.۶ فرم کامل Reminder

```
┌ New reminder ─────────────────────────────┐
│ [ Title                                 ] │
│ [ Add details (optional)                ] │
│ 📅 Tue, Oct 28   🕘 09:00                  │
│ ⟳ Does not repeat ▾                        │
│ ⛓ Link to… (Goal / Sub-goal / Task / Note)│
│ 🔔 Notify: At time ▾          [● on]      │
│                        [Cancel] [Save]    │
└───────────────────────────────────────────┘
```

### ۷.۷ نقاط ورود از بخش‌های دیگر

| جا | ورودی |
|---|---|
| `TaskDetail` | دکمه‌ی 🔔 «Remind me». پیش‌فرض زمان: روز `dueDate` ساعت 09:00 |
| `TaskForm` | Select اختیاری «Goal» |
| `NoteEditorHeader` | آیکون 🔔 برای یادآوری مرور این یادداشت |
| `Header` | `ReminderBell` با popover: موارد Overdue و Today + Done/Snooze سریع + «View all» |
| `DashboardPage` | `SectionCard`های «Goals in progress» (۳ هدف نزدیک به مهلت با progress bar) و «Up next» (۵ یادآوری بعدی) |
| `CalendarPage` (فاز بعدی) | نمایش یادآوری‌ها به‌صورت نقطه یا chip بنفش کنار تسک‌ها |
| Assistant (فاز بعدی) | ابزارهای `list_goals`، `update_goal_progress`، `create_reminder`، `snooze_reminder`، که به `MUTATING_TOOLS` اضافه می‌شوند |

---

## ۸. موارد مرزی

- **منطقه‌ی زمانی:**
  - هر یادآوری `timeZone` خودش را دارد که از `Intl.DateTimeFormat().resolvedOptions().timeZone` گرفته می‌شود.
  - تکرار در همان منطقه‌ی زمانی محاسبه می‌شود.
  - تاریخ‌های هدف رشته‌های `"yyyy-MM-dd"` هستند که با `format()` ساخته می‌شوند، نه با `toISOString()`.
- **تغییر `weekStartsOn`:** روی یادآوری‌های موجود اثری ندارد. فقط روی پیش‌فرض‌های آینده (preset Weekly review، بازه‌ی weekly) اثر دارد.
- **هدف بدون endDate؟** پشتیبانی نمی‌شود. بازه همیشه پایان دارد. برای پیگیری بی‌پایان، Habits وجود دارد.
- **کاهش endDate به قبل از امروز:** مجاز است. هدف بلافاصله Needs review می‌شود و یادآوری deadline اگر در گذشته باشد غیرفعال می‌شود.
- **حذف تسکی که در پیشرفت task-based حساب می‌شد:** پیشرفت دوباره محاسبه می‌شود. در تاریخچه رویدادی ثبت نمی‌شود.
- **ساعات سکوت:** push در این بازه ارسال نمی‌شود و `nextAt` به پایان بازه منتقل می‌شود. اعلان درون‌برنامه‌ای همچنان نمایش داده می‌شود.
- **چند دستگاه:** وقتی یک یادآوری در یک دستگاه Done می‌شود، بقیه‌ی دستگاه‌ها در polling بعدی آن را نمی‌گیرند. اعلان push که قبلاً ارسال شده با `tag = reminderId` جایگزین می‌شود.

---

## ۹. فازبندی پیاده‌سازی

| فاز | محتوا | خروجی قابل استفاده |
|---|---|---|
| **1. Goals core** | مدل‌های `Goal` و `GoalLog`، `Task.goalId`، `Note.goalId`، ماژول API، صفحات GoalsPage و GoalDetailPage، چهار نوع پیشرفت، زیرهدف‌ها، چرخه‌ی وضعیت، Extend، Archive | هدف‌گذاری کامل بدون یادآوری |
| **2. Reminders core** | مدل‌های `Reminder` و `ReminderLog`، `nextOccurrence` + تست، ماژول API، RemindersPage، QuickAdd، Snooze، `ReminderDueWatcher` و `ReminderBell` | یادآوری مستقل با اعلان درون‌برنامه‌ای |
| **3. اتصال** | presetها در فرم هدف، بخش Reminders در صفحه‌ی هدف، قوانین همگام‌سازی و دیالوگ‌ها، دکمه‌ی Remind me در Task و Note، LinkPicker | تجربه‌ی یکپارچه |
| **4. Push** | `sw.js`، VAPID، `PushSubscription`، action token، endpoint cron، کارت مجوز، تنظیمات اعلان | اعلان با برنامه‌ی بسته |
| **5. تکمیلی** | ویجت‌های داشبورد، ابزارهای Assistant، نمایش در Calendar | |

**چک‌لیست هر فاز:**
- `npx tsc --noEmit` در `neura-api` بدون خطا.
- `npx prisma migrate dev`.
- `@types/*` جدید در `dependencies`.
- به‌روزرسانی CLAUDE.md: routeها، مدل‌ها، API و استثناهای cross-feature.
