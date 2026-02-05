/**
 * Swagger Schema Definitions
 * ==========================
 * Định nghĩa tất cả data models cho OpenAPI documentation.
 *
 * File này sử dụng JSDoc annotations với @swagger tag để
 * swagger-jsdoc có thể parse và generate OpenAPI spec.
 *
 * Các schemas được nhóm theo module:
 * - Common: Error, Success, Pagination
 * - Auth: Login, Register, Token responses
 * - User: User model và DTOs
 * - API Key: Key model và responses
 * - Token: Balance, Transaction
 * - Chat: Message, Conversation
 * - Deposit: Order, Pricing
 * - Settings: System config
 * - Cron: Job, Execution
 */

// =============================================================================
// COMMON SCHEMAS
// Các schema dùng chung cho nhiều endpoints
// =============================================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     # =========================================================================
 *     # ERROR RESPONSES
 *     # =========================================================================
 *
 *     Error:
 *       type: object
 *       description: |
 *         **Response lỗi chuẩn của API**
 *
 *         Tất cả errors đều trả về format này để client dễ xử lý.
 *       required:
 *         - error
 *       properties:
 *         error:
 *           type: string
 *           description: Thông báo lỗi cho user (có thể hiển thị trực tiếp)
 *           example: "Email đã được sử dụng"
 *         code:
 *           type: string
 *           description: |
 *             Mã lỗi để programmatic handling.
 *             Dùng code này để switch/case xử lý các loại lỗi khác nhau.
 *           enum:
 *             - VALIDATION_ERROR
 *             - UNAUTHORIZED
 *             - FORBIDDEN
 *             - NOT_FOUND
 *             - CONFLICT
 *             - RATE_LIMITED
 *             - INTERNAL_ERROR
 *           example: "VALIDATION_ERROR"
 *         details:
 *           type: object
 *           description: Chi tiết bổ sung về lỗi (optional)
 *           additionalProperties: true
 *           example:
 *             field: "email"
 *             reason: "invalid_format"
 *
 *     ValidationError:
 *       type: object
 *       description: |
 *         **Lỗi validation khi input không hợp lệ**
 *
 *         Thường trả về HTTP 400 hoặc 422.
 *       properties:
 *         error:
 *           type: string
 *           example: "Validation failed"
 *         code:
 *           type: string
 *           example: "VALIDATION_ERROR"
 *         details:
 *           type: object
 *           properties:
 *             errors:
 *               type: array
 *               items:
 *                 type: string
 *               example:
 *                 - "Email is required"
 *                 - "Password must be at least 8 characters"
 *
 *     # =========================================================================
 *     # SUCCESS RESPONSES
 *     # =========================================================================
 *
 *     SuccessResponse:
 *       type: object
 *       description: Response thành công chung
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Operation completed successfully"
 *
 *     DeleteResponse:
 *       type: object
 *       description: Response sau khi xóa thành công
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         deleted:
 *           type: boolean
 *           example: true
 *
 *     # =========================================================================
 *     # PAGINATION
 *     # =========================================================================
 *
 *     Pagination:
 *       type: object
 *       description: |
 *         **Thông tin phân trang**
 *
 *         Dùng cho các endpoints trả về danh sách.
 *       properties:
 *         page:
 *           type: integer
 *           description: Trang hiện tại (bắt đầu từ 1)
 *           minimum: 1
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Số items mỗi trang
 *           minimum: 1
 *           maximum: 100
 *           example: 20
 *         total:
 *           type: integer
 *           description: Tổng số items
 *           minimum: 0
 *           example: 150
 *         totalPages:
 *           type: integer
 *           description: Tổng số trang
 *           minimum: 0
 *           example: 8
 *
 *     # =========================================================================
 *     # USER SCHEMAS
 *     # =========================================================================
 *
 *     User:
 *       type: object
 *       description: |
 *         **Thông tin người dùng**
 *
 *         Không bao gồm password_hash vì lý do bảo mật.
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID duy nhất của user (UUID v4)
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         email:
 *           type: string
 *           format: email
 *           description: Email đăng nhập (unique trong hệ thống)
 *           example: "user@example.com"
 *         name:
 *           type: string
 *           description: Tên hiển thị
 *           minLength: 2
 *           maxLength: 100
 *           example: "Nguyễn Văn A"
 *         role:
 *           type: string
 *           description: |
 *             Vai trò của user:
 *             - **admin**: Toàn quyền quản trị
 *             - **user**: Quyền hạn thông thường
 *           enum:
 *             - admin
 *             - user
 *           example: "user"
 *         is_active:
 *           type: boolean
 *           description: |
 *             Trạng thái tài khoản:
 *             - **true**: Hoạt động bình thường
 *             - **false**: Bị khóa, không thể đăng nhập
 *           example: true
 *         token_balance:
 *           type: number
 *           format: float
 *           description: Số dư token hiện tại (dùng để trả phí AI)
 *           minimum: 0
 *           example: 1000.50
 *         gateway_url:
 *           type: string
 *           format: uri
 *           nullable: true
 *           description: URL Gateway riêng của user (nếu có)
 *           example: "https://gateway.example.com"
 *         last_active_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Thời điểm hoạt động cuối cùng
 *           example: "2024-01-15T10:30:00Z"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Thời điểm tạo tài khoản
 *           example: "2024-01-01T00:00:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Thời điểm cập nhật cuối
 *           example: "2024-01-15T10:30:00Z"
 *
 *     UserList:
 *       type: object
 *       description: Response danh sách users với pagination
 *       properties:
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *
 *     # =========================================================================
 *     # AUTH SCHEMAS
 *     # =========================================================================
 *
 *     RegisterRequest:
 *       type: object
 *       description: |
 *         **Request đăng ký tài khoản mới**
 *
 *         Tất cả các trường đều bắt buộc.
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email đăng nhập (phải unique)
 *           example: "newuser@example.com"
 *         password:
 *           type: string
 *           format: password
 *           description: |
 *             Mật khẩu (tối thiểu 8 ký tự).
 *             Khuyến nghị: chữ hoa + chữ thường + số + ký tự đặc biệt.
 *           minLength: 8
 *           example: "SecureP@ssw0rd!"
 *         name:
 *           type: string
 *           description: Tên hiển thị (2-100 ký tự)
 *           minLength: 2
 *           maxLength: 100
 *           example: "Nguyễn Văn A"
 *
 *     LoginRequest:
 *       type: object
 *       description: |
 *         **Request đăng nhập**
 *
 *         Trả về JWT tokens nếu thành công.
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email đã đăng ký
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           format: password
 *           description: Mật khẩu
 *           example: "password123"
 *
 *     AuthResponse:
 *       type: object
 *       description: |
 *         **Response sau khi đăng nhập/đăng ký thành công**
 *
 *         Chứa JWT tokens và thông tin user.
 *       properties:
 *         accessToken:
 *           type: string
 *           description: |
 *             JWT access token để gọi API.
 *             **Hết hạn sau 24 giờ.**
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         refreshToken:
 *           type: string
 *           description: |
 *             Refresh token để gia hạn access token.
 *             **Hết hạn sau 7 ngày.**
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *     RefreshRequest:
 *       type: object
 *       description: Request gia hạn access token
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Refresh token từ login response
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     RefreshResponse:
 *       type: object
 *       description: Response sau khi refresh thành công
 *       properties:
 *         accessToken:
 *           type: string
 *           description: Access token mới
 *         refreshToken:
 *           type: string
 *           description: Refresh token mới
 *
 *     # =========================================================================
 *     # API KEY SCHEMAS
 *     # =========================================================================
 *
 *     ApiKey:
 *       type: object
 *       description: |
 *         **Thông tin API Key**
 *
 *         ⚠️ Không bao gồm key đầy đủ vì lý do bảo mật.
 *         Key chỉ hiển thị 1 lần khi tạo.
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID của API key
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: ID của user sở hữu key
 *         key_prefix:
 *           type: string
 *           description: |
 *             Prefix của key để nhận dạng.
 *             Format: `opk_` + 6 ký tự đầu
 *           example: "opk_abc123"
 *         name:
 *           type: string
 *           description: Tên/mô tả key (do user đặt)
 *           example: "Production API Key"
 *         permissions:
 *           type: array
 *           description: |
 *             Danh sách quyền của key:
 *             - **chat**: Gọi Chat API
 *             - **read**: Đọc thông tin
 *             - **write**: Ghi/sửa thông tin
 *           items:
 *             type: string
 *             enum:
 *               - chat
 *               - read
 *               - write
 *           example:
 *             - chat
 *             - read
 *         is_active:
 *           type: boolean
 *           description: Key còn hoạt động không
 *           example: true
 *         last_used_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Lần sử dụng cuối
 *           example: "2024-01-15T10:30:00Z"
 *         expires_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: |
 *             Thời điểm hết hạn.
 *             **null** = không hết hạn (vĩnh viễn)
 *           example: "2025-01-01T00:00:00Z"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Thời điểm tạo
 *           example: "2024-01-01T00:00:00Z"
 *
 *     ApiKeyCreateRequest:
 *       type: object
 *       description: Request tạo API key mới
 *       properties:
 *         name:
 *           type: string
 *           description: Tên/mô tả cho key
 *           example: "My Production Key"
 *         permissions:
 *           type: array
 *           description: Danh sách quyền (default: ['chat'])
 *           items:
 *             type: string
 *           example:
 *             - chat
 *             - read
 *         expires_at:
 *           type: string
 *           format: date-time
 *           description: Thời điểm hết hạn (optional)
 *           example: "2025-12-31T23:59:59Z"
 *
 *     ApiKeyCreateResponse:
 *       type: object
 *       description: |
 *         **Response sau khi tạo API key**
 *
 *         ⚠️ **QUAN TRỌNG:** Trường `key` chỉ hiển thị 1 lần duy nhất!
 *         Hãy copy và lưu lại ngay.
 *       properties:
 *         key:
 *           type: string
 *           description: |
 *             🔑 **API Key đầy đủ**
 *
 *             ⚠️ LƯU LẠI NGAY! Key này sẽ KHÔNG hiển thị lại.
 *           example: "opk_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
 *         apiKey:
 *           $ref: '#/components/schemas/ApiKey'
 *
 *     # =========================================================================
 *     # TOKEN SCHEMAS
 *     # =========================================================================
 *
 *     TokenBalance:
 *       type: object
 *       description: Thông tin số dư token
 *       properties:
 *         balance:
 *           type: number
 *           format: float
 *           description: Số dư token hiện tại
 *           example: 1000.50
 *         currency:
 *           type: string
 *           description: Đơn vị
 *           example: "tokens"
 *
 *     TokenTransaction:
 *       type: object
 *       description: |
 *         **Một giao dịch token**
 *
 *         Ghi lại mọi thay đổi số dư: nạp tiền, sử dụng, điều chỉnh.
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID giao dịch
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: ID user
 *         type:
 *           type: string
 *           description: |
 *             Loại giao dịch:
 *             - **credit**: Cộng token (nạp tiền, admin cộng)
 *             - **debit**: Trừ token (sử dụng AI)
 *             - **adjustment**: Điều chỉnh (admin)
 *           enum:
 *             - credit
 *             - debit
 *             - adjustment
 *           example: "debit"
 *         amount:
 *           type: number
 *           format: float
 *           description: |
 *             Số lượng token thay đổi.
 *             - Số dương: cộng
 *             - Số âm: trừ
 *           example: -50.5
 *         balance_after:
 *           type: number
 *           format: float
 *           description: Số dư sau giao dịch
 *           example: 949.5
 *         description:
 *           type: string
 *           nullable: true
 *           description: Mô tả giao dịch
 *           example: "Chat với Claude - 500 input tokens, 200 output tokens"
 *         reference_id:
 *           type: string
 *           nullable: true
 *           description: ID tham chiếu (deposit_id, chat_id, etc.)
 *           example: "chat_abc123"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Thời điểm giao dịch
 *           example: "2024-01-15T10:30:00Z"
 *
 *     TransactionList:
 *       type: object
 *       description: Danh sách giao dịch với pagination
 *       properties:
 *         transactions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TokenTransaction'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *
 *     # =========================================================================
 *     # CHAT SCHEMAS
 *     # =========================================================================
 *
 *     ChatRequest:
 *       type: object
 *       description: |
 *         **Request gửi tin nhắn chat**
 *
 *         Gửi tin nhắn đến AI và nhận phản hồi.
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           description: Nội dung tin nhắn cần gửi
 *           minLength: 1
 *           maxLength: 100000
 *           example: "Xin chào, bạn có thể giúp tôi viết code Python không?"
 *         conversationId:
 *           type: string
 *           description: |
 *             ID conversation để tiếp tục chat.
 *             Nếu không có, sẽ tạo conversation mới.
 *           example: "conv_abc123def456"
 *         model:
 *           type: string
 *           description: Model AI muốn sử dụng (optional)
 *           example: "claude-sonnet-4"
 *
 *     ChatResponse:
 *       type: object
 *       description: Response từ AI
 *       properties:
 *         reply:
 *           type: string
 *           description: Câu trả lời từ AI
 *           example: "Xin chào! Tôi rất vui được giúp bạn viết code Python..."
 *         conversationId:
 *           type: string
 *           description: ID conversation (dùng để tiếp tục chat)
 *           example: "conv_abc123def456"
 *         tokensUsed:
 *           type: object
 *           description: Số token đã sử dụng trong lượt chat này
 *           properties:
 *             input:
 *               type: integer
 *               description: Tokens đầu vào (prompt)
 *               example: 50
 *             output:
 *               type: integer
 *               description: Tokens đầu ra (response)
 *               example: 150
 *             total:
 *               type: integer
 *               description: Tổng tokens
 *               example: 200
 *         balanceRemaining:
 *           type: number
 *           format: float
 *           description: Số dư token còn lại sau chat
 *           example: 800.50
 *
 *     Conversation:
 *       type: object
 *       description: Thông tin một conversation
 *       properties:
 *         id:
 *           type: string
 *           description: ID conversation
 *           example: "conv_abc123def456"
 *         title:
 *           type: string
 *           description: Tiêu đề (tự động từ tin nhắn đầu tiên)
 *           example: "Viết code Python"
 *         messageCount:
 *           type: integer
 *           description: Số tin nhắn trong conversation
 *           example: 10
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Thời điểm tạo
 *           example: "2024-01-15T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Thời điểm cập nhật cuối (tin nhắn cuối)
 *           example: "2024-01-15T10:30:00Z"
 *
 *     ChatMessage:
 *       type: object
 *       description: Một tin nhắn trong conversation
 *       properties:
 *         role:
 *           type: string
 *           description: |
 *             Vai trò người gửi:
 *             - **user**: Người dùng
 *             - **assistant**: AI
 *             - **system**: Hệ thống
 *           enum:
 *             - user
 *             - assistant
 *             - system
 *           example: "user"
 *         content:
 *           type: string
 *           description: Nội dung tin nhắn
 *           example: "Viết hàm tính giai thừa"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Thời điểm gửi
 *           example: "2024-01-15T10:30:00Z"
 *
 *     # =========================================================================
 *     # DEPOSIT SCHEMAS
 *     # =========================================================================
 *
 *     PricingTier:
 *       type: object
 *       description: Một gói token
 *       properties:
 *         tokens:
 *           type: integer
 *           description: Số tokens trong gói
 *           example: 1000
 *         price:
 *           type: number
 *           description: Giá (VND)
 *           example: 50000
 *         bonus:
 *           type: integer
 *           description: Bonus tokens (nếu có)
 *           example: 100
 *         popular:
 *           type: boolean
 *           description: Gói phổ biến/khuyến nghị
 *           example: true
 *
 *     Pricing:
 *       type: object
 *       description: Bảng giá tokens
 *       properties:
 *         tiers:
 *           type: array
 *           description: Các gói token có sẵn
 *           items:
 *             $ref: '#/components/schemas/PricingTier'
 *         currency:
 *           type: string
 *           description: Đơn vị tiền tệ
 *           example: "VND"
 *         minDeposit:
 *           type: number
 *           description: Số tiền nạp tối thiểu
 *           example: 10000
 *
 *     DepositCreateRequest:
 *       type: object
 *       description: Request tạo đơn nạp tiền
 *       required:
 *         - tokenAmount
 *       properties:
 *         tokenAmount:
 *           type: integer
 *           description: Số tokens muốn mua
 *           minimum: 100
 *           example: 1000
 *
 *     DepositOrder:
 *       type: object
 *       description: |
 *         **Đơn nạp tiền**
 *
 *         Chứa thông tin thanh toán để user chuyển khoản.
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID đơn hàng
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: ID user
 *         amount:
 *           type: number
 *           description: Số tiền cần thanh toán (VND)
 *           example: 50000
 *         tokens:
 *           type: number
 *           description: Số tokens sẽ nhận (bao gồm bonus)
 *           example: 1100
 *         status:
 *           type: string
 *           description: |
 *             Trạng thái đơn:
 *             - **pending**: Chờ thanh toán
 *             - **completed**: Đã hoàn thành
 *             - **cancelled**: Đã hủy
 *             - **expired**: Hết hạn
 *           enum:
 *             - pending
 *             - completed
 *             - cancelled
 *             - expired
 *           example: "pending"
 *         payment_info:
 *           type: object
 *           description: Thông tin thanh toán
 *           properties:
 *             bank_name:
 *               type: string
 *               description: Tên ngân hàng
 *               example: "MB Bank"
 *             account_number:
 *               type: string
 *               description: Số tài khoản
 *               example: "0123456789"
 *             account_name:
 *               type: string
 *               description: Tên chủ tài khoản
 *               example: "OPERIS COMPANY"
 *             content:
 *               type: string
 *               description: |
 *                 Nội dung chuyển khoản.
 *                 ⚠️ **BẮT BUỘC** ghi đúng nội dung này!
 *               example: "OPERIS ABC123XYZ"
 *             qr_url:
 *               type: string
 *               format: uri
 *               description: URL mã QR thanh toán
 *               example: "https://qr.vietqr.io/..."
 *         expires_at:
 *           type: string
 *           format: date-time
 *           description: Thời điểm hết hạn thanh toán
 *           example: "2024-01-15T11:00:00Z"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Thời điểm tạo đơn
 *           example: "2024-01-15T10:30:00Z"
 *
 *     # =========================================================================
 *     # CRON SCHEMAS
 *     # =========================================================================
 *
 *     Cronjob:
 *       type: object
 *       description: |
 *         **Cron Job**
 *
 *         Scheduled task chạy tự động theo lịch.
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID cronjob
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         customer_id:
 *           type: string
 *           format: uuid
 *           description: ID user sở hữu
 *         box_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID box (nếu gắn với box cụ thể)
 *         name:
 *           type: string
 *           description: Tên cronjob
 *           example: "Daily Report"
 *         schedule:
 *           type: string
 *           description: |
 *             Cron expression (5-field format).
 *
 *             Format: `minute hour day-of-month month day-of-week`
 *
 *             Ví dụ:
 *             - `* * * * *` = mỗi phút
 *             - `0 9 * * *` = 9:00 sáng mỗi ngày
 *             - `0 0 * * 0` = 0:00 đêm Chủ nhật
 *             - `0 0,2,4,6,8,10,12,14,16,18,20,22 * * *` = mỗi 2 giờ
 *           example: "0 9 * * *"
 *         action:
 *           type: string
 *           description: Loại action
 *           example: "send_message"
 *         task:
 *           type: string
 *           nullable: true
 *           description: Nội dung task/message
 *           example: "Generate daily sales report"
 *         enabled:
 *           type: boolean
 *           description: Cronjob có đang được kích hoạt không
 *           example: true
 *         last_run_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Thời điểm chạy cuối cùng
 *           example: "2024-01-15T09:00:00Z"
 *         next_run_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Thời điểm chạy tiếp theo
 *           example: "2024-01-16T09:00:00Z"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Thời điểm tạo
 *           example: "2024-01-01T00:00:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Thời điểm cập nhật cuối
 *           example: "2024-01-15T10:00:00Z"
 *
 *     CronjobCreateRequest:
 *       type: object
 *       description: Request tạo cronjob mới
 *       required:
 *         - name
 *         - schedule
 *         - action
 *       properties:
 *         box_id:
 *           type: string
 *           format: uuid
 *           description: ID box (optional)
 *         name:
 *           type: string
 *           description: Tên cronjob
 *           minLength: 1
 *           maxLength: 100
 *           example: "Daily Report"
 *         schedule:
 *           type: string
 *           description: Cron expression
 *           example: "0 9 * * *"
 *         action:
 *           type: string
 *           description: Loại action
 *           example: "send_message"
 *         task:
 *           type: string
 *           description: Nội dung task
 *           example: "Generate daily sales report"
 *         enabled:
 *           type: boolean
 *           description: Kích hoạt ngay (default: true)
 *           default: true
 *
 *     CronjobExecution:
 *       type: object
 *       description: |
 *         **Lịch sử chạy cronjob**
 *
 *         Ghi lại mỗi lần cronjob được execute.
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID execution
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         cronjob_id:
 *           type: string
 *           format: uuid
 *           description: ID cronjob
 *         status:
 *           type: string
 *           description: |
 *             Kết quả chạy:
 *             - **success**: Thành công
 *             - **failure**: Thất bại
 *           enum:
 *             - success
 *             - failure
 *           example: "success"
 *         started_at:
 *           type: string
 *           format: date-time
 *           description: Thời điểm bắt đầu
 *           example: "2024-01-15T09:00:00Z"
 *         finished_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Thời điểm kết thúc
 *           example: "2024-01-15T09:00:05Z"
 *         duration_ms:
 *           type: integer
 *           nullable: true
 *           description: Thời gian chạy (milliseconds)
 *           example: 5000
 *         output:
 *           type: string
 *           nullable: true
 *           description: Output của task (nếu success)
 *           example: "Report generated successfully"
 *         error:
 *           type: string
 *           nullable: true
 *           description: Error message (nếu failure)
 *           example: "Gateway connection timeout"
 *
 *     ScheduleValidation:
 *       type: object
 *       description: Kết quả validate cron schedule
 *       properties:
 *         valid:
 *           type: boolean
 *           description: Schedule có hợp lệ không
 *           example: true
 *         nextRun:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Thời điểm chạy tiếp theo (nếu valid)
 *           example: "2024-01-16T09:00:00Z"
 *
 *     SchedulerStatus:
 *       type: object
 *       description: Trạng thái scheduler (Admin)
 *       properties:
 *         running:
 *           type: boolean
 *           description: Scheduler có đang chạy không
 *           example: true
 *         interval:
 *           type: integer
 *           description: Interval check (milliseconds)
 *           example: 60000
 *
 *     # =========================================================================
 *     # SETTINGS SCHEMAS
 *     # =========================================================================
 *
 *     Settings:
 *       type: object
 *       description: |
 *         **Cấu hình hệ thống**
 *
 *         Chỉ admin mới có quyền đọc/ghi.
 *       properties:
 *         providers:
 *           type: object
 *           description: Cấu hình LLM providers
 *           additionalProperties:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               apiKey:
 *                 type: string
 *               models:
 *                 type: array
 *                 items:
 *                   type: string
 *         pricing:
 *           type: object
 *           description: Cấu hình giá token
 *         features:
 *           type: object
 *           description: Feature flags
 */

// Export để swagger-jsdoc nhận file này
export {};
