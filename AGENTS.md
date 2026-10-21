# 送信 · Letter Sender 项目设计规范

## 项目概述
一个精致的电子书信全栈应用。发信方可以自定义信纸、邮票、印章、火漆、字体来写信，经由精美的折叠/封装/投递动画后，发送到收信人邮箱；收信方输入自己的邮箱即可查看信件，并有拆信展开动画。

## 作业要求对齐
- ✅ 前后端通过 API 数据通信
- ✅ 后端 JSON 文件持久化存储信件
- ✅ 后端调用大模型 API（AI 润色信件内容）
- ✅ 前端页面交互展示 + 动画

## 技术栈
- 前端：React 19 + TypeScript + Tailwind CSS + Framer Motion
- 后端：FastAPI + LangChain Python（业务 API，端口 8000）
- 页面渲染：NestJS（ViewModule，保留模板渲染能力）
- 存储：本地 JSON 文件持久化（`/tmp/letters.json`）
- AI：LangChain + 豆包 Ark API（信件润色），未配置 key 时自动降级 mock
- 邮件：SMTP 真实邮件发送（HTML 格式，含信纸/邮票/印章样式）
- 动画：Framer Motion + CSS 动画

## 页面路由
| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 入口：写信 / 收信 两个入口 |
| `/write` | 写信页 | 选信纸/邮票/印章/火漆/字体 + 写信内容 + AI 润色 |
| `/mailbox` | 邮箱页 | 输入邮箱查看收件列表 |
| `/letter/:id` | 读信页 | 拆信动画 + 阅读信件内容 |

## 设计风格
- 整体风格：复古信纸 / 温暖怀旧 / 手作感
- 主色调：暖米色 + 酒红/墨绿点缀 + 火漆朱红
- 字体：衬线体为主，提供多种手写/衬线字体可选
- 动画：流畅优雅，有仪式感

### 色彩系统
- 背景暖米：`#faf6ef` (bg-primary)
- 信纸米白：`#fdfbf7`
- 文字深棕：`#3d2b1f`
- 火漆朱红：`#a63d2f`
- 墨绿点缀：`#2d5a3d`
- 邮戳蓝黑：`#1a3a5c`
- 边框浅棕：`#d4c4a8`

### 间距规范
- 页面内边距：24px（移动端）/ 48px（桌面端）
- 卡片内边距：20px
- 元素间距：gap 统一用 12px / 16px / 24px 三档

## 数据模型（JSON 持久化）
```typescript
interface Letter {
  id: string;
  content: string;
  paperStyle: string;      // 信纸样式 id
  stampStyle: string;      // 邮票样式 id（城市景点）
  sealStyle: string;       // 印章样式 id（圆形花纹）
  waxStyle: string;        // 火漆样式 id
  fontStyle: string;       // 字体样式 id
  senderName: string;      // 发信人署名
  recipientEmail: string;  // 收信人邮箱
  createdAt: string;       // ISO 时间
  isRead: boolean;         // 是否已读
}
```

后端内部存储使用 snake_case（paper_style / stamp_style 等），API 层通过 Pydantic serialization_alias 输出 camelCase，与前端 shared/api.interface.ts 对齐。

## 后端 API（FastAPI Python）

后端代码位于 `python-backend/app/`，使用 FastAPI + LangChain + Pydantic。
- 入口：`python-backend/app/main.py`
- 存储：`app/storage.py`（JSON 文件持久化）
- AI 润色：`app/ai_service.py`（LangChain ChatOpenAI 调用豆包 Ark API）
- 邮件服务：`app/email_service.py`（SMTP 发送 HTML 邮件，含信纸/邮票/印章）
- 数据校验：`app/schemas.py`（Pydantic v2）

启动：`cd python-backend && PYTHONPATH=. python -m uvicorn app.main:app --port 8000`

前端通过 Vite 代理将 `/api/*` 转发到 `localhost:8000`。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/letters` | 发送一封信（创建信件 + 发送邮件） |
| GET | `/api/letters/mailbox/:email` | 查询某邮箱的收件列表 |
| GET | `/api/letters/:id` | 获取单封信件详情 |
| POST | `/api/letters/:id/read` | 标记信件已读 |
| POST | `/api/ai/polish` | AI 润色信件内容（LangChain） |
| GET | `/api/health` | 健康检查 + AI/SMTP 配置状态 |

### SMTP 环境变量
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD`
- `SMTP_SENDER_NAME`（发件人显示名）
- `SMTP_USE_SSL`（默认 true）
- `APP_BASE_URL`（邮件中「在网页中打开」链接前缀）

### AI 环境变量
- `DOUBAO_API_KEY`（豆包 Ark API Key，空则降级 mock）
- `DOUBAO_BASE_URL`（默认 `https://ark.cn-beijing.volces.com/api/v3`）
- `DOUBAO_MODEL`（默认 `doubao-1-5-lite-32k-250115`）
