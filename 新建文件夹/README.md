# BCMOJANG 个人网站

一个科技 YouTuber/UP主 的个人主页，整合 B站 真实数据。

## 快速更新数据

只需编辑 `data.json` 文件即可更新网站所有内容！

### 更新视频

在 `data.json` 的 `videos` 数组中添加新视频：

```json
{
  "id": "BV1xxxxxxx",
  "category": "dji",
  "title": "视频标题",
  "excerpt": "视频简介",
  "duration": "01:30",
  "views": "1.0 万",
  "date": "2025-01-01",
  "thumbnail": "http://i0.hdslb.com/bfs/archive/xxxxx.jpg"
}
```

### 更新统计数据

修改 `stats` 对象：

```json
"stats": {
  "followers": 274,
  "videos": 74,
  "views": 1059000,
  "likes": 22302
}
```

### 更新推荐装备

修改 `recommendations` 数组：

```json
{
  "rank": 1,
  "category": "穿戴设备",
  "title": "小米手环 9 Pro",
  "reason": "推荐理由",
  "price": 299,
  "score": "8.5/10",
  "image": "图片URL",
  "video_id": "BV1xxxxxxx"
}
```

### 更新 Hero 区域

修改 `hero` 对象：

```json
"hero": {
  "badge": "热门视频",
  "title_line1": "第一行标题",
  "title_line2": "第二行标题（渐变色）",
  "description": "描述文字",
  "duration": "01:53",
  "views": "1.0 万",
  "likes": "13",
  "video_url": "https://www.bilibili.com/video/BVxxxxxxx/",
  "thumbnail": "缩略图URL"
}
```

### 更新个人信息

修改 `profile` 对象：

```json
"profile": {
  "name": "BCMOJANG",
  "uid": "1248933612",
  "avatar": "头像URL",
  "signature": "个性签名",
  "bilibili": "B站主页链接",
  "qq_group": "QQ群号",
  "github": "GitHub链接"
}
```

## 如何获取 B站 图片链接

1. 打开 B站 视频页面
2. 右键点击视频封面 → 复制图片地址
3. 图片格式：`http://i0.hdslb.com/bfs/archive/xxxxx.jpg`
4. 可添加后缀调整尺寸：`@640w_360h_1c`

## 如何获取 B站 视频 ID

视频链接格式：`https://www.bilibili.com/video/BV1xxxxxxx/`

其中 `BV1xxxxxxx` 就是视频 ID。

## 部署到 GitHub Pages

1. Fork 或上传此仓库到 GitHub
2. 进入仓库 Settings → Pages
3. Source 选择 `Deploy from a branch`
4. Branch 选择 `main` / `(root)`
5. 保存后等待 1-2 分钟即可访问

## 文件结构

```
├── index.html      # 主页面
├── styles.css      # 样式文件
├── script.js       # JavaScript 逻辑
├── data.json       # 数据配置（编辑此文件更新内容）
└── README.md       # 说明文档
```

## 特性

- ✅ 响应式设计，支持手机/平板/桌面
- ✅ 自定义光标效果（桌面端）
- ✅ 页面加载动画
- ✅ 滚动进度条
- ✅ 3D 卡片悬停效果
- ✅ 视频分类筛选
- ✅ 价格滑块筛选
- ✅ 统计数字动画
- ✅ 粘性视频播放器
- ✅ 毛玻璃导航栏
- ✅ 所有链接可点击跳转

## 技术栈

- 纯 HTML/CSS/JavaScript，无框架依赖
- CSS 变量实现主题系统
- IntersectionObserver 实现滚动动画
- fetch API 加载 JSON 数据

## 许可

MIT License
