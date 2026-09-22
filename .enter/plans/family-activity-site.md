# 家族活動紀錄網站「我們的家」— 實作計畫

## Context（為什麼做這件事）

目前專案是全新模板，只有一個佔位首頁（`src/pages/Index.tsx`），沒有任何業務邏輯或資料。
使用者要打造的是一個**私密的家族活動紀錄網站**，已透過對話確認的需求範圍：

| 需求 | 決定 |
| --- | --- |
| 核心功能 | 活動時間軸 + 相簿、家族成員名錄、家族樹、活動出席登記 |
| 資料儲存 | 真實雲端資料庫 + 家族成員登入（多人共同新增） |
| 加入方式 | 管理員發出**邀請碼**，家人自行註冊 |
| 活動欄位 | 日期、標題、內容描述、照片、參與成員、地點、活動類型標籤 |
| 出席登記 | 活動建立後，家人各自登記「我會參加 / 不參加 / 人數」 |
| 家族樹 | 以最年長祖先為根，向下展開各代（直系血親 + 配偶） |
| 語言 | 繁體中文 + 英文（雙語切換） |
| 視覺 | 溫馨米白 + 暖橘，網站名稱暫定「我們的家」 |

因為需要帳號登入、資料庫與照片儲存，實作第一步必須開啟 **Enter Cloud**（會跳出確認視窗請你同意）。

---

## 一、後端資料模型（Enter Cloud）

以 `enter_cloud` skill 的流程建立 migration、RLS 與 backend functions。所有表都啟用 RLS：**登入的家族成員可讀，寫入依角色限制**。

**`profiles`**（與登入帳號一對一）
`id`(uuid, PK = auth.users.id)、`display_name`、`avatar_url`、`role`('admin' | 'member'，預設 member)、`family_member_id`(連結到家族成員)、`created_at`
→ 用 `auth.users` 的 trigger 自動建立 profile。

**`family_members`**（成員名錄 + 家族樹來源）
`id`、`full_name`、`gender`('male'|'female'|'other')、`birth_date`、`death_date`、`generation`(int)、`parent_id`(自身 FK，血親父/母)、`spouse_id`(自身 FK，配偶)、`photo_url`、`bio`、`profile_id`、`sort_order`、`created_at`
→ 不變式：`parent_id != id`、`spouse_id != id`、不可形成循環（表單驗證 + 前端組樹時防護）。

**`activities`**
`id`、`title`、`description`、`activity_date`(date, not null)、`location`、`category`('gathering'|'trip'|'festival'|'wedding'|'memorial'|'birthday'|'other')、`cover_image_url`、`created_by`、`created_at`、`updated_at`

**`activity_photos`**（相簿）
`id`、`activity_id`(FK, on delete cascade)、`image_url`、`caption`、`sort_order`、`created_at`

**`activity_participants`**（出席登記）
`id`、`activity_id`、`family_member_id`、`status`('attending'|'declined')、`guest_count`(int, 預設 1)、`note`、`created_at`、`updated_at`
→ 唯一鍵 `(activity_id, family_member_id)`，同人重複登記時 upsert。

**`invite_codes`**
`id`、`code`(unique)、`role`、`note`、`created_by`、`used_by`、`used_at`、`expires_at`、`created_at`

**Storage**：建立 `family-media` bucket（公開讀取，登入者可上傳），存成員照片與活動照片。

**權限規則**
- `profiles`：登入者可讀全部；只能改自己的。
- `family_members`：登入者可讀；**admin** 可新增/編輯/刪除。
- `activities` / `activity_photos`：登入者可讀；建立者可編輯/刪除，admin 可刪除任何一筆。
- `activity_participants`：登入者可讀；登入者可新增/更新（可代家人登記）。
- `invite_codes`：僅 admin 可讀寫（一般成員讀不到，避免邀請碼外流）。

**Backend functions**
1. `validate-invite-code`（未登入可呼叫）：驗證邀請碼是否存在、未使用、未過期 → 回傳 `{ valid, reason }`。
2. `redeem-invite-code`（需登入）：核銷邀請碼、寫入 `used_by` / `used_at`、依邀請碼 role 更新自己的 `profiles.role`。
3. `create-invite-code`（僅 admin）：產生一組新邀請碼。

**註冊流程**：填 Email + 密碼 + 邀請碼 → 先呼叫 `validate-invite-code` → `signUp` → 登入後呼叫 `redeem-invite-code`。若 Enter Cloud 開啟了 Email 驗證，會在畫面明確提示「請至信箱點擊驗證連結後登入」。

---

