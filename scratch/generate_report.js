
const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, BorderStyle,
  WidthType, VerticalAlign, ShadingType, PageBreak,
  convertInchesToTwip,
} = require("docx");
const fs = require("fs");

// ─────────────────────────────────────────────────────────────────────────────
// STYLE HELPERS – khớp với file mẫu (Times New Roman, lề chuẩn VN)
// ─────────────────────────────────────────────────────────────────────────────

// Font cơ bản: TNR size 26 (=13pt) – khớp w:sz=26 trong mẫu
const TNR = (text, opts = {}) => new TextRun({
  text,
  font: "Times New Roman",
  size: 26,          // 13pt – đúng với mẫu (sz=26)
  ...opts,
});

// H1: size 32 (16pt), bold, spacing before 235 – khớp u1 trong mẫu
const H1 = (text) => new Paragraph({
  children: [new TextRun({ text, font: "Times New Roman", size: 32, bold: true })],
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 235, after: 160, line: 259, lineRule: "auto" },
});

// H2: size 28 (14pt), bold, indent left 360 – khớp u2 trong mẫu
const H2 = (text) => new Paragraph({
  children: [new TextRun({ text, font: "Times New Roman", size: 28, bold: true })],
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 127, after: 100, line: 259, lineRule: "auto" },
  indent: { left: 360, hanging: 360 },
});

// H3: size 28 (14pt), color 4F81BD, indent left 520 – khớp u3 trong mẫu
const H3 = (text) => new Paragraph({
  children: [new TextRun({ text, font: "Times New Roman", size: 28, bold: true, color: "4F81BD" })],
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 20, after: 20, line: 240, lineRule: "auto" },
  indent: { left: 520 },
});

// Đoạn văn thường: indent đầu dòng 720 twips (1cm), line 259/auto – khớp mẫu
const P = (text, indent = true) => new Paragraph({
  children: [TNR(text)],
  spacing: { before: 0, after: 160, line: 259, lineRule: "auto" },
  indent: indent ? { firstLine: 720 } : undefined,
});

// Đoạn in đậm
const PB = (text) => new Paragraph({
  children: [new TextRun({ text, font: "Times New Roman", size: 26, bold: true })],
  spacing: { before: 120, after: 60, line: 259, lineRule: "auto" },
});

// Đoạn bình thường không indent
const PNORM = (text = "") => new Paragraph({
  children: [TNR(text)],
  spacing: { before: 0, after: 160, line: 259, lineRule: "auto" },
});

// Bullet
const PBULLET = (text, level = 0) => new Paragraph({
  children: [TNR(text)],
  bullet: { level },
  spacing: { before: 60, after: 60, line: 259, lineRule: "auto" },
  indent: { left: 1374, hanging: 534 },  // khớp List Paragraph mẫu
});

const BREAK = () => new Paragraph({ children: [new PageBreak()] });

const CENTER = (text, size = 26, bold = false) => new Paragraph({
  children: [new TextRun({ text, font: "Times New Roman", size, bold })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 120, after: 120, line: 259, lineRule: "auto" },
});

// ─────────────────────────────────────────────────────────────────────────────
// TABLE CELL HELPERS – màu header 4F81BD như Heading 3 trong mẫu
// ─────────────────────────────────────────────────────────────────────────────
const BLUE_HDR = "4F81BD";   // màu đúng từ mẫu (Heading 3 color)
const LIGHT_BG = "D9E2F3";   // xanh nhạt cho nhãn label
const MID_BG   = "EBF3FB";   // xanh rất nhạt cho dòng chẵn

// Cell tiêu đề bảng: nền 4F81BD, chữ trắng, căn giữa, bold
const hCell = (text, w) => new TableCell({
  children: [new Paragraph({
    children: [new TextRun({ text, font: "Times New Roman", size: 22, bold: true, color: "FFFFFF" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
  })],
  shading: { fill: BLUE_HDR, type: ShadingType.CLEAR, color: "auto" },
  verticalAlign: VerticalAlign.CENTER,
  width: w ? { size: w, type: WidthType.DXA } : undefined,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
});

// Cell dữ liệu thường
const dCell = (text, shade = false, bold = false) => new TableCell({
  children: [new Paragraph({
    children: [new TextRun({ text, font: "Times New Roman", size: 22, bold })],
    spacing: { before: 60, after: 60, line: 259, lineRule: "auto" },
  })],
  shading: shade ? { fill: MID_BG, type: ShadingType.CLEAR } : undefined,
  verticalAlign: VerticalAlign.CENTER,
  margins: { top: 40, bottom: 40, left: 100, right: 100 },
});

// Cell nhãn (cột trái bảng UC) – nền xanh nhạt, bold
const labelCell = (text) => new TableCell({
  children: [new Paragraph({
    children: [new TextRun({ text, font: "Times New Roman", size: 22, bold: true })],
    spacing: { before: 60, after: 60, line: 259, lineRule: "auto" },
  })],
  shading: { fill: LIGHT_BG, type: ShadingType.CLEAR, color: "auto" },
  width: { size: 2400, type: WidthType.DXA },
  margins: { top: 40, bottom: 40, left: 100, right: 100 },
});

// Cell giá trị (cột phải bảng UC)
const valueCell = (lines) => new TableCell({
  children: lines.map(l => new Paragraph({
    children: [new TextRun({ text: l, font: "Times New Roman", size: 22 })],
    spacing: { before: 40, after: 40, line: 259, lineRule: "auto" },
  })),
  margins: { top: 40, bottom: 40, left: 100, right: 100 },
});

// ─────────────────────────────────────────────────────────────────────────────
// DB TABLE BUILDER → returns array of nodes (H3 heading + Table + spacer)
// ─────────────────────────────────────────────────────────────────────────────
function dbSection(sectionNum, tableName, description, columns) {
  const rows = columns.map((c, i) => new TableRow({
    children: [
      dCell(String(i + 1), i % 2 !== 0),
      dCell(c.name, i % 2 !== 0, true),
      dCell(c.type, i % 2 !== 0),
      dCell(c.desc, i % 2 !== 0),
    ],
  }));

  return [
    H3(`${sectionNum} Bảng ${tableName} (${description})`),
    new Table({
      rows: [
        new TableRow({
          tableHeader: true,
          children: [hCell("STT", 500), hCell("Tên cột", 2000), hCell("Kiểu dữ liệu", 1800), hCell("Mô tả / Ràng buộc", 4500)],
        }),
        ...rows,
      ],
      width: { size: 8800, type: WidthType.DXA },
    }),
    PNORM(),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// USE CASE TABLE BUILDER → returns array (H3 heading + Table + spacer)
// ─────────────────────────────────────────────────────────────────────────────
function ucSection(bangNum, ucCode, title, data) {
  const rows = Object.entries(data).map(([label, lines]) => new TableRow({
    children: [labelCell(label), valueCell(Array.isArray(lines) ? lines : [lines])],
  }));

  return [
    H3(`Bảng ${bangNum} – Đặc tả chức năng ${title}`),
    new Table({
      rows,
      width: { size: 8800, type: WidthType.DXA },
    }),
    PNORM(),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARISON TABLE HELPER
// ─────────────────────────────────────────────────────────────────────────────
function compareTable(headers, rows) {
  const hRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => hCell(h, i === 0 ? 2500 : 2000)),
  });
  const dRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => dCell(cell, ri % 2 !== 0, ci === 0)),
  }));
  return new Table({ rows: [hRow, ...dRows], width: { size: 8800, type: WidthType.DXA } });
}

