# USER_GUIDE.md — Hướng dẫn sử dụng

## App dùng để làm gì?
Quản lý tài chính cá nhân toàn cảnh và chia tiền khi đi chơi nhóm:
- Biết **tổng tài sản ròng** (có bao nhiêu tiền).
- Theo dõi **lãi/lỗ** đầu tư chứng khoán & tiền ảo (giá tự cập nhật).
- Quản lý **nợ/vay**, lãi phải trả, lịch trả góp.
- Theo dõi **thu/chi**, xem **báo cáo** dòng tiền.
- Lập **mục tiêu tiết kiệm** ("cần X tiền trong Y tháng").
- **Chia tiền nhóm**: ai trả, ai chịu, ai cần chuyển cho ai.

Mở app tại **http://localhost:3000**. Thanh điều hướng trên cùng có các mục: Tổng quan, Tài khoản, Giao dịch, Đầu tư, Nợ/Vay, Mục tiêu, Báo cáo, Chia tiền nhóm.

## Tạo ví / tài khoản
1. Vào **Tài khoản**.
2. Nhập **Tên** (vd "Vietcombank"), chọn **Loại** (Tiền mặt / Ngân hàng), nhập **Số dư**.
3. Bấm **+ Thêm**. Có thể sửa số dư trực tiếp rồi **Lưu**, hoặc **Xoá**.

## Thêm giao dịch thu / chi
1. Vào **Giao dịch** (cần có tài khoản trước).
2. Chọn **Loại**: Chi / Thu / Chuyển khoản.
3. Nhập **Số tiền**, **Ngày**, **Tài khoản nguồn**; nếu Chuyển khoản thì chọn thêm **Đến tài khoản**.
4. Chọn **Danh mục** (tuỳ chọn) và **Ghi chú**.
5. Bấm **+ Ghi giao dịch**. Số dư tài khoản tự cập nhật. Xoá giao dịch sẽ hoàn lại số dư.

## Quản lý danh mục
- App seed sẵn các danh mục (Lương, Thưởng, Ăn uống, Đi lại, Nhà ở/Hoá đơn...).
- Vào **Danh mục** để: thêm danh mục mới (tên + loại Thu/Chi), **sửa tên** (đổi rồi bấm Lưu), **xoá**. Mỗi danh mục hiển thị số giao dịch đang dùng.
- Xoá danh mục **không làm mất giao dịch**: các giao dịch đang dùng sẽ được gỡ nhãn danh mục (thành "không danh mục"), không bị xoá.

## Đầu tư (chứng khoán / tiền ảo)
1. Vào **Đầu tư**, nhập **Mã** (vd `VNM`, `BTC`), **Loại**, **Số lượng**, **Giá vốn/đơn vị**, bấm **+ Thêm**. Thêm trùng mã sẽ tự gộp và tính lại giá vốn trung bình.
2. Nhập **giá hiện tại** ở ô từng dòng rồi bấm ↻ để cập nhật thủ công.
3. Hoặc bấm **↻ Cập nhật giá** để tự lấy giá: tiền ảo (CoinGecko), cổ phiếu VN (VNDirect). Cột Lãi/Lỗ và % cập nhật theo.

## Nợ / Vay
1. Vào **Nợ/Vay**, nhập **Tên**, **Gốc**, **Lãi suất %/năm**, **Kỳ hạn (tháng)**, **Loại lãi** (Trả góp đều / Lãi đơn / Lãi kép), **Ngày bắt đầu**.
2. Mỗi khoản hiển thị: dư nợ còn lại, trả/tháng ước tính, tổng lãi cả kỳ, đã trả gốc/lãi; có **lịch trả góp**.
3. **Ghi nhận trả**: nhập số tiền + ngày → app tự tách phần lãi (theo dư nợ) và phần gốc.

## Xem báo cáo
Vào **Báo cáo**:
- **Dòng tiền tháng**: Thu / Chi / Còn lại (tiết kiệm) tháng hiện tại.
- **Chi theo danh mục**: tỷ lệ từng nhóm chi.
- **Chiến lược trả nợ**: nhập số tiền trả thêm/tháng → so sánh **Avalanche** vs **Snowball** (thời gian trả hết, tổng lãi), gợi ý phương án tiết kiệm hơn.

