const fs = require("fs");
const path = require("path");

const reload = {
  name: "reload",
  description: "Reload lại tất cả commands và modules",
  async execute(message) {
    if (!message.member.permissions.has("Administrator")) {
      await message.channel.send("Bạn không có quyền sử dụng lệnh này!");
      return;
    }

    try {
      // Đếm số lượng files được reload
      let reloadCount = 0;

      // Clear require cache for commands directory
      const commandsPath = path.join(__dirname, "..");
      const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));

      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        delete require.cache[require.resolve(filePath)];
        reloadCount++;
      }

      // Clear require cache for models directory
      const modelsPath = path.join(commandsPath, "models");
      if (fs.existsSync(modelsPath)) {
        const modelFiles = fs
          .readdirSync(modelsPath)
          .filter((file) => file.endsWith(".js"));

        for (const file of modelFiles) {
          const filePath = path.join(modelsPath, file);
          delete require.cache[require.resolve(filePath)];
          reloadCount++;
        }
      }

      // Clear require cache for config directory
      const configPath = path.join(commandsPath, "config");
      if (fs.existsSync(configPath)) {
        const configFiles = fs
          .readdirSync(configPath)
          .filter((file) => file.endsWith(".js"));

        for (const file of configFiles) {
          const filePath = path.join(configPath, file);
          delete require.cache[require.resolve(filePath)];
          reloadCount++;
        }
      }

      // Reload main commands file
      const mainCommandsPath = path.join(commandsPath, "commands.js");
      if (fs.existsSync(mainCommandsPath)) {
        delete require.cache[require.resolve(mainCommandsPath)];
      }

      // Send success message with details
      const response = [
        "```diff",
        "+ Đã reload thành công!",
        `+ Số files đã reload: ${reloadCount}`,
        "```",
        "Các thay đổi đã được cập nhật.",
      ].join("\n");

      await message.channel.send(response);

      // Log reload details
      console.log(
        `[Reload] ${message.author.tag} đã reload ${reloadCount} files`
      );
    } catch (error) {
      console.error("Error during reload:", error);
      await message.channel.send(
        ["```diff", "- Lỗi khi reload!", `- ${error.message}`, "```"].join("\n")
      );
    }
  },
};

module.exports = reload;
