const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  AttachmentBuilder, // Add this import
} = require("discord.js");
const axios = require("axios");
const Application = require("./models/Application");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

// Initialize the chart canvas with proper dimensions and settings
const chartCanvas = new ChartJSNodeCanvas({
  width: 800,
  height: 400,
  backgroundColour: "white",
});

const STATUS_OPTIONS = [
  { label: "Đã nộp", value: "Đã nộp", description: "Đơn đã được nộp" },
  {
    label: "Hẹn phỏng vấn",
    value: "Hẹn phỏng vấn",
    description: "Có lịch phỏng vấn",
  },
  {
    label: "Đã phỏng vấn",
    value: "Đã phỏng vấn",
    description: "Đã hoàn thành phỏng vấn",
  },
  { label: "Trượt", value: "Trượt", description: "Không đạt yêu cầu" },
];

const hasRequiredRole = (message) => {
  const allowedRoleId = process.env.ALLOWED_ROLE_ID;
  return message.member.roles.cache.has(allowedRoleId);
};

const findFirstEmptyRow = async () => {
  try {
    const response = await axios.get(process.env.SHEETDB_URL);
    const rows = response.data;
    const emptyRowIndex = rows.findIndex((row) => !row["Công ty"]);
    return emptyRowIndex !== -1 ? emptyRowIndex : rows.length;
  } catch (error) {
    console.error("Error finding empty row:", error);
    throw error;
  }
};

