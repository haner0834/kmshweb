import { Suspense, useEffect, useState } from "react";
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

const NotificationItem = ({ notification }: { notification: Notification }) => {
  return (
    <li>
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
  const [isLastPage, setIsLastPage] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number | null>();

  const updateNotifications = async () => {
    if (!isLastPage) {
      const json = await authedFetch(
        `http://localhost:3000/api/student/notifications?page=${page}&pagesize=10`
      );
      setNotifications([...notifications, ...json.data]);
      if (json.meta.page < json.meta.totalPages) {
        // There are more pages
        setPage((prev) => prev + 1);
      } else {
        setIsLastPage(true);
      }
    }
  };

  useEffect(() => {
    const a = async () => {
      const json = await authedFetch(
        "http://localhost:3000/api/student/notifications/count?role=unread"
      );
      console.log(json);
      setUnreadCount(json.data);
    };
    a();
  }, []);

  return (
    <div className="dropdown dropdown-end" onFocus={updateNotifications}>
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
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))
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
