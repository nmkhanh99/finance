# Documentation Maintenance

## Activation
- Always On

## Mục đích
Luôn duy trì tài liệu dự án song song với code. Mỗi khi hoàn thành một tính năng, sửa lỗi, refactor quan trọng, hoặc thay đổi UX / API / database, PHẢI cập nhật tài liệu liên quan **trước khi commit**.

## Các file tài liệu bắt buộc (ở thư mục gốc dự án)

### 1. DEVELOPMENT.md — tài liệu cho developer
Phải bao gồm:
- Tổng quan kiến trúc dự án.
- Cấu trúc thư mục.
- Công nghệ đang dùng.
- Cách chạy app local.
- Cách chạy test / lint / build.
- Quy ước code.
- Quy ước Git commit.
- Database schema hoặc data model.
- Luồng xử lý chính.
- Các quyết định kỹ thuật quan trọng.
- Các dependency chính và lý do sử dụng.
- Ghi chú bảo mật, đặc biệt với dữ liệu tài chính cá nhân.

### 2. USER_GUIDE.md — hướng dẫn người dùng
Phải bao gồm:
- App dùng để làm gì.
- Cách tạo ví / tài khoản.
- Cách thêm giao dịch thu / chi.
- Cách quản lý danh mục.
- Cách xem báo cáo.
- Cách tạo ngân sách.
- Cách theo dõi mục tiêu tiết kiệm.
- Cách import / export dữ liệu (nếu có).
- Giải thích các thuật ngữ tài chính trong app.
- Các lỗi thường gặp và cách xử lý.

### 3. CHANGELOG.md — lịch sử thay đổi
Mỗi commit tính năng phải thêm mục theo đúng format:
```
## YYYY-MM-DD

### Added
- Tính năng mới.

### Changed
- Thay đổi hành vi hoặc giao diện.

### Fixed
- Lỗi đã sửa.

### Technical
- Thay đổi kỹ thuật, refactor, test, database migration.
```

### 4. ROADMAP.md — backlog & định hướng
Phải bao gồm các mục:
- **Done**: các tính năng đã hoàn thành.
- **In Progress**: task đang làm.
- **Next**: các tính năng nên làm tiếp.
- **Later**: ý tưởng dài hạn.
- **Technical Debt**: nợ kỹ thuật cần xử lý.

## Quy tắc cập nhật tài liệu
- KHÔNG commit tính năng nếu chưa cập nhật tài liệu liên quan.
- Thêm tính năng mới → cập nhật `USER_GUIDE.md`.
- Thay đổi kiến trúc, database, API, state management hoặc cấu trúc thư mục → cập nhật `DEVELOPMENT.md`.
- Hoàn thành task → cập nhật `CHANGELOG.md` và `ROADMAP.md`.
- Thêm command mới, script mới hoặc dependency mới → ghi vào `DEVELOPMENT.md`.
- Thay đổi hành vi người dùng nhìn thấy được → ghi vào `USER_GUIDE.md`.
- Tài liệu phải rõ ràng, đủ để người khác clone repo và tiếp tục phát triển.
- KHÔNG ghi thông tin giả. Phần nào chưa có thì ghi "Chưa có" hoặc "Sẽ bổ sung sau".
- KHÔNG ghi secret, token, private key, thông tin tài khoản thật hoặc dữ liệu tài chính cá nhân thật vào tài liệu.

## Vòng lặp bắt buộc trước mỗi commit
Trước khi commit mỗi task, kiểm tra đủ:
1. Code đã hoàn thành.
2. Test / lint / build đã chạy — hoặc ghi rõ lý do không chạy được.
3. `DEVELOPMENT.md` đã cập nhật nếu có thay đổi kỹ thuật.
4. `USER_GUIDE.md` đã cập nhật nếu có thay đổi với người dùng.
5. `CHANGELOG.md` đã ghi lại thay đổi.
6. `ROADMAP.md` đã chuyển task hoàn thành sang Done và chọn task tiếp theo.

Commit PHẢI bao gồm cả code và tài liệu liên quan.

## Summary bắt buộc sau mỗi commit
Sau mỗi commit, phần tóm tắt phải gồm:
- Tính năng đã làm.
- File code đã thay đổi.
- File tài liệu đã cập nhật.
- Test / lint / build đã chạy.
- Commit hash.
- Task tiếp theo dự kiến.
