# 貢獻指南

本文件說明本專案的開發規範。所有參與開發的人員，請遵守以下規則以確保程式碼的一致性與可維護性。如有需要，請見[英文版](CONTRIBUTING.md)。

---

## 開發流程說明

本專案依照階段方式管理，但**不強制依順序執行**。每個階段代表一個產品面向或模組的成熟度，而非開發先後順序。允許跨階段同時開發，只需確保溝通清楚並使用正確的分支命名。

常見階段如下：

- `demo`：快速原型開發與初步測試
- `backend`：API 與核心邏輯實作
- `frontend`：Web 前端
- `ios-improved`：改進版 iOS App，使用實際 API 與反饋
- `android`：Android 版本
- `test`：公開測試與回饋收集
- `release`：正式發佈版本

---

## 分支命名規則

分支命名格式如下：

```
[階段]/[平台]/[類型]-[簡短描述]
```

- **階段**：`demo`、`backend`、`frontend`、`ios-improved`、`android`、`test`、`release`等。
- **平台**：`ios`, `android`、`android`、`web`、`api`、`shared` 等
- **類型**：`feature`（新功能）、`fix`（修正）、`refactor`（重構）、`chore`（雜項）

### 範例

- `demo/ios/feature-score-ui`
- `backend/api/feature-compare-algorithm`
- `frontend/web/refactor-header`
- `release/shared/chore-final-cleanup`

使用小寫英文字母與連字符（`-`）。

---

## Commit 提交格式

請使用以下結構進行 commit：

```
[類型] 簡短描述

（可選）補充說明修改原因與內容。
```

### 類型分類

- `feat`：新增功能
- `fix`：錯誤修復
- `refactor`：不影響功能的程式重構
- `chore`：雜項（如 CI、建置設定）
- `docs`：文件修改
- `style`：格式／命名調整（不影響邏輯）
- `test`：測試新增或修改

### 範例

```
[feat] 加入成績快取以減少爬蟲請求
```

```
[fix] 修復冷啟動導致登入卡住的問題
```

---

## Pull Request 規範

- PR 應建立於與功能對應的階段分支（如 `demo`, `backend`）。
- PR 標題建議與分支名稱一致。
- PR 說明需包含：
  - 主要變更項目
  - 修改背景或目的
  - （如有）畫面或執行結果截圖

---

## 程式風格規範

- 縮排統一（依語言選用 2 或 4 空格）
- 命名需具描述性與一致性
- 避免深層巢狀邏輯，可拆解成輔助函式
- 提交前移除 console.log、debug code
- 若修改現有檔案，請遵循原有風格

---

## 專案結構（目前）

```
/
├── ios/
├── android/
├── backend/
├── frontend/
├── shared/
├── public-test/
└── docs/
```

---

## 其他說明

- **開發階段為協作分類工具，非流程限制。** 可以同時開發多個平台或模組。
- 請避免將不同開發背景（如 iOS demo 與 Android 正式版）混合於同一 PR。
- 所有合併請經過審查流程，不建議直接 push 到 `main`。