## 二、前端架構（新增檔案）

**基礎層**
- `src/integrations/supabase/client.ts` — 依 skill 產生的雲端連線 client
- `src/types/database.ts` — 資料表型別與 `ActivityCategory` 等常數型別
- `src/lib/constants.ts` — 活動類型清單（key 對應 i18n）
- `src/lib/upload.ts` — 圖片上傳到 `family-media` 並回傳公開網址
- `src/lib/format.ts` — 日期格式化（沿用已安裝的 `date-fns`）
- `src/lib/family-tree.ts` — 由扁平成員陣列組成樹（含循環/孤兒節點防護），可單獨測試
- `src/hooks/use-auth.tsx` — `AuthProvider` + `useAuth()`（session、profile、role、signIn/signUp/signOut）
- `src/hooks/use-activities.ts` / `use-members.ts` — 以已配置的 `@tanstack/react-query` 做查詢與 mutation，集中處理 invalidate

**版面與共用元件**
- `src/components/layout/site-header.tsx`（導覽 + 已登入者資訊 + `LanguageSwitcher`）
- `src/components/layout/site-footer.tsx`
- `src/components/layout/protected-route.tsx`（未登入導向 `/login`，非 admin 擋 `/admin`）
- `src/components/common/category-badge.tsx`、`empty-state.tsx`、`page-header.tsx`

**功能元件**
- 活動：`activity-card.tsx`、`activity-timeline.tsx`、`activity-form.tsx`、`activity-photo-grid.tsx`、`activity-photo-uploader.tsx`、`rsvp-panel.tsx`
- 成員：`member-card.tsx`、`member-form.tsx`、`member-picker.tsx`
- 家族樹：`family-tree.tsx`、`family-tree-node.tsx`（各代縮排 + 連接線 + 配偶並列 + 可收合分支，行動版可讀）
- 邀請碼：`invite-code-manager.tsx`

**頁面**（依 `src/router.tsx` 既有註冊模式新增路由）
| 路徑 | 內容 |
| --- | --- |
| `/` | 首頁：家族名稱 hero、近期活動、統計數字、快速入口 |
| `/activities` | 活動時間軸（依年份 / 類型 / 成員篩選） |
| `/activities/new` | 新增活動（登入者，含照片上傳、勾選參與成員） |
| `/activities/:id` | 活動詳情：相簿、地點、參與成員、出席登記面板 |
| `/members` | 家族成員名錄（依輩分分組） |
| `/members/:id` | 成員頁：基本資料、父母/配偶/子女、參與過的活動 |
| `/tree` | 家族樹 |
| `/admin` | 管理員專區：邀請碼產生與狀態、成員新增/編輯 |
| `/login` | 登入 / 邀請碼註冊 |
| `*` | 沿用現有 `NotFound` |

**沿用既有資源**：`cn`（`src/lib/utils.ts`）、shadcn 元件（card / dialog / form / select / badge / tabs / avatar / carousel / skeleton / dropdown-menu / calendar / sonner）、`LanguageSwitcher`（`src/components/language-switcher.tsx`）、i18n 工具（`src/i18n/util.ts`）、`App.tsx` 已建立的 `QueryClientProvider`。

---

## 三、設計系統（`src/index.css` + `tailwind.config.ts`）

- 米白底 + 暖橘主色（例：`--primary: 13 68% 63%` ≈ `#E07A5F`），暖棕文字 `--foreground: 25 25% 18%`，`--accent` 為淡米橘、`--card` 近白，並同步提供 `.dark` 版本（夜景相簿風）。
- 新增 token：`--gradient-warm`、`--gradient-subtle`、`--shadow-elegant`、`--shadow-glow`、`--transition-smooth`。
- 標題字型走 serif 展示字（Noto Serif TC / 系統 serif fallback），內文走 sans，於 `tailwind.config.ts` 加 `fontFamily.display`。
- 在 `src/components/ui/button.tsx` 等元件加入 `hero` / `warm` 等變體，不在元件內寫死顏色；一律使用語意 token。

## 四、多語系（zh-TW + en）

- `i18n.config.json`：語言改為 `zh-TW`（繁體中文，detect `zh-TW` / `zh-Hant` / `zh`）+ `en`，`fallbackLng` 設為 `zh-TW`；移除簡體 `zh-CN`。
- `public/locales/zh-TW.json`、`public/locales/en.json`：涵蓋導覽、活動欄位、類型標籤、出席狀態、邀請碼流程、錯誤訊息等所有文案（沿用現有「扁平 dotted key」格式）。
- 依 `enter_i18n` skill 執行語言設定變更（若多語系功能尚未開啟，會先跳出確認視窗請你同意）。