const formatDate = () => {
  const today = new Date();
  return today.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const apply = {
  name: "apply",
  description: "Thêm thông tin ứng tuyển mới",
  async execute(message, args) {
    if (!hasRequiredRole(message)) {
      await message.channel.send("Bạn không có quyền sử dụng lệnh này!");
      return;
    }

    if (args.length < 4) {
      await message.channel.send(
        "Thiếu thông tin! Sử dụng: h!apply [công ty] [vị trí] [phương thức] [links] [ghi chú]"
      );
      return;
    }

    try {
      // Extract arguments
      const company = args[0];
      const position = args[1];
      const method = args[2];
      const links = args[3];
      const notes = args.slice(4).join(" ");

      const application = new Application({
        company,
        position,
        applicationDate: formatDate(),
        method,
        links,
        status: "Đã nộp",
        notes: notes || "",
      });

      await application.save();

      const sheetData = {
        "Công ty": application.company,
        "Vị trí ứng tuyển": application.position,
        "Ngày nộp đơn": application.applicationDate,
        "Phương thức ứng tuyển": application.method,
        Links: application.links,
        "Trạng thái": application.status,
        "Ghi chú": application.notes,
      };

      await axios.post(process.env.SHEETDB_URL, {
        data: [sheetData],
      });

      await message.channel.send(
        "✅ Thông tin ứng tuyển đã được lưu thành công!"
      );
    } catch (error) {
      console.error("Error saving application:", error);
      await message.channel.send("❌ Có lỗi xảy ra khi lưu thông tin!");
    }
  },
};

const test = {
  name: "test",
  description: "Thêm dữ liệu mẫu vào MongoDB và Google Sheet",
  async execute(message) {
    if (!hasRequiredRole(message)) {
      await message.channel.send("Bạn không có quyền sử dụng lệnh này!");
      return;
    }

    const sampleData = [
      {
        company: "Google",
        position: "Software Engineer",
        applicationDate: "15/08/2023",
        method: "Website",
        links: "https://careers.google.com",
        status: "Đã nộp",
        notes: "Test entry 1",
      },
      {
        company: "Microsoft",
        position: "Product Manager",
        applicationDate: "16/08/2023",
        method: "LinkedIn",
        links: "https://careers.microsoft.com",
        status: "Hẹn phỏng vấn",
        notes: "Test entry 2",
      },
    ];

    try {
      // Save to MongoDB
      await Application.insertMany(sampleData);

      // Prepare data for Google Sheet
      const sheetData = sampleData.map((data) => ({
        "Công ty": data.company,
        "Vị trí ứng tuyển": data.position,
        "Ngày nộp đơn": data.applicationDate,
        "Phương thức ứng tuyển": data.method,
        Links: data.links,
        "Trạng thái": data.status,
        "Ghi chú": data.notes,
      }));

      // Save to Google Sheet
      await axios.post(process.env.SHEETDB_URL, {
        data: sheetData,
      });

      await message.channel.send(
        "Đã thêm dữ liệu mẫu thành công vào cả MongoDB và Google Sheet!"
      );
    } catch (error) {
      console.error("Error adding test data:", error);
      await message.channel.send("Có lỗi xảy ra khi thêm dữ liệu mẫu!");
    }
  },
};

const update = {
  name: "update",
  description: "Cập nhật trạng thái cho đơn ứng tuyển",
  async execute(message) {
    if (!hasRequiredRole(message)) {
      await message.channel.send("Bạn không có quyền sử dụng lệnh này!");
      return;
    }

    try {
      const applications = await Application.find().sort({ createdAt: -1 });
      console.log("Found applications:", applications); // Debug log

      if (!applications.length) {
        await message.channel.send(
          "Không có đơn ứng tuyển nào trong hệ thống!"
        );
        return;
      }

      const menuOptions = applications.map((app) => ({
        label: `${app.company}`,
        description: `${app.position} (${app.status})`.slice(0, 100), // Discord limit
        value: app._id.toString(),
      }));

      console.log("Menu options:", menuOptions); // Debug log

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("select_application")
          .setPlaceholder("Chọn công ty để cập nhật")
          .addOptions(menuOptions.slice(0, 25))
      );

      const initialResponse = await message.channel.send({
        content: "Chọn đơn ứng tuyển cần cập nhật:",
        components: [row],
      });

      try {
        const selectionInteraction =
          await initialResponse.awaitMessageComponent({
            filter: (i) =>
              i.customId === "select_application" &&
              i.user.id === message.author.id,
            time: 30000,
          });

        const selectedId = selectionInteraction.values[0];
        console.log("Selected ID:", selectedId); // Debug log

        const selectedApp = await Application.findById(selectedId);
        console.log("Selected application:", selectedApp); // Debug log

        if (!selectedApp) {
          await selectionInteraction.update({
            content: "Không tìm thấy đơn ứng tuyển đã chọn!",
            components: [],
          });
          return;
        }

        const statusRow = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("select_status")
            .setPlaceholder("Chọn trạng thái mới")
            .addOptions(STATUS_OPTIONS)
        );

        await selectionInteraction.update({
          content: `Đã chọn: ${selectedApp.company} - ${selectedApp.position}\nTrạng thái hiện tại: ${selectedApp.status}\nChọn trạng thái mới:`,
          components: [statusRow],
        });

        const statusInteraction = await initialResponse.awaitMessageComponent({
          filter: (i) =>
            i.customId === "select_status" && i.user.id === message.author.id,
          time: 30000,
        });

        const newStatus = statusInteraction.values[0];

        try {
          // Update MongoDB
          await Application.findByIdAndUpdate(selectedId, {
            status: newStatus,
          });

          // Update Google Sheet - Using the correct SheetDB update endpoint
          await axios.put(
            `${process.env.SHEETDB_URL}/Công ty/${selectedApp.company}`,
            {
              data: { "Trạng thái": newStatus },
            }
          );

          await statusInteraction.update({
            content: `✅ Đã cập nhật trạng thái của ${selectedApp.company} thành "${newStatus}"`,
            components: [],
          });
        } catch (error) {
          console.error("Error updating status:", error);
          await statusInteraction.update({
            content: `❌ Có lỗi xảy ra khi cập nhật trạng thái!\nLỗi: ${error.message}`,
            components: [],
          });
        }
      } catch (error) {
        if (error.code === "INTERACTION_COLLECTOR_ERROR") {
          await message.channel.send("Hết thời gian lựa chọn!");
        } else {
          console.error("Error in selection process:", error);
          await message.channel.send("Có lỗi xảy ra trong quá trình cập nhật!");
        }
      }
    } catch (error) {
      console.error("Error in update command:", error);
      await message.channel.send("Có lỗi xảy ra khi thực hiện lệnh!");
    }
  },
};

