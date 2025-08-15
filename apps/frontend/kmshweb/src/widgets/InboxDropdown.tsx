import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { type Notification, type NotificationIcon } from "../types/student";
import { useAuthFetch } from "../auth/useAuthFetch";
import {
  FileText as TextFile,
  ShieldAlert,
  BusFront as Bus,
  Award,
} from "@icons";

export const NotificationInboxIcon = ({
  unreadCount,
}: {
  unreadCount: number;
}) => {
  return (
    <div className="indicator">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {unreadCount != 0 && (
        <span className="badge badge-xs badge-primary indicator-item">
          {unreadCount}
        </span>
      )}
    </div>
  );
};

const InboxDropdownButtonPlaceholder = () => {
  return (
    <div className="btn btn-circle btn-ghost">
      <NotificationInboxIcon unreadCount={0} />
    </div>
  );
};

const getIcon = (icon: NotificationIcon) => {
  // TODO: Return specific icon for different input
  switch (icon) {
    case "score":
      return <TextFile className="w-6 h-6" />;
    case "auth":
      return <ShieldAlert className="w-6 h-6 stroke-error" />;
    case "bus":
      return <Bus className="w-6 h-6" />;
    case "disciplinary":
      return <Award />;
  }
};

const NotificationItem = ({
  notification,
  readNotification,
}: {
  notification: Notification;
  readNotification: (id: string) => void;
}) => {
  const { authedFetch } = useAuthFetch();
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (!notification.isRead) {
            authedFetch(
              `http://localhost:3000/api/student/notifications/${notification.id}/read`,
              {
                method: "PATCH",
              }
            );
            setTimeout(() => {
              readNotification(notification.id);
              observer.disconnect(); // 只跑一次
            }, 1000);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <li ref={ref}>
      <div className="flex items-center justify-between w-full px-2 py-1 my-1">
        {getIcon(notification.icon)}

        <a href={notification.path} className="w-full">
          {notification.title}
        </a>

        {!notification.isRead && (
          // status-error status-primary
          <span
            className={`status status-${
              notification.type === "warning" ? "error" : "primary"
            } me-1`}
          ></span>
        )}
      </div>
    </li>
  );
};

const InboxDropdownContent = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { authedFetch } = useAuthFetch();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number | null>();

  const observer = useRef<IntersectionObserver | null>(null);
  const lastNotificationRef = useCallback(
    (node: any) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const readNotification = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const getNotificationCount = async () => {
    const json = await authedFetch(
      "http://localhost:3000/api/student/notifications/count?role=unread"
    );
    setUnreadCount(json.data);
  };

  useEffect(() => {
    getNotificationCount();
  }, []);

  useEffect(() => {
    if (!hasMore) {
      return;
    }
    const pageSize = 10;
    setLoading(true);
    authedFetch(
      `http://localhost:3000/api/student/notifications?page=${page}&pagesize=${pageSize}`
    )
      .then((json) => {
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const newItems = json.data.filter(
            (n: Notification) => !existingIds.has(n.id)
          );
          const newNotifications = newItems.map((notification: any) => {
            const a = {
              ...notification,
              path: notification.route.replace(":id", notification.id),
            };
            return a;
          });
          return [...prev, ...newNotifications];
        });
        setHasMore(json.meta.page < json.meta.totalPages); // if less than pageSize, no more data
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  return (
    <div className="dropdown dropdown-end" onBlur={getNotificationCount}>
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <NotificationInboxIcon unreadCount={unreadCount ?? 0} />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content block menu bg-base-100 rounded-box z-1 w-70 max-h-50 overflow-y-scroll p-2 shadow-md hide-scrollbar"
      >
        <p className="uppercase mx-2 text-xs opacity-50 mb-1.5">
          notifications
        </p>
        {notifications.length > 0 ? (
          notifications.map((notification, index) => {
            if (index === notifications.length - 1) {
              return (
                <div key={notification.id} ref={lastNotificationRef}>
                  <NotificationItem
                    readNotification={readNotification}
                    notification={notification}
                  />
                </div>
              );
            }
            return (
              <NotificationItem
                key={notification.id}
                readNotification={readNotification}
                notification={notification}
              />
            );
          })
        ) : (
          <li>
            <a>There's no earlier notifications</a>
          </li>
        )}
      </ul>
    </div>
  );
};

const InboxDropdown = () => {
  return (
    <Suspense fallback={<InboxDropdownButtonPlaceholder />}>
      <InboxDropdownContent />
    </Suspense>
  );
};

export default InboxDropdown;
