# GitHub 项目上传指南

## 步骤 1: 创建 GitHub 账户

如果您还没有 GitHub 账户，请先在 [GitHub官网](https://github.com/) 注册一个新账户。

## 步骤 2: 创建新仓库

1. 登录您的 GitHub 账户
2. 点击右上角的 "+" 图标，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: 输入一个合适的仓库名称（例如 "shop-ecommerce"）
   - **Description**: 可选，添加一个简短的项目描述
   - **Visibility**: 选择 "Public" 或 "Private"
   - 不要勾选 "Initialize this repository with a README"（因为我们已经有了README文件）
4. 点击 "Create repository" 按钮

## 步骤 3: 将本地仓库连接到远程仓库

### HTTPS 方式（推荐新手使用）

1. 在本地项目目录中执行以下命令（替换 YOUR_USERNAME 和 YOUR_REPOSITORY 为您的GitHub用户名和仓库名）：

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

2. 推送本地代码到 GitHub：

```bash
git push -u origin master
# 或者（如果默认分支是 main）
git push -u origin main
```

3. 系统会提示您输入 GitHub 用户名和密码（或者个人访问令牌）

### SSH 方式（推荐长期使用）

**设置 SSH 密钥（如果尚未设置）：**

1. 检查是否已有 SSH 密钥：

```bash
ls -al ~/.ssh
```

2. 如果没有，生成新的 SSH 密钥：

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

3. 将 SSH 密钥添加到 ssh-agent：

```bash
eval $(ssh-agent -s)
ssh-add ~/.ssh/id_ed25519
```

4. 将 SSH 公钥添加到您的 GitHub 账户：
   - 复制公钥内容：`cat ~/.ssh/id_ed25519.pub`
   - 在 GitHub 上，点击头像 > Settings > SSH and GPG keys > New SSH key
   - 粘贴公钥并保存

**使用 SSH 推送代码：**

1. 添加远程仓库（SSH URL）：

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPOSITORY.git
```

2. 推送代码：

```bash
git push -u origin master
# 或者
git push -u origin main
```

## 步骤 4: 验证推送是否成功

1. 刷新 GitHub 仓库页面
2. 确认您的文件已经成功上传到仓库

## 常见问题解决

### 如果推送失败提示 "fatal: The current branch master has no upstream branch"

运行：
```bash
git push --set-upstream origin master
```

### 如果提示远程仓库已存在

先移除现有远程仓库：
```bash
git remote remove origin
```
然后重新添加远程仓库。

### 如果需要更新代码

1. 本地修改和提交：
```bash
git add .
git commit -m "Update: description of changes"
```

2. 推送更新：
```bash
git push
```

## 后续建议

1. **保护主分支**：在 GitHub 上设置分支保护规则，要求代码审查才能合并到主分支

2. **添加 Issue 模板**：帮助贡献者提供结构化的问题报告

3. **设置项目里程碑**：规划未来的开发计划

4. **启用 GitHub Pages**：如果项目有静态文档，可以部署为 GitHub Pages

祝您使用愉快！