const delete_command = {
  name: "delete",
  description: "Xóa đơn ứng tuyển",
  async execute(message) {
    if (!hasRequiredRole(message)) {
      await message.channel.send("Bạn không có quyền sử dụng lệnh này!");
      return;
    }

    try {
      const applications = await Application.find().sort({ createdAt: -1 });

      if (!applications.length) {
        await message.channel.send(
          "Không có đơn ứng tuyển nào trong hệ thống!"
        );
        return;
      }

      const menuOptions = applications.map((app) => ({
        label: `${app.company}`,
        description: `${app.position} (${app.status})`.slice(0, 100),
        value: app._id.toString(),
      }));

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("select_delete")
          .setPlaceholder("Chọn đơn ứng tuyển cần xóa")
          .addOptions(menuOptions.slice(0, 25))
      );

      const response = await message.channel.send({
        content: "Chọn đơn ứng tuyển cần xóa:",
        components: [row],
      });

      try {
        const selection = await response.awaitMessageComponent({
          filter: (i) =>
            i.customId === "select_delete" && i.user.id === message.author.id,
          time: 30000,
        });

        const selectedId = selection.values[0];
        const selectedApp = await Application.findById(selectedId);

        if (!selectedApp) {
          await selection.update({
            content: "Không tìm thấy đơn ứng tuyển đã chọn!",
            components: [],
          });
          return;
        }

        // Create confirm/cancel buttons
        const confirmButton = new ButtonBuilder()
          .setCustomId("confirm_delete")
          .setLabel("Xác nhận xóa")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅");

        const cancelButton = new ButtonBuilder()
          .setCustomId("cancel_delete")
          .setLabel("Hủy xóa")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("❌");

        const confirmRow = new ActionRowBuilder().addComponents(
          confirmButton,
          cancelButton
        );

        await selection.update({
          content: `Bạn có chắc chắn muốn xóa đơn ứng tuyển sau?\n\nCông ty: ${selectedApp.company}\nVị trí: ${selectedApp.position}\nTrạng thái: ${selectedApp.status}`,
          components: [confirmRow],
        });

        const confirmation = await response.awaitMessageComponent({
          filter: (i) =>
            (i.customId === "confirm_delete" ||
              i.customId === "cancel_delete") &&
            i.user.id === message.author.id,
          time: 30000,
        });

        if (confirmation.customId === "confirm_delete") {
          // Delete from MongoDB
          await Application.findByIdAndDelete(selectedId);

          // Delete from Google Sheet
          await axios.delete(
            `${process.env.SHEETDB_URL}/Công ty/${selectedApp.company}`
          );

          await confirmation.update({
            content: `✅ Đã xóa đơn ứng tuyển tại ${selectedApp.company} - ${selectedApp.position}`,
            components: [],
          });
        } else {
          await confirmation.update({
            content: "❌ Đã hủy thao tác xóa",
            components: [],
          });
        }
      } catch (error) {
        if (error.code === "INTERACTION_COLLECTOR_ERROR") {
          await message.channel.send("Hết thời gian lựa chọn!");
        } else {
          console.error("Error in delete process:", error);
          await message.channel.send("Có lỗi xảy ra trong quá trình xóa!");
        }
      }
    } catch (error) {
      console.error("Error in delete command:", error);
      await message.channel.send("Có lỗi xảy ra khi thực hiện lệnh!");
    }
  },
};

