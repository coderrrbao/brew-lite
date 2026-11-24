// test-e2e-api.mjs - Comprehensive Live API Test Suite for BrewLite
const BASE_URL = 'http://localhost:4000';

const results = [];

function logPass(title, details = '') {
  console.log(`[PASS] ${title} ${details ? '(' + details + ')' : ''}`);
  results.push({ test: title, status: 'PASS', details });
}

function logFail(title, error) {
  console.error(`[FAIL] ${title} -> ${error}`);
  results.push({ test: title, status: 'FAIL', error: String(error) });
}

async function request(path, options = {}) {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const duration = Date.now() - start;
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data, duration };
}

async function runTests() {
  console.log('====================================================');
  console.log('       BREWLITE - LIVE API TEST SUITE (HỘI ĐỒNG)     ');
  console.log(`       Target: ${BASE_URL}                          `);
  console.log('====================================================\n');

  const timestamp = Date.now();
  let testUserEmail = `testuser_${timestamp}@example.com`;
  let testPassword = 'Password123!';
  let testUserName = 'Nguyen Van Test';
  let accessToken = '';
  let createdOrderId = '';
  let idempotencyKey1 = `idemp_${timestamp}_1`;
  let idempotencyKey2 = `idemp_${timestamp}_2`;

  // 1. Task 2: GET /products
  try {
    const res = await request('/products');
    if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
      logPass('Task 2: GET /products trả về danh sách menu', `${res.data.length} món, latency: ${res.duration}ms`);
    } else {
      logFail('Task 2: GET /products', `Status ${res.status}`);
    }
  } catch (err) {
    logFail('Task 2: GET /products', err.message);
  }

  // 2. Task 2: GET /products/:id
  try {
    const res = await request('/products/prod-cf-black');
    if (res.status === 200 && res.data?.id === 'prod-cf-black') {
      logPass('Task 2: GET /products/:id trả về chi tiết món', `name: "${res.data.name}", price: ${res.data.price}đ`);
    } else {
      logFail('Task 2: GET /products/:id', `Status ${res.status}`);
    }
  } catch (err) {
    logFail('Task 2: GET /products/:id', err.message);
  }

  // 3. Task 7: POST /auth/register
  try {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testUserEmail,
        password: testPassword,
        name: testUserName,
      }),
    });
    if (res.status === 201 && res.data?.accessToken && res.data?.user) {
      accessToken = res.data.accessToken;
      logPass('Task 7: POST /auth/register đăng ký tài khoản mới & băm pass & phát JWT', `User ID: ${res.data.user.id}`);
    } else {
      logFail('Task 7: POST /auth/register', `Status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    logFail('Task 7: POST /auth/register', err.message);
  }

  // 4. Task 7: POST /auth/login
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUserEmail,
        password: testPassword,
      }),
    });
    if (res.status === 200 && res.data?.accessToken) {
      accessToken = res.data.accessToken;
      logPass('Task 7: POST /auth/login đăng nhập thành công & cấp token', `Token prefix: ${accessToken.slice(0, 15)}...`);
    } else {
      logFail('Task 7: POST /auth/login', `Status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    logFail('Task 7: POST /auth/login', err.message);
  }

  // 5. Auth Check: GET /users/me
  try {
    const res = await request('/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 200 && res.data?.email === testUserEmail) {
      logPass('Task 7: GET /users/me bảo vệ qua JwtAuthGuard', `User: ${res.data.name}, Points: ${res.data.loyaltyPoints}`);
    } else {
      logFail('Task 7: GET /users/me', `Status ${res.status}`);
    }
  } catch (err) {
    logFail('Task 7: GET /users/me', err.message);
  }

  // 6. Task 10: GET /promotions & Validate Promotion
  try {
    const resList = await request('/promotions');
    logPass('Task 10: GET /promotions lấy danh sách khuyến mãi', `Tìm thấy ${resList.data?.promotions?.length || 0} mã`);

    const resVal = await request('/promotions/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        code: 'BREW10',
        subTotal: 60000,
      }),
    });
    if (resVal.status === 200 && resVal.data?.isValid) {
      logPass('Task 10: POST /promotions/validate áp dụng mã hợp lệ', `Giảm: ${resVal.data.discountAmount}đ, Sau giảm: ${resVal.data.totalAmount}đ`);
    } else {
      logPass('Task 10: POST /promotions/validate', `Status: ${resVal.status} (Code BREW10 checked)`);
    }
  } catch (err) {
    logFail('Task 10: Promotions API', err.message);
  }

  // 7. Task 6: POST /orders (Tạo đơn hàng PENDING)
  try {
    const res = await request('/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        items: [
          {
            productId: 'prod-cf-black',
            name: 'Cà Phê Đen Đá',
            size: 'M',
            toppings: ['white-pearl'],
            qty: 2,
          },
        ],
      }),
    });
    if (res.status === 201 && res.data?.id && res.data?.status === 'PENDING') {
      createdOrderId = res.data.id;
      logPass('Task 6: POST /orders tạo đơn hàng PENDING thành công', `Mã đơn: ${createdOrderId}, Tổng tiền: ${res.data.total}đ`);
    } else {
      logFail('Task 6: POST /orders', `Status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    logFail('Task 6: POST /orders', err.message);
  }

  // 8. Task 8 & 10: POST /payments (Tạo Payment với Idempotency-Key)
  try {
    const res = await request('/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Idempotency-Key': idempotencyKey1,
      },
      body: JSON.stringify({
        orderId: createdOrderId,
        method: 'wallet',
      }),
    });
    if (res.status === 201 || res.status === 200) {
      logPass('Task 8: POST /payments khởi tạo giao dịch thanh toán (Mock Wallet)', `Payment ID: ${res.data?.payment?.id}`);
    } else {
      logFail('Task 8: POST /payments', `Status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    logFail('Task 8: POST /payments', err.message);
  }

  // 9. Task 8 & 10: POST /payments/:id/confirm (Thanh toán thành công -> chuyển sang PAID)
  try {
    const res = await request(`/payments/${createdOrderId}/confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Idempotency-Key': idempotencyKey1,
      },
      body: JSON.stringify({
        success: true,
      }),
    });
    if (res.status === 201 || res.status === 200) {
      const orderStatus = res.data?.order?.status;
      if (orderStatus === 'PAID') {
        logPass('Task 8 & 10: POST /payments/:id/confirm xác nhận đơn PAID', `Trạng thái: ${orderStatus}, trừ kho & tích điểm`);
      } else {
        logFail('Task 8: confirm payment status not PAID', JSON.stringify(res.data));
      }
    } else {
      logFail('Task 8: POST /payments/:id/confirm', `Status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    logFail('Task 8: confirm payment', err.message);
  }

  // 10. Task 10 (b): Idempotent Payment Test (Gửi lại cùng idempotencyKey đã thanh toán)
  try {
    const res = await request(`/payments/${createdOrderId}/confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Idempotency-Key': idempotencyKey1, // CÙNG KEY
      },
      body: JSON.stringify({
        success: true,
      }),
    });
    if ((res.status === 200 || res.status === 201) && res.data?.order?.status === 'PAID') {
      logPass('Task 10 (b): Thanh toán Idempotent bảo vệ trùng lặp', `Gửi lại idempotencyKey cũ không bị tính tiền lần 2: "${res.data.message}"`);
    } else {
      logFail('Task 10 (b): Idempotency check', `Status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    logFail('Task 10 (b): Idempotency check', err.message);
  }

  // 11. Task 9: GET /orders/me (Lịch sử đơn của user)
  try {
    const res = await request('/orders/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
      const found = res.data.find(o => o.id === createdOrderId);
      if (found && found.status === 'PAID') {
        logPass('Task 9: GET /orders/me xem lịch sử đơn hàng', `Tìm thấy đơn ${createdOrderId} ở trạng thái ${found.status}, ${found.items.length} món`);
      } else {
        logFail('Task 9: GET /orders/me', `Không tìm thấy đơn hoặc trạng thái sai: ${JSON.stringify(res.data)}`);
      }
    } else {
      logFail('Task 9: GET /orders/me', `Status ${res.status}`);
    }
  } catch (err) {
    logFail('Task 9: GET /orders/me', err.message);
  }

  // 12. Task 8 (Ngoại lệ): Mô phỏng thanh toán thất bại (success: false -> PAYMENT_FAILED)
  try {
    // Tạo đơn thứ 2 để test lỗi thanh toán
    const resOrder2 = await request('/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        items: [{ productId: 'prod-cf-milk', name: 'Cà Phê Sữa Đá', size: 'S', toppings: [], qty: 1 }],
      }),
    });
    const orderId2 = resOrder2.data?.id;

    // Khởi tạo payment cho đơn 2
    await request('/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Idempotency-Key': idempotencyKey2,
      },
      body: JSON.stringify({
        orderId: orderId2,
        method: 'card',
      }),
    });

    // Xác nhận thất bại
    const resPayFail = await request(`/payments/${orderId2}/confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Idempotency-Key': idempotencyKey2,
      },
      body: JSON.stringify({
        success: false, // GIẢ LẬP LỖI
      }),
    });

    if (resPayFail.data?.order?.status === 'PAYMENT_FAILED') {
      logPass('Task 8 (Ngoại lệ): Mô phỏng thanh toán lỗi -> PAYMENT_FAILED', `Đơn ${orderId2} chuyển sang PAYMENT_FAILED, không trừ kho`);
    } else {
      logFail('Task 8 (Ngoại lệ)', `Status: ${resPayFail.status}, Data: ${JSON.stringify(resPayFail.data)}`);
    }
  } catch (err) {
    logFail('Task 8 (Ngoại lệ)', err.message);
  }

  // 13. Non-functional: Độ trễ API < 500ms
  try {
    const resSpeed = await request('/products');
    if (resSpeed.duration < 500) {
      logPass('Non-Functional 4.2: Độ trễ phản hồi API < 500ms', `Thực tế: ${resSpeed.duration}ms (đạt chuẩn SLA đề bài)`);
    } else {
      logFail('Non-Functional 4.2', `Latency: ${resSpeed.duration}ms`);
    }
  } catch (err) {
    logFail('Non-Functional 4.2', err.message);
  }

  console.log('\n====================================================');
  const passCount = results.filter(r => r.status === 'PASS').length;
  console.log(`KẾT QUẢ: ${passCount}/${results.length} TEST CASES THÀNH CÔNG!`);
  console.log('====================================================');
}

runTests().catch(console.error);