// =============================================================================
// DOCUMENT CONTENT
// =============================================================================
const children = [

  // ══════════════════════════════════════════════════════════════════════
  // TRANG BÌA
  // ══════════════════════════════════════════════════════════════════════
  CENTER("TRƯỜNG CAO ĐẲNG FPT POLYTECHNIC", 28, false),
  CENTER("BỘ MÔN CÔNG NGHỆ THÔNG TIN", 28, false),
  PNORM(), PNORM(), PNORM(),
  CENTER("BÁO CÁO DỰ ÁN TỐT NGHIỆP", 36, true),
  PNORM(), PNORM(),
  CENTER("XÂY DỰNG HỆ THỐNG QUẢN LÝ PHÒNG KHÁM", 30, true),
  CENTER("VẬT LÝ TRỊ LIỆU – OFFICE CARE", 34, true),
  PNORM(), PNORM(),
  new Paragraph({ children: [TNR("Giảng viên hướng dẫn  :  "), TNR("[Tên Giảng viên]", { bold: true })], alignment: AlignmentType.CENTER }),
  new Paragraph({ children: [TNR("Chuyên ngành              :  "), TNR("Lập trình Web", { bold: true })], alignment: AlignmentType.CENTER }),
  new Paragraph({ children: [TNR("Nhóm thực hiện          :  "), TNR("Nhóm Office Care", { bold: true })], alignment: AlignmentType.CENTER }),
  PNORM(), PNORM(),
  CENTER("Đà Nẵng, Năm 2025", 24, false),
  BREAK(),

  // ══════════════════════════════════════════════════════════════════════
  // LỜI MỞ ĐẦU
  // ══════════════════════════════════════════════════════════════════════
  H1("LỜI MỞ ĐẦU"),
  P("Trong bối cảnh hệ thống y tế hiện đại ngày càng phát triển, nhu cầu quản lý phòng khám chuyên khoa một cách hiệu quả, minh bạch và chuyên nghiệp trở nên cấp thiết hơn bao giờ hết. Đặc biệt trong lĩnh vực Vật lý trị liệu – Phục hồi chức năng, nơi mà mỗi bệnh nhân cần một lộ trình điều trị cá nhân hóa kéo dài nhiều buổi, việc quản lý lịch hẹn, liệu trình và hóa đơn theo phương thức thủ công truyền thống đang bộc lộ nhiều hạn chế."),
  P("Trước thực trạng đó, dự án \"Office Care – Hệ thống Quản lý Phòng khám Vật lý Trị liệu\" ra đời với mục tiêu xây dựng một nền tảng quản lý tập trung, toàn diện, phục vụ đa vai trò: Khách hàng đặt lịch trực tuyến, Lễ tân điều phối lịch hẹn và thu phí, Kỹ thuật viên ghi nhận tiến trình điều trị, Bác sĩ chẩn đoán và đề xuất liệu trình, và Quản trị viên giám sát toàn hệ thống."),
  P("Hệ thống không chỉ giải quyết bài toán quản lý lịch hẹn và tránh đặt trùng, mà còn tích hợp cơ chế gói dịch vụ linh hoạt (combo nhiều buổi), chính sách dùng thử 3 buổi không phí trước, công thức hoàn tiền minh bạch 50%, và khả năng ghi nhận nhật ký buổi trị liệu chi tiết hỗ trợ AI – hướng tới một phòng khám thông minh, nâng cao trải nghiệm bệnh nhân và hiệu quả vận hành."),
  BREAK(),

  // ══════════════════════════════════════════════════════════════════════
  // LỜI CẢM ƠN
  // ══════════════════════════════════════════════════════════════════════
  H1("LỜI CẢM ƠN"),
  P("Lời đầu tiên, nhóm thực hiện xin chân thành cảm ơn toàn bộ quý thầy cô Trường Cao Đẳng FPT Polytechnic đã truyền đạt những kiến thức quý báu trong suốt thời gian học tập tại trường."),
  P("Nhóm gửi lời cảm ơn sâu sắc đến Giảng viên hướng dẫn – người đã nhiệt tình định hướng, góp ý và hỗ trợ nhóm trong suốt quá trình thực hiện đồ án tốt nghiệp này."),
  P("Cuối cùng, nhóm xin cảm ơn tất cả các thành viên đã đồng lòng cùng nhau vượt qua những thử thách trong quá trình thực hiện dự án. Xin chân thành cảm ơn!"),
  BREAK(),

  // ══════════════════════════════════════════════════════════════════════
  // THUẬT NGỮ
  // ══════════════════════════════════════════════════════════════════════
  H1("THUẬT NGỮ VÀ CÁC TỪ VIẾT TẮT"),
  new Table({
    rows: [
      new TableRow({ tableHeader: true, children: [hCell("Thuật ngữ / Từ viết tắt", 2800), hCell("Giải thích", 6000)] }),
      ...[
        ["VLT / PT", "Vật lý trị liệu – Physiotherapy (Physical Therapy)"],
        ["KTV", "Kỹ thuật viên vật lý trị liệu"],
        ["BS", "Bác sĩ y khoa"],
        ["LT", "Lễ tân phòng khám"],
        ["SPA", "Single Page Application – Ứng dụng web đơn trang"],
        ["JWT", "JSON Web Token – Token xác thực phiên làm việc"],
        ["OTP", "One-Time Password – Mật khẩu dùng một lần (6 số gửi qua email)"],
        ["REST API", "Representational State Transfer – Kiến trúc giao tiếp Client-Server"],
        ["CRUD", "Create, Read, Update, Delete – 4 thao tác cơ bản với dữ liệu"],
        ["UUID", "Universally Unique Identifier – Định danh duy nhất toàn cầu (128-bit)"],
        ["ERD", "Entity Relationship Diagram – Sơ đồ thực thể quan hệ CSDL"],
        ["CCCD", "Căn cước công dân (Việt Nam)"],
        ["FK / PK", "Foreign Key / Primary Key – Khóa ngoại / Khóa chính trong CSDL"],
        ["PostgreSQL", "Hệ quản trị CSDL quan hệ mã nguồn mở hiệu năng cao"],
        ["Soft delete", "Xóa mềm – đánh dấu ẩn thay vì xóa vĩnh viễn khỏi CSDL"],
        ["SOAP Notes", "Subjective–Objective–Assessment–Plan: Định dạng ghi nhật ký lâm sàng chuẩn"],
        ["Combo / Gói", "Gói điều trị nhiều buổi được bán với mức giá ưu đãi"],
      ].map(([k, v], i) => new TableRow({ children: [dCell(k, i%2!==0, true), dCell(v, i%2!==0)] })),
    ],
    width: { size: 8800, type: WidthType.DXA },
  }),
  BREAK(),

  // ══════════════════════════════════════════════════════════════════════
  // PHẦN 1
  // ══════════════════════════════════════════════════════════════════════
  H1("PHẦN 1 – GIỚI THIỆU ĐỀ TÀI"),
  H2("1.1. Mục tiêu đề tài"),
  P("Dự án \"Office Care\" nhằm xây dựng hệ thống quản lý phòng khám vật lý trị liệu toàn diện, phục vụ cả vận hành nội bộ lẫn trải nghiệm khách hàng trực tuyến. Mục tiêu cụ thể:"),
  PBULLET("Nền tảng đặt lịch trực tuyến: Khách hàng xem dịch vụ, chọn KTV ưa thích, chọn khung giờ và đặt lịch hẹn; hệ thống kiểm tra xung đột tự động."),
  PBULLET("Quản lý lịch hẹn & phòng khám: Ngăn chặn đặt trùng lịch giữa KTV và phòng điều trị, tối ưu lịch làm việc toàn phòng khám."),
  PBULLET("Quản lý gói dịch vụ (combo liệu trình): Hỗ trợ đăng ký dùng thử 3 buổi miễn phí, thanh toán trả góp linh hoạt và gia hạn gói."),
  PBULLET("Ghi nhật ký buổi trị liệu (SOAP Notes): KTV ghi điểm đau, diễn biến điều trị; AI tóm tắt nội dung tự động."),
  PBULLET("Quản lý hóa đơn & thanh toán đa phương thức: Tạo hóa đơn, thu phí, hoàn tiền theo công thức minh bạch."),
  PBULLET("Phân quyền đa vai trò: 5 vai trò (Khách hàng, Lễ tân, KTV, Bác sĩ, Admin), mỗi vai trò chỉ truy cập chức năng phù hợp."),

  H2("1.2. Phạm vi đề tài"),
  P("Dự án bao gồm các thành phần sau:"),
  PBULLET("Website đặt lịch dành cho khách hàng: Giao diện responsive, cho phép xem dịch vụ, đặt lịch, theo dõi liệu trình cá nhân."),
  PBULLET("Dashboard quản lý nội bộ: Lễ tân điều phối lịch; Bác sĩ chẩn đoán; KTV ghi nhật ký; Admin quản trị toàn hệ thống."),
  PBULLET("REST API Backend: Xử lý toàn bộ nghiệp vụ, xác thực JWT+OTP, chống trùng lịch tầng Database."),
  PBULLET("Hệ thống gói & liệu trình: Quản lý vòng đời từ đăng ký → dùng thử → kích hoạt → hoàn thành/hủy hoàn tiền."),

  H2("1.3. Kết quả dự kiến đạt được"),
  PBULLET("Nâng cao hiệu quả vận hành phòng khám, giảm thiểu sai sót lịch hẹn và tối ưu công suất phòng."),
  PBULLET("Cải thiện trải nghiệm bệnh nhân: chủ động đặt lịch và theo dõi tiến trình điều trị trực tuyến."),
  PBULLET("Minh bạch tài chính: hóa đơn rõ ràng, hỗ trợ trả góp và công thức hoàn tiền cụ thể."),
  PBULLET("Kiến trúc module hóa sẵn sàng mở rộng: tích hợp AI chẩn đoán, SMS/Zalo, quản lý đa chi nhánh."),
  BREAK(),

  // ══════════════════════════════════════════════════════════════════════
  // PHẦN 2
  // ══════════════════════════════════════════════════════════════════════
  H1("PHẦN 2 – KHẢO SÁT YÊU CẦU"),
  H2("2.1. Khảo sát"),
  P("Hiện nay, phần lớn phòng khám vật lý trị liệu tại Việt Nam quản lý lịch hẹn bằng sổ tay hoặc bảng tính Excel, gây ra nhiều vấn đề: đặt trùng lịch, không theo dõi được tiến trình bệnh nhân theo gói, thiếu minh bạch trong thu chi và khó quản lý nhiều KTV cùng lúc."),

  H2("2.2. Ứng dụng thực tế tham khảo"),
  PBULLET("BookingCare – Nền tảng đặt lịch khám bệnh: https://bookingcare.vn"),
  PBULLET("Nhanh.vn – Hệ thống quản lý phòng khám tổng quát: https://nhanh.vn"),
  PBULLET("Medici – Nền tảng quản lý phòng khám: https://medici.vn"),

  H2("2.3. So sánh với các hệ thống có trong thị trường"),
  compareTable(
    ["Tiêu chí", "BookingCare", "Nhanh.vn", "Office Care"],
    [
      ["Đặt lịch trực tuyến", "Có", "Có", "Có (OTP xác thực)"],
      ["Quản lý liệu trình combo", "Không", "Hạn chế", "Đầy đủ (dùng thử 3 buổi)"],
      ["Chống trùng lịch DB", "Không", "Không", "Có (ràng buộc tầng Database)"],
      ["SOAP Notes / Nhật ký buổi", "Không", "Không", "Có (+ AI tóm tắt)"],
      ["Hoàn tiền theo công thức", "Không", "Không", "Có (công thức 50%)"],
      ["Phân quyền 5 vai trò", "2 vai trò", "3 vai trò", "5 vai trò đầy đủ"],
      ["Thanh toán trả góp", "Không", "Không", "Có"],
      ["Dashboard thống kê", "Cơ bản", "Có", "Có (doanh thu, KTV, dịch vụ)"],
    ]
  ),
  PNORM(),

  H2("2.4. Định hướng xây dựng hệ thống"),
  P("Dựa trên khảo sát, Office Care tập trung vào các tính năng đặc thù chưa có trong các hệ thống hiện tại:"),
  PBULLET("Hệ thống lịch hẹn thông minh với kiểm tra xung đột kép (KTV + Phòng) tại tầng Database."),
  PBULLET("Quản lý gói combo linh hoạt: dùng thử → thanh toán → kích hoạt → theo dõi tiến trình từng buổi."),
  PBULLET("Nhật ký lâm sàng SOAP Notes chi tiết cho từng buổi điều trị, kết hợp AI tóm tắt."),
  PBULLET("Dashboard thống kê doanh thu, tỷ lệ tái khám, hiệu suất KTV theo thời gian thực."),
  PBULLET("Phân quyền 5 vai trò rõ ràng, giao diện Dashboard riêng biệt cho từng nhóm người dùng."),
  BREAK(),

  // ══════════════════════════════════════════════════════════════════════
  // PHẦN 3
  // ══════════════════════════════════════════════════════════════════════
  H1("PHẦN 3 – PHÂN TÍCH HIỆN TRẠNG"),
  H2("3.1 Phân tích"),
  H3("3.1.1 Ưu Điểm"),
  PBULLET("Nhu cầu thị trường cao: Vật lý trị liệu – Phục hồi chức năng đang phát triển mạnh, đặc biệt sau đại dịch COVID-19 với nhiều bệnh nhân cần phục hồi."),
  PBULLET("Chưa có giải pháp chuyên biệt: Thị trường thiếu phần mềm quản lý phòng khám VLT chuyên sâu, tạo cơ hội rõ ràng cho Office Care."),
  PBULLET("Khả năng tái khám cao: Đặc thù liệu trình nhiều buổi tạo mối quan hệ lâu dài và ổn định giữa bệnh nhân và phòng khám."),
  PBULLET("Số hóa quy trình: Thay thế sổ tay/Excel bằng hệ thống tự động hóa, giảm thiểu sai sót con người."),

  H3("3.1.2 Nhược điểm"),
  PBULLET("Quản lý lịch phức tạp: Mỗi buổi cần phân công đúng KTV, đúng phòng, đúng thiết bị – rất dễ xảy ra xung đột nếu không có ràng buộc hệ thống."),
  PBULLET("Quy trình nghiệp vụ đặc thù: Liệu trình dùng thử, công thức hoàn tiền, SOAP Notes đòi hỏi thiết kế hệ thống chặt chẽ, khó triển khai."),
  PBULLET("Bảo mật dữ liệu y tế: Thông tin sức khỏe, chẩn đoán bệnh nhân cần được bảo vệ nghiêm ngặt."),
  PBULLET("Chi phí phát triển cao: Hệ thống chuyên biệt cần đầu tư lớn về thiết kế UX và kỹ thuật backend."),

  H2("3.2 Xác định đối tượng người dùng"),
  new Table({
    rows: [
      new TableRow({ tableHeader: true, children: [hCell("Vai trò", 2200), hCell("Mô tả chức năng chính", 6600)] }),
      ...[
        ["Khách hàng (Bệnh nhân)", "Xem dịch vụ và gói điều trị, đặt lịch hẹn trực tuyến, xem lịch sử điều trị cá nhân, đánh giá KTV và dịch vụ sau buổi trị liệu."],
        ["Lễ tân", "Xác nhận và điều chỉnh lịch hẹn, check-in bệnh nhân, tạo hóa đơn và thu phí đa phương thức, điều phối phòng và KTV theo ngày."],
        ["Kỹ thuật viên (KTV)", "Xem lịch trực hàng ngày, ghi nhật ký SOAP Notes từng buổi, cập nhật điểm đau trước/sau buổi, theo dõi tiến trình liệu trình bệnh nhân."],
        ["Bác sĩ", "Lượng giá bệnh nhân lần đầu, ghi chẩn đoán y khoa và chống chỉ định, đề xuất gói điều trị combo hoặc dịch vụ lẻ phù hợp."],
        ["Quản trị viên (Admin)", "Quản lý toàn hệ thống: nhân sự, dịch vụ, gói điều trị, phòng, thiết bị, voucher, báo cáo doanh thu theo thời gian."],
      ].map(([r, d], i) => new TableRow({ children: [dCell(r, i%2!==0, true), dCell(d, i%2!==0)] })),
    ],
    width: { size: 8800, type: WidthType.DXA },
  }),
  PNORM(),

  H2("3.3 Activity Diagram"),
  PNORM("[Hình 3.3.1 – Cơ chế xác thực tài khoản OTP]"),
  PNORM("[Hình 3.3.2 – Luồng đặt lịch hẹn của Khách hàng]"),
  PNORM("[Hình 3.3.3 – Luồng đăng ký và kích hoạt Gói điều trị]"),

  H2("3.4 Sơ đồ Use Case"),
  PNORM("[Hình 3.4.1 – Sơ đồ Use Case tổng quát hệ thống Office Care]"),
  PNORM("[Hình 3.4.2 – Sơ đồ Use Case chi tiết phía Khách hàng]"),
  PNORM("[Hình 3.4.3 – Sơ đồ Use Case chi tiết phía Nhân viên & Admin]"),

  H2("3.5 Đặc tả Use Case"),

  // UC ADMIN: 3.5.1 → 3.5.8
  ...ucSection("3.5.1", "UC3-1", "quản lý danh mục dịch vụ", {
    "Mã Use Case": ["UC3-1"],
    "Tên": ["Quản lý Danh mục dịch vụ"],
    "Mục đích": ["Cho phép Admin quản lý danh mục phân loại dịch vụ vật lý trị liệu (thêm, sửa, ẩn/hiện) nhằm đảm bảo thông tin dịch vụ được tổ chức khoa học."],
    "Tác nhân": ["Admin"],
    "Mô tả tóm tắt": ["Admin có thể thêm danh mục mới, chỉnh sửa tên/mô tả hoặc ẩn danh mục không còn sử dụng."],
    "Điều kiện tiên quyết": ["Admin đã đăng nhập vào hệ thống với vai trò admin.", "Hệ thống đã có sẵn danh sách danh mục hoặc Admin muốn tạo mới."],
    "Luồng sự kiện chính": [
      "1. Admin truy cập trang Quản lý Danh mục.",
      "2. Admin chọn thao tác: Thêm mới, Sửa, hoặc Ẩn/Hiện danh mục.",
      "3. Thêm: Nhập tên danh mục, mô tả, thứ tự hiển thị và lưu lại.",
      "4. Sửa: Chọn danh mục, chỉnh sửa thông tin và lưu lại.",
      "5. Ẩn: Chuyển trạng thái an_hien = false, danh mục không hiển thị trên website.",
      "6. Hệ thống cập nhật và phản ánh thay đổi ngay lập tức.",
    ],
    "Điều kiện sau": ["Danh mục được cập nhật chính xác, hiển thị đúng thứ tự trên website."],
    "Biến thể": ["Thêm danh mục trùng tên: Hệ thống thông báo lỗi, yêu cầu nhập tên khác.", "Ẩn danh mục đang có dịch vụ hoạt động: Hệ thống cảnh báo trước khi xác nhận."],
  }),

  ...ucSection("3.5.2", "UC3-2", "quản lý dịch vụ", {
    "Mã Use Case": ["UC3-2"],
    "Tên": ["Quản lý Dịch vụ"],
    "Mục đích": ["Cho phép Admin quản lý toàn bộ danh sách dịch vụ vật lý trị liệu (thêm, sửa, xóa mềm)."],
    "Tác nhân": ["Admin"],
    "Mô tả tóm tắt": ["Admin có thể thêm dịch vụ mới, chỉnh sửa thông tin (giá, thời lượng, thiết bị yêu cầu) hoặc ẩn dịch vụ ngừng cung cấp."],
    "Điều kiện tiên quyết": ["Admin đã đăng nhập. Danh mục dịch vụ đã được tạo."],
    "Luồng sự kiện chính": [
      "1. Admin truy cập trang Quản lý Dịch vụ.",
      "2. Thêm dịch vụ: Nhập tên, danh mục, mô tả ngắn, mô tả chi tiết, thời lượng (phút), đơn giá (VNĐ), thiết bị yêu cầu và lưu.",
      "3. Sửa dịch vụ: Chọn dịch vụ cần sửa, chỉnh sửa thông tin và nhấn Lưu.",
      "4. Ẩn dịch vụ: Chuyển trạng thái sang 'ngung_cung_cap', không hiển thị trên website.",
      "5. Hệ thống cập nhật danh sách dịch vụ.",
    ],
    "Điều kiện sau": ["Dịch vụ được cập nhật chính xác, phản ánh đúng trên trang đặt lịch của khách hàng."],
    "Biến thể": ["Thêm dịch vụ với tên trùng: Hệ thống báo lỗi, yêu cầu tên khác.", "Ẩn dịch vụ đang có lịch hẹn tương lai: Cảnh báo để Admin xử lý trước."],
  }),

  ...ucSection("3.5.3", "UC3-3", "quản lý lịch hẹn", {
    "Mã Use Case": ["UC3-3"],
    "Tên": ["Quản lý Lịch hẹn"],
    "Mục đích": ["Cho phép Lễ tân xem, xác nhận, điều chỉnh và hủy lịch hẹn của bệnh nhân trong ngày."],
    "Tác nhân": ["Lễ tân, Admin"],
    "Mô tả tóm tắt": ["Lễ tân có thể xem lịch hẹn theo ngày/KTV, xác nhận lịch chờ, check-in bệnh nhân đến và hủy lịch khi cần."],
    "Điều kiện tiên quyết": ["Lễ tân đã đăng nhập với vai trò le_tan.", "Hệ thống đã có lịch hẹn của khách hàng."],
    "Luồng sự kiện chính": [
      "1. Lễ tân truy cập trang Quản lý Lịch hẹn.",
      "2. Xem danh sách lịch hẹn theo ngày, lọc theo KTV hoặc phòng.",
      "3. Xác nhận lịch: Chuyển trạng thái từ 'cho_xac_nhan' sang 'da_xac_nhan', gửi email xác nhận.",
      "4. Check-in bệnh nhân: Ghi nhận thời gian đến, xác minh CCCD (lần đầu cho gói dùng thử).",
      "5. Hủy lịch: Nhập lý do hủy, hệ thống ghi nhận và thông báo khách hàng.",
    ],
    "Điều kiện sau": ["Trạng thái lịch hẹn được cập nhật chính xác, phản ánh đúng trong lịch làm việc của KTV."],
    "Biến thể": ["KTV nghỉ đột xuất: Lễ tân chuyển lịch sang KTV khác có trống.", "Trùng lịch phòng: Hệ thống tự động gợi ý phòng trống thay thế."],
  }),

  ...ucSection("3.5.4", "UC3-4", "quản lý bình luận & đánh giá", {
    "Mã Use Case": ["UC3-4"],
    "Tên": ["Quản lý Bình luận & Đánh giá"],
    "Mục đích": ["Cho phép Admin xem, duyệt và xóa các đánh giá dịch vụ của bệnh nhân sau buổi trị liệu."],
    "Tác nhân": ["Admin"],
    "Mô tả tóm tắt": ["Admin có thể duyệt đánh giá để hiển thị công khai trên website hoặc ẩn/xóa đánh giá vi phạm."],
    "Điều kiện tiên quyết": ["Admin đã đăng nhập. Hệ thống có các đánh giá chờ duyệt."],
    "Luồng sự kiện chính": [
      "1. Admin truy cập trang Quản lý Đánh giá.",
      "2. Xem danh sách đánh giá mới, lọc theo KTV, dịch vụ hoặc số sao.",
      "3. Duyệt đánh giá: Chuyển hien_thi_cong_khai = true để hiển thị trên website.",
      "4. Ẩn đánh giá: Chuyển hien_thi_cong_khai = false.",
      "5. Xóa đánh giá vi phạm quy định.",
    ],
    "Điều kiện sau": ["Đánh giá được quản lý chính xác, website hiển thị đúng đánh giá đã được duyệt."],
    "Biến thể": ["Đánh giá 1 sao không có nhận xét: Admin xem xét và quyết định duyệt hay ẩn theo quy định."],
  }),

  ...ucSection("3.5.5", "UC3-5", "quản lý khách hàng", {
    "Mã Use Case": ["UC3-5"],
    "Tên": ["Quản lý Khách hàng"],
    "Mục đích": ["Cho phép Admin và Lễ tân xem, tìm kiếm và cập nhật thông tin hồ sơ khách hàng."],
    "Tác nhân": ["Admin, Lễ tân"],
    "Mô tả tóm tắt": ["Admin có thể xem danh sách khách hàng, cập nhật thông tin cá nhân, xem lịch sử điều trị và khóa tài khoản vi phạm."],
    "Điều kiện tiên quyết": ["Admin hoặc Lễ tân đã đăng nhập."],
    "Luồng sự kiện chính": [
      "1. Truy cập trang Quản lý Khách hàng.",
      "2. Tìm kiếm khách hàng theo tên, SĐT hoặc email.",
      "3. Xem hồ sơ chi tiết: thông tin cá nhân, lịch sử đặt lịch, liệu trình đang dùng, hóa đơn.",
      "4. Cập nhật thông tin: CCCD, địa chỉ, hạng khách hàng.",
      "5. Khóa tài khoản: Chuyển trạng thái sang 'bi_khoa' khi vi phạm.",
    ],
    "Điều kiện sau": ["Thông tin khách hàng được cập nhật chính xác trong hệ thống."],
    "Biến thể": ["Khóa tài khoản khách đang có gói điều trị: Hệ thống cảnh báo trước khi xác nhận."],
  }),

  ...ucSection("3.5.6", "UC3-6", "quản lý voucher giảm giá", {
    "Mã Use Case": ["UC3-6"],
    "Tên": ["Quản lý Voucher Giảm giá"],
    "Mục đích": ["Cho phép Admin tạo và quản lý các voucher khuyến mãi để hỗ trợ chiến dịch marketing."],
    "Tác nhân": ["Admin"],
    "Mô tả tóm tắt": ["Admin có thể tạo voucher theo % hoặc tiền cố định, đặt giới hạn sử dụng, thời hạn hiệu lực và điều kiện áp dụng."],
    "Điều kiện tiên quyết": ["Admin đã đăng nhập."],
    "Luồng sự kiện chính": [
      "1. Admin truy cập trang Quản lý Voucher.",
      "2. Tạo voucher mới: Nhập mã, loại giảm (%), giá trị, giảm tối đa, đơn tối thiểu, số lượng và ngày hết hạn.",
      "3. Chỉnh sửa voucher: Cập nhật thông tin và lưu.",
      "4. Tạm dừng voucher: Chuyển trạng thái 'tam_dung' khi cần dừng sớm.",
      "5. Xóa voucher chưa được sử dụng.",
    ],
    "Điều kiện sau": ["Voucher được lưu và sẵn sàng để khách hàng sử dụng khi thanh toán."],
    "Biến thể": ["Tạo voucher trùng mã: Hệ thống báo lỗi, yêu cầu nhập mã khác.", "Xóa voucher đang được sử dụng: Hệ thống từ chối và cảnh báo."],
  }),

  ...ucSection("3.5.7", "UC3-7", "quản lý gói dịch vụ", {
    "Mã Use Case": ["UC3-7"],
    "Tên": ["Quản lý Gói Dịch vụ (Combo Liệu trình)"],
    "Mục đích": ["Cho phép Admin tạo và quản lý các gói điều trị combo với cơ chế dùng thử 3 buổi đặc thù."],
    "Tác nhân": ["Admin"],
    "Mô tả tóm tắt": ["Admin tạo gói gồm nhiều dịch vụ, định nghĩa tổng số buổi, giá gói, thời hạn và chính sách ưu đãi."],
    "Điều kiện tiên quyết": ["Admin đã đăng nhập. Các dịch vụ thành phần đã được tạo."],
    "Luồng sự kiện chính": [
      "1. Admin truy cập trang Quản lý Gói dịch vụ.",
      "2. Tạo gói mới: Nhập tên gói, mã gói, tổng số buổi, giá gói, giá gốc (để hiển thị % tiết kiệm), thời hạn (tháng).",
      "3. Phân bổ dịch vụ: Chọn dịch vụ và số buổi trong gói cho từng dịch vụ.",
      "4. Bật/tắt hiển thị gói trên website.",
      "5. Ẩn gói khi ngừng cung cấp.",
    ],
    "Điều kiện sau": ["Gói dịch vụ được tạo và hiển thị đúng trên website, sẵn sàng cho khách hàng đăng ký."],
    "Biến thể": ["Tạo gói với mã trùng: Hệ thống thông báo lỗi.", "Ẩn gói đang được đăng ký bởi khách hàng: Cảnh báo và chờ xử lý các đăng ký hiện tại."],
  }),

  ...ucSection("3.5.8", "UC3-8", "thống kê doanh thu", {
    "Mã Use Case": ["UC3-8"],
    "Tên": ["Thống kê Doanh thu"],
    "Mục đích": ["Cung cấp báo cáo doanh thu theo thời gian, dịch vụ và KTV để hỗ trợ quyết định kinh doanh."],
    "Tác nhân": ["Admin"],
    "Mô tả tóm tắt": ["Admin xem biểu đồ và bảng tổng hợp doanh thu từ hóa đơn đã thanh toán theo kỳ lựa chọn."],
    "Điều kiện tiên quyết": ["Admin đã đăng nhập. Hệ thống có dữ liệu hóa đơn đã thanh toán."],
    "Luồng sự kiện chính": [
      "1. Admin truy cập trang Thống kê/Dashboard.",
      "2. Chọn khoảng thời gian (ngày/tuần/tháng/năm).",
      "3. Hệ thống tổng hợp: tổng doanh thu, số lịch hẹn hoàn thành, doanh thu theo dịch vụ, theo KTV.",
      "4. Hiển thị biểu đồ trực quan.",
      "5. Xuất báo cáo Excel nếu cần.",
    ],
    "Điều kiện sau": ["Báo cáo hiển thị chính xác, đầy đủ thông tin trong kỳ đã chọn."],
    "Biến thể": ["Không có dữ liệu trong kỳ: Thông báo 'Chưa có doanh thu trong kỳ này'.", "Lọc theo KTV cụ thể: Hiển thị chỉ doanh thu đóng góp bởi KTV đó."],
  }),

  // UC USER: 3.5.9 → 3.5.19
  ...ucSection("3.5.9", "UC01", "đăng nhập / đăng ký", {
    "Mã Use Case": ["UC01"],
    "Tên": ["Đăng nhập / Đăng ký"],
    "Mục đích": ["Cho phép người dùng tạo tài khoản mới hoặc đăng nhập vào hệ thống thông qua xác thực OTP Email."],
    "Tác nhân": ["Khách hàng, Nhân viên (mọi vai trò)"],
    "Mô tả tóm tắt": ["Người dùng nhập email, hệ thống gửi mã OTP 6 số, xác thực OTP để lấy Access Token & Refresh Token."],
    "Điều kiện tiên quyết": ["Người dùng chưa đăng nhập vào hệ thống."],
    "Luồng sự kiện chính": [
      "1. Người dùng truy cập trang Đăng nhập.",
      "2. Nhập địa chỉ email, nhấn Gửi OTP.",
      "3. Hệ thống gửi mã OTP 6 số về email (hết hạn sau 5 phút).",
      "4. Người dùng nhập OTP, hệ thống xác thực.",
      "5. Hệ thống cấp Access Token (15 phút) và Refresh Token (7 ngày).",
      "6. Điều hướng đến Dashboard tương ứng với vai trò.",
    ],
    "Điều kiện sau": ["Người dùng đăng nhập thành công, có quyền truy cập chức năng theo vai trò."],
    "Biến thể": ["OTP hết hạn: Hệ thống thông báo và cho phép gửi lại OTP.", "Email chưa đăng ký: Tự động tạo tài khoản mới với vai trò khách hàng."],
  }),

  ...ucSection("3.5.10", "UC02", "xem danh mục và dịch vụ", {
    "Mã Use Case": ["UC02"],
    "Tên": ["Xem Danh mục & Dịch vụ"],
    "Mục đích": ["Hiển thị danh mục và chi tiết dịch vụ VLT cho khách hàng tìm hiểu trước khi đặt lịch."],
    "Tác nhân": ["Khách hàng (đã đăng nhập và chưa đăng nhập)"],
    "Mô tả tóm tắt": ["Khách hàng có thể duyệt danh mục, xem dịch vụ theo nhóm, xem chi tiết từng dịch vụ bao gồm mô tả, thời lượng và giá."],
    "Điều kiện tiên quyết": ["Trang web đang hoạt động bình thường."],
    "Luồng sự kiện chính": [
      "1. Khách hàng truy cập trang chủ hoặc trang Dịch vụ.",
      "2. Xem danh sách danh mục và dịch vụ theo nhóm.",
      "3. Nhấn vào dịch vụ để xem chi tiết: mô tả đầy đủ, thời lượng, đơn giá, KTV thực hiện.",
      "4. Khách hàng có thể nhấn Đặt lịch ngay từ trang chi tiết dịch vụ.",
    ],
    "Điều kiện sau": ["Khách hàng hiểu rõ dịch vụ và có thể tiến hành đặt lịch."],
    "Biến thể": ["Dịch vụ tạm ngưng: Hiển thị nhãn 'Tạm ngưng', không cho phép đặt lịch.", "Không có dịch vụ trong danh mục: Thông báo 'Chưa có dịch vụ trong mục này'."],
  }),

  ...ucSection("3.5.11", "UC03", "đặt lịch hẹn", {
    "Mã Use Case": ["UC03"],
    "Tên": ["Đặt Lịch hẹn"],
    "Mục đích": ["Cho phép khách hàng đặt lịch hẹn với KTV để trải nghiệm dịch vụ VLT."],
    "Tác nhân": ["Khách hàng"],
    "Mô tả tóm tắt": ["Khách hàng chọn dịch vụ, KTV ưa thích (hoặc bất kỳ), ngày giờ phù hợp. Hệ thống kiểm tra xung đột và xác nhận lịch."],
    "Điều kiện tiên quyết": ["Khách hàng đã đăng nhập."],
    "Luồng sự kiện chính": [
      "1. Chọn dịch vụ muốn đặt lịch.",
      "2. Chọn KTV ưa thích hoặc để hệ thống tự phân công.",
      "3. Chọn ngày và khung giờ từ lịch trống hiển thị.",
      "4. Nhập lý do khám / mô tả vấn đề sức khỏe.",
      "5. Xác nhận đặt lịch – hệ thống kiểm tra xung đột KTV và phòng.",
      "6. Gửi email xác nhận, lịch hẹn tạo với trạng thái 'cho_xac_nhan'.",
    ],
    "Điều kiện sau": ["Lịch hẹn được tạo thành công và chờ Lễ tân xác nhận."],
    "Biến thể": ["Trùng lịch KTV: Hệ thống báo lỗi và gợi ý khung giờ/KTV khác.", "Khách hàng chưa đăng nhập: Chuyển hướng tới trang đăng nhập."],
  }),

  ...ucSection("3.5.12", "UC04", "xem lịch sử đặt lịch", {
    "Mã Use Case": ["UC04"],
    "Tên": ["Xem Lịch sử Đặt lịch"],
    "Mục đích": ["Cho phép khách hàng theo dõi toàn bộ lịch hẹn (đã đặt, sắp tới, đã hoàn thành) và tiến trình liệu trình."],
    "Tác nhân": ["Khách hàng"],
    "Mô tả tóm tắt": ["Khách hàng xem lịch hẹn theo trạng thái, chi tiết từng buổi đã điều trị và số buổi còn lại trong gói."],
    "Điều kiện tiên quyết": ["Khách hàng đã đăng nhập và có lịch hẹn."],
    "Luồng sự kiện chính": [
      "1. Khách hàng vào trang Hồ sơ → Lịch sử đặt lịch.",
      "2. Xem danh sách lịch hẹn lọc theo trạng thái (sắp tới, đã qua, đã hủy).",
      "3. Nhấn vào lịch hẹn để xem chi tiết: dịch vụ, KTV, phòng, ghi chú.",
      "4. Xem tiến trình gói điều trị: số buổi đã dùng / tổng số buổi.",
    ],
    "Điều kiện sau": ["Khách hàng có thể theo dõi và quản lý lịch điều trị của mình."],
    "Biến thể": ["Chưa có lịch hẹn: Hiển thị thông báo và nút Đặt lịch ngay."],
  }),

  ...ucSection("3.5.13", "UC05", "hủy lịch hẹn", {
    "Mã Use Case": ["UC05"],
    "Tên": ["Hủy Lịch hẹn"],
    "Mục đích": ["Cho phép khách hàng hủy lịch hẹn chưa thực hiện khi không thể đến đúng hẹn."],
    "Tác nhân": ["Khách hàng, Lễ tân"],
    "Mô tả tóm tắt": ["Khách hàng có thể hủy lịch hẹn đang ở trạng thái 'cho_xac_nhan' hoặc 'da_xac_nhan' trước giờ hẹn."],
    "Điều kiện tiên quyết": ["Khách hàng đã đăng nhập và có lịch hẹn chưa thực hiện."],
    "Luồng sự kiện chính": [
      "1. Khách hàng vào Lịch sử đặt lịch, chọn lịch cần hủy.",
      "2. Nhấn Hủy lịch, nhập lý do hủy.",
      "3. Xác nhận hủy – hệ thống ghi nhận thời gian hủy và lý do.",
      "4. Gửi email thông báo hủy cho cả khách hàng và Lễ tân.",
      "5. Phòng và KTV được giải phóng trong lịch.",
    ],
    "Điều kiện sau": ["Lịch hẹn chuyển sang trạng thái 'da_huy', tài nguyên được giải phóng."],
    "Biến thể": ["Hủy lịch đã check-in: Không cho phép, hướng dẫn liên hệ Lễ tân.", "Hủy quá muộn (< 2 giờ trước): Cảnh báo về chính sách phí hủy."],
  }),

  ...ucSection("3.5.14", "UC06", "đăng ký gói dịch vụ", {
    "Mã Use Case": ["UC06"],
    "Tên": ["Đăng ký Gói Dịch vụ (Liệu trình Combo)"],
    "Mục đích": ["Cho phép khách hàng đăng ký gói điều trị nhiều buổi với cơ chế dùng thử 3 buổi miễn phí đặc thù."],
    "Tác nhân": ["Khách hàng, Lễ tân"],
    "Mô tả tóm tắt": ["Khách hàng đăng ký gói điều trị dựa trên đề xuất của Bác sĩ, được dùng thử 3 buổi miễn phí trước khi thanh toán toàn gói."],
    "Điều kiện tiên quyết": ["Bác sĩ đã lượng giá và đề xuất gói điều trị phù hợp."],
    "Luồng sự kiện chính": [
      "1. Khách hàng xem gói điều trị Bác sĩ đề xuất.",
      "2. Đăng ký dùng thử – trạng thái 'cho_kich_hoat', chưa thanh toán.",
      "3. Lễ tân xác minh CCCD khi check-in buổi đầu tiên.",
      "4. Khách hàng tập tối đa 3 buổi miễn phí.",
      "5. Từ buổi thứ 4: Hệ thống tự khóa lịch, Lễ tân tạo hóa đơn toàn gói.",
      "6. Khách hàng thanh toán (hoặc đóng đợt 1 trả góp) → Gói chuyển 'chinh_thuc'.",
    ],
    "Điều kiện sau": ["Gói được kích hoạt, khách hàng tiếp tục đặt lịch các buổi còn lại."],
    "Biến thể": ["Từ chối sau 3 buổi: Tính phí lẻ 3 buổi đã dùng theo đơn giá dịch vụ.", "Quá hạn quyết định: Hệ thống khóa lịch cho đến khi thanh toán."],
  }),

  ...ucSection("3.5.15", "UC07", "đánh giá dịch vụ sau buổi trị liệu", {
    "Mã Use Case": ["UC07"],
    "Tên": ["Đánh giá Dịch vụ sau Buổi trị liệu"],
    "Mục đích": ["Cho phép khách hàng đánh giá chất lượng dịch vụ và thái độ KTV sau mỗi buổi hoàn thành."],
    "Tác nhân": ["Khách hàng"],
    "Mô tả tóm tắt": ["Sau khi buổi trị liệu hoàn thành, hệ thống mời khách hàng đánh giá sao và viết nhận xét."],
    "Điều kiện tiên quyết": ["Buổi trị liệu đã được xác nhận 'hoan_thanh'."],
    "Luồng sự kiện chính": [
      "1. Hệ thống gửi yêu cầu đánh giá sau buổi kết thúc.",
      "2. Khách hàng chấm điểm tổng quan (1-5 sao) và điểm thái độ KTV (1-5 sao).",
      "3. Nhập nhận xét văn bản (tuỳ chọn).",
      "4. Chọn đánh giá hiệu quả: rất hiệu quả / hiệu quả / bình thường / chưa hiệu quả.",
      "5. Xác nhận có muốn quay lại không.",
    ],
    "Điều kiện sau": ["Đánh giá lưu vào hệ thống, chờ Admin duyệt để hiển thị công khai."],
    "Biến thể": ["Không đánh giá: Hệ thống nhắc nhở 1 lần, sau đó bỏ qua."],
  }),

  ...ucSection("3.5.16", "UC08", "ghi nhật ký buổi trị liệu (KTV)", {
    "Mã Use Case": ["UC08"],
    "Tên": ["Ghi Nhật ký Buổi trị liệu (SOAP Notes)"],
    "Mục đích": ["Cho phép KTV ghi chép chi tiết diễn biến và kết quả của từng buổi điều trị theo chuẩn SOAP Notes."],
    "Tác nhân": ["Kỹ thuật viên (KTV)"],
    "Mô tả tóm tắt": ["KTV ghi điểm đau trước/sau buổi, SOAP notes đầy đủ; hệ thống AI tóm tắt nội dung thành câu ngắn gọn."],
    "Điều kiện tiên quyết": ["KTV đã đăng nhập. Buổi trị liệu đang ở trạng thái 'dang_thuc_hien'."],
    "Luồng sự kiện chính": [
      "1. KTV truy cập lịch làm việc, chọn buổi trị liệu đang thực hiện.",
      "2. Nhập điểm đau trước buổi (0-10).",
      "3. Ghi SOAP Notes: Subjective (BN khai), Objective (KTV quan sát), Assessment (đánh giá), Plan (kế hoạch).",
      "4. Nhập điểm đau sau buổi (0-10), điểm hiệu quả KTV tự chấm (0-10).",
      "5. Ghi cảnh báo đặc biệt nếu có (chống chỉ định mới phát sinh).",
      "6. Xác nhận hoàn thành – AI tóm tắt SOAP thành câu ngắn gọn, lưu với nhãn ✦ AI.",
    ],
    "Điều kiện sau": ["Nhật ký lưu đầy đủ, tiến trình liệu trình cập nhật số buổi đã dùng."],
    "Biến thể": ["KTV sửa tóm tắt AI: Lưu override, hệ thống log sự kiện vào system_audit_log."],
  }),

  ...ucSection("3.5.17", "UC09", "lượng giá và chẩn đoán (Bác sĩ)", {
    "Mã Use Case": ["UC09"],
    "Tên": ["Lượng giá & Chẩn đoán (Bác sĩ)"],
    "Mục đích": ["Cho phép Bác sĩ ghi chẩn đoán, chống chỉ định và đề xuất gói điều trị phù hợp sau buổi lượng giá."],
    "Tác nhân": ["Bác sĩ"],
    "Mô tả tóm tắt": ["Bác sĩ lượng giá bệnh nhân lần đầu, ghi nhận thông tin lâm sàng và đề xuất liệu trình điều trị."],
    "Điều kiện tiên quyết": ["Bác sĩ đã đăng nhập. Lịch hẹn lượng giá đang ở trạng thái 'da_checkin'."],
    "Luồng sự kiện chính": [
      "1. Bác sĩ truy cập lịch hẹn lượng giá hôm nay.",
      "2. Xem thông tin bệnh nhân, lý do khám.",
      "3. Ghi chẩn đoán y khoa vào trường chan_doan.",
      "4. Ghi chống chỉ định nếu có (loãng xương, máy tạo nhịp, thai kỳ...).",
      "5. Đề xuất gói điều trị combo (khuyen_nghi_goi_id) hoặc dịch vụ lẻ (khuyen_nghi_dich_vu_id).",
      "6. Xác nhận hoàn thành buổi lượng giá.",
    ],
    "Điều kiện sau": ["Chẩn đoán được lưu, Lễ tân và khách hàng thấy gói đề xuất để đăng ký."],
    "Biến thể": ["Bệnh nhân có chống chỉ định tuyệt đối: Không đề xuất liệu trình, ghi rõ lý do."],
  }),

  ...ucSection("3.5.18", "UC10", "xem và sử dụng voucher giảm giá", {
    "Mã Use Case": ["UC10"],
    "Tên": ["Xem và Sử dụng Voucher Giảm giá"],
    "Mục đích": ["Cho phép khách hàng nhập mã voucher khi thanh toán để được hưởng ưu đãi giảm giá."],
    "Tác nhân": ["Khách hàng, Lễ tân"],
    "Mô tả tóm tắt": ["Trong quá trình thanh toán, khách hàng hoặc Lễ tân nhập mã voucher; hệ thống xác thực và tự động tính toán số tiền giảm."],
    "Điều kiện tiên quyết": ["Có hóa đơn chưa thanh toán. Voucher còn hiệu lực."],
    "Luồng sự kiện chính": [
      "1. Tại màn hình thanh toán, nhập mã voucher.",
      "2. Hệ thống kiểm tra: mã tồn tại, còn trong thời hạn, chưa hết lượt, đáp ứng điều kiện tối thiểu.",
      "3. Tính toán số tiền giảm (theo % hoặc tiền mặt cố định, giới hạn giảm tối đa).",
      "4. Hiển thị tổng tiền sau giảm để xác nhận.",
      "5. Xác nhận thanh toán – hệ thống ghi nhận lượt sử dụng voucher.",
    ],
    "Điều kiện sau": ["Voucher được áp dụng, hóa đơn phản ánh đúng số tiền sau giảm."],
    "Biến thể": ["Voucher hết hạn: Thông báo lỗi rõ ràng.", "Không đáp ứng đơn tối thiểu: Thông báo điều kiện áp dụng."],
  }),

  ...ucSection("3.5.19", "UC11", "nhắn tin với nhân viên tư vấn", {
    "Mã Use Case": ["UC11"],
    "Tên": ["Nhắn tin với Nhân viên Tư vấn"],
    "Mục đích": ["Cho phép khách hàng liên hệ trực tiếp với Lễ tân để được hỗ trợ, tư vấn dịch vụ hoặc giải đáp thắc mắc."],
    "Tác nhân": ["Khách hàng, Lễ tân"],
    "Mô tả tóm tắt": ["Khách hàng gửi tin nhắn qua giao diện chat tích hợp; Lễ tân nhận thông báo và phản hồi trong thời gian sớm nhất."],
    "Điều kiện tiên quyết": ["Khách hàng đã đăng nhập."],
    "Luồng sự kiện chính": [
      "1. Khách hàng nhấn nút 'Liên hệ tư vấn' trên website.",
      "2. Mở cửa sổ chat với Lễ tân trực tuyến.",
      "3. Gửi tin nhắn, câu hỏi về dịch vụ, giá hoặc lịch trống.",
      "4. Lễ tân nhận thông báo và phản hồi.",
      "5. Hệ thống lưu lịch sử cuộc hội thoại.",
    ],
    "Điều kiện sau": ["Khách hàng nhận được tư vấn, có thể tiến hành đặt lịch."],
    "Biến thể": ["Ngoài giờ làm việc: Hiển thị thông báo giờ hoạt động, cho phép để lại tin nhắn."],
  }),

  H2("3.6. Đối tượng và phạm vi hệ thống"),
  P("Hệ thống Office Care phục vụ bệnh nhân cần điều trị phục hồi chức năng, đội ngũ nhân viên phòng khám (Lễ tân, KTV, Bác sĩ) và ban quản lý (Admin). Phạm vi hiện tại tập trung vào mô hình đơn chi nhánh, với lộ trình mở rộng đa chi nhánh trong giai đoạn tiếp theo."),
  BREAK(),

  // ══════════════════════════════════════════════════════════════════════
  // PHẦN 4
  // ══════════════════════════════════════════════════════════════════════
  H1("PHẦN 4 – THIẾT KẾ HỆ THỐNG"),
  H2("4.1. Mô hình triển khai"),
  P("Hệ thống được triển khai theo kiến trúc Client-Server tách biệt hoàn toàn, tối ưu hóa hiệu năng và khả năng mở rộng:"),
  PBULLET("Frontend (React SPA): Chạy trên trình duyệt, giao tiếp với Backend thông qua REST API qua HTTPS."),
  PBULLET("Backend (Node.js REST API): Xử lý toàn bộ logic nghiệp vụ, xác thực JWT và truy vấn PostgreSQL."),
  PBULLET("Database (PostgreSQL): Lưu trữ dữ liệu với ràng buộc toàn vẹn tầng DB và cơ chế soft-delete."),
  PBULLET("Email Service: Gửi OTP xác thực và thông báo lịch hẹn tự động."),

  H2("4.2. Công nghệ sử dụng"),
  PB("Frontend:"),
  new Table({
    rows: [
      new TableRow({ tableHeader: true, children: [hCell("Công nghệ", 2800), hCell("Vai trò trong dự án", 6000)] }),
      ...[
        ["React + Vite", "Framework JavaScript xây dựng SPA tốc độ cao, hot-reload nhanh khi phát triển"],
        ["Tailwind CSS", "CSS utility-first – thiết kế responsive, không cần CSS Modules riêng lẻ"],
        ["Zustand", "Quản lý global state gọn nhẹ: authStore (JWT), bookingStore (lịch hẹn)"],
        ["React Router v6", "Định tuyến và bảo vệ route theo vai trò (ProtectedRoute component)"],
        ["Axios", "HTTP client với Interceptors tự động đính kèm JWT vào mỗi request"],
        ["Zod", "Validate schema dữ liệu form tại phía Client trước khi gửi API"],
      ].map(([t, d], i) => new TableRow({ children: [dCell(t, i%2!==0, true), dCell(d, i%2!==0)] })),
    ],
    width: { size: 8800, type: WidthType.DXA },
  }),
  PNORM(),
  PB("Backend:"),
  new Table({
    rows: [
      new TableRow({ tableHeader: true, children: [hCell("Công nghệ", 2800), hCell("Vai trò trong dự án", 6000)] }),
      ...[
        ["Node.js + TypeScript", "Runtime server với type safety tuyệt đối, codebase dễ bảo trì"],
        ["Express.js", "REST API Framework – 3 lớp: Routes → Controllers → Services → Repositories"],
        ["PostgreSQL", "CSDL quan hệ chính – Raw SQL với Connection Pool, không dùng ORM"],
        ["pg (node-postgres)", "Driver PostgreSQL hiệu năng cao, hỗ trợ Connection Pool và Prepared Statements"],
        ["JWT + OTP Email", "Xác thực: Access Token 15 phút + Refresh Token 7 ngày; OTP 6 số qua email"],
        ["Zod", "Validation Middleware kiểm tra toàn bộ dữ liệu đầu vào trước khi vào Controller"],
      ].map(([t, d], i) => new TableRow({ children: [dCell(t, i%2!==0, true), dCell(d, i%2!==0)] })),
    ],
    width: { size: 8800, type: WidthType.DXA },
  }),
  PNORM(),

  H2("4.3. Phác thảo giao diện website"),
  PNORM("[Hình 4.3.1 – Trang chủ / Landing Page]"),
  PNORM("[Hình 4.3.2 – Trang Dịch vụ và Gói điều trị]"),
  PNORM("[Hình 4.3.3 – Trang Đặt lịch]"),
  PNORM("[Hình 4.3.4 – Trang Đăng nhập OTP]"),
  PNORM("[Hình 4.3.5 – Dashboard Lễ tân]"),
  PNORM("[Hình 4.3.6 – Dashboard KTV – Lịch làm việc & SOAP Notes]"),
  PNORM("[Hình 4.3.7 – Dashboard Admin – Thống kê doanh thu]"),
  BREAK(),

  // ══════════════════════════════════════════════════════════════════════
  // PHẦN 5
  // ══════════════════════════════════════════════════════════════════════
  H1("PHẦN 5 – THỰC HIỆN DỰ ÁN"),
  H2("5.1. Thiết kế Cơ sở dữ liệu"),
  H3("5.1.1 Sơ đồ ERD"),
  P("Hệ thống Office Care sử dụng PostgreSQL với 25 bảng, chia thành 6 phân hệ chức năng: (1) Người dùng & Phân quyền, (2) Danh mục Dịch vụ & Thiết bị, (3) Lịch hẹn & Lịch trực, (4) Gói dịch vụ & Liệu trình, (5) Hóa đơn & Thanh toán, (6) Bảng phụ trợ & Audit."),
  PNORM("[Hình 5.1.1 – Sơ đồ ERD toàn hệ thống Office Care]"),
  PNORM(),

  H3("5.1.2 Cơ sở dữ liệu"),
  P("Dưới đây là đặc tả chi tiết 25 bảng (từ 5.1.2 đến 5.1.26) của hệ thống:"),
  PNORM(),

  // ── 5.1.2 vai_tro ──────────────────────────────────────────────────────
  ...dbSection("5.1.2", "vai_tro", "Quản lý vai trò hệ thống", [
    { name: "id", type: "smallserial (PK)", desc: "Mã định danh vai trò, tự tăng (1→5)" },
    { name: "ma_vai_tro", type: "varchar(20) UNIQUE", desc: "Mã vai trò: 'khach_hang' | 'le_tan' | 'ky_thuat_vien' | 'bac_si' | 'admin'" },
    { name: "ten_hien_thi", type: "varchar(50)", desc: "Tên hiển thị: 'Khách hàng', 'Lễ tân', 'Kỹ thuật viên', 'Bác sĩ', 'Quản trị viên'" },
    { name: "mo_ta_quyen", type: "text", desc: "Mô tả chi tiết quyền hạn và chức năng của vai trò này" },
  ]),

  // ── 5.1.3 nguoi_dung ───────────────────────────────────────────────────
  ...dbSection("5.1.3", "nguoi_dung", "Quản lý tài khoản người dùng", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất, DEFAULT gen_random_uuid()" },
    { name: "ho_ten", type: "varchar(150) NOT NULL", desc: "Họ và tên đầy đủ của người dùng" },
    { name: "email", type: "varchar(255) UNIQUE NOT NULL", desc: "Địa chỉ email, dùng để đăng nhập và nhận OTP" },
    { name: "so_dien_thoai", type: "varchar(20)", desc: "Số điện thoại liên lạc của người dùng" },
    { name: "mat_khau_hash", type: "varchar(255) NOT NULL", desc: "Mật khẩu sau khi hash bằng bcrypt" },
    { name: "vai_tro_id", type: "smallint FK → vai_tro(id)", desc: "Vai trò của người dùng trong hệ thống" },
    { name: "trang_thai", type: "varchar(20) DEFAULT 'hoat_dong'", desc: "Trạng thái tài khoản: 'hoat_dong' | 'bi_khoa' | 'tam_nghi'" },
    { name: "da_xac_thuc_email", type: "boolean DEFAULT false", desc: "Email đã được xác thực OTP hay chưa" },
    { name: "avatar_url", type: "text", desc: "URL ảnh đại diện của người dùng" },
    { name: "thoi_gian_tao", type: "timestamp DEFAULT now()", desc: "Thời điểm tạo tài khoản" },
    { name: "lan_dang_nhap_cuoi", type: "timestamp", desc: "Thời điểm đăng nhập gần nhất" },
    { name: "deleted_at", type: "timestamp", desc: "Soft delete – NULL = chưa xóa; có giá trị = đã xóa mềm" },
  ]),

  // ── 5.1.4 khach_hang ───────────────────────────────────────────────────
  ...dbSection("5.1.4", "khach_hang", "Hồ sơ thông tin Khách hàng", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất hồ sơ khách hàng" },
    { name: "nguoi_dung_id", type: "uuid FK → nguoi_dung(id)", desc: "Liên kết 1-1 với tài khoản người dùng" },
    { name: "ngay_sinh", type: "date", desc: "Ngày sinh của khách hàng (dùng để tính tuổi)" },
    { name: "gioi_tinh", type: "varchar(10)", desc: "Giới tính: 'nam' | 'nu' | 'khac'" },
    { name: "dia_chi", type: "text", desc: "Địa chỉ thường trú đầy đủ" },
    { name: "so_cccd", type: "varchar(20)", desc: "Số CCCD – bắt buộc nhập khi check-in buổi đầu gói dùng thử" },
    { name: "hang_khach_hang", type: "varchar(20) DEFAULT 'thuong'", desc: "Hạng thành viên: 'thuong' | 'bac' | 'vang' | 'kim_cuong'" },
    { name: "preferred_ktv_id", type: "uuid FK → chuyen_gia_y_te(id)", desc: "KTV ưa thích của khách hàng (hệ thống ưu tiên phân công)" },
    { name: "thoi_gian_tao", type: "timestamp DEFAULT now()", desc: "Thời điểm tạo hồ sơ khách hàng" },
    { name: "deleted_at", type: "timestamp", desc: "Soft delete hồ sơ khách hàng" },
  ]),

  // ── 5.1.5 chuyen_gia_y_te ──────────────────────────────────────────────
  ...dbSection("5.1.5", "chuyen_gia_y_te", "Hồ sơ Chuyên gia Y tế – Bác sĩ & KTV", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất hồ sơ chuyên gia" },
    { name: "nguoi_dung_id", type: "uuid FK → nguoi_dung(id)", desc: "Liên kết với tài khoản đăng nhập của chuyên gia" },
    { name: "ma_nhan_vien", type: "varchar(20) NOT NULL", desc: "Mã nhân viên nội bộ (VD: KTV001, BS001)" },
    { name: "chuyen_mon_chinh", type: "varchar(200) NOT NULL", desc: "Chuyên môn chính (VD: Vật lý trị liệu cột sống, Phục hồi chức năng chi trên)" },
    { name: "so_nam_kinh_nghiem", type: "integer", desc: "Số năm kinh nghiệm hành nghề" },
    { name: "chung_chi", type: "text", desc: "Danh sách chứng chỉ chuyên môn đã đạt được" },
    { name: "mo_ta_ban_than", type: "text", desc: "Giới thiệu bản thân, hiển thị trên trang profile website" },
    { name: "anh_dai_dien_url", type: "text", desc: "URL ảnh đại diện chuyên nghiệp" },
    { name: "trang_thai", type: "varchar(20) DEFAULT 'hoat_dong'", desc: "Trạng thái: 'hoat_dong' | 'nghi_phep' | 'tam_nghi'" },
    { name: "ngay_vao_lam", type: "date", desc: "Ngày bắt đầu làm việc chính thức tại phòng khám" },
  ]),

  // ── 5.1.6 danh_muc_dich_vu ─────────────────────────────────────────────
  ...dbSection("5.1.6", "danh_muc_dich_vu", "Danh mục phân loại Dịch vụ", [
    { name: "id", type: "bigserial (PK)", desc: "Mã định danh danh mục, tự tăng" },
    { name: "ten_danh_muc", type: "varchar(100) NOT NULL", desc: "Tên danh mục (VD: Trị liệu cột sống, Phục hồi chức năng chi trên)" },
    { name: "mo_ta", type: "text", desc: "Mô tả chi tiết về nhóm dịch vụ trong danh mục" },
    { name: "thu_tu_hien_thi", type: "integer DEFAULT 0", desc: "Thứ tự sắp xếp hiển thị trên website (số nhỏ hiển thị trước)" },
    { name: "an_hien", type: "boolean DEFAULT true", desc: "Trạng thái hiển thị: true = đang hiển thị, false = đã ẩn" },
  ]),

  // ── 5.1.7 dich_vu ──────────────────────────────────────────────────────
  ...dbSection("5.1.7", "dich_vu", "Quản lý Dịch vụ VLT", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất dịch vụ" },
    { name: "danh_muc_id", type: "bigint FK → danh_muc_dich_vu(id)", desc: "Danh mục phân loại dịch vụ này" },
    { name: "ten_dich_vu", type: "varchar(200) NOT NULL", desc: "Tên dịch vụ đầy đủ (VD: Trị liệu Shockwave vai gáy)" },
    { name: "mo_ta_ngan", type: "varchar(500)", desc: "Mô tả ngắn (hiển thị trên thẻ dịch vụ danh sách)" },
    { name: "mo_ta_chi_tiet", type: "text", desc: "Mô tả đầy đủ về quy trình, lợi ích và đối tượng phù hợp" },
    { name: "thoi_luong_phut", type: "integer NOT NULL", desc: "Thời lượng thực hiện dịch vụ tính bằng phút" },
    { name: "don_gia", type: "bigint NOT NULL", desc: "Đơn giá dịch vụ, đơn vị VNĐ" },
    { name: "hinh_anh_url", type: "text", desc: "URL hình ảnh minh họa dịch vụ" },
    { name: "trang_thai", type: "varchar(20) DEFAULT 'hoat_dong'", desc: "Trạng thái: 'hoat_dong' | 'an' | 'ngung_cung_cap'" },
    { name: "thu_tu_hien_thi", type: "integer DEFAULT 0", desc: "Thứ tự ưu tiên hiển thị trong danh mục" },
    { name: "thiet_bi_yeu_cau", type: "varchar(100)", desc: "Loại thiết bị y tế cần để thực hiện (VD: shockwave, tens, laser_class4)" },
  ]),

  // ── 5.1.8 phong ────────────────────────────────────────────────────────
  ...dbSection("5.1.8", "phong", "Quản lý Phòng điều trị", [
    { name: "id", type: "bigserial (PK)", desc: "Mã định danh phòng, tự tăng" },
    { name: "ten_phong", type: "varchar(100) NOT NULL", desc: "Tên phòng điều trị (VD: Phòng Shockwave 1, Phòng Điện xung)" },
    { name: "ma_phong", type: "varchar(20) NOT NULL", desc: "Mã phòng ngắn gọn (VD: P101, P201, P301)" },
    { name: "loai_phong", type: "varchar(100)", desc: "Loại phòng theo chức năng chuyên biệt" },
    { name: "loai_dich_vu_ho_tro", type: "jsonb", desc: "Mảng JSON chứa ID các dịch vụ mà phòng có thể hỗ trợ" },
    { name: "thiet_bi", type: "jsonb", desc: "Mảng JSON chứa danh sách thiết bị y tế đang đặt trong phòng" },
    { name: "mo_ta", type: "text", desc: "Mô tả chi tiết về phòng điều trị" },
    { name: "trang_thai", type: "varchar(20) DEFAULT 'san_sang'", desc: "Trạng thái: 'san_sang' | 'dang_su_dung' | 'bao_tri'" },
    { name: "tang", type: "varchar(20)", desc: "Số tầng trong tòa nhà (VD: Tầng 1, Tầng 2)" },
  ]),

  // ── 5.1.9 thiet_bi_y_te ────────────────────────────────────────────────
  ...dbSection("5.1.9", "thiet_bi_y_te", "Quản lý Thiết bị Y tế", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất thiết bị y tế" },
    { name: "ma_thiet_bi", type: "varchar(20) UNIQUE NOT NULL", desc: "Mã thiết bị nội bộ (VD: SW001 – Shockwave 1, TENS002)" },
    { name: "ten_thiet_bi", type: "varchar(100) NOT NULL", desc: "Tên đầy đủ của thiết bị y tế" },
    { name: "loai_thiet_bi", type: "varchar(100)", desc: "Loại thiết bị: 'shockwave' | 'tens' | 'laser_class4' | 'ultrasound'" },
    { name: "ngay_mua", type: "date", desc: "Ngày mua và đưa vào sử dụng" },
    { name: "ngay_bao_tri_tiep_theo", type: "date", desc: "Ngày bảo trì định kỳ tiếp theo" },
    { name: "trang_thai", type: "varchar(20) DEFAULT 'san_sang'", desc: "Trạng thái: 'san_sang' | 'dang_su_dung' | 'bao_tri' | 'hong'" },
    { name: "phong_id_hien_tai", type: "bigint FK → phong(id)", desc: "Phòng hiện tại đang đặt thiết bị" },
    { name: "ghi_chu", type: "text", desc: "Ghi chú về bảo dưỡng, sự cố và lịch sử sửa chữa" },
    { name: "thoi_gian_tao", type: "timestamp DEFAULT now()", desc: "Thời điểm nhập thiết bị vào hệ thống" },
  ]),

  // ── 5.1.10 lich_dat ────────────────────────────────────────────────────
  ...dbSection("5.1.10", "lich_dat", "Quản lý Lịch hẹn – Tâm điểm điều phối", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất lịch hẹn" },
    { name: "ma_lich_dat", type: "varchar(20) NOT NULL", desc: "Mã lịch hẹn hiển thị (VD: LD20250528001)" },
    { name: "khach_hang_id", type: "uuid FK → khach_hang(id)", desc: "Khách hàng đặt lịch (NULL nếu khách vãng lai)" },
    { name: "ho_ten_khach", type: "varchar(150)", desc: "Tên khách cho trường hợp đặt hộ hoặc khách vãng lai" },
    { name: "so_dien_thoai", type: "varchar(20)", desc: "SĐT liên lạc khi cần xác nhận hoặc thay đổi" },
    { name: "gioi_tinh_khach", type: "varchar(10)", desc: "Giới tính: 'nam' | 'nu' | 'khac'" },
    { name: "dich_vu_id", type: "uuid FK → dich_vu(id)", desc: "Dịch vụ được đặt trong lịch hẹn này" },
    { name: "ky_thuat_vien_id", type: "uuid FK → chuyen_gia_y_te(id)", desc: "KTV hoặc Bác sĩ được phân công thực hiện" },
    { name: "phong_id", type: "bigint FK → phong(id)", desc: "Phòng điều trị được phân công cho lịch hẹn" },
    { name: "ngay_gio_bat_dau", type: "timestamp NOT NULL", desc: "Thời điểm bắt đầu lịch hẹn" },
    { name: "ngay_gio_ket_thuc", type: "timestamp NOT NULL", desc: "Thời điểm kết thúc dự kiến (= bắt đầu + thời lượng dịch vụ)" },
    { name: "ly_do_kham", type: "text", desc: "Lý do đến khám, mô tả vấn đề sức khỏe của bệnh nhân" },
    { name: "trang_thai", type: "varchar(30) DEFAULT 'cho_xac_nhan'", desc: "Trạng thái: 'cho_xac_nhan' | 'da_xac_nhan' | 'da_checkin' | 'hoan_thanh' | 'da_huy'" },
    { name: "chan_doan", type: "text [Lâm sàng]", desc: "Bác sĩ ghi nhận chẩn đoán y khoa sau buổi lượng giá" },
    { name: "chong_chi_dinh", type: "text [Lâm sàng]", desc: "Chống chỉ định y khoa (VD: loãng xương nặng, có máy tạo nhịp tim)" },
    { name: "khuyen_nghi_dich_vu_id", type: "uuid FK → dich_vu(id)", desc: "Dịch vụ lẻ mà Bác sĩ đề xuất sau lượng giá" },
    { name: "khuyen_nghi_goi_id", type: "uuid FK → goi_dich_vu(id)", desc: "Gói điều trị combo Bác sĩ đề xuất cho bệnh nhân" },
    { name: "nguoi_tao", type: "varchar(20) DEFAULT 'khach_hang'", desc: "Nguồn tạo lịch: 'khach_hang' | 'le_tan'" },
    { name: "thoi_gian_tao", type: "timestamp DEFAULT now()", desc: "Thời điểm tạo lịch hẹn trong hệ thống" },
  ]),

  // ── 5.1.11 lich_lam_viec ───────────────────────────────────────────────
  ...dbSection("5.1.11", "lich_lam_viec", "Lịch làm việc – Ca trực Nhân viên", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất ca làm việc" },
    { name: "nguoi_dung_id", type: "uuid FK → nguoi_dung(id)", desc: "Nhân viên (Bác sĩ hoặc KTV) đăng ký ca trực" },
    { name: "ngay", type: "date NOT NULL", desc: "Ngày làm việc của ca trực" },
    { name: "gio_bat_dau", type: "time NOT NULL", desc: "Giờ bắt đầu ca trực (VD: 07:30)" },
    { name: "gio_ket_thuc", type: "time NOT NULL", desc: "Giờ kết thúc ca trực (VD: 17:00)" },
    { name: "trang_thai", type: "varchar(20) DEFAULT 'hoat_dong'", desc: "Trạng thái ca: 'hoat_dong' | 'da_huy' | 'nghi_phep'" },
  ]),

  // ── 5.1.12 goi_dich_vu ─────────────────────────────────────────────────
  ...dbSection("5.1.12", "goi_dich_vu", "Quản lý Gói Dịch vụ Combo", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất gói dịch vụ" },
    { name: "ten_goi", type: "varchar(200) NOT NULL", desc: "Tên gói (VD: Combo Trị liệu Vai Gáy 10 Buổi – Shockwave + Điện xung)" },
    { name: "ma_goi", type: "varchar(30) UNIQUE NOT NULL", desc: "Mã gói ngắn gọn (VD: PKG-VG10, PKG-CS5)" },
    { name: "mo_ta", type: "text", desc: "Mô tả đầy đủ về lợi ích và quy trình của gói điều trị" },
    { name: "tong_so_buoi", type: "integer NOT NULL", desc: "Tổng số buổi điều trị định mức của gói" },
    { name: "gia_goi", type: "bigint NOT NULL", desc: "Giá gói ưu đãi (đơn vị VNĐ)" },
    { name: "gia_goc", type: "bigint", desc: "Giá gốc nếu tính từng buổi riêng lẻ (để hiển thị % tiết kiệm)" },
    { name: "han_dung_thang", type: "integer DEFAULT 6", desc: "Thời hạn sử dụng gói từ ngày kích hoạt (đơn vị tháng)" },
    { name: "hien_thi_website", type: "boolean DEFAULT true", desc: "Có hiển thị gói trên website khách hàng không" },
    { name: "trang_thai", type: "varchar(20) DEFAULT 'hoat_dong'", desc: "Trạng thái gói: 'hoat_dong' | 'an' | 'het_han'" },
    { name: "chi_tiet_dich_vu", type: "jsonb DEFAULT '[]'", desc: "Mảng JSON phân bổ số buổi của từng dịch vụ trong gói" },
    { name: "thoi_gian_tao", type: "timestamp DEFAULT now()", desc: "Thời điểm Admin tạo gói" },
  ]),

  // ── 5.1.13 lich_dieu_tri ───────────────────────────────────────────────
  ...dbSection("5.1.13", "lich_dieu_tri", "Tiến trình Điều trị Khách hàng", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất liệu trình điều trị" },
    { name: "khach_hang_id", type: "uuid FK → khach_hang(id)", desc: "Khách hàng đang thực hiện liệu trình" },
    { name: "loai_dieu_tri", type: "varchar(20)", desc: "Loại: 'dich_vu_le' (buổi lẻ) | 'theo_goi' (combo)" },
    { name: "dich_vu_id", type: "uuid FK → dich_vu(id)", desc: "Dịch vụ điều trị (áp dụng khi là dịch vụ lẻ)" },
    { name: "goi_dich_vu_id", type: "uuid FK → goi_dich_vu(id)", desc: "Gói điều trị (áp dụng khi là theo gói)" },
    { name: "tong_so_buoi", type: "integer NOT NULL", desc: "Tổng số buổi cần thực hiện trong liệu trình" },
    { name: "so_buoi_da_dung", type: "integer DEFAULT 0", desc: "Số buổi đã thực hiện (tự cộng sau mỗi buổi hoàn thành)" },
    { name: "trang_thai", type: "varchar(20) DEFAULT 'dang_dieu_tri'", desc: "Trạng thái: 'dang_dieu_tri' | 'hoan_thanh' | 'tam_dung' | 'da_huy'" },
    { name: "thoi_gian_tao", type: "timestamp DEFAULT now()", desc: "Thời điểm bắt đầu liệu trình" },
  ]),

  // ── 5.1.14 buoi_tri_lieu ───────────────────────────────────────────────
  ...dbSection("5.1.14", "buoi_tri_lieu", "Nhật ký Buổi trị liệu – SOAP Notes", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất buổi trị liệu" },
    { name: "lich_dieu_tri_id", type: "uuid FK → lich_dieu_tri(id)", desc: "Liệu trình mà buổi này thuộc về" },
    { name: "khach_hang_id", type: "uuid FK → khach_hang(id)", desc: "Khách hàng tham gia buổi trị liệu" },
    { name: "ky_thuat_vien_id", type: "uuid FK → chuyen_gia_y_te(id)", desc: "KTV thực hiện trực tiếp buổi điều trị" },
    { name: "phong_id", type: "bigint FK → phong(id)", desc: "Phòng điều trị thực hiện buổi" },
    { name: "dich_vu_id", type: "uuid FK → dich_vu(id)", desc: "Dịch vụ VLT thực hiện trong buổi này" },
    { name: "thoi_gian_bat_dau", type: "timestamp NOT NULL", desc: "Thời điểm bắt đầu thực hiện buổi" },
    { name: "thoi_gian_ket_thuc", type: "timestamp", desc: "Thời điểm kết thúc thực tế của buổi" },
    { name: "danh_gia_truoc_buoi", type: "integer (0-10)", desc: "Điểm đau bệnh nhân tự đánh giá TRƯỚC buổi (0 = không đau, 10 = đau nhất)" },
    { name: "danh_gia_sau_buoi", type: "integer (0-10)", desc: "Điểm đau bệnh nhân tự đánh giá SAU buổi" },
    { name: "danh_gia_hieu_qua", type: "integer (0-10)", desc: "KTV chấm điểm hiệu quả tổng thể của buổi điều trị" },
    { name: "so_thu_tu_buoi", type: "integer", desc: "Buổi thứ mấy trong tổng liệu trình (1, 2, 3...)" },
    { name: "trang_thai", type: "varchar(20) DEFAULT 'dang_thuc_hien'", desc: "Trạng thái: 'dang_thuc_hien' | 'hoan_thanh' | 'gian_doan'" },
    { name: "canh_bao_dac_biet", type: "text", desc: "Cảnh báo y khoa quan trọng phát sinh trong buổi (cần Bác sĩ xem xét)" },
    { name: "ai_tom_tat_ngan", type: "varchar(300) [AI]", desc: "Câu tóm tắt SOAP Notes ngắn gọn do AI tự động sinh, hiển thị nhãn ✦ AI" },
    { name: "thoi_gian_ghi_chu", type: "timestamp", desc: "Thời điểm KTV hoàn thành ghi nhật ký buổi" },
  ]),

  // ── 5.1.15 hoa_don ─────────────────────────────────────────────────────
  ...dbSection("5.1.15", "hoa_don", "Quản lý Hóa đơn", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất hóa đơn" },
    { name: "ma_hoa_don", type: "varchar(20) NOT NULL", desc: "Mã hóa đơn hiển thị (VD: HD20250528001)" },
    { name: "khach_hang_id", type: "uuid FK → khach_hang(id)", desc: "Khách hàng được lập hóa đơn" },
    { name: "loai_hoa_don", type: "varchar(20)", desc: "Loại: 'dich_vu_don' | 'goi_dieu_tri' | 'danh_gia'" },
    { name: "lich_dat_id", type: "uuid FK → lich_dat(id)", desc: "Lịch hẹn liên quan (cho hóa đơn dịch vụ đơn lẻ)" },
    { name: "dang_ky_goi_id", type: "uuid", desc: "ID đăng ký gói liên quan (cho hóa đơn gói điều trị)" },
    { name: "tong_tien_truoc_giam", type: "bigint DEFAULT 0", desc: "Tổng tiền trước khi áp dụng giảm giá hoặc voucher" },
    { name: "so_tien_giam", type: "bigint DEFAULT 0", desc: "Số tiền được giảm (voucher + chính sách ưu đãi)" },
    { name: "tong_tien_thanh_toan", type: "bigint NOT NULL", desc: "Tổng tiền cần thanh toán = tong_tien_truoc_giam - so_tien_giam" },
    { name: "da_thanh_toan", type: "bigint DEFAULT 0", desc: "Số tiền đã thu được (hỗ trợ trả góp nhiều lần)" },
    { name: "trang_thai", type: "varchar(30)", desc: "Trạng thái: 'chua_thanh_toan' | 'thanh_toan_mot_phan' | 'da_thanh_toan' | 'da_hoan_tien'" },
    { name: "ghi_chu", type: "text", desc: "Ghi chú nội bộ về hóa đơn (thỏa thuận, ngoại lệ)" },
    { name: "ngay_tao", type: "timestamp DEFAULT now()", desc: "Thời điểm Lễ tân tạo hóa đơn" },
    { name: "ngay_thanh_toan", type: "timestamp", desc: "Thời điểm thanh toán hoàn tất" },
    { name: "thu_boi", type: "uuid", desc: "ID Lễ tân thực hiện thu tiền" },
  ]),

  // ── 5.1.16 thanh_toan ──────────────────────────────────────────────────
  ...dbSection("5.1.16", "thanh_toan", "Quản lý Giao dịch Thanh toán", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất giao dịch" },
    { name: "ma_giao_dich", type: "varchar(50) NOT NULL", desc: "Mã giao dịch (tự sinh hoặc từ cổng thanh toán VNPay/MoMo)" },
    { name: "hoa_don_id", type: "uuid FK → hoa_don(id)", desc: "Hóa đơn mà giao dịch này thanh toán cho" },
    { name: "so_tien", type: "bigint NOT NULL", desc: "Số tiền của giao dịch này (VNĐ) – hỗ trợ trả góp nhiều đợt" },
    { name: "phuong_thuc", type: "varchar(20)", desc: "Phương thức: 'tien_mat' | 'chuyen_khoan' | 'the' | 'momo' | 'vnpay'" },
    { name: "trang_thai", type: "varchar(20) DEFAULT 'cho_xu_ly'", desc: "Trạng thái: 'cho_xu_ly' | 'thanh_cong' | 'that_bai' | 'da_hoan_tien'" },
    { name: "ma_tham_chieu", type: "varchar(100)", desc: "Mã tham chiếu từ ngân hàng hoặc cổng thanh toán (để đối soát)" },
    { name: "nguoi_thu_tien_id", type: "uuid", desc: "ID Lễ tân hoặc hệ thống xử lý giao dịch" },
    { name: "thoi_gian_giao_dich", type: "timestamp DEFAULT now()", desc: "Thời điểm thực hiện giao dịch" },
    { name: "ghi_chu", type: "text", desc: "Ghi chú (lỗi giao dịch, lý do hoàn tiền, điều chỉnh)" },
  ]),

  // ── 5.1.17 voucher ─────────────────────────────────────────────────────
  ...dbSection("5.1.17", "voucher", "Quản lý Voucher Giảm giá", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất voucher" },
    { name: "ma_voucher", type: "varchar(50) NOT NULL", desc: "Mã voucher mà khách hàng nhập khi thanh toán (VD: SUMMER25, NEWCUS50K)" },
    { name: "ten_chien_dich", type: "varchar(200)", desc: "Tên chiến dịch marketing liên quan đến voucher này" },
    { name: "loai_giam", type: "varchar(20)", desc: "Loại giảm: 'phan_tram' (%) | 'tien_mat' (VNĐ cố định)" },
    { name: "gia_tri_giam", type: "bigint NOT NULL", desc: "Giá trị giảm: số % hoặc số VNĐ tùy theo loai_giam" },
    { name: "giam_toi_da", type: "bigint", desc: "Số tiền giảm tối đa (áp dụng khi loại giảm là phan_tram)" },
    { name: "don_hang_toi_thieu", type: "bigint DEFAULT 0", desc: "Giá trị hóa đơn tối thiểu để có thể áp dụng voucher" },
    { name: "ap_dung_cho", type: "varchar(30) DEFAULT 'tat_ca'", desc: "Phạm vi áp dụng: 'tat_ca' | 'dich_vu_le' | 'goi_dieu_tri'" },
    { name: "so_luong_toi_da", type: "integer", desc: "Tổng số lượt sử dụng tối đa của voucher (NULL = không giới hạn)" },
    { name: "so_luong_da_dung", type: "integer DEFAULT 0", desc: "Số lượt đã được sử dụng thực tế" },
    { name: "ngay_bat_dau", type: "date NOT NULL", desc: "Ngày voucher bắt đầu có hiệu lực" },
    { name: "ngay_het_han", type: "date", desc: "Ngày voucher hết hạn (NULL = không có ngày hết hạn)" },
    { name: "tao_boi", type: "uuid FK → nguoi_dung(id)", desc: "Admin tạo voucher này" },
    { name: "trang_thai", type: "varchar(20) DEFAULT 'hoat_dong'", desc: "Trạng thái: 'hoat_dong' | 'tam_dung' | 'het_han'" },
    { name: "thoi_gian_tao", type: "timestamp DEFAULT now()", desc: "Thời điểm Admin tạo voucher" },
  ]),

  // ── 5.1.18 danh_gia_dich_vu ────────────────────────────────────────────
  ...dbSection("5.1.18", "danh_gia_dich_vu", "Đánh giá Dịch vụ sau Buổi trị liệu", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất đánh giá" },
    { name: "buoi_tri_lieu_id", type: "uuid FK → buoi_tri_lieu(id)", desc: "Buổi trị liệu được đánh giá" },
    { name: "khach_hang_id", type: "uuid FK → khach_hang(id)", desc: "Khách hàng thực hiện đánh giá" },
    { name: "ky_thuat_vien_id", type: "uuid FK → chuyen_gia_y_te(id)", desc: "KTV được đánh giá trong buổi trị liệu" },
    { name: "so_sao_tong", type: "integer NOT NULL (1-5)", desc: "Điểm đánh giá tổng quan về buổi trị liệu (1-5 sao)" },
    { name: "so_sao_ktv", type: "integer (1-5)", desc: "Điểm đánh giá thái độ và kỹ năng của KTV (1-5 sao)" },
    { name: "nhan_xet", type: "text", desc: "Nhận xét văn bản của khách hàng (tuỳ chọn)" },
    { name: "hieu_qua_dieu_tri", type: "varchar(30)", desc: "Đánh giá hiệu quả: 'rat_hieu_qua' | 'hieu_qua' | 'binh_thuong' | 'chua_hieu_qua'" },
    { name: "se_quay_lai", type: "boolean", desc: "Khách hàng có ý định quay lại điều trị hay không" },
    { name: "hien_thi_cong_khai", type: "boolean DEFAULT false", desc: "Admin đã duyệt để hiển thị đánh giá trên website chưa" },
    { name: "thoi_gian_danh_gia", type: "timestamp DEFAULT now()", desc: "Thời điểm khách hàng gửi đánh giá" },
  ]),

  // ── 5.1.19 goi_dich_vu_chi_tiet ────────────────────────────────────────
  ...dbSection("5.1.19", "goi_dich_vu_chi_tiet", "Chi tiết Dịch vụ trong Gói – Phân bổ buổi", [
    { name: "id", type: "serial (PK)", desc: "Mã định danh dòng chi tiết, tự tăng" },
    { name: "goi_dich_vu_id", type: "uuid FK → goi_dich_vu(id) CASCADE", desc: "Gói dịch vụ mà dòng này thuộc về; xóa gói thì xóa theo" },
    { name: "dich_vu_id", type: "uuid FK → dich_vu(id)", desc: "Dịch vụ được phân bổ trong gói" },
    { name: "so_buoi_trong_goi", type: "integer DEFAULT 1", desc: "Số buổi của dịch vụ này được phân bổ trong toàn bộ gói" },
    { name: "so_lan_toi_da_trong_goi", type: "integer DEFAULT 10", desc: "Số lần tối đa có thể thực hiện dịch vụ này trong một buổi điều trị" },
    { name: "bat_buoc", type: "boolean DEFAULT false", desc: "Dịch vụ có bắt buộc thực hiện trong mỗi buổi không" },
    { name: "thu_tu_thuc_hien", type: "integer DEFAULT 0", desc: "Thứ tự khuyến nghị thực hiện dịch vụ trong buổi (số nhỏ thực hiện trước)" },
  ]),

  // ── 5.1.20 buoi_dich_vu_su_dung ────────────────────────────────────────
  ...dbSection("5.1.20", "buoi_dich_vu_su_dung", "Dịch vụ đã sử dụng trong Buổi trị liệu", [
    { name: "id", type: "serial (PK)", desc: "Mã định danh bản ghi, tự tăng" },
    { name: "buoi_tri_lieu_id", type: "uuid FK → buoi_tri_lieu(id) CASCADE", desc: "Buổi trị liệu mà dịch vụ được sử dụng; xóa buổi thì xóa theo" },
    { name: "dich_vu_id", type: "uuid FK → dich_vu(id)", desc: "Dịch vụ VLT đã được thực hiện trong buổi" },
    { name: "so_lan_thuc_te", type: "integer DEFAULT 1", desc: "Số lần dịch vụ này được thực hiện thực tế trong buổi" },
    { name: "ghi_chu_ly_do", type: "text", desc: "Lý do điều chỉnh (nếu khác so với kế hoạch trong gói)" },
    { name: "ktv_id", type: "uuid FK → nguoi_dung(id)", desc: "KTV thực hiện dịch vụ (có thể khác KTV chính của buổi)" },
    { name: "trang_thai", type: "varchar(20) DEFAULT 'da_duyet'", desc: "Trạng thái duyệt: 'cho_duyet' | 'da_duyet' | 'tu_choi'" },
    { name: "tao_luc", type: "timestamptz DEFAULT now()", desc: "Thời điểm ghi nhận dịch vụ sử dụng" },
    { name: "duyet_boi", type: "uuid FK → nguoi_dung(id)", desc: "Người duyệt bản ghi sử dụng dịch vụ (Bác sĩ hoặc Admin)" },
    { name: "duyet_luc", type: "timestamptz", desc: "Thời điểm duyệt bản ghi" },
  ]),

  // ── 5.1.21 buoi_tri_lieu_dich_vu ───────────────────────────────────────
  ...dbSection("5.1.21", "buoi_tri_lieu_dich_vu", "Danh sách Dịch vụ kế hoạch trong Buổi trị liệu", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất bản ghi kế hoạch dịch vụ" },
    { name: "buoi_tri_lieu_id", type: "uuid FK → buoi_tri_lieu(id) CASCADE", desc: "Buổi trị liệu liên quan; xóa buổi thì xóa theo" },
    { name: "dich_vu_id", type: "uuid FK → dich_vu(id) CASCADE", desc: "Dịch vụ được lên kế hoạch thực hiện trong buổi" },
    { name: "so_luong", type: "integer DEFAULT 1", desc: "Số lượng lần dịch vụ được kế hoạch thực hiện" },
    { name: "thoi_gian_thuc_hien", type: "timestamp DEFAULT now()", desc: "Thời điểm dịch vụ được thêm vào kế hoạch buổi" },
  ]),

  // ── 5.1.22 voucher_dich_vu ─────────────────────────────────────────────
  ...dbSection("5.1.22", "voucher_dich_vu", "Voucher áp dụng cho Dịch vụ cụ thể", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất bản ghi liên kết voucher-dịch vụ" },
    { name: "voucher_id", type: "uuid FK → voucher(id) CASCADE", desc: "Voucher áp dụng; xóa voucher thì xóa liên kết theo" },
    { name: "dich_vu_id", type: "uuid FK → dich_vu(id) CASCADE", desc: "Dịch vụ được áp dụng voucher; xóa dịch vụ thì xóa liên kết theo" },
    { name: "[UNIQUE]", type: "(voucher_id, dich_vu_id)", desc: "Ràng buộc: mỗi cặp voucher–dịch vụ chỉ xuất hiện một lần" },
  ]),

  // ── 5.1.23 voucher_goi_dich_vu ─────────────────────────────────────────
  ...dbSection("5.1.23", "voucher_goi_dich_vu", "Voucher áp dụng cho Gói Dịch vụ cụ thể", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất bản ghi liên kết voucher-gói" },
    { name: "voucher_id", type: "uuid FK → voucher(id) CASCADE", desc: "Voucher áp dụng; xóa voucher thì xóa liên kết theo" },
    { name: "goi_dich_vu_id", type: "uuid FK → goi_dich_vu(id) CASCADE", desc: "Gói dịch vụ được áp dụng voucher; xóa gói thì xóa liên kết theo" },
    { name: "[UNIQUE]", type: "(voucher_id, goi_dich_vu_id)", desc: "Ràng buộc: mỗi cặp voucher–gói dịch vụ chỉ xuất hiện một lần" },
  ]),

  // ── 5.1.24 thong_bao ───────────────────────────────────────────────────
  ...dbSection("5.1.24", "thong_bao", "Thông báo hệ thống", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất thông báo" },
    { name: "nguoi_dung_id", type: "uuid FK → nguoi_dung(id) CASCADE", desc: "Người dùng nhận thông báo; xóa tài khoản thì xóa thông báo theo" },
    { name: "tieu_de", type: "varchar(200) NOT NULL", desc: "Tiêu đề ngắn gọn của thông báo" },
    { name: "noi_dung", type: "text NOT NULL", desc: "Nội dung chi tiết của thông báo" },
    { name: "loai", type: "varchar(30) DEFAULT 'he_thong'", desc: "Loại thông báo: 'he_thong' | 'lich_hen' | 'hoa_don' | 'marketing'" },
    { name: "da_doc", type: "boolean DEFAULT false", desc: "Người dùng đã đọc thông báo hay chưa" },
    { name: "thoi_gian_tao", type: "timestamp DEFAULT now()", desc: "Thời điểm hệ thống tạo và gửi thông báo" },
  ]),

  // ── 5.1.25 otp_codes ───────────────────────────────────────────────────
  ...dbSection("5.1.25", "otp_codes", "Mã OTP xác thực Email", [
    { name: "id", type: "uuid (PK)", desc: "Định danh duy nhất bản ghi OTP" },
    { name: "email", type: "varchar(255) NOT NULL", desc: "Địa chỉ email mà mã OTP được gửi tới" },
    { name: "otp", type: "varchar(6) NOT NULL", desc: "Mã OTP 6 chữ số ngẫu nhiên" },
    { name: "expires_at", type: "timestamptz NOT NULL", desc: "Thời điểm hết hạn của mã OTP (thường 5 phút sau khi tạo)" },
    { name: "created_at", type: "timestamptz DEFAULT now()", desc: "Thời điểm hệ thống tạo và gửi OTP qua email" },
  ]),

  // ── 5.1.26 refresh_tokens ──────────────────────────────────────────────
  ...dbSection("5.1.26", "refresh_tokens", "Quản lý Refresh Token – Phiên đăng nhập", [
    { name: "id", type: "serial (PK)", desc: "Mã định danh token, tự tăng" },
    { name: "nguoi_dung_id", type: "uuid FK → nguoi_dung(id)", desc: "Người dùng sở hữu refresh token này" },
    { name: "token", type: "text NOT NULL", desc: "Chuỗi Refresh Token JWT (thường có thời hạn 7 ngày)" },
    { name: "expires_at", type: "timestamp NOT NULL", desc: "Thời điểm Refresh Token hết hạn" },
    { name: "created_at", type: "timestamp DEFAULT now()", desc: "Thời điểm token được tạo (khi người dùng đăng nhập thành công)" },
  ]),

  // ─── Kết thúc 5.1 ─────────────────────────────────────────────────────
  PNORM(),
  new Paragraph({
    children: [TNR("─── Kết thúc Phần 5.1 (5.1.2 – 5.1.26) – Đã mô tả đầy đủ 25 bảng CSDL ───", { bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
  }),
];

// =============================================================================
// BUILD DOCUMENT
// =============================================================================
const doc = new Document({
  // ────────────────────────────────────────────────────────────────
  // Styles khớp hoàn toàn với file mẫu (từ styles.xml)
  // ────────────────────────────────────────────────────────────────
  styles: {
    default: {
      document: {
        run: { font: "Times New Roman", size: 26 },  // sz=26 (13pt) – giống mẫu
        paragraph: { spacing: { after: 160, line: 259, lineRule: "auto" } },
      },
    },
    paragraphStyles: [
      {
        // Heading 1 – khớp styleId="u1": sz=32, bold, spacing before=235
        id: "Heading1", name: "Heading 1",
        basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { bold: true, size: 32, font: "Times New Roman", color: "000000" },
        paragraph: {
          spacing: { before: 235, after: 160, line: 259, lineRule: "auto" },
          outlineLevel: 0,
        },
      },
      {
        // Heading 2 – khớp styleId="u2": sz=28, bold, indent left=360 hanging=360
        id: "Heading2", name: "Heading 2",
        basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { bold: true, size: 28, font: "Times New Roman", color: "000000" },
        paragraph: {
          spacing: { before: 127, after: 100, line: 259, lineRule: "auto" },
          indent: { left: 360, hanging: 360 },
          outlineLevel: 1,
        },
      },
      {
        // Heading 3 – khớp styleId="u3": sz=28, bold, color=4F81BD, indent left=520
        id: "Heading3", name: "Heading 3",
        basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { bold: true, size: 28, font: "Times New Roman", color: "4F81BD" },
        paragraph: {
          spacing: { before: 20, after: 20, line: 240, lineRule: "auto" },
          indent: { left: 520 },
          outlineLevel: 2,
        },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        // Lề chuẩn báo cáo VN: trên/dưới 2.5cm, trái 3.5cm, phải 2cm
        margin: {
          top: 1417,    // 2.5cm = 1417 twips
          bottom: 1134, // 2cm
          left: 1984,   // 3.5cm
          right: 1134,  // 2cm
        },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("d:\\VLTT\\VLTT\\scratch\\BaoCao_OfficeCare.docx", buf);
  console.log("✅ BaoCao_OfficeCare.docx đã tạo xong!");
  console.log("📋 Nội dung:");
  console.log("   ✅ Trang bìa");
  console.log("   ✅ Lời mở đầu, Lời cảm ơn, Thuật ngữ");
  console.log("   ✅ Phần 1 – Giới thiệu đề tài");
  console.log("   ✅ Phần 2 – Khảo sát yêu cầu");
  console.log("   ✅ Phần 3 – Phân tích hiện trạng");
  console.log("      ✅ 19 bảng đặc tả Use Case (3.5.1→3.5.19)");
  console.log("   ✅ Phần 4 – Thiết kế hệ thống");
  console.log("   ✅ Phần 5.1 – CSDL (25 bảng: 5.1.2→5.1.26) – đầy đủ toàn bộ schema");
});