const search = {
  name: "search",
  description: "Tìm kiếm đơn ứng tuyển",
  async execute(message, args) {
    if (!hasRequiredRole(message)) {
      await message.channel.send("Bạn không có quyền sử dụng lệnh này!");
      return;
    }

    if (args.length < 2) {
      await message.channel.send(
        "Thiếu thông tin! Sử dụng: h!search [field] [query]\nField có thể là: company, position, status"
      );
      return;
    }

    const [field, ...queryArgs] = args;
    const query = queryArgs.join(" ");

    try {
      const searchQuery = {};
      searchQuery[field] = new RegExp(query, "i");
      const results = await Application.find(searchQuery).sort({
        createdAt: -1,
      });

      if (!results.length) {
        await message.channel.send("Không tìm thấy kết quả nào!");
        return;
      }

      let messageContent = `🔍 Kết quả tìm kiếm cho "${query}" trong trường "${field}":\n\n`;
      results.forEach((app, index) => {
        messageContent += `${index + 1}. Công ty: ${app.company}\n`;
        messageContent += `   Vị trí: ${app.position}\n`;
        messageContent += `   Trạng thái: ${app.status}\n`;
        messageContent += `   Ngày nộp: ${app.applicationDate}\n\n`;
      });

      await message.channel.send(messageContent);
    } catch (error) {
      console.error("Error searching applications:", error);
      await message.channel.send("Có lỗi xảy ra khi tìm kiếm!");
    }
  },
};