Ngoài ra **Tổng quan** hiển thị Net Worth + phân bổ Tiền mặt / Đầu tư / Dư nợ.

## Tạo ngân sách
1. Vào **Ngân sách**.
2. Với mỗi danh mục Chi, nhập **Hạn mức/tháng** rồi bấm **Lưu** (để trống / 0 để bỏ ngân sách).
3. App hiển thị **đã chi tháng này / hạn mức**, thanh tiến độ (xanh < 80%, vàng ≥ 80%, đỏ khi vượt) và số tiền **còn lại** hoặc **vượt**.
4. Đầu trang có cảnh báo **"⚠️ N danh mục vượt ngân sách"** nếu có danh mục vượt.

Ngân sách lặp lại mỗi tháng (so sánh với chi tiêu của tháng hiện tại).

## Theo dõi mục tiêu tiết kiệm
1. Vào **Mục tiêu**, nhập **Tên**, **Số tiền cần**, **Đã có**, **Hạn đạt được**.
2. Mỗi mục tiêu hiển thị thanh tiến độ %, số tháng còn lại, và **"cần tiết kiệm X/tháng"**.
3. Cập nhật **Đã có** khi tiết kiệm thêm.

## Chia tiền nhóm (đi chơi)
1. Vào **Chia tiền nhóm** → **+ Tạo nhóm** (tên chuyến đi).
2. Mở nhóm → thêm **thành viên** (chỉ cần tên).
3. **Thêm chi phí**: nhập **Nội dung** (bắt buộc), chọn **Người trả**, **Ngày**, chọn cách chia:
   - **Chia đều**: nhập tổng tiền, tick những người cùng chịu (bỏ tick người không tham gia).
   - **Tùy chỉnh**: nhập số tiền cụ thể cho từng người.
4. Xem **Báo cáo phân tích** (mỗi người đã trả / phải chịu / chênh lệch) và **Phương án thanh toán** (ai chuyển cho ai bao nhiêu — tối thiểu số lần chuyển).

## Import / Export dữ liệu
**Chưa có.** Sẽ bổ sung sau (import CSV sao kê, export báo cáo).

## Giải thích thuật ngữ tài chính
- **Net Worth (tài sản ròng)**: tổng tài sản − tổng nợ.
- **P&L / Lãi-Lỗ chưa thực hiện**: chênh lệch giá hiện tại so với giá vốn, chưa bán.
- **Giá vốn trung bình**: giá mua bình quân gia quyền khi mua nhiều lần.
- **Lãi đơn / lãi kép**: lãi tính trên gốc / lãi tính trên cả gốc lẫn lãi tích lũy.
- **Trả góp đều (annuity)**: mỗi kỳ trả số tiền bằng nhau (gồm gốc + lãi).
- **Avalanche**: ưu tiên trả khoản **lãi suất cao nhất** trước → tiết kiệm tổng lãi.
- **Snowball**: ưu tiên trả khoản **dư nợ nhỏ nhất** trước → tạo động lực.
- **FV (giá trị tương lai)**: dùng để tính số tiền cần tiết kiệm/tháng đạt mục tiêu.

## Lỗi thường gặp & cách xử lý
- **Trang Giao dịch báo "cần có tài khoản trước"**: vào Tài khoản tạo ít nhất 1 tài khoản.
- **Bấm Cập nhật giá nhưng có mã bị "bỏ qua"**: mã tiền ảo chưa nằm trong danh sách hỗ trợ (`CRYPTO_IDS`), hoặc mã cổ phiếu sai/không có dữ liệu. Kiểm tra lại mã.
- **Lỗi cập nhật giá (mạng/â rate limit)**: app không crash, chỉ báo lỗi — thử lại sau.
- **Net Worth chưa tính đầu tư khi chưa có giá**: nếu chưa cập nhật giá, app tạm dùng **giá vốn** (P&L = 0).
- **Không xoá được thành viên nhóm**: thành viên đó đã trả hoặc tham gia chi phí — xoá các chi phí liên quan trước.
- **App không chạy / lỗi kết nối DB**: kiểm tra PostgreSQL đang chạy và `DATABASE_URL` trong `.env` đúng (xem `DEVELOPMENT.md`).
