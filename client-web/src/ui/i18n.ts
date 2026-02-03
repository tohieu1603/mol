// Internationalization - English & Vietnamese
export type Language = "en" | "vi";

export const translations = {
  en: {
    // App
    appName: "OPERIS",
    appTagline: "Client Portal",

    // Navigation
    navMenu: "Menu",
    navChat: "Chat",
    navChatDesc: "Direct gateway chat session for quick interventions.",
    navWorkflow: "Workflows",
    navWorkflowDesc: "Automate tasks with scheduled AI runs.",
    navBilling: "Billing",
    navBillingDesc: "View usage and manage subscription.",
    navLogs: "Logs",
    navLogsDesc: "View system logs and activity.",
    navDocs: "Docs",
    navDocsDesc: "Documentation and guides.",
    navLogin: "Login",
    navLogout: "Logout",

    // Theme
    themeAuto: "Auto",
    themeLight: "Light",
    themeDark: "Dark",

    // Chat
    chatGreeting: "Hello",
    chatSubtitle: "Where should we start?",
    chatPlaceholder: "Ask Operis...",
    chatSend: "Send",
    chatSignIn: "Sign in to send",
    chatDisclaimer: "Operis may make mistakes. Please verify important information.",
    chatSuggestionImage: "Create image",
    chatSuggestionWrite: "Write anything",
    chatSuggestionLearn: "Help me learn",
    chatSuggestionDay: "Power up my day",

    // Workflow
    workflowTitle: "Workflows",
    workflowSubtitle: "Automate tasks with scheduled AI runs",
    workflowNew: "New Workflow",
    workflowRefresh: "Refresh",
    workflowEmpty: "No workflows yet",
    workflowEmptyDesc: "Automate repetitive tasks by creating workflows that run on a schedule.",
    workflowCreate: "Create Workflow",
    workflowLoading: "Loading workflows...",

    // Workflow Form
    wfFormTitle: "New Workflow",
    wfName: "Name",
    wfNamePlaceholder: "Daily Summary",
    wfDescription: "Description",
    wfDescPlaceholder: "What does this workflow do?",
    wfStatus: "Status",
    wfActive: "Active",
    wfPaused: "Paused",
    wfSchedule: "Schedule",
    wfRecurring: "Recurring",
    wfOneTime: "One-time",
    wfCron: "Cron",
    wfRunEvery: "Run every",
    wfRunAt: "Run at",
    wfExpression: "Expression",
    wfTimezone: "Timezone",
    wfExecution: "Execution",
    wfSession: "Session",
    wfSessionMain: "Main Session",
    wfSessionIsolated: "Isolated",
    wfWake: "Wake",
    wfWakeNow: "Immediately",
    wfWakeHeartbeat: "Next Heartbeat",
    wfType: "Type",
    wfTypeAgent: "Agent Turn",
    wfTypeEvent: "System Event",
    wfTimeout: "Timeout",
    wfTimeoutSuffix: "sec",
    wfPostPrefix: "Post to Main Prefix",
    wfMessage: "Message",
    wfEvent: "Event",
    wfMessagePlaceholder: "What should the AI do?",
    wfEventPlaceholder: "Event name to trigger",
    wfDeliver: "Deliver response to chat",
    wfCancel: "Cancel",
    wfCreating: "Creating...",

    // Workflow Card
    wfPause: "Pause",
    wfStart: "Start",
    wfRun: "Run",
    wfDelete: "Delete",
    wfLast: "Last",
    wfNever: "Never",
    wfJustNow: "Just now",

    // Billing
    billingTitle: "Billing",
    billingSubtitle: "View usage and manage subscription",
    billingCurrentPlan: "Current Plan",
    billingUsage: "Usage",
    billingHistory: "Payment History",

    // Logs
    logsTitle: "Logs",
    logsSubtitle: "View system logs and activity",

    // Docs
    docsTitle: "Documentation",
    docsSubtitle: "Guides and references",

    // Login
    loginTitle: "Sign In",
    loginSubtitle: "Access your account",
    loginUsername: "Username",
    loginPassword: "Password",
    loginButton: "Sign In",

    // Common
    required: "*",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    confirm: "Confirm",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
  },

  vi: {
    // App
    appName: "OPERIS",
    appTagline: "Cổng Khách Hàng",

    // Navigation
    navMenu: "Menu",
    navChat: "Trò chuyện",
    navChatDesc: "Phiên chat trực tiếp với gateway.",
    navWorkflow: "Luồng công việc",
    navWorkflowDesc: "Tự động hóa tác vụ theo lịch trình.",
    navBilling: "Thanh toán",
    navBillingDesc: "Xem sử dụng và quản lý gói.",
    navLogs: "Nhật ký",
    navLogsDesc: "Xem nhật ký hệ thống.",
    navDocs: "Tài liệu",
    navDocsDesc: "Hướng dẫn sử dụng.",
    navLogin: "Đăng nhập",
    navLogout: "Đăng xuất",

    // Theme
    themeAuto: "Tự động",
    themeLight: "Sáng",
    themeDark: "Tối",

    // Chat
    chatGreeting: "Xin chào",
    chatSubtitle: "Bắt đầu từ đâu nhỉ?",
    chatPlaceholder: "Hỏi Operis...",
    chatSend: "Gửi",
    chatSignIn: "Đăng nhập để gửi",
    chatDisclaimer: "Operis có thể mắc lỗi. Vui lòng xác minh thông tin quan trọng.",
    chatSuggestionImage: "Tạo hình ảnh",
    chatSuggestionWrite: "Viết gì đó",
    chatSuggestionLearn: "Giúp tôi học",
    chatSuggestionDay: "Lên kế hoạch ngày",

    // Workflow
    workflowTitle: "Luồng Công Việc",
    workflowSubtitle: "Tự động hóa tác vụ với AI theo lịch",
    workflowNew: "Tạo mới",
    workflowRefresh: "Làm mới",
    workflowEmpty: "Chưa có luồng công việc",
    workflowEmptyDesc: "Tự động hóa các tác vụ lặp đi lặp lại bằng cách tạo luồng công việc theo lịch.",
    workflowCreate: "Tạo Workflow",
    workflowLoading: "Đang tải...",

    // Workflow Form
    wfFormTitle: "Workflow Mới",
    wfName: "Tên",
    wfNamePlaceholder: "Báo cáo hàng ngày",
    wfDescription: "Mô tả",
    wfDescPlaceholder: "Workflow này làm gì?",
    wfStatus: "Trạng thái",
    wfActive: "Hoạt động",
    wfPaused: "Tạm dừng",
    wfSchedule: "Lịch trình",
    wfRecurring: "Lặp lại",
    wfOneTime: "Một lần",
    wfCron: "Cron",
    wfRunEvery: "Chạy mỗi",
    wfRunAt: "Chạy lúc",
    wfExpression: "Biểu thức",
    wfTimezone: "Múi giờ",
    wfExecution: "Thực thi",
    wfSession: "Phiên",
    wfSessionMain: "Phiên chính",
    wfSessionIsolated: "Riêng biệt",
    wfWake: "Đánh thức",
    wfWakeNow: "Ngay lập tức",
    wfWakeHeartbeat: "Heartbeat tiếp",
    wfType: "Loại",
    wfTypeAgent: "Agent Turn",
    wfTypeEvent: "System Event",
    wfTimeout: "Timeout",
    wfTimeoutSuffix: "giây",
    wfMessage: "Tin nhắn",
    wfEvent: "Sự kiện",
    wfMessagePlaceholder: "AI nên làm gì?",
    wfEventPlaceholder: "Tên sự kiện cần kích hoạt",
    wfDeliver: "Gửi phản hồi vào chat",
    wfCancel: "Hủy",
    wfCreating: "Đang tạo...",
    wfPostPrefix: "Tiền tố gửi về Main",

    // Workflow Card
    wfPause: "Dừng",
    wfStart: "Chạy",
    wfRun: "Chạy ngay",
    wfDelete: "Xóa",
    wfLast: "Lần cuối",
    wfNever: "Chưa chạy",
    wfJustNow: "Vừa xong",

    // Billing
    billingTitle: "Thanh Toán",
    billingSubtitle: "Xem sử dụng và quản lý gói",
    billingCurrentPlan: "Gói Hiện Tại",
    billingUsage: "Sử Dụng",
    billingHistory: "Lịch Sử Thanh Toán",

    // Logs
    logsTitle: "Nhật Ký",
    logsSubtitle: "Xem nhật ký hệ thống",

    // Docs
    docsTitle: "Tài Liệu",
    docsSubtitle: "Hướng dẫn sử dụng",

    // Login
    loginTitle: "Đăng Nhập",
    loginSubtitle: "Truy cập tài khoản của bạn",
    loginUsername: "Tên đăng nhập",
    loginPassword: "Mật khẩu",
    loginButton: "Đăng Nhập",

    // Common
    required: "*",
    loading: "Đang tải...",
    error: "Lỗi",
    success: "Thành công",
    confirm: "Xác nhận",
    cancel: "Hủy",
    save: "Lưu",
    delete: "Xóa",
    edit: "Sửa",
    close: "Đóng",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang][key] ?? translations.en[key] ?? key;
}

// Get browser language preference
export function getDefaultLanguage(): Language {
  if (typeof navigator === "undefined") return "en";
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("vi")) return "vi";
  return "en";
}
