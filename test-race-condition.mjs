// test-race-condition.mjs - Real-world Race Condition & Stock Concurrency Test
import pg from './backend/node_modules/.pnpm/pg@8.23.1/node_modules/pg/lib/index.js';
const { Client } = pg;

const API_BASE = 'http://localhost:4000';
const DB_URL = 'postgresql://brewlite:brewlite@localhost:5433/brewlite?schema=public';
const TARGET_PRODUCT_ID = 'prod-espresso';
const INITIAL_TEST_STOCK = 5;
const CONCURRENT_USERS_COUNT = 25;

async function getDbClient() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  return client;
}

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log('========================================================================');
  console.log('       BREWLITE - RACE CONDITION & HIGH CONCURRENCY STOCK TEST          ');
  console.log('========================================================================\n');

  const db = await getDbClient();

  // 1. Lưu lại tồn kho ban đầu để rollback sau test
  const originalRes = await db.query('SELECT stock, version FROM "Product" WHERE id = $1', [TARGET_PRODUCT_ID]);
  const originalStock = originalRes.rows[0].stock;
  const originalVersion = originalRes.rows[0].version;
  console.log(`[SETUP] Sản phẩm mục tiêu: ${TARGET_PRODUCT_ID}`);
  console.log(`[SETUP] Tồn kho gốc trong DB: ${originalStock} (version: ${originalVersion})`);

  try {
    // 2. Thiết lập tồn kho ở mức "sắp hết hàng" = 5
    await db.query('UPDATE "Product" SET stock = $1, version = 0 WHERE id = $2', [INITIAL_TEST_STOCK, TARGET_PRODUCT_ID]);
    console.log(`[SETUP] Đã hạ tồn kho xuống mức giới hạn: STOCK = ${INITIAL_TEST_STOCK}, VERSION = 0\n`);

    // Kiểm tra lại qua API GET /products/:id
    const checkApi = await apiRequest(`/products/${TARGET_PRODUCT_ID}`);
    console.log(`[API CHECK] GET /products/${TARGET_PRODUCT_ID} -> Stock hiển thị: ${checkApi.data.stock}`);

    // 3. Chuẩn bị 25 tài khoản user độc lập
    console.log(`\n[STEP 1] Đang khởi tạo và xác thực ${CONCURRENT_USERS_COUNT} người dùng đồng thời...`);
    const users = [];
    const timestamp = Date.now();

    for (let i = 1; i <= CONCURRENT_USERS_COUNT; i++) {
      const email = `race_user_${timestamp}_${i}@test.com`;
      const password = 'Password123!';
      const name = `Buyer #${i}`;

      const reg = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });

      if (!reg.ok) {
        throw new Error(`Không thể đăng ký user ${email}: ${JSON.stringify(reg.data)}`);
      }

      users.push({
        id: reg.data.user.id,
        email,
        name,
        token: reg.data.accessToken,
      });
    }
    console.log(`[STEP 1] Đã tạo xong ${users.length} phiên người dùng với đầy đủ JWT Bearer token.`);

    // 4. KÍCH HOẠT FLASH SALE / RACE CONDITION
    console.log(`\n========================================================================`);
    console.log(`[STEP 2] KÍCH HOẠT RACE CONDITION: ${CONCURRENT_USERS_COUNT} USERS ĐỒNG LOẠT ĐẶT 1 SẢN PHẨM (TỒN KHO = ${INITIAL_TEST_STOCK})`);
    console.log(`========================================================================`);

    const startTime = Date.now();

    // 25 request gửi đi tại cùng 1 tick
    const orderPromises = users.map(async (u, idx) => {
      const res = await apiRequest('/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${u.token}` },
        body: JSON.stringify({
          items: [
            {
              productId: TARGET_PRODUCT_ID,
              name: 'Espresso Single Shot',
              size: 'S',
              toppings: [],
              qty: 1, // mỗi người đặt 1 ly
            },
          ],
        }),
      });
      return {
        userIndex: idx + 1,
        userName: u.name,
        status: res.status,
        data: res.data,
      };
    });

    const results = await Promise.all(orderPromises);
    const duration = Date.now() - startTime;

    console.log(`\n[THỐNG KÊ TẢI] Toàn bộ ${CONCURRENT_USERS_COUNT} requests hoàn tất trong ${duration}ms!\n`);

    // Phân loại kết quả
    const successfulOrders = results.filter((r) => r.status === 201);
    const conflictOrders = results.filter((r) => r.status === 409);
    const otherErrors = results.filter((r) => r.status !== 201 && r.status !== 409);

    console.log('------------------------------------------------------------------------');
    console.log(`- SỐ ĐƠN THÀNH CÔNG (HTTP 201):        ${successfulOrders.length} / ${CONCURRENT_USERS_COUNT}`);
    console.log(`- SỐ ĐƠN BỊ TỪ CHỐI DO HẾT HÀNG (409): ${conflictOrders.length} / ${CONCURRENT_USERS_COUNT}`);
    if (otherErrors.length > 0) {
      console.log(`- LỖI KHÁC (BẤT THƯỜNG):               ${otherErrors.length}`);
    }
    console.log('------------------------------------------------------------------------\n');

    // 5. Kiểm tra tính toàn vẹn của CSDL
    const postRes = await db.query('SELECT stock, version FROM "Product" WHERE id = $1', [TARGET_PRODUCT_ID]);
    const currentStock = postRes.rows[0].stock;
    const currentVersion = postRes.rows[0].version;

    console.log(`[DATABASE INTEGRITY CHECK]`);
    console.log(`- Tồn kho thực tế trong CSDL sau race condition: ${currentStock}`);
    console.log(`- Version thực tế trong CSDL sau race condition:  ${currentVersion}`);

    let test1Passed = false;
    if (successfulOrders.length === INITIAL_TEST_STOCK && currentStock === 0 && currentVersion === INITIAL_TEST_STOCK) {
      console.log(`\n>>> [TEST PASSED] Hệ thống xử lý concurrency TUYỆT ĐỐI CHÍNH XÁC!`);
      console.log(`    - Đúng 5/25 user mua được hàng.`);
      console.log(`    - 20 user bị chặn với mã 409 Conflict.`);
      console.log(`    - Tồn kho về đúng 0, KHÔNG BỊ ÂM (NO OVERSELLING).`);
      test1Passed = true;
    } else {
      console.error(`\n>>> [TEST FAILED] Phát hiện sai lệch tồn kho! Success: ${successfulOrders.length}, Stock: ${currentStock}`);
    }

    // 6. Test thử khi kho = 0: User cố tình đặt tiếp
    console.log(`\n[STEP 3] Thử nghiệm đặt hàng khi kho đã về 0...`);
    const attemptWhenZero = await apiRequest('/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${users[0].token}` },
      body: JSON.stringify({
        items: [{ productId: TARGET_PRODUCT_ID, name: 'Espresso Single Shot', size: 'S', toppings: [], qty: 1 }],
      }),
    });
    console.log(`- Phản hồi từ server: HTTP ${attemptWhenZero.status} -> "${attemptWhenZero.data?.message}"`);
    if (attemptWhenZero.status === 409) {
      console.log(`>>> [TEST PASSED] API từ chối ngay lập tức khi hết hàng!`);
    }

    // 7. Thử nghiệm Hoàn kho khi Hủy đơn (Rollback on cancel)
    console.log(`\n[STEP 4] Thử nghiệm HOÀN KHO KHI HỦY ĐƠN:`);
    const orderToCancel = successfulOrders[0].data.id;
    const luckyUser = users.find((u, idx) => idx + 1 === successfulOrders[0].userIndex);

    console.log(`- User #${successfulOrders[0].userIndex} quyết định HỦY đơn hàng ${orderToCancel}...`);
    const cancelRes = await apiRequest(`/orders/${orderToCancel}/user-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${luckyUser.token}` },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });

    console.log(`- Trạng thái phản hồi hủy đơn: HTTP ${cancelRes.status} (status: ${cancelRes.data?.status})`);

    // Kiểm tra kho sau khi hủy
    const afterCancelDb = await db.query('SELECT stock FROM "Product" WHERE id = $1', [TARGET_PRODUCT_ID]);
    console.log(`- Tồn kho trong CSDL sau khi hủy đơn: ${afterCancelDb.rows[0].stock}`);

    if (afterCancelDb.rows[0].stock === 1) {
      console.log(`>>> [TEST PASSED] Kho được tự động hoàn lại đúng 1 sản phẩm!`);

      // 8. User thứ 6 (từng bị từ chối) bây giờ đặt lại
      console.log(`\n[STEP 5] User bị từ chối trước đó thử đặt lại sau khi có người hủy đơn...`);
      const retryUser = users[5];
      const retryOrder = await apiRequest('/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${retryUser.token}` },
        body: JSON.stringify({
          items: [{ productId: TARGET_PRODUCT_ID, name: 'Espresso Single Shot', size: 'S', toppings: [], qty: 1 }],
        }),
      });

      console.log(`- Kết quả đặt lại: HTTP ${retryOrder.status} (Mã đơn: ${retryOrder.data?.id})`);
      const finalDb = await db.query('SELECT stock FROM "Product" WHERE id = $1', [TARGET_PRODUCT_ID]);
      console.log(`- Tồn kho cuối cùng trong DB: ${finalDb.rows[0].stock}`);

      if (retryOrder.status === 201 && finalDb.rows[0].stock === 0) {
        console.log(`>>> [TEST PASSED] User đặt lại thành công sản phẩm vừa được hoàn kho!`);
      }
    }

  } finally {
    // 9. Dọn dẹp & Khôi phục lại tồn kho ban đầu
    console.log(`\n[TEARDOWN] Đang khôi phục lại tồn kho ban đầu...`);
    await db.query('UPDATE "Product" SET stock = $1, version = $2 WHERE id = $3', [originalStock, originalVersion, TARGET_PRODUCT_ID]);
    console.log(`[TEARDOWN] Đã khôi phục ${TARGET_PRODUCT_ID} về stock = ${originalStock}, version = ${originalVersion}`);
    await db.end();
  }

  console.log('\n========================================================================');
  console.log('       KẾT THÚC KIỂM THỬ RACE CONDITION & CONCURRENCY                   ');
  console.log('========================================================================');
}

main().catch(console.error);