const export_command = {
  name: "export",
  description: "Xuất dữ liệu ra file CSV",
  async execute(message) {
    if (!hasRequiredRole(message)) {
      await message.channel.send("Bạn không có quyền sử dụng lệnh này!");
      return;
    }

    try {
      const applications = await Application.find().sort({ createdAt: -1 });

      if (!applications.length) {
        await message.channel.send("Không có dữ liệu để xuất!");
        return;
      }

      const csvContent = [
        [
          "Công ty",
          "Vị trí",
          "Ngày nộp đơn",
          "Phương thức",
          "Links",
          "Trạng thái",
          "Ghi chú",
        ].join(","),
        ...applications.map((app) =>
          [
            app.company,
            app.position,
            app.applicationDate,
            app.method,
            app.links,
            app.status,
            app.notes,
          ]
            .map((field) => `"${field}"`)
            .join(",")
        ),
      ].join("\n");

      const buffer = Buffer.from(csvContent, "utf-8");
      const attachment = new AttachmentBuilder(buffer, {
        name: "applications.csv",
      });

      await message.channel.send({
        content: "Đây là file CSV chứa dữ liệu ứng tuyển của bạn:",
        files: [attachment],
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      await message.channel.send("Có lỗi xảy ra khi xuất dữ liệu!");
    }
  },
};

const dashboard = {
  name: "dashboard",
  description: "Hiển thị thống kê ứng tuyển",
  async execute(message) {
    if (!hasRequiredRole(message)) {
      await message.channel.send("Bạn không có quyền sử dụng lệnh này!");
      return;
    }

    try {
      const applications = await Application.find();

      // Create statistics by status
      const statusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});

      // Chart configuration
      const configuration = {
        type: "bar",
        data: {
          labels: Object.keys(statusCounts),
          datasets: [
            {
              label: "Số lượng đơn ứng tuyển",
              data: Object.values(statusCounts),
              backgroundColor: [
                "rgba(54, 162, 235, 0.8)",
                "rgba(255, 206, 86, 0.8)",
                "rgba(75, 192, 192, 0.8)",
                "rgba(255, 99, 132, 0.8)",
              ],
              borderColor: [
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(255, 99, 132, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: "Thống kê đơn ứng tuyển theo trạng thái",
              color: "black",
              font: {
                size: 16,
              },
            },
            legend: {
              labels: {
                color: "black",
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: "black",
              },
            },
            x: {
              ticks: {
                color: "black",
              },
            },
          },
        },
      };

      // Generate chart
      const image = await chartCanvas.renderToBuffer(configuration);
      const attachment = new AttachmentBuilder(image, {
        name: "dashboard.png",
      });

      // Create statistics summary
      const totalApplications = applications.length;
      const summary =
        `📊 Tổng quan ứng tuyển:\n\n` +
        `Tổng số đơn: ${totalApplications}\n` +
        Object.entries(statusCounts)
          .map(
            ([status, count]) =>
              `${status}: ${count} (${Math.round(
                (count / totalApplications) * 100
              )}%)`
          )
          .join("\n");

      await message.channel.send({
        content: summary,
        files: [attachment],
      });
    } catch (error) {
      console.error("Error generating dashboard:", error);
      await message.channel.send("Có lỗi xảy ra khi tạo dashboard!");
    }
  },
};

const list = {
  name: "list",
  description: "Hiển thị danh sách tất cả đơn ứng tuyển dạng bảng",
  async execute(message) {
    if (!hasRequiredRole(message)) {
      await message.channel.send("Bạn không có quyền sử dụng lệnh này!");
      return;
    }

    try {
      const applications = await Application.find().sort({ createdAt: -1 });

      if (!applications.length) {
        await message.channel.send(
          "Không có đơn ứng tuyển nào trong hệ thống!"
        );
        return;
      }

      // Create a compact table-like format
      const header =
        "```\n" +
        "STT | Công ty          | Vị trí           | Trạng thái      | Ngày nộp\n" +
        "----+------------------+------------------+----------------+----------\n";

      const rows = applications.map((app, index) => {
        // Pad and truncate fields to maintain alignment
        const stt = String(index + 1).padEnd(3);
        const company = app.company.slice(0, 15).padEnd(15);
        const position = app.position.slice(0, 15).padEnd(15);
        const status = app.status.slice(0, 13).padEnd(13);
        const date = app.applicationDate;

        return `${stt} | ${company} | ${position} | ${status} | ${date}`;
      });

      const footer = "\n```";

      // Split into chunks if too long
      const CHUNK_SIZE = 15; // Number of rows per message
      const chunks = [];

      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        chunks.push(header + chunk.join("\n") + footer);
      }

      // Send each chunk
      for (const chunk of chunks) {
        await message.channel.send(chunk);
      }

      // Send summary
      const summary = `\nTổng số đơn: ${applications.length}`;
      await message.channel.send(summary);
    } catch (error) {
      console.error("Error fetching applications:", error);
      await message.channel.send(
        "Có lỗi xảy ra khi lấy danh sách đơn ứng tuyển!"
      );
    }
  },
};

const help = {
  name: "helps",
  description: "Hiển thị danh sách các lệnh có sẵn",
  async execute(message) {
    const helpEmbed = {
      color: 0x0099ff,
      title: "🤖 Danh sách lệnh của Bot",
      description: "Sử dụng prefix `h!` trước mỗi lệnh",
      fields: [
        {
          name: "📝 Quản lý đơn",
          value: [
            "`h!apply [công ty] [vị trí] [phương thức] [links] [ghi chú]` - Thêm đơn mới",
            "`h!update` - Cập nhật trạng thái đơn",
            "`h!delete` - Xóa đơn ứng tuyển",
          ].join("\n"),
        },
        {
          name: "🔍 Tìm kiếm & Xem",
          value: [
            "`h!list` - Xem danh sách đơn",
            "`h!search [field] [query]` - Tìm kiếm đơn",
            "`h!dashboard` - Xem thống kê",
            "`h!export` - Xuất dữ liệu ra CSV",
          ].join("\n"),
        },
        {
          name: "⚙️ Hệ thống",
          value: [
            "`h!helps` - Hiện menu này",
            "`h!reload` - Tải lại bot (Admin)",
            "`h!test` - Thêm dữ liệu mẫu",
          ].join("\n"),
        },
        {
          name: "📌 Lưu ý",
          value: "Cần có role được cấp quyền để sử dụng các lệnh",
        },
      ],
      footer: {
        text: "Job Application Tracker Bot",
      },
      timestamp: new Date(),
    };

    await message.channel.send({ embeds: [helpEmbed] });
  },
};

const commands = [
  apply,
  test,
  update,
  delete_command,
  search,
  export_command,
  dashboard,
  list,
  help, // Add help command to the array
];

const reload = require("./commands/reload");
commands.push(reload);

module.exports = { commands };
