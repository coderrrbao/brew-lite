"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import Link from "next/link";

import { getAccessToken } from "@/lib/api/auth";
import { ApiError, request } from "@/lib/api/client";
import { formatPrice } from "@/lib/data";
import type { Order } from "@/lib/store";

import {
    PageShell,
    cardCls,
    btnPrimary,
    btnOutline,
} from "./ui";

// Kiểu dữ liệu trạng thái
type OrderStatus = Order["status"];

type NextStatus =
    | "PREPARING"
    | "READY"
    | "COMPLETED";

// Dữ liệu đơn hàng nhân viên
interface StaffOrder {
    id: string;
    status: OrderStatus;
    total: number;
    createdAt: string;

    user: {
        name: string | null;
        email: string;
    } | null;

    items: {
        id: string;
        name: string;
        qty: number;
        size: string;
        lineTotal: number;
    }[];
}

// Hiển thị tên trạng thái
const statusLabels: Record<OrderStatus, string> = {
    PENDING: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    PREPARING: "Đang pha chế",
    READY: "Sẵn sàng lấy",
    COMPLETED: "Hoàn thành",
    PAYMENT_FAILED: "Thanh toán thất bại",
    CANCELLED: "Đã hủy",
};

// Xác định hành động tiếp theo
const nextActions: Partial<
    Record<
        OrderStatus,
        {
            label: string;
            next: NextStatus;
        }
    >
> = {
    PAID: {
        label: "Bắt đầu pha chế",
        next: "PREPARING",
    },

    PREPARING: {
        label: "Sẵn sàng lấy",
        next: "READY",
    },

    READY: {
        label: "Hoàn thành",
        next: "COMPLETED",
    },
};