---

## 五、需要你提供的資料（我會在對應階段主動提醒）

1. **現在就能給我（可之後再補）**：家族正式名稱與副標、想放的家族照片。
2. **建好資料庫後**：你的管理員帳號 Email；第一批邀請碼要幾組。
3. **成員名錄階段**：最年長祖先與各代成員名單（姓名、稱謂、出生年、父/母、配偶）— 可以先給我 5～10 人的小樣本，我再示範如何批次補齊。
4. **活動紀錄階段**：2～3 筆真實活動（日期、標題、內容、地點、類型、照片）。

---

## Implementation checklist

- [ ] 開啟 Enter Cloud，載入 `enter_cloud` skill 並依其流程建立專案連線
- [ ] 建立 `profiles`、`family_members`、`activities`、`activity_photos`、`activity_participants`、`invite_codes` 六張表與 RLS 政策
- [ ] 建立 `handle_new_user` trigger，讓註冊後自動產生 `profiles` 資料列
- [ ] 建立 `family-media` Storage bucket 與上傳/讀取政策
- [ ] 實作 `validate-invite-code`、`redeem-invite-code`、`create-invite-code` 三個 backend functions
- [ ] 產生 `src/integrations/supabase/client.ts` 與 `src/types/database.ts`
- [ ] 實作 `use-auth.tsx`（session/profile/role 載入、signIn、signUp+邀請碼、signOut）
- [ ] 實作 `protected-route.tsx`，未登入導向 `/login`、非 admin 擋 `/admin`
- [ ] 實作 `/login` 登入與邀請碼註冊頁，含驗證失敗與需 Email 驗證的提示
- [ ] 實作 `/admin`：產生/複製/查看邀請碼狀態、成員新增與編輯
- [ ] 實作 `use-members.ts`、`/members` 名錄（依輩分分組）與 `/members/:id` 成員頁
- [ ] 實作 `member-form.tsx`，含 `parent_id`/`spouse_id` 自身參照與循環防護驗證
- [ ] 實作 `src/lib/family-tree.ts`（由扁平資料組樹、多根節點、孤兒節點降級為根）
- [ ] 實作 `/tree` 家族樹（以最年長祖先為根向下展開、配偶並列、分支可收合）
- [ ] 實作 `use-activities.ts` 與 `/activities` 時間軸（年份/類型/成員篩選）
- [ ] 實作 `activity-form.tsx` 與 `/activities/new`（含照片上傳與參與成員勾選）
- [ ] 實作 `/activities/:id` 詳情頁、相簿格狀瀏覽與 `rsvp-panel.tsx`（參加/不參加/人數 upsert）
- [ ] 更新 `src/router.tsx` 註冊全部新路由，並讓 `Index.tsx` 成為真正的首頁
- [ ] 更新 `src/index.css` 與 `tailwind.config.ts` 為米白+暖橘設計系統（含 dark 版本與字型）
- [ ] 更新 `i18n.config.json` 為 zh-TW + en，並補齊 `public/locales/zh-TW.json`、`en.json` 全部文案
- [ ] 所有頁面使用語意 token 與 RWD（行動版單欄、桌機多欄），無寫死顏色

## Verification checklist

- [ ] `pnpm lint` 與 `pnpm exec tsc --noEmit` 全數通過
- [ ] `pnpm run build` 成功
- [ ] 未登入訪問 `/`、`/activities`、`/tree` → 導向 `/login`；一般成員訪問 `/admin` → 被擋下
- [ ] 錯誤邀請碼 / 已使用邀請碼 / 過期邀請碼註冊 → 顯示對應錯誤且不建立帳號
- [ ] 正確邀請碼註冊 → 可登入、`profiles.role` 正確、邀請碼狀態變為已使用
- [ ] 新增活動（含照片、地點、類型、參與成員）→ 時間軸立即出現該筆，照片可正常顯示
- [ ] 出席登記：同一成員重複送出 → upsert 不產生重複列；人數統計正確
- [ ] 家族樹：三代以上資料正確分層，配偶並列，無循環資料時不崩潰
- [ ] 邊界：無任何活動 / 無成員 / 活動無照片時顯示空狀態而非破版
- [ ] 語言切換 zh-TW ↔ en：導覽與所有頁面文案皆切換，重新載入後保留
- [ ] 用 `website_screenshot` 以 `mobile_390` 與 `desktop_1280` 檢視 `/`、`/activities`、`/tree`、`/activities/:id` 版面正常