export default function StaffOrdersView() {
    const [orders, setOrders] = useState<StaffOrder[]>([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [actionError, setActionError] = useState("");

    const [accessDenied, setAccessDenied] = useState(false);

    const [requiresLogin, setRequiresLogin] = useState(false);

    const [busyId, setBusyId] = useState<string | null>(null);

    const [filter, setFilter] = useState<
        OrderStatus | "ALL"
    >("ALL");

    const fetching = useRef(false);

    // Lấy tất cả đơn hàng
    const loadOrders = useCallback(async () => {
        if (fetching.current) return;

        const token = getAccessToken();

        if (!token) {
            setAccessDenied(true);
            setRequiresLogin(true);
            setError("Vui lòng đăng nhập để tiếp tục.");
            setLoading(false);
            return;
        }

        fetching.current = true;

        try {
            const result = await request<StaffOrder[]>(
                "/orders/staff",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            setOrders(result);
            setError("");
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                setAccessDenied(true);
                setRequiresLogin(true);
                setError("Vui lòng đăng nhập để tiếp tục.");
            } else if (err instanceof ApiError && err.status === 403) {
                setAccessDenied(true);
                setRequiresLogin(false);
                setError("Bạn không có quyền nhân viên");
            } else {
                console.error("Lỗi lấy đơn hàng:", err);
                setError("Không thể tải danh sách đơn hàng");
            }
        } finally {
            fetching.current = false;
            setLoading(false);
        }
    }, []);

    // Polling mỗi 2,5 giây
    useEffect(() => {
        if (accessDenied) return;

        void loadOrders();

        const interval = setInterval(() => {
            void loadOrders();
        }, 2500);

        return () => clearInterval(interval);
    }, [loadOrders, accessDenied]);

    // Nhân viên cập nhật trạng thái
    const handleUpdate = async (
        orderId: string,
        status: NextStatus,
    ) => {
        if (busyId) return;

        const token = getAccessToken();

        if (!token) {
            setActionError("Bạn chưa đăng nhập");
            return;
        }

        setBusyId(orderId);
        setActionError("");

        try {
            await request(`/orders/${orderId}/status`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status,
                }),
            });

            // Tải lại danh sách sau khi chuyển
            await loadOrders();
        } catch (err) {
            if (
                err instanceof ApiError &&
                err.status === 409
            ) {
                setActionError(
                    "Trạng thái đã được hệ thống tự động thay đổi. " +
                    "Vui lòng kiểm tra lại.",
                );
            } else if (err instanceof ApiError && err.status === 401) {
                setAccessDenied(true);
                setRequiresLogin(true);
                setError("Vui lòng đăng nhập để tiếp tục.");
            } else if (err instanceof ApiError && err.status === 403) {
                setAccessDenied(true);
                setRequiresLogin(false);
                setError("Bạn không có quyền nhân viên");
            } else {
                console.error("Lỗi cập nhật trạng thái:", err);
                setActionError(
                    "Không thể cập nhật trạng thái đơn hàng",
                );
            }

            await loadOrders();
        } finally {
            setBusyId(null);
        }
    };

    // Lọc đơn hàng
    const filteredOrders =
        filter === "ALL"
            ? orders
            : orders.filter(
                (order) => order.status === filter,
            );

    const paidCount = orders.filter(
        (order) => order.status === "PAID",
    ).length;

    const preparingCount = orders.filter(
        (order) => order.status === "PREPARING",
    ).length;

    const readyCount = orders.filter(
        (order) => order.status === "READY",
    ).length;

    // Đang tải
    if (loading) {
        return (
            <PageShell>
                <p className="text-center">
                    Đang tải đơn hàng...
                </p>
            </PageShell>
        );
    }

    // Không có quyền
    if (accessDenied) {
        return (
            <PageShell className="text-center">
                {requiresLogin ? (
                    <>
                        <h1 className="text-2xl font-semibold">
                            Yêu cầu đăng nhập
                        </h1>

                        <p className="mt-3 text-muted-foreground">
                            Vui lòng đăng nhập để truy cập quản lý đơn hàng.
                        </p>

                        <Link
                            href="/login"
                            className={`${btnPrimary} mt-6`}
                        >
                            Đăng nhập
                        </Link>
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-semibold">
                            Không có quyền truy cập
                        </h1>

                        <p className="mt-3 text-muted-foreground">
                            – {error}
                        </p>
                    </>
                )}
            </PageShell>
        );
    }

    return (
        <PageShell wide>

            {/* Tiêu đề */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-semibold">
                        Quản lý đơn hàng
                    </h1>

                    <p className="mt-2 text-muted-foreground">
                        BrewLite Staff Dashboard
                    </p>
                </div>

                <Link href="/orders" className={btnOutline}>
                    Đơn hàng của tôi
                </Link>
            </div>

            {/* Thống kê */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <div className={`${cardCls} p-5`}>
                    <p className="text-sm text-muted-foreground">
                        Tổng đơn hàng
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                        {orders.length}
                    </p>
                </div>

                <div className={`${cardCls} p-5`}>
                    <p className="text-sm text-muted-foreground">
                        Đã thanh toán
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                        {paidCount}
                    </p>
                </div>

                <div className={`${cardCls} p-5`}>
                    <p className="text-sm text-muted-foreground">
                        Đang pha chế
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                        {preparingCount}
                    </p>
                </div>

                <div className={`${cardCls} p-5`}>
                    <p className="text-sm text-muted-foreground">
                        Sẵn sàng lấy
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                        {readyCount}
                    </p>
                </div>
            </div>

            {/* Bộ lọc */}
            <div className="mt-8 flex flex-wrap gap-3">
                {[
                    { key: "ALL", label: "Tất cả" },
                    { key: "PAID", label: "Đã thanh toán" },
                    { key: "PREPARING", label: "Đang pha chế" },
                    { key: "READY", label: "Sẵn sàng lấy" },
                    { key: "COMPLETED", label: "Hoàn thành" },
                ].map((item) => (
                    <button
                        key={item.key}
                        onClick={() =>
                            setFilter(
                                item.key as OrderStatus | "ALL",
                            )
                        }
                        className={`rounded-full px-5 py-2 text-sm font-semibold ${filter === item.key
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-card"
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Thông báo lỗi */}
            {(error || actionError) && (
                <p
                    role="alert"
                    className="mt-5 text-sm text-red-600"
                >
                    {actionError || error}
                </p>
            )}

            {/* Danh sách đơn */}
            <div className="mt-6 space-y-4">
                {filteredOrders.map((order) => {
                    const action = nextActions[order.status];

                    return (
                        <div
                            key={order.id}
                            className={`${cardCls} p-6`}
                        >

                            {/* Thông tin đơn */}
                            <div className="flex flex-wrap justify-between gap-4">

                                <div>
                                    <h2 className="font-semibold">
                                        Đơn #{order.id.slice(-8)}
                                    </h2>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {order.user?.name ||
                                            order.user?.email ||
                                            "Khách vãng lai"}
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        {new Date(
                                            order.createdAt,
                                        ).toLocaleString("vi-VN")}
                                    </p>
                                </div>

                                <span className="h-fit rounded-full bg-secondary px-4 py-2 text-sm font-medium">
                                    {statusLabels[order.status]}
                                </span>
                            </div>

                            {/* Sản phẩm */}
                            <div className="mt-5 border-t border-border pt-4">
                                {order.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between gap-4 py-2 text-sm"
                                    >
                                        <span>
                                            {item.name} - Size {item.size}
                                            {" × "}
                                            {item.qty}
                                        </span>

                                        <span>
                                            {formatPrice(item.lineTotal)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Tổng tiền + nút thao tác */}
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Tổng tiền
                                    </p>

                                    <p className="text-xl font-bold">
                                        {formatPrice(order.total)}
                                    </p>
                                </div>

                                {action ? (
                                    <button
                                        disabled={busyId !== null}
                                        onClick={() =>
                                            void handleUpdate(
                                                order.id,
                                                action.next,
                                            )
                                        }
                                        className={`${btnPrimary} disabled:opacity-50`}
                                    >
                                        {busyId === order.id
                                            ? "Đang cập nhật..."
                                            : action.label}
                                    </button>
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        Không có thao tác
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {filteredOrders.length === 0 && (
                    <div className={`${cardCls} p-10 text-center`}>
                        <p className="text-muted-foreground">
                            Không có đơn hàng nào
                        </p>
                    </div>
                )}
            </div>
        </PageShell>
    );
